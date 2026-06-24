/**
 * 双文档工作台案例列表（含协作案件）
 * GET /api/m07/workspace/cases
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    // admin 看所有 writing 案件；engineer 看自己负责的 + 协作的 + 未分配的
    const isAdmin = user.role === 'admin'
    const result = await query(
      `SELECT c.*,
        engineer.name as engineer_name
       FROM cases c
       LEFT JOIN users engineer ON c.engineer_id = engineer.id
       WHERE c.status = 'writing'
         AND (
           $2::boolean
           OR c.engineer_id = $1
           OR c.id IN (SELECT case_id FROM case_engineers WHERE engineer_id = $1)
           OR c.engineer_id IS NULL
         )
       ORDER BY c.updated_at DESC`,
      [user.id, isAdmin]
    )

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('获取工作台案例失败:', err)
    return NextResponse.json(error('获取失败', 500), { status: 500 })
  }
}
