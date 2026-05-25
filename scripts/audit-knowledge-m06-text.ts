import fs from "fs/promises"
import path from "path"
import { pool, query } from "@/lib/db"
import { ensureKnowledgeSchema } from "@/lib/knowledge"
import { hasSuspiciousMojibake } from "@/lib/text-sanitize"

const SOURCE_ROOTS = [
  "components/vast/m06",
  "components/vast/m09/knowledge-assets.tsx",
  "app/api/m06",
  "app/api/ai/rag",
  "lib/m06.ts",
  "lib/m06-ai.ts",
  "lib/knowledge.ts",
  "hooks/use-m06-document.ts",
  "scripts/ingest-knowledge.ts",
]

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"])

async function collectFiles(target: string): Promise<string[]> {
  const absolute = path.resolve(process.cwd(), target)
  const stat = await fs.stat(absolute).catch(() => null)
  if (!stat) return []
  if (stat.isFile()) return SOURCE_EXTENSIONS.has(path.extname(absolute)) ? [absolute] : []

  const entries = await fs.readdir(absolute, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => collectFiles(path.join(target, entry.name)))
  )
  return nested.flat()
}

function sourceHasIssue(text: string) {
  const withoutEscapedReplacement = text.replace(/\\u[fF]{3}[dD]/g, "")
  return hasSuspiciousMojibake(withoutEscapedReplacement)
}

async function auditSource() {
  const files = Array.from(new Set((await Promise.all(SOURCE_ROOTS.map(collectFiles))).flat()))
  const hits: Array<{ file: string; line: number; sample: string }> = []

  for (const file of files) {
    const text = await fs.readFile(file, "utf8")
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (sourceHasIssue(line)) {
        hits.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          sample: line.trim().slice(0, 160),
        })
      }
    })
  }

  return hits
}

async function auditDatabase() {
  await ensureKnowledgeSchema()
  const hits: Array<{ table: string; id: string; field: string; sample: string }> = []

  const checks = [
    {
      table: "disclosure_documents",
      id: "id",
      columns: ["content_json", "ai_suggestions"],
      jsonColumns: ["content_json", "ai_suggestions"],
    },
    {
      table: "disclosure_document_versions",
      id: "id",
      columns: ["content_json", "ai_suggestions"],
      jsonColumns: ["content_json", "ai_suggestions"],
    },
    {
      table: "knowledge_base",
      id: "id",
      columns: ["field", "title", "content", "source", "source_url", "metadata"],
      jsonColumns: ["metadata"],
    },
    {
      table: "knowledge_chunks",
      id: "id",
      columns: ["field", "title", "content", "source", "source_url", "metadata"],
      jsonColumns: ["metadata"],
    },
  ]

  function collectJsonHits(value: unknown, prefix: string): Array<{ field: string; sample: string }> {
    if (typeof value === "string") {
      return hasSuspiciousMojibake(value) ? [{ field: prefix, sample: value.slice(0, 160) }] : []
    }
    if (Array.isArray(value)) {
      return value.flatMap((item, index) => collectJsonHits(item, `${prefix}.${index}`))
    }
    if (value && typeof value === "object") {
      return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => collectJsonHits(item, `${prefix}.${key}`))
    }
    return []
  }

  for (const check of checks) {
    const rows = await query(
      `SELECT ${check.id}, ${check.columns.join(", ")} FROM ${check.table}`
    )
    for (const row of rows.rows) {
      for (const column of check.columns) {
        const value = row[column]
        if (check.jsonColumns.includes(column)) {
          for (const hit of collectJsonHits(value, column)) {
            hits.push({
              table: check.table,
              id: row[check.id],
              field: hit.field,
              sample: hit.sample,
            })
          }
        } else if (hasSuspiciousMojibake(value)) {
          hits.push({
            table: check.table,
            id: row[check.id],
            field: column,
            sample: String(value).slice(0, 160),
          })
        }
      }
    }
  }

  return hits
}

async function main() {
  const sourceHits = await auditSource()
  const dataHits = await auditDatabase()

  console.log(`M06/知识库源码乱码命中: ${sourceHits.length}`)
  sourceHits.slice(0, 20).forEach((hit) => {
    console.log(`  ${hit.file}:${hit.line} ${hit.sample}`)
  })
  console.log(`M06/知识库数据乱码命中: ${dataHits.length}`)
  dataHits.slice(0, 20).forEach((hit) => {
    console.log(`  ${hit.table}.${hit.field} ${hit.id}: ${hit.sample}`)
  })

  if (sourceHits.length || dataHits.length) process.exitCode = 1
}

main()
  .catch((err) => {
    console.error("乱码审计失败:", err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
