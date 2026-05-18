/**
 * 案件状态流转
 * POST /api/cases/:id/transition
 * 请求体：{ to: 'assigning' }
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import {
  isTransitionAllowed,
  getTransitionLabel,
  checkTransitionPrerequisites,
  CASE_STATUS_LABELS,
} from '@/lib/case-state-machine'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { to } = body

    if (!to) {
      return NextResponse.json(error('目标状态不能为空', 400))
    }

    // 查询当前案件状态
    const caseResult = await query('SELECT id, status FROM cases WHERE id = $1', [id])
    if (caseResult.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404))
    }

    const currentStatus = caseResult.rows[0].status

    // 检查状态跳转是否合法
    if (!isTransitionAllowed(currentStatus, to)) {
      return NextResponse.json(
        error(
          `不允许从 ${CASE_STATUS_LABELS[currentStatus as keyof typeof CASE_STATUS_LABELS]} 跳转到 ${CASE_STATUS_LABELS[to as keyof typeof CASE_STATUS_LABELS]}`,
          400
        )
      )
    }

    // 检查前置条件
    const prereq = await checkTransitionPrerequisites(id, currentStatus, to, query)
    if (!prereq.valid) {
      return NextResponse.json(error(prereq.message || '前置条件不满足', 400))
    }

    // 执行状态流转
    const updateResult = await query(
      'UPDATE cases SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [to, id]
    )

    // 记录状态历史
    await query(
      `INSERT INTO case_status_history (case_id, from_status, to_status, operator_id, remark)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, currentStatus, to, user.id, getTransitionLabel(currentStatus, to)]
    )

    return NextResponse.json(
      success(updateResult.rows[0], '状态流转成功')
    )
  } catch (err: any) {
    console.error('状态流转失败:', err)
    return NextResponse.json(error('状态流转失败', 500))
  }
}

// GET /api/cases/:id/transition — 获取允许的下一状态
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const caseResult = await query('SELECT status FROM cases WHERE id = $1', [id])
    if (caseResult.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404))
    }

    const currentStatus = caseResult.rows[0].status

    const { getAllowedTransitions } = await import('@/lib/case-state-machine')
    const allowed = getAllowedTransitions(currentStatus)

    return NextResponse.json(success(allowed))
  } catch (err: any) {
    console.error('获取允许状态失败:', err)
    return NextResponse.json(error('获取允许状态失败', 500))
  }
}
