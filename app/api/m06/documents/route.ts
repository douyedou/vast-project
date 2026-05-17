/**
 * 交底书文档管理
 * GET  /api/m06/documents?caseId=xxx
 * POST /api/m06/documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

// GET /api/m06/documents
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
      `SELECT id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at
       FROM disclosure_documents WHERE case_id = $1 ORDER BY created_at DESC`,
      [caseId]
    )

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('获取交底书失败:', err)
    return NextResponse.json(error('获取交底书失败', 500))
  }
}

// POST /api/m06/documents
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { caseId, contentJson } = body

    if (!caseId) {
      return NextResponse.json(error('caseId 不能为空', 400))
    }

    const result = await query(
      `INSERT INTO disclosure_documents (case_id, content_json)
       VALUES ($1, $2) RETURNING *`,
      [caseId, JSON.stringify(contentJson || {})]
    )

    return NextResponse.json(success(result.rows[0], '创建交底书成功'))
  } catch (err: any) {
    console.error('创建交底书失败:', err)
    return NextResponse.json(error('创建交底书失败', 500))
  }
}
