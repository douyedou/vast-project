import { ensureKnowledgeSchema } from "@/lib/knowledge"
import { pool, query } from "@/lib/db"

async function main() {
  await ensureKnowledgeSchema()

  const counts = await query(`
    SELECT
      (SELECT COUNT(*) FROM knowledge_base) AS documents,
      (SELECT COUNT(*) FROM knowledge_chunks) AS chunks,
      (SELECT COUNT(*) FROM disclosure_document_versions) AS versions
  `)

  console.log("M06/知识库迁移完成", counts.rows[0])
}

main()
  .catch((err) => {
    console.error("M06/知识库迁移失败:", err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
