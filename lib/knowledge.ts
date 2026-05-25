import crypto from "crypto"
import { aiService } from "@/lib/ai-service"
import { query } from "@/lib/db"
import { sanitizeDisplayText } from "@/lib/text-sanitize"

export type KnowledgeSourceType = "patent" | "paper" | "template" | "other"

export interface KnowledgeDocumentInput {
  field: string
  title: string
  content: string
  source: string
  sourceType: KnowledgeSourceType
  sourceUrl?: string
  metadata?: Record<string, any>
}

export interface KnowledgeSearchOptions {
  topK?: number
  field?: string
  sourceTypes?: KnowledgeSourceType[]
  minSimilarity?: number
}

export interface KnowledgeSearchSource {
  id: string
  knowledgeId?: string
  title: string
  content: string
  field: string
  source: string
  sourceType: KnowledgeSourceType
  sourceUrl?: string
  similarity: number
  chunkIndex?: number
  metadata?: Record<string, any>
}

export interface IngestRunPatch {
  status?: "running" | "completed" | "failed"
  totalDocuments?: number
  totalChunks?: number
  totalEmbeddings?: number
  errorMessage?: string
  metadata?: Record<string, any>
}

let schemaEnsured = false

export function hashText(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex")
}

export function sanitizeKnowledgeText(value: unknown) {
  return sanitizeDisplayText(value)
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
}

export function chunkText(text: string, options: { min?: number; max?: number; overlap?: number } = {}) {
  const min = options.min ?? 500
  const max = options.max ?? 800
  const overlap = options.overlap ?? 80
  const normalized = sanitizeKnowledgeText(text)
  if (!normalized) return []
  if (normalized.length <= max) return [normalized]

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ""

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).trim().length <= max) {
      current = [current, paragraph].filter(Boolean).join("\n\n")
      continue
    }

    if (current.length >= min) {
      chunks.push(current)
      current = current.slice(Math.max(0, current.length - overlap))
    }

    if (paragraph.length > max) {
      for (let index = 0; index < paragraph.length; index += max - overlap) {
        const part = paragraph.slice(index, index + max).trim()
        if (part.length >= min || !chunks.length) chunks.push(part)
      }
      current = ""
    } else {
      current = [current, paragraph].filter(Boolean).join("\n\n").trim()
    }
  }

  if (current) {
    if (current.length < min && chunks.length) {
      const previous = chunks.pop() || ""
      chunks.push([previous, current].filter(Boolean).join("\n\n").slice(-max))
    } else {
      chunks.push(current)
    }
  }

  return chunks.filter(Boolean)
}

