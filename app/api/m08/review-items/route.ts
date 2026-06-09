/**
 * M08 审核问题管理
 * POST /api/m08/review-items — 新增问题
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

const VALID_TYPES = ['completeness', 'uniformity', 'novelty', 'form', 'support']
const VALID_SEVERITY = ['low', 'medium', 'high', 'critical']
const VALID_STATUS = ['pending', 'resolved', 'ignored']

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { reviewId, content, type, severity, status, isBlocking, step } = body
    if (!reviewId || !content) return NextResponse.json(error('缺少必填字段', 400), { status: 400 })

    const itemType = VALID_TYPES.includes(type) ? type : 'form'
    const itemSeverity = VALID_SEVERITY.includes(severity) ? severity : 'medium'
    const itemStatus = VALID_STATUS.includes(status) ? status : 'pending'

    const result = await query(
      `INSERT INTO review_items (review_id, type, content, severity, status, is_blocking, step) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [reviewId, itemType, content, itemSeverity, itemStatus, !!isBlocking, step || null]
    )
    const row = result.rows[0]
    return NextResponse.json(success({
      id: row.id,
      review_id: row.review_id,
      type: row.type,
      content: row.content,
      severity: row.severity,
      status: row.status,
      isBlocking: row.is_blocking,
      step: row.step,
      created_at: row.created_at,
    }, '问题已添加'))
  } catch (err: any) {
    console.error('Add review item error:', err)
    return NextResponse.json(error('添加失败: ' + err.message, 500), { status: 500 })
  }
}
