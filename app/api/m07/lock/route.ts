/**
 * 锁定案例提交审核
 * POST /api/m07/lock
 * cases.status: writing → writingcheck
 * patent_documents.status: writing → ai_checking
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query, transaction } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId', 400), { status: 400 })

    // 检查当前状态
    const caseResult = await query(`SELECT status FROM cases WHERE id = $1`, [caseId])
    if (caseResult.rows.length === 0) return NextResponse.json(error('案例不存在', 404), { status: 404 })
    if (caseResult.rows[0].status !== 'writing') {
      return NextResponse.json(error('当前状态不允许锁定', 400), { status: 400 })
    }

    const fromStatus = caseResult.rows[0].status

    await transaction(async (client) => {
      // 锁定案例状态
      await client.query(
        `UPDATE cases SET status = 'writingcheck', updated_at = NOW() WHERE id = $1`,
        [caseId]
      )
      // 记录状态历史
      await client.query(
        `INSERT INTO case_status_history (case_id, from_status, to_status, operator_id, remark)
         VALUES ($1, $2, $3, $4, $5)`,
        [caseId, fromStatus, 'writingcheck', user.id, '撰写完成，锁定提交审核']
      )
      // 锁定文档状态
      await client.query(
        `UPDATE patent_documents SET status = 'ai_checking', updated_at = NOW()
         WHERE case_id = $1 AND status = 'writing'`,
        [caseId]
      )
      // 创建审核记录（随机分配审核员，避免重复）
      const existingReview = await client.query(
        `SELECT id FROM reviews WHERE case_id = $1 AND result = 'pending' LIMIT 1`,
        [caseId]
      )
      if (existingReview.rows.length === 0) {
        await client.query(
          `INSERT INTO reviews (case_id, reviewer_id, result)
           VALUES ($1, (SELECT id FROM users WHERE role = 'reviewer' AND status = 'active' ORDER BY RANDOM() LIMIT 1), 'pending')`,
          [caseId]
        )
      }
    })

    return NextResponse.json(success({ caseId }, '已锁定并提交审核'))
  } catch (err: any) {
    console.error('锁定失败:', err)
    return NextResponse.json(error('锁定失败: ' + err.message, 500), { status: 500 })
  }
}
