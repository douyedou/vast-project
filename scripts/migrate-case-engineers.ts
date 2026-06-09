/**
 * 迁移：创建 case_engineers 协作撰写人表
 * 执行：npx tsx scripts/migrate-case-engineers.ts
 */

import { query } from '../lib/db'

async function main() {
  console.log('创建 case_engineers 表...')

  await query(`
    CREATE TABLE IF NOT EXISTS case_engineers (
      case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      engineer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invited_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (case_id, engineer_id)
    )
  `)

  console.log('case_engineers 表创建成功')
  process.exit(0)
}

main().catch(err => {
  console.error('迁移失败:', err)
  process.exit(1)
})
