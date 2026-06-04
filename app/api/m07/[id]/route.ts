/**
 * 专利文档详情/更新
 * GET /api/m07/documents/:id
 * PUT /api/m07/documents/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/m07/documents/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const result = await query(
      `SELECT id, case_id, type, content, status, ai_rate, version, created_at, updated_at
       FROM patent_documents WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    return NextResponse.json(success(result.rows[0]))
  } catch (err: any) {
    console.error('获取专利文档失败:', err)
    return NextResponse.json(error('获取专利文档失败', 500))
  }
}

// PUT /api/m07/documents/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { content, status, aiRate } = body

    const docCheck = await query('SELECT id, content, version FROM patent_documents WHERE id = $1', [id])
    if (docCheck.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    const oldDoc = docCheck.rows[0]

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (content !== undefined) { updates.push(`content = $${paramIndex++}`); values.push(content) }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status) }
    if (aiRate !== undefined) { updates.push(`ai_rate = $${paramIndex++}`); values.push(aiRate) }
    updates.push(`version = version + 1`)
    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE patent_documents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    // 保存版本快照
    if (content !== undefined && content !== oldDoc.content) {
      await query(
        `INSERT INTO document_versions (document_id, content, operator_id, change_summary)
         VALUES ($1, $2, $3, $4)`,
        [id, oldDoc.content, user.id, '内容更新']
      )
    }

    return NextResponse.json(success(result.rows[0], '保存成功'))
  } catch (err: any) {
    console.error('更新专利文档失败:', err)
    return NextResponse.json(error('更新专利文档失败', 500))
  }
}
