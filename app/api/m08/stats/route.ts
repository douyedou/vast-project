/**
 * M08 质量审核侧边栏统计
 * GET /api/m08/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id
         WHERE c.status = 'reviewing' AND r.result = 'pending' AND r.preliminary_done = FALSE) AS pending_review,

        (SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id
         WHERE c.status = 'reviewing' AND r.result = 'pending' AND r.preliminary_done = TRUE) AS reviewing,

        (SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id) AS total_tasks,

        (SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id
         WHERE c.status = 'reviewing' AND r.result = 'pending' AND r.preliminary_done = TRUE) AS decision_needed
    `, [])

    const row = result.rows[0]
    const pendingReview = Number(row.pending_review || 0)
    const reviewing = Number(row.reviewing || 0)

    return NextResponse.json(success({
      // 审核工作台：待处理 = 待审核 + 审核中
      dashboard: pendingReview + reviewing,
      // 审核任务列表：全部审核任务
      taskList: Number(row.total_tasks || 0),
      // 审核决策：已通过初审、等待做决策的案件
      decision: Number(row.decision_needed || 0),
    }))
  } catch (err: any) {
    console.error('M08 stats error:', err)
    return NextResponse.json(error('获取 M08 统计失败', 500))
  }
}