export async function ensureKnowledgeSchema() {
  if (schemaEnsured) return

  await query(`CREATE EXTENSION IF NOT EXISTS vector`)

  await query(`
    ALTER TABLE knowledge_base
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `)

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_base_content_hash
    ON knowledge_base(content_hash)
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      knowledge_id UUID REFERENCES knowledge_base(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      field VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      embedding vector(1024),
      source VARCHAR(500),
      source_type VARCHAR(50) CHECK (source_type IN ('patent', 'paper', 'template', 'other')) DEFAULT 'other',
      source_url TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      content_hash VARCHAR(64) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await query(`CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_field ON knowledge_chunks(field)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source_type ON knowledge_chunks(source_type)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_knowledge_id ON knowledge_chunks(knowledge_id)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)`)

  await query(`
    CREATE TABLE IF NOT EXISTS knowledge_ingest_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'running',
      source VARCHAR(500),
      total_documents INTEGER DEFAULT 0,
      total_chunks INTEGER DEFAULT 0,
      total_embeddings INTEGER DEFAULT 0,
      error_message TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      finished_at TIMESTAMPTZ
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS disclosure_document_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID REFERENCES disclosure_documents(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      action VARCHAR(100) NOT NULL DEFAULT 'save',
      content_json JSONB NOT NULL,
      ai_suggestions JSONB DEFAULT '{}'::jsonb,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await query(`CREATE INDEX IF NOT EXISTS idx_disclosure_versions_document_id ON disclosure_document_versions(document_id)`)
  await query(`CREATE INDEX IF NOT EXISTS idx_disclosure_versions_created_at ON disclosure_document_versions(created_at DESC)`)

  schemaEnsured = true
}

export async function createIngestRun(type: string, source: string, metadata: Record<string, any> = {}) {
  await ensureKnowledgeSchema()
  const result = await query(
    `INSERT INTO knowledge_ingest_runs (type, source, metadata)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [type, source, JSON.stringify(metadata)]
  )
  return result.rows[0].id as string
}

export async function updateIngestRun(id: string, patch: IngestRunPatch) {
  await ensureKnowledgeSchema()
  const result = await query(
    `UPDATE knowledge_ingest_runs
     SET status = COALESCE($2, status),
         total_documents = COALESCE($3, total_documents),
         total_chunks = COALESCE($4, total_chunks),
         total_embeddings = COALESCE($5, total_embeddings),
         error_message = COALESCE($6, error_message),
         metadata = COALESCE($7, metadata),
         finished_at = CASE WHEN COALESCE($2, status) IN ('completed', 'failed') THEN NOW() ELSE finished_at END
     WHERE id = $1`,
    [
      id,
      patch.status,
      patch.totalDocuments,
      patch.totalChunks,
      patch.totalEmbeddings,
      patch.errorMessage,
      patch.metadata ? JSON.stringify(patch.metadata) : undefined,
    ]
  )
  return result.rowCount || 0
}

export async function upsertKnowledgeDocument(input: KnowledgeDocumentInput) {
  await ensureKnowledgeSchema()

  const field = sanitizeKnowledgeText(input.field) || "通用"
  const title = sanitizeKnowledgeText(input.title) || "未命名知识"
  const content = sanitizeKnowledgeText(input.content)
  const source = sanitizeKnowledgeText(input.source) || title
  const sourceType = input.sourceType || "other"
  const sourceUrl = sanitizeKnowledgeText(input.sourceUrl)
  const contentHash = hashText(`${field}|${title}|${source}|${content}`)

  if (content.length < 20) {
    return { documentId: "", chunks: 0, embeddings: 0, skipped: true }
  }

  const docEmbedding = await aiService.embed(`${title}\n${content.slice(0, 4000)}`)
  const docVector = `[${docEmbedding.embedding.join(",")}]`
  const existing = await query(
    `SELECT id FROM knowledge_base WHERE source = $1 AND title = $2 LIMIT 1`,
    [source, title]
  )

  let documentId: string
  if (existing.rows[0]) {
    const updated = await query(
      `UPDATE knowledge_base
       SET field = $2,
           content = $3,
           embedding = $4::vector,
           source_type = $5,
           source_url = $6,
           metadata = $7,
           content_hash = $8,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [
        existing.rows[0].id,
        field,
        content,
        docVector,
        sourceType,
        sourceUrl || null,
        JSON.stringify(input.metadata || {}),
        contentHash,
      ]
    )
    documentId = updated.rows[0].id
  } else {
    const inserted = await query(
      `INSERT INTO knowledge_base (field, title, content, embedding, source, source_type, source_url, metadata, content_hash)
       VALUES ($1, $2, $3, $4::vector, $5, $6, $7, $8, $9)
       ON CONFLICT (content_hash) DO UPDATE
       SET field = EXCLUDED.field,
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           embedding = EXCLUDED.embedding,
           source = EXCLUDED.source,
           source_type = EXCLUDED.source_type,
           source_url = EXCLUDED.source_url,
           metadata = EXCLUDED.metadata,
           updated_at = NOW()
       RETURNING id`,
      [field, title, content, docVector, source, sourceType, sourceUrl || null, JSON.stringify(input.metadata || {}), contentHash]
    )
    documentId = inserted.rows[0].id
  }

  const chunks = chunkText(content)
  await query(`DELETE FROM knowledge_chunks WHERE knowledge_id = $1`, [documentId])

  let embeddings = 1
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]
    const chunkEmbedding = await aiService.embed(`${title}\n${chunk}`)
    embeddings++
    const chunkVector = `[${chunkEmbedding.embedding.join(",")}]`
    const chunkHash = hashText(`${documentId}|${index}|${chunk}`)
    await query(
      `INSERT INTO knowledge_chunks (
        knowledge_id, chunk_index, field, title, content, embedding, source, source_type, source_url, metadata, content_hash
       )
       VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8, $9, $10, $11)
       ON CONFLICT (content_hash) DO UPDATE
       SET content = EXCLUDED.content,
           embedding = EXCLUDED.embedding,
           metadata = EXCLUDED.metadata,
           updated_at = NOW()`,
      [
        documentId,
        index,
        field,
        title,
        chunk,
        chunkVector,
        source,
        sourceType,
        sourceUrl || null,
        JSON.stringify(input.metadata || {}),
        chunkHash,
      ]
    )
  }

  return { documentId, chunks: chunks.length, embeddings, skipped: false }
}

export async function searchKnowledge(question: string, options: KnowledgeSearchOptions = {}) {
  await ensureKnowledgeSchema()

  const topK = Math.max(1, Math.min(20, options.topK ?? 5))
  const embedResult = await aiService.embed(question)
  const vectorStr = `[${embedResult.embedding.join(",")}]`
  const conditions = ["embedding IS NOT NULL"]
  const params: any[] = [vectorStr]
  let paramIndex = 2

  if (options.field) {
    conditions.push(`field = $${paramIndex++}`)
    params.push(options.field)
  }
  if (options.sourceTypes?.length) {
    conditions.push(`source_type = ANY($${paramIndex++})`)
    params.push(options.sourceTypes)
  }

  params.push(topK * 2)
  const rows = await query(
    `SELECT id, knowledge_id, chunk_index, field, title, content, source, source_type, source_url, metadata,
            1 - (embedding <=> $1::vector) AS similarity
     FROM knowledge_chunks
     WHERE ${conditions.join(" AND ")}
     ORDER BY embedding <=> $1::vector
     LIMIT $${paramIndex}`,
    params
  )

  let sources = rows.rows.map((row: any) => normalizeSearchRow(row))

  if (!sources.length) {
    const fallbackRows = await query(
      `SELECT id, id as knowledge_id, 0 as chunk_index, field, title, content, source, source_type, source_url, metadata,
              1 - (embedding <=> $1::vector) AS similarity
       FROM knowledge_base
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorStr, topK]
    )
    sources = fallbackRows.rows.map((row: any) => normalizeSearchRow(row))
  }

  const minSimilarity = options.minSimilarity ?? 0
  return sources
    .filter((source) => source.similarity >= minSimilarity)
    .slice(0, topK)
}

