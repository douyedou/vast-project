import { pool, query } from "@/lib/db"
import { aiService } from "@/lib/ai-service"
import { chunkText, ensureKnowledgeSchema, hashText, sanitizeKnowledgeText } from "@/lib/knowledge"

async function main() {
  await ensureKnowledgeSchema()

  const documents = await query(
    `SELECT id, field, title, content, source, source_type, source_url, metadata
     FROM knowledge_base
     ORDER BY created_at`
  )

  console.log(`待检查知识文档: ${documents.rows.length} 条`)
  let embeddedDocuments = 0
  let chunksCreated = 0
  let chunksEmbedded = 0

  for (const row of documents.rows) {
    const title = sanitizeKnowledgeText(row.title)
    const content = sanitizeKnowledgeText(row.content)
    if (!content) continue

    const documentEmbedding = await aiService.embed(`${title}\n${content.slice(0, 4000)}`)
    await query(
      `UPDATE knowledge_base
       SET embedding = $1::vector,
           content_hash = COALESCE(content_hash, $3),
           updated_at = NOW()
       WHERE id = $2`,
      [`[${documentEmbedding.embedding.join(",")}]`, row.id, hashText(`${row.source}|${title}|${content}`)]
    )
    embeddedDocuments++

    const existingChunks = await query(`SELECT COUNT(*)::int AS count FROM knowledge_chunks WHERE knowledge_id = $1`, [row.id])
    if (existingChunks.rows[0].count > 0) continue

    const chunks = chunkText(content)
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index]
      const embedding = await aiService.embed(`${title}\n${chunk}`)
      const chunkHash = hashText(`${row.id}|${index}|${chunk}`)
      await query(
        `INSERT INTO knowledge_chunks (
          knowledge_id, chunk_index, field, title, content, embedding, source, source_type, source_url, metadata, content_hash
         )
         VALUES ($1, $2, $3, $4, $5, $6::vector, $7, $8, $9, $10, $11)
         ON CONFLICT (content_hash) DO UPDATE
         SET embedding = EXCLUDED.embedding,
             updated_at = NOW()`,
        [
          row.id,
          index,
          row.field || "通用",
          title,
          chunk,
          `[${embedding.embedding.join(",")}]`,
          row.source,
          row.source_type || "other",
          row.source_url,
          JSON.stringify(row.metadata || {}),
          chunkHash,
        ]
      )
      chunksCreated++
      chunksEmbedded++
    }

    console.log(`已处理: ${title.substring(0, 40)} / chunks=${chunks.length}`)
  }

  const summary = await query(`
    SELECT
      (SELECT COUNT(*) FROM knowledge_base) AS documents,
      (SELECT COUNT(*) FROM knowledge_chunks) AS chunks,
      (SELECT COUNT(*) FROM knowledge_base WHERE embedding IS NULL) AS documents_without_embedding,
      (SELECT COUNT(*) FROM knowledge_chunks WHERE embedding IS NULL) AS chunks_without_embedding
  `)
  console.log("向量化完成", {
    embeddedDocuments,
    chunksCreated,
    chunksEmbedded,
    summary: summary.rows[0],
  })
}

main()
  .catch((err) => {
    console.error("知识库向量化失败:", err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
