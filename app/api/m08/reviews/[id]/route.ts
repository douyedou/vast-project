/**
 * 审核任务详情/更新
 * GET /api/m08/reviews/:id
 * PUT /api/m08/reviews/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/m08/reviews/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const reviewResult = await query(
      `SELECT r.*, c.title as case_title, c.case_id, reviewer.name as reviewer_name
       FROM reviews r
       JOIN cases c ON r.case_id = c.id
       LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
       WHERE r.id = $1`,
      [id]
    )

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(error('审核任务不存在', 404))
    }

    // 查询审核项
    const itemsResult = await query(
      `SELECT id, type, content, severity, status, created_at
       FROM review_items WHERE review_id = $1 ORDER BY created_at DESC`,
      [id]
    )

    return NextResponse.json(success({
      ...reviewResult.rows[0],
      items: itemsResult.rows,
    }))
  } catch (err: any) {
    console.error('获取审核详情失败:', err)
    return NextResponse.json(error('获取审核详情失败', 500))
  }
}

// PUT /api/m08/reviews/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { result, comments, aiSuggestions } = body

    if (!result || !['pass', 'reject', 'pending'].includes(result)) {
      return NextResponse.json(error('无效的审核结果', 400))
    }

    const result_query = await query(
      `UPDATE reviews SET result = $1, comments = $2, ai_suggestions = $3, reviewer_id = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [result, comments || null, aiSuggestions ? JSON.stringify(aiSuggestions) : null, user.id, id]
    )

    if (result_query.rows.length === 0) {
      return NextResponse.json(error('审核任务不存在', 404))
    }

    return NextResponse.json(success(result_query.rows[0], '提交审核意见成功'))
  } catch (err: any) {
    console.error('更新审核任务失败:', err)
    return NextResponse.json(error('更新审核任务失败', 500))
  }
}
