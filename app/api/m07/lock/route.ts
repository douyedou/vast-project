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

    await transaction(async (client) => {
      // 锁定案例状态
      await client.query(
        `UPDATE cases SET status = 'writingcheck', updated_at = NOW() WHERE id = $1`,
        [caseId]
      )
      // 锁定文档状态
      await client.query(
        `UPDATE patent_documents SET status = 'ai_checking', updated_at = NOW()
         WHERE case_id = $1 AND status = 'writing'`,
        [caseId]
      )
      // 创建审核记录
      await client.query(
        `INSERT INTO reviews (case_id, reviewer_id, result)
         VALUES ($1, (SELECT id FROM users WHERE role = 'reviewer' LIMIT 1), 'pending')
         ON CONFLICT DO NOTHING`,
        [caseId]
      )
    })

    return NextResponse.json(success({ caseId }, '已锁定并提交审核'))
  } catch (err: any) {
    console.error('锁定失败:', err)
    return NextResponse.json(error('锁定失败: ' + err.message, 500), { status: 500 })
  }
}
