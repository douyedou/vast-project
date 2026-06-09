/**
 * 用户搜索（用于邀请协作人）
 * GET /api/users/search?keyword=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')?.trim() || ''

    let result
    if (keyword) {
      result = await query(
        `SELECT id, name, username, email, role
         FROM users
         WHERE role = 'engineer' AND status = 'active'
           AND (name ILIKE $1 OR username ILIKE $1 OR email ILIKE $1)
         ORDER BY name
         LIMIT 20`,
        [`%${keyword}%`]
      )
    } else {
      result = await query(
        `SELECT id, name, username, email, role
         FROM users WHERE role = 'engineer' AND status = 'active'
         ORDER BY name LIMIT 20`,
        []
      )
    }

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('搜索用户失败:', err)
    return NextResponse.json(error('搜索失败', 500), { status: 500 })
  }
}
