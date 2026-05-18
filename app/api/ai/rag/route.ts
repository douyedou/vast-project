/**
 * RAG 问答接口
 * POST /api/ai/rag
 * 请求体：{ question: string, topK?: number }
 * 响应：{ answer: string, sources: [{ title, content, similarity }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { aiService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { question, topK = 3 } = body

    if (!question || question.length < 3) {
      return NextResponse.json(error('问题不能为空', 400))
    }

    // 1. 问题向量化
    const embedResult = await aiService.embed(question)
    const queryVector = embedResult.embedding

    // 2. 向量相似度搜索（cosine similarity）
    const vectorStr = `[${queryVector.join(',')}]`
    const searchResult = await query(
      `SELECT id, field, title, content, source, source_type,
        1 - (embedding <=> $1::vector) as similarity
       FROM knowledge_base
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [vectorStr, topK]
    )

    const sources = searchResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content.substring(0, 500),
      similarity: Math.round(parseFloat(row.similarity) * 100),
      source: row.source,
    }))

    // 3. 构建 RAG Prompt
    const context = sources
      .map((s: any, i: number) => `[参考${i + 1}] ${s.title}\n${s.content}`)
      .join('\n\n')

    const ragPrompt = `请根据以下参考资料回答问题。如果参考资料不足以回答问题，请明确说明。

参考资料：
${context}

用户问题：${question}

请给出详细、准确的回答：`

    // 4. LLM 生成回答
    const generateResult = await aiService.generate(ragPrompt, {
      system: '你是一个专利领域的专业助手。请基于提供的参考资料回答问题，不要编造信息。',
      temperature: 0.3,
      maxTokens: 2048,
    })

    return NextResponse.json(
      success({
        answer: generateResult.text,
        sources,
        model: generateResult.model,
      })
    )
  } catch (err: any) {
    console.error('RAG 问答失败:', err)
    return NextResponse.json(error('RAG 问答失败: ' + err.message, 500))
  }
}

// GET /api/ai/rag — 知识库列表
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')?.trim()
    const field = searchParams.get('field')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (keyword) {
      conditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`)
      params.push(`%${keyword}%`)
      paramIndex++
    }
    if (field) {
      conditions.push(`field = $${paramIndex}`)
      params.push(field)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(`SELECT COUNT(*) FROM knowledge_base ${whereClause}`, params)
    const total = parseInt(countResult.rows[0].count)

    const dataParams = [...params, pageSize, (page - 1) * pageSize]
    const dataResult = await query(
      `SELECT id, field, title, content, source, source_type, created_at
       FROM knowledge_base ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    )

    return NextResponse.json(
      success({
        list: dataResult.rows,
        total,
        page,
        pageSize,
      })
    )
  } catch (err: any) {
    console.error('获取知识库失败:', err)
    return NextResponse.json(error('获取知识库失败', 500))
  }
}
