import { pool, query } from "@/lib/db"
import { ensureKnowledgeSchema } from "@/lib/knowledge"
import { hasSuspiciousMojibake, sanitizeDeep, sanitizeDisplayText } from "@/lib/text-sanitize"

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

function patentTypeLabel(value: unknown) {
  const type = sanitizeDisplayText(value)
  const map: Record<string, string> = {
    invention: "发明",
    utility: "实用新型",
    design: "外观设计",
  }
  return map[type] || type || "发明"
}

function scrubUnrecoverable<T>(value: T): T {
  if (typeof value === "string") {
    const cleaned = sanitizeDisplayText(value)
    return (hasSuspiciousMojibake(cleaned) ? "" : cleaned) as T
  }
  if (Array.isArray(value)) return value.map((item) => scrubUnrecoverable(item)).filter((item) => item !== "") as T
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, scrubUnrecoverable(item)])
    ) as T
  }
  return value
}

async function cleanupDisclosureDocuments() {
  let updated = 0
  const rows = await query(`
    SELECT d.id, d.content_json, d.ai_suggestions, c.title AS case_title, c.case_id AS case_no, c.type AS case_type
    FROM disclosure_documents d
    JOIN cases c ON c.id = d.case_id
  `)

  for (const row of rows.rows) {
    const content: any = scrubUnrecoverable(sanitizeDeep(row.content_json || {}))
    content.meta = {
      ...(content.meta || {}),
      caseTitle: sanitizeDisplayText(row.case_title),
      caseNo: sanitizeDisplayText(row.case_no),
      patentType: patentTypeLabel(row.case_type),
    }
    const suggestions = scrubUnrecoverable(sanitizeDeep(row.ai_suggestions || {}))
    if (sameJson(content, row.content_json) && sameJson(suggestions, row.ai_suggestions)) continue

    await query(
      `UPDATE disclosure_documents
       SET content_json = $2::jsonb, ai_suggestions = $3::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [row.id, JSON.stringify(content), JSON.stringify(suggestions)]
    )
    updated++
  }

  return updated
}

async function cleanupDisclosureVersions() {
  let updated = 0
  const rows = await query(`
    SELECT v.id, v.content_json, v.ai_suggestions, c.title AS case_title, c.case_id AS case_no, c.type AS case_type
    FROM disclosure_document_versions v
    JOIN disclosure_documents d ON d.id = v.document_id
    JOIN cases c ON c.id = d.case_id
  `)

  for (const row of rows.rows) {
    const content: any = scrubUnrecoverable(sanitizeDeep(row.content_json || {}))
    content.meta = {
      ...(content.meta || {}),
      caseTitle: sanitizeDisplayText(row.case_title),
      caseNo: sanitizeDisplayText(row.case_no),
      patentType: patentTypeLabel(row.case_type),
    }
    const suggestions = scrubUnrecoverable(sanitizeDeep(row.ai_suggestions || {}))
    if (sameJson(content, row.content_json) && sameJson(suggestions, row.ai_suggestions)) continue

    await query(
      `UPDATE disclosure_document_versions
       SET content_json = $2::jsonb, ai_suggestions = $3::jsonb
       WHERE id = $1`,
      [row.id, JSON.stringify(content), JSON.stringify(suggestions)]
    )
    updated++
  }

  return updated
}

async function cleanupKnowledgeBase() {
  let updated = 0
  const rows = await query(`
    SELECT id, field, title, content, source, source_url, metadata
    FROM knowledge_base
  `)

  for (const row of rows.rows) {
    const next = {
      field: sanitizeDisplayText(row.field) || "通用",
      title: sanitizeDisplayText(row.title) || "未命名知识",
      content: sanitizeDisplayText(row.content),
      source: sanitizeDisplayText(row.source),
      source_url: sanitizeDisplayText(row.source_url) || null,
      metadata: sanitizeDeep(row.metadata || {}),
    }

    if (
      next.field === row.field &&
      next.title === row.title &&
      next.content === row.content &&
      next.source === row.source &&
      (next.source_url || null) === (row.source_url || null) &&
      sameJson(next.metadata, row.metadata)
    ) {
      continue
    }

    await query(
      `UPDATE knowledge_base
       SET field = $2, title = $3, content = $4, source = $5, source_url = $6, metadata = $7::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [row.id, next.field, next.title, next.content, next.source, next.source_url, JSON.stringify(next.metadata)]
    )
    updated++
  }

  return updated
}

async function cleanupKnowledgeChunks() {
  let updated = 0
  const rows = await query(`
    SELECT id, field, title, content, source, source_url, metadata
    FROM knowledge_chunks
  `)

  for (const row of rows.rows) {
    const next = {
      field: sanitizeDisplayText(row.field) || "通用",
      title: sanitizeDisplayText(row.title) || "未命名知识",
      content: sanitizeDisplayText(row.content),
      source: sanitizeDisplayText(row.source),
      source_url: sanitizeDisplayText(row.source_url) || null,
      metadata: sanitizeDeep(row.metadata || {}),
    }

    if (
      next.field === row.field &&
      next.title === row.title &&
      next.content === row.content &&
      next.source === row.source &&
      (next.source_url || null) === (row.source_url || null) &&
      sameJson(next.metadata, row.metadata)
    ) {
      continue
    }

    await query(
      `UPDATE knowledge_chunks
       SET field = $2, title = $3, content = $4, source = $5, source_url = $6, metadata = $7::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [row.id, next.field, next.title, next.content, next.source, next.source_url, JSON.stringify(next.metadata)]
    )
    updated++
  }

  return updated
}

async function main() {
  await ensureKnowledgeSchema()
  const result = {
    disclosureDocuments: await cleanupDisclosureDocuments(),
    disclosureVersions: await cleanupDisclosureVersions(),
    knowledgeBase: await cleanupKnowledgeBase(),
    knowledgeChunks: await cleanupKnowledgeChunks(),
  }

  console.log("M06/知识库乱码定向清理完成", result)
}

main()
  .catch((err) => {
    console.error("M06/知识库乱码定向清理失败:", err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
