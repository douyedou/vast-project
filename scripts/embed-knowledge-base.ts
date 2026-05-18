/**
 * 知识库批量向量化脚本
 * 遍历 knowledge_base 表，为每条记录生成 embedding 并存入 pgvector
 *
 * 用法：npx tsx scripts/embed-knowledge-base.ts
 */

import { Pool } from 'pg'

const OLLAMA_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434') + '/api/embeddings'
const EMBED_MODEL = 'mxbai-embed-large:latest'

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBED_MODEL,
      prompt: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama embed 失败: ${response.status}`)
  }

  const data = await response.json()
  return data.embedding
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://vast_user:dydyxy999@localhost:5432/vast_db',
  })
  const client = await pool.connect()

  try {
    // 获取所有需要向量化的记录
    const rowsResult = await client.query(
      `SELECT id, title, content FROM knowledge_base WHERE embedding IS NULL ORDER BY created_at`
    )

    console.log(`待向量化记录: ${rowsResult.rows.length} 条\n`)

    let success = 0
    let failed = 0

    for (const row of rowsResult.rows) {
      // 构造输入文本：标题 + 内容前 400 字符（mxbai-embed-large 上下文限制 512 tokens）
      const inputText = `${row.title}\n${row.content || ''}`.substring(0, 400)

      try {
        const embedding = await getEmbedding(inputText)
        const vectorStr = `[${embedding.join(',')}]`

        await client.query(
          `UPDATE knowledge_base SET embedding = $1::vector WHERE id = $2`,
          [vectorStr, row.id]
        )

        success++
        console.log(`✅ [${success}] ${row.title.substring(0, 40)} (${embedding.length}维)`)
      } catch (err: any) {
        failed++
        console.log(`❌ ${row.title.substring(0, 40)}: ${err.message}`)
      }
    }

    console.log(`\n🎉 完成！成功: ${success}, 失败: ${failed}`)
  } catch (err: any) {
    console.error('脚本执行失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
