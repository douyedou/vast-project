/**
 * 数据库初始化脚本
 * 读取 docs/schema.sql 并执行，创建所有表和初始数据
 * 
 * 使用方式：npm run db:init
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { pool, testConnection } from '../lib/db'

async function initDatabase() {
  console.log('🚀 开始初始化数据库...\n')

  // 1. 测试连接
  const connected = await testConnection()
  if (!connected) {
    console.error('数据库连接失败，请检查 .env 中的 DATABASE_URL 配置')
    process.exit(1)
  }

  // 2. 读取 schema.sql
  const schemaPath = join(process.cwd(), 'docs', 'schema.sql')
  let schemaSQL: string
  
  try {
    schemaSQL = readFileSync(schemaPath, 'utf-8')
    console.log(`📄 已读取 schema.sql (${schemaSQL.length} 字符)\n`)
  } catch (err) {
    console.error('❌ 读取 schema.sql 失败:', err)
    process.exit(1)
  }

  // 3. 按分号分割 SQL 语句并逐条执行
  // 注意：需要处理函数定义中的分号，所以用特殊分隔符
  const statements = schemaSQL
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📊 共 ${statements.length} 条 SQL 语句待执行\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i]
    const shortSQL = sql.substring(0, 60).replace(/\s+/g, ' ')
    
    try {
      await pool.query(sql)
      successCount++
      console.log(`  ✅ [${i + 1}/${statements.length}] ${shortSQL}...`)
    } catch (err: any) {
      errorCount++
      // 忽略"已存在"的错误（幂等执行）
      if (err.code === '42P06' || err.code === '42710' || err.code === '23505') {
        console.log(`  ⚠️  [${i + 1}/${statements.length}] ${shortSQL}... (已存在，跳过)`)
      } else {
        console.error(`  ❌ [${i + 1}/${statements.length}] ${shortSQL}...`)
        console.error(`     错误: ${err.message}`)
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ 成功: ${successCount} 条`)
  console.log(`⚠️  跳过: ${errorCount} 条`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  // 4. 验证表是否创建成功
  const tableResult = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `)

  console.log('📋 已创建的表:')
  tableResult.rows.forEach((row, idx) => {
    console.log(`   ${idx + 1}. ${row.table_name}`)
  })

  console.log(`\n🎉 数据库初始化完成！\n`)

  await pool.end()
}

initDatabase().catch((err) => {
  console.error('初始化失败:', err)
  process.exit(1)
})
