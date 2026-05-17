/**
 * 案件详情/更新/删除
 * GET    /api/cases/:id
 * PUT    /api/cases/:id
 * DELETE /api/cases/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/cases/:id — 案件详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    // 查询案件基本信息
    const caseResult = await query(
      `SELECT c.*,
        applicant.name as applicant_name,
        engineer.name as engineer_name,
        reviewer.name as reviewer_name
       FROM cases c
       LEFT JOIN users applicant ON c.applicant_id = applicant.id
       LEFT JOIN users engineer ON c.engineer_id = engineer.id
       LEFT JOIN users reviewer ON c.reviewer_id = reviewer.id
       WHERE c.id = $1`,
      [id]
    )

    if (caseResult.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404))
    }

    const caseData = caseResult.rows[0]

    // 查询附件
    const filesResult = await query(
      `SELECT id, filename, original_name, url, mime_type, size, created_at
       FROM case_files WHERE case_id = $1 ORDER BY created_at DESC`,
      [id]
    )

    // 查询状态历史
    const historyResult = await query(
      `SELECT h.*, u.name as operator_name
       FROM case_status_history h
       LEFT JOIN users u ON h.operator_id = u.id
       WHERE h.case_id = $1 ORDER BY h.created_at DESC`,
      [id]
    )

    return NextResponse.json(success({
      ...caseData,
      files: filesResult.rows,
      history: historyResult.rows,
    }))
  } catch (err: any) {
    console.error('获取案件详情失败:', err)
    return NextResponse.json(error('获取案件详情失败', 500))
  }
}

// PUT /api/cases/:id — 更新案件
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { title, description, status, engineerId, reviewerId, priority } = body

    // 检查案件是否存在
    const caseCheck = await query('SELECT id, status FROM cases WHERE id = $1', [id])
    if (caseCheck.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404))
    }

    const oldStatus = caseCheck.rows[0].status

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (title !== undefined) { updates.push(`title = $${paramIndex++}`); values.push(title) }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description) }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status) }
    if (engineerId !== undefined) { updates.push(`engineer_id = $${paramIndex++}`); values.push(engineerId) }
    if (reviewerId !== undefined) { updates.push(`reviewer_id = $${paramIndex++}`); values.push(reviewerId) }
    if (priority !== undefined) { updates.push(`priority = $${paramIndex++}`); values.push(priority) }

    if (updates.length === 0) {
      return NextResponse.json(error('没有要更新的字段', 400))
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE cases SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    // 如果状态变更，记录历史
    if (status && status !== oldStatus) {
      await query(
        `INSERT INTO case_status_history (case_id, from_status, to_status, operator_id, remark)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, oldStatus, status, user.id, '状态更新']
      )
    }

    return NextResponse.json(success(result.rows[0], '更新成功'))
  } catch (err: any) {
    console.error('更新案件失败:', err)
    return NextResponse.json(error('更新案件失败', 500))
  }
}

// DELETE /api/cases/:id — 删除案件
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const result = await query(
      'DELETE FROM cases WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404))
    }

    return NextResponse.json(success({ id: result.rows[0].id }, '删除成功'))
  } catch (err: any) {
    console.error('删除案件失败:', err)
    return NextResponse.json(error('删除案件失败', 500))
  }
}
