/**
 * RAG 批量测试脚本
 * 测试多个问题的检索质量
 *
 * 用法：npx tsx scripts/test-rag.ts
 */

import { Pool } from 'pg'

const OLLAMA_URL = 'http://localhost:11434/api/embeddings'
const EMBED_MODEL = 'mxbai-embed-large:latest'

const TEST_QUESTIONS = [
  { question: '半轴装配吊具的技术方案是什么？', expected: '半轴' },
  { question: 'ABS传感器测试台如何工作？', expected: 'ABS' },
  { question: '血液灌流器的吸附树脂有什么特点？', expected: '血液' },
  { question: '水面救援系统有哪些组成部分？', expected: '救援' },
  { question: '机械领域的专利有哪些？', expected: '机械' },
]

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  })
  const data = await response.json()
  return data.embedding
}

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://vast_user:dydyxy999@localhost:5432/vast_db',
  })
  const client = await pool.connect()

  console.log('=== RAG 批量测试 ===\n')

  for (const test of TEST_QUESTIONS) {
    const embed = await getEmbedding(test.question)
    const vectorStr = `[${embed.join(',')}]`

    const result = await client.query(
      `SELECT title, content, 1 - (embedding <=> $1::vector) as similarity
       FROM knowledge_base WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector LIMIT 3`,
      [vectorStr]
    )

    const top = result.rows[0]
    const isRelevant = top.title.includes(test.expected) || top.content.includes(test.expected)

    console.log(`Q: ${test.question}`)
    console.log(`  Top1: [${Math.round(top.similarity * 100)}%] ${top.title.substring(0, 50)}`)
    console.log(`  相关性: ${isRelevant ? '✅' : '❌'}`)
    console.log('')
  }

  client.release()
  await pool.end()
}

main()
