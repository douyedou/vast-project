/**
 * 专利文档管理
 * GET  /api/m07/documents?caseId=xxx
 * POST /api/m07/documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

// GET /api/m07/documents
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    if (!caseId) {
      return NextResponse.json(error('缺少 caseId 参数', 400))
    }

    const result = await query(
      `SELECT id, case_id, type, content, status, ai_rate, version, created_at, updated_at
       FROM patent_documents WHERE case_id = $1 ORDER BY created_at DESC`,
      [caseId]
    )

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('获取专利文档失败:', err)
    return NextResponse.json(error('获取专利文档失败', 500))
  }
}

// POST /api/m07/documents
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { caseId, type, content } = body

    if (!caseId || !type) {
      return NextResponse.json(error('caseId 和 type 不能为空', 400))
    }
    if (!['spec', 'claims', 'abstract', 'drawings'].includes(type)) {
      return NextResponse.json(error('无效的文档类型', 400))
    }

    const result = await query(
      `INSERT INTO patent_documents (case_id, type, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [caseId, type, content || '']
    )

    return NextResponse.json(success(result.rows[0], '创建文档成功'))
  } catch (err: any) {
    console.error('创建专利文档失败:', err)
    return NextResponse.json(error('创建专利文档失败', 500))
  }
}