function normalizeSearchRow(row: any): KnowledgeSearchSource {
  const similarity = Math.max(0, Math.min(1, Number(row.similarity || 0)))
  return {
    id: row.id,
    knowledgeId: row.knowledge_id,
    title: sanitizeKnowledgeText(row.title),
    content: sanitizeKnowledgeText(String(row.content || "").slice(0, 900)),
    field: sanitizeKnowledgeText(row.field),
    source: sanitizeKnowledgeText(row.source),
    sourceType: row.source_type || "other",
    sourceUrl: sanitizeKnowledgeText(row.source_url) || undefined,
    similarity,
    chunkIndex: typeof row.chunk_index === "number" ? row.chunk_index : undefined,
    metadata: row.metadata || {},
  }
}

export function sourceToM06Source(source: KnowledgeSearchSource) {
  return {
    id: source.id,
    title: source.title,
    content: source.content,
    similarity: Math.round(source.similarity * 100),
    source: source.source,
    sourceType: source.sourceType,
    url: source.sourceUrl,
  }
}

export async function getKnowledgeStats() {
  await ensureKnowledgeSchema()

  const summary = await query(`
    SELECT
      (SELECT COUNT(*) FROM knowledge_base)::int AS documents,
      (SELECT COUNT(*) FROM knowledge_chunks)::int AS chunks,
      (SELECT COUNT(*) FROM knowledge_base WHERE embedding IS NULL)::int AS documents_without_embedding,
      (SELECT COUNT(*) FROM knowledge_chunks WHERE embedding IS NULL)::int AS chunks_without_embedding,
      (SELECT COUNT(DISTINCT field) FROM knowledge_base)::int AS fields
  `)
  const fieldStats = await query(`
    SELECT field, COUNT(*)::int AS chunks
    FROM knowledge_chunks
    GROUP BY field
    ORDER BY chunks DESC, field ASC
  `)
  const sourceTypeStats = await query(`
    SELECT source_type, COUNT(*)::int AS chunks
    FROM knowledge_chunks
    GROUP BY source_type
    ORDER BY chunks DESC, source_type ASC
  `)
  const ingestRuns = await query(`
    SELECT id, type, status, source, total_documents, total_chunks, total_embeddings, error_message, metadata, started_at, finished_at
    FROM knowledge_ingest_runs
    ORDER BY started_at DESC
    LIMIT 10
  `)

  return {
    ...summary.rows[0],
    fieldStats: fieldStats.rows,
    sourceTypeStats: sourceTypeStats.rows,
    ingestRuns: ingestRuns.rows,
  }
}

