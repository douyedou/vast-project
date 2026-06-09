/**
 * 退回修改 - 将 writingcheck 状态退回 writing
 * POST /api/m07/revert
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId', 400), { status: 400 })

    // 退回修改：cases → writing, patent_documents → writing
    const revertResult = await query(
      `UPDATE cases SET status = 'writing', updated_at = NOW() WHERE id = $1 AND status = 'writingcheck'
       RETURNING status`,
      [caseId]
    )
    if (revertResult.rows.length > 0) {
      await query(
        `INSERT INTO case_status_history (case_id, from_status, to_status, operator_id, remark)
         VALUES ($1, $2, $3, $4, $5)`,
        [caseId, 'writingcheck', 'writing', user.id, '退回修改：重新撰写']
      )
    }
    await query(
      `UPDATE patent_documents SET status = 'writing', updated_at = NOW()
       WHERE case_id = $1 AND status = 'ai_checking'`,
      [caseId]
    )

    return NextResponse.json(success({ caseId }, '已退回修改'))
  } catch (err: any) {
    console.error('退回失败:', err)
    return NextResponse.json(error('退回失败: ' + err.message, 500), { status: 500 })
  }
}
