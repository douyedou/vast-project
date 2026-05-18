/**
 * 知识库文档管理
 * POST /api/ai/rag/documents — 添加文档（自动向量化）
 * DELETE /api/ai/rag/documents/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { aiService } from '@/lib/ai-service'

// POST /api/ai/rag/documents
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { field, title, content, source, sourceType } = body

    if (!field || !title || !content) {
      return NextResponse.json(error('领域、标题、内容不能为空', 400))
    }

    // 文本向量化
    const embedResult = await aiService.embed(content)
    const vector = embedResult.embedding

    const result = await query(
      `INSERT INTO knowledge_base (field, title, content, embedding, source, source_type)
       VALUES ($1, $2, $3, $4::vector, $5, $6)
       RETURNING id, field, title, source, source_type, created_at`,
      [field, title, content, `[${vector.join(',')}]`, source || null, sourceType || 'other']
    )

    return NextResponse.json(success(result.rows[0], '文档添加成功'))
  } catch (err: any) {
    console.error('添加知识库文档失败:', err)
    return NextResponse.json(error('添加知识库文档失败: ' + err.message, 500))
  }
}
