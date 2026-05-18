/**
 * 导出数据库种子数据为 SQL 文件（不含向量 embedding）
 * 供异地组员初始化一致的数据
 *
 * 用法：npx tsx scripts/export-seed-data.ts
 * 输出：docs/seed-data.sql
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { pool } from '../lib/db'

function escapeSQL(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'string') return "'" + val.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'"
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (val instanceof Date) return escapeSQL(val.toISOString())
  if (typeof val === 'object') {
    // JSONB / JSON 对象或数组
    return escapeSQL(JSON.stringify(val))
  }
  return String(val)
}

async function exportTable(
  tableName: string,
  columns: string[],
  excludeColumns: string[] = []
): Promise<string> {
  const selectCols = columns.filter(c => !excludeColumns.includes(c)).join(', ')
  const result = await pool.query(`SELECT ${selectCols} FROM ${tableName} ORDER BY created_at`)

  if (result.rows.length === 0) return ''

  const insertCols = columns.filter(c => !excludeColumns.includes(c))
  const lines: string[] = []
  lines.push(`-- ${tableName}: ${result.rows.length} 条记录`)

  for (const row of result.rows) {
    const vals = insertCols.map(col => escapeSQL(row[col]))
    lines.push(`INSERT INTO ${tableName} (${insertCols.join(', ')}) VALUES (${vals.join(', ')});`)
  }

  lines.push('')
  return lines.join('\n')
}

async function main() {
  const outputPath = join(process.cwd(), 'docs', 'seed-data.sql')
  const parts: string[] = []

  parts.push(`-- ============================================================`)
  parts.push(`-- VAST 8.0 种子数据 - 企业真实数据（不含向量）`)
  parts.push(`-- 执行顺序：先执行 schema.sql，再执行此文件`)
  parts.push(`-- 向量数据请运行: npx tsx scripts/embed-knowledge-base.ts`)
  parts.push(`-- ============================================================`)
  parts.push('')

  // cases
  parts.push(await exportTable('cases', [
    'id', 'case_id', 'title', 'type', 'status', 'applicant_id', 'engineer_id',
    'reviewer_id', 'description', 'priority', 'created_at', 'updated_at'
  ]))

  // case_files
  parts.push(await exportTable('case_files', [
    'id', 'case_id', 'filename', 'original_name', 'url', 'mime_type', 'size', 'created_at'
  ]))

  // case_status_history
  parts.push(await exportTable('case_status_history', [
    'id', 'case_id', 'from_status', 'to_status', 'operator_id', 'remark', 'created_at'
  ]))

  // disclosure_documents
  parts.push(await exportTable('disclosure_documents', [
    'id', 'case_id', 'content_json', 'ai_suggestions', 'status', 'version', 'created_at', 'updated_at'
  ]))

  // patent_documents
  parts.push(await exportTable('patent_documents', [
    'id', 'case_id', 'type', 'content', 'status', 'ai_rate', 'version', 'created_at', 'updated_at'
  ]))

  // knowledge_base (不含 embedding)
  parts.push(await exportTable('knowledge_base', [
    'id', 'field', 'title', 'content', 'source', 'source_type', 'created_at'
  ], ['embedding']))

  // terminology
  parts.push(await exportTable('terminology', [
    'id', 'field', 'term', 'definition', 'synonyms', 'usage_example', 'created_at'
  ]))

  // document_versions
  parts.push(await exportTable('document_versions', [
    'id', 'document_id', 'content', 'operator_id', 'change_summary', 'created_at'
  ]))

  // reviews
  parts.push(await exportTable('reviews', [
    'id', 'case_id', 'reviewer_id', 'result', 'comments', 'ai_suggestions', 'created_at', 'updated_at'
  ]))

  // review_items
  parts.push(await exportTable('review_items', [
    'id', 'review_id', 'type', 'content', 'severity', 'status', 'created_at'
  ]))

  writeFileSync(outputPath, parts.join('\n'))
  console.log(`✅ 种子数据已导出: ${outputPath}`)
  console.log(`   共导出 ${parts.filter(p => p.includes('INSERT INTO')).length} 条 INSERT 语句`)

  await pool.end()
}

main().catch(err => {
  console.error('导出失败:', err)
  process.exit(1)
})