export function abstractFromOpenAlexInvertedIndex(index: Record<string, number[]> | null | undefined) {
  if (!index || typeof index !== "object") return ""
  const words: Array<[number, string]> = []
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions || []) words.push([position, word])
  }
  return words
    .sort((a, b) => a[0] - b[0])
    .map(([, word]) => word)
    .join(" ")
}

export async function harvestOpenAlexWorks(queryText: string, field: string, limit = 10) {
  const url = new URL("https://api.openalex.org/works")
  url.searchParams.set("search", queryText)
  url.searchParams.set("per-page", String(Math.max(1, Math.min(50, limit))))
  url.searchParams.set("filter", "from_publication_date:2018-01-01")

  const response = await fetch(url)
  if (!response.ok) throw new Error(`OpenAlex 请求失败: ${response.status}`)
  const data = await response.json()
  const works = Array.isArray(data.results) ? data.results : []

  const results = []
  for (const work of works) {
    const abstract = abstractFromOpenAlexInvertedIndex(work.abstract_inverted_index)
    const title = sanitizeKnowledgeText(work.title || work.display_name)
    if (!title || !abstract) continue

    const authors = Array.isArray(work.authorships)
      ? work.authorships
          .map((item: any) => item.author?.display_name)
          .filter(Boolean)
          .slice(0, 6)
      : []
    const landingUrl = work.primary_location?.landing_page_url || work.doi || work.id
    const upsert = await upsertKnowledgeDocument({
      field,
      title,
      content: abstract,
      source: landingUrl || title,
      sourceUrl: landingUrl,
      sourceType: "paper",
      metadata: {
        provider: "OpenAlex",
        year: work.publication_year,
        doi: work.doi,
        authors,
        query: queryText,
      },
    })
    results.push({ title, ...upsert })
  }
  return results
}

export async function harvestCrossrefWorks(queryText: string, field: string, limit = 10) {
  const url = new URL("https://api.crossref.org/works")
  url.searchParams.set("query", queryText)
  url.searchParams.set("rows", String(Math.max(1, Math.min(50, limit))))

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Crossref 请求失败: ${response.status}`)
  const data = await response.json()
  const works = Array.isArray(data.message?.items) ? data.message.items : []

  const results = []
  for (const work of works) {
    const title = sanitizeKnowledgeText(Array.isArray(work.title) ? work.title[0] : work.title)
    const abstract = sanitizeKnowledgeText(work.abstract || "")
      .replace(/<\/?[^>]+(>|$)/g, "")
    if (!title || abstract.length < 80) continue

    const sourceUrl = work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined)
    const upsert = await upsertKnowledgeDocument({
      field,
      title,
      content: abstract,
      source: sourceUrl || title,
      sourceUrl,
      sourceType: "paper",
      metadata: {
        provider: "Crossref",
        year: Array.isArray(work.published?.["date-parts"]) ? work.published["date-parts"][0]?.[0] : undefined,
        doi: work.DOI,
        query: queryText,
      },
    })
    results.push({ title, ...upsert })
  }
  return results
}

export async function harvestSemanticScholarWorks(queryText: string, field: string, limit = 10) {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search")
  url.searchParams.set("query", queryText)
  url.searchParams.set("limit", String(Math.max(1, Math.min(50, limit))))
  url.searchParams.set("fields", "title,abstract,year,url,venue,authors")

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Semantic Scholar 请求失败: ${response.status}`)
  const data = await response.json()
  const works = Array.isArray(data.data) ? data.data : []

  const results = []
  for (const work of works) {
    const title = sanitizeKnowledgeText(work.title)
    const abstract = sanitizeKnowledgeText(work.abstract)
    if (!title || abstract.length < 80) continue

    const upsert = await upsertKnowledgeDocument({
      field,
      title,
      content: abstract,
      source: work.url || title,
      sourceUrl: work.url,
      sourceType: "paper",
      metadata: {
        provider: "Semantic Scholar",
        year: work.year,
        venue: work.venue,
        authors: Array.isArray(work.authors) ? work.authors.map((author: any) => author.name).slice(0, 6) : [],
        query: queryText,
      },
    })
    results.push({ title, ...upsert })
  }
  return results
}

