/**
 * 质检审核管理
 * GET  /api/m08/reviews?status=xxx&page=1&pageSize=20
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

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      conditions.push(`r.result = $${paramIndex++}`)
      params.push(status)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(`SELECT COUNT(*) FROM reviews r ${whereClause}`, params)
    const total = parseInt(countResult.rows[0].count)

    const dataParams = [...params, pageSize, (page - 1) * pageSize]
    const dataResult = await query(
      `SELECT r.*, c.title as case_title, c.case_id, reviewer.name as reviewer_name
       FROM reviews r
       JOIN cases c ON r.case_id = c.id
       LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    )

    return NextResponse.json(paginate(dataResult.rows, total, page, pageSize))
  } catch (err: any) {
    console.error('获取审核列表失败:', err)
    return NextResponse.json(error('获取审核列表失败', 500))
  }
}

// POST /api/m08/reviews
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { caseId } = body

    if (!caseId) {
      return NextResponse.json(error('caseId 不能为空', 400))
    }

    // 检查案件是否存在
    const caseCheck = await query('SELECT id FROM cases WHERE id = $1', [caseId])
    if (caseCheck.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404))
    }

    const result = await query(
      `INSERT INTO reviews (case_id, reviewer_id, result)
       VALUES ($1, $2, $3) RETURNING *`,
      [caseId, user.id, 'pending']
    )

    return NextResponse.json(success(result.rows[0], '创建审核任务成功'))
  } catch (err: any) {
    console.error('创建审核任务失败:', err)
    return NextResponse.json(error('创建审核任务失败', 500))
  }
}
