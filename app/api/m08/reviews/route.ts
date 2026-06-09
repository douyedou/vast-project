/**
 * M08 审核任务列表
 * GET  /api/m08/reviews?page=1&pageSize=20&status=xxx&keyword=xxx
 * POST /api/m08/reviews
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error, paginate } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

// GET /api/m08/reviews
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const status = searchParams.get('status')
    const keyword = searchParams.get('keyword')?.trim()

    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    // 默认只显示审核中的任务，可通过 ?status=completed / ?status=rejected 查看历史
    if (status && status !== 'all') {
      conditions.push(`c.status = $${idx}`)
      params.push(status)
      idx++
    } else {
      conditions.push(`c.status = 'reviewing'`)
    }
    if (keyword) {
      conditions.push(`(c.title ILIKE $${idx} OR c.case_id ILIKE $${idx})`)
      params.push(`%${keyword}%`)
      idx++
    }
    conditions.push(`(r.reviewer_id = $${idx} OR r.reviewer_id IS NULL)`)
    params.push(user.id)
    idx++

    const where = conditions.join(' AND ')

    const countResult = await query(
      `SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id WHERE ${where}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    const dataParams = [...params, pageSize, (page - 1) * pageSize]
    const result = await query(
      `SELECT DISTINCT ON (c.id)
         r.id AS review_id, r.result AS review_result,
         c.id, c.case_id, c.title, c.type, c.status,
         c.created_at, c.updated_at, c.priority, c.returned_count,
         u.name AS reviewer_name,
         r.preliminary_done, r.disclosure_done, r.five_books_done,
         (SELECT COUNT(*) FROM review_items ri WHERE ri.review_id = r.id AND ri.severity IN ('high','critical')) AS blocking_count
       FROM reviews r
       JOIN cases c ON c.id = r.case_id
       LEFT JOIN users u ON u.id = r.reviewer_id
       WHERE ${where}
       ORDER BY c.id, r.updated_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      dataParams
    )

    const list = result.rows.map((row: any) => ({
      id: row.id,
      reviewId: row.review_id,
      reviewResult: row.review_result,
      case_id: row.case_id,
      title: row.title,
      type: row.type,
      status: row.status,
      priority: row.priority,
      reviewer_name: row.reviewer_name || '未分配',
      returned_count: Number(row.returned_count || 0),
      blocking_count: Number(row.blocking_count || 0),
      preliminaryDone: row.preliminary_done,
      disclosureDone: row.disclosure_done,
      fiveBooksDone: row.five_books_done,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    return NextResponse.json(paginate(list, total, page, pageSize))
  } catch (err: any) {
    console.error('M08 reviews error:', err)
    return NextResponse.json(error('获取审核列表失败', 500))
  }
}

// POST /api/m08/reviews — 创建审核任务（M07 lock 已创建，此接口备用）
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { caseId } = body
    if (!caseId) return NextResponse.json(error('caseId 不能为空', 400))

    const caseCheck = await query('SELECT id FROM cases WHERE id = $1', [caseId])
    if (caseCheck.rows.length === 0) return NextResponse.json(error('案件不存在', 404))

    const result = await query(
      `INSERT INTO reviews (case_id, reviewer_id, result)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [caseId, user.id]
    )

    return NextResponse.json(success(result.rows[0], '创建审核任务成功'))
  } catch (err: any) {
    console.error('创建审核任务失败:', err)
    return NextResponse.json(error('创建审核任务失败', 500))
  }
}