function normalizePatentRows(data: any) {
  if (Array.isArray(data?.patents)) return data.patents
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.patents)) return data.data.patents
  return []
}

async function fetchPatentsViewRows(queryText: string, limit: number) {
  const cappedLimit = Math.max(1, Math.min(50, limit))
  const fields = [
    "patent_id",
    "patent_number",
    "patent_title",
    "patent_abstract",
    "patent_date",
    "assignees.assignee_organization",
  ]
  const q = JSON.stringify({
    _or: [
      { _text_any: { patent_title: queryText } },
      { _text_any: { patent_abstract: queryText } },
    ],
  })
  const options = JSON.stringify({ per_page: cappedLimit })

  const endpoints = [
    `https://search.patentsview.org/api/v1/patent/?q=${encodeURIComponent(q)}&f=${encodeURIComponent(JSON.stringify(fields))}&o=${encodeURIComponent(options)}`,
    `https://api.patentsview.org/patents/query?q=${encodeURIComponent(q)}&f=${encodeURIComponent(JSON.stringify(fields))}&o=${encodeURIComponent(options)}`,
  ]

  let lastError: Error | null = null
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } })
      if (!response.ok) {
        lastError = new Error(`PatentsView 请求失败: ${response.status}`)
        continue
      }
      const data = await response.json()
      const rows = normalizePatentRows(data)
      if (rows.length) return rows
    } catch (err: any) {
      lastError = err
    }
  }

  if (lastError) throw lastError
  return []
}

export async function harvestPatentsViewWorks(queryText: string, field: string, limit = 10) {
  const rows = await fetchPatentsViewRows(queryText, limit)
  const results = []

  for (const patent of rows) {
    const patentId = sanitizeKnowledgeText(patent.patent_id || patent.patent_number || patent.id)
    const title = sanitizeKnowledgeText(patent.patent_title || patent.title)
    const abstract = sanitizeKnowledgeText(patent.patent_abstract || patent.abstract)
    if (!title || abstract.length < 40) continue

    const assignees = Array.isArray(patent.assignees)
      ? patent.assignees
          .map((item: any) => item.assignee_organization || item.organization || item.name)
          .filter(Boolean)
          .slice(0, 6)
      : []
    const sourceUrl = patentId ? `https://patents.google.com/patent/US${patentId}` : undefined
    const content = [
      abstract,
      `公开专利元数据：标题为“${title}”。`,
      patent.patent_date ? `公开日期：${patent.patent_date}。` : "",
      assignees.length ? `申请人/受让人：${assignees.join("、")}。` : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    const upsert = await upsertKnowledgeDocument({
      field,
      title,
      content,
      source: sourceUrl || `PatentsView:${patentId || title}`,
      sourceUrl,
      sourceType: "patent",
      metadata: {
        provider: "PatentsView",
        patentId,
        date: patent.patent_date,
        assignees,
        query: queryText,
      },
    })
    results.push({ title, ...upsert })
  }

  return results
}
