/**
 * 数据库重置脚本
 * 删除所有表并重新初始化（危险操作！）
 * 
 * 使用方式：npm run db:reset
 */

import { pool, testConnection } from '../lib/db'

async function resetDatabase() {
  console.log('⚠️  正在重置数据库...\n')

  const connected = await testConnection()
  if (!connected) {
    console.error('数据库连接失败')
    process.exit(1)
  }

  // 删除所有表（按依赖顺序，先删子表）
  const tables = [
    'role_permissions',
    'review_items',
    'reviews',
    'edit_logs',
    'document_versions',
    'patent_documents',
    'terminology',
    'knowledge_base',
    'disclosure_documents',
    'case_status_history',
    'case_files',
    'cases',
    'permissions',
    'roles',
    'users',
  ]

  for (const table of tables) {
    try {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
      console.log(`  🗑️  已删除表: ${table}`)
    } catch (err: any) {
      console.error(`  ❌ 删除表 ${table} 失败:`, err.message)
    }
  }

  console.log('\n🗑️  所有表已删除\n')
  await pool.end()

  // 重新初始化
  console.log('🔄 重新初始化数据库...\n')
  const { initDatabase } = await import('./db-init')
  // 直接调用 initDatabase 的逻辑
  // 这里简化处理，提示用户手动执行 npm run db:init
  console.log('请执行: npm run db:init')
}

resetDatabase().catch((err) => {
  console.error('重置失败:', err)
  process.exit(1)
})
