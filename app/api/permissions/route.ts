/**
 * 权限列表
 * GET /api/permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

// GET /api/permissions — 权限列表
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const result = await query(
      `SELECT id, module, action, description
       FROM permissions
       ORDER BY module, action`
    )

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('获取权限列表失败:', err)
    return NextResponse.json(error('获取权限列表失败', 500))
  }
}
