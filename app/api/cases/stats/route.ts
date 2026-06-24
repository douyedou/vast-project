/**
 * 案件状态统计
 * GET /api/cases/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const params: any[] = []
    let sql = `
      SELECT c.status, COUNT(*) as count
      FROM cases c
    `

    if (user.role !== 'admin') {
      sql += ` WHERE (c.applicant_id = $1 OR c.engineer_id = $1 OR c.reviewer_id = $1)`
      params.push(user.id)
    }

    sql += ` GROUP BY c.status`

    const result = await query(sql, params)
    const stats: Record<string, number> = {}
    for (const row of result.rows) {
      stats[row.status] = parseInt(row.count)
    }

    return NextResponse.json(success(stats))
  } catch (err: any) {
    console.error('获取案件统计失败:', err)
    return NextResponse.json(error('获取案件统计失败', 500))
  }
}
