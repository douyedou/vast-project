/**
 * 数据库初始化脚本
 * 读取 docs/schema.sql 并执行，创建所有表和初始数据
 * 
 * 使用方式：npm run db:init
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { pool, testConnection } from '../lib/db'

/**
 * 智能分割 SQL 语句
 * 处理 plpgsql 函数中的分号，不在 $$...$$ 之间分割
 */
function splitSQL(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''

  const lines = sql.split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    // 跳过纯注释行（但保留空行用于可读性）
    if (trimmed.startsWith('--') || trimmed === '') {
      if (!inDollarQuote) {
        // 如果在函数外遇到空行，且当前有内容，可能是一个语句的结束
        if (current.trim() && !current.trim().endsWith(';')) {
          // 继续累积
        }
      }
      current += line + '\n'
      continue
    }

    current += line + '\n'

    // 检测 $$ 或 $tag$ 开始/结束
    const dollarMatches = line.match(/\$(\w*)\$/g)
    if (dollarMatches) {
      for (const match of dollarMatches) {
        if (!inDollarQuote) {
          inDollarQuote = true
          dollarTag = match
        } else if (match === dollarTag) {
          inDollarQuote = false
          dollarTag = ''
        }
      }
    }

    // 只有在函数外遇到分号才分割
    if (!inDollarQuote && trimmed.endsWith(';')) {
      const stmt = current.trim()
      if (stmt.length > 0) {
        statements.push(stmt)
      }
      current = ''
    }
  }

  // 处理最后一条（可能没有分号结尾）
  if (current.trim()) {
    statements.push(current.trim())
  }

  return statements
}

async function initDatabase() {
  console.log('🚀 开始初始化数据库...\n')

  // 1. 测试连接
  const connected = await testConnection()
  if (!connected) {
    console.error('❌ 数据库连接失败，请检查 .env 中的 DATABASE_URL 配置')
    console.error('   当前配置:', process.env.DATABASE_URL)
    process.exit(1)
  }

  // 2. 检查扩展是否已安装
  console.log('🔍 检查必要扩展...')
  try {
    const extResult = await pool.query(
      "SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector')"
    )
    const installedExts = extResult.rows.map((r: any) => r.extname)
    console.log('   已安装扩展:', installedExts.join(', ') || '无')
    
    if (!installedExts.includes('uuid-ossp')) {
      console.warn('   ⚠️  uuid-ossp 扩展未安装，请用超级用户执行：')
      console.warn('      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
    }
    if (!installedExts.includes('vector')) {
      console.warn('   ⚠️  vector 扩展未安装，请用超级用户执行：')
      console.warn('      CREATE EXTENSION IF NOT EXISTS vector;')
      console.warn('   向量检索功能将不可用，但其他功能正常。')
    }
    console.log('')
  } catch (err) {
    console.warn('   无法检查扩展状态（可能无权限）\n')
  }

  // 3. 读取 schema.sql
  const schemaPath = join(process.cwd(), 'docs', 'schema.sql')
  let schemaSQL: string
  
  try {
    schemaSQL = readFileSync(schemaPath, 'utf-8')
    console.log(`📄 已读取 schema.sql (${schemaSQL.length} 字符)\n`)
  } catch (err) {
    console.error('❌ 读取 schema.sql 失败:', err)
    process.exit(1)
  }

  // 4. 智能分割 SQL 语句
  const statements = splitSQL(schemaSQL)
  console.log(`📊 共 ${statements.length} 条 SQL 语句待执行\n`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i]
    const firstLine = sql.split('\n').find(l => l.trim() && !l.trim().startsWith('--')) || sql
    const shortSQL = firstLine.substring(0, 70).replace(/\s+/g, ' ')
    
    try {
      await pool.query(sql)
      successCount++
      console.log(`  ✅ [${i + 1}/${statements.length}] ${shortSQL}...`)
    } catch (err: any) {
      // 忽略"已存在"的错误（幂等执行）
      if (err.code === '42P06' || err.code === '42710' || err.code === '23505' || err.code === '42701') {
        skipCount++
        console.log(`  ⚠️  [${i + 1}/${statements.length}] ${shortSQL}... (已存在，跳过)`)
      } else if (err.message?.includes('权限')) {
        errorCount++
        console.error(`  ❌ [${i + 1}/${statements.length}] ${shortSQL}...`)
        console.error(`     权限不足，请用超级用户执行此语句，或给 vast_user 授权：`)
        console.error(`     ALTER USER vast_user WITH SUPERUSER;`)
      } else {
        errorCount++
        console.error(`  ❌ [${i + 1}/${statements.length}] ${shortSQL}...`)
        console.error(`     错误 [${err.code}]: ${err.message.split('\n')[0]}`)
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ 成功: ${successCount} 条`)
  console.log(`⚠️  跳过: ${skipCount} 条`)
  console.log(`❌ 失败: ${errorCount} 条`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  // 5. 验证表是否创建成功
  const tableResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)

  console.log('📋 已创建的表:')
  if (tableResult.rows.length === 0) {
    console.log('   (无)')
  } else {
    tableResult.rows.forEach((row: any, idx: number) => {
      console.log(`   ${idx + 1}. ${row.table_name}`)
    })
  }

  console.log(`\n🎉 数据库初始化流程结束！\n`)

  if (errorCount > 0) {
    console.log('💡 提示：如果有权限错误，请用 psql 以 postgres 超级用户登录后执行：')
    console.log('   ALTER USER vast_user WITH SUPERUSER;')
    console.log('   然后重新运行 npm run db:init')
  }

  await pool.end()
}

initDatabase().catch((err) => {
  console.error('初始化失败:', err)
  process.exit(1)
})
