/**
 * 案件状态历史
 * GET /api/cases/:id/history
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    // 检查案件是否存在
    const caseCheck = await query('SELECT id FROM cases WHERE id = $1', [id])
    if (caseCheck.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404))
    }

    const result = await query(
      `SELECT h.*, u.name as operator_name
       FROM case_status_history h
       LEFT JOIN users u ON h.operator_id = u.id
       WHERE h.case_id = $1
       ORDER BY h.created_at DESC`,
      [id]
    )

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('获取案件历史失败:', err)
    return NextResponse.json(error('获取案件历史失败', 500))
  }
}
