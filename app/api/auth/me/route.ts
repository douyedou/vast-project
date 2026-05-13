/**
 * 获取当前登录用户信息
 * GET /api/auth/me
 * 
 * 请求头：Authorization: Bearer <token>
 * 响应：{ code, data: { id, username, name, role, permissions[] }, message }
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 1. 验证登录
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(error('请先登录', 401), { status: 401 })
    }

    // 2. 查询用户权限（基于角色的权限列表）
    const permResult = await query(
      `SELECT p.module, p.action
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON rp.role_id = r.id
       WHERE r.name = $1`,
      [user.role === 'applicant' ? '交案人' :
       user.role === 'engineer' ? '专利工程师' :
       user.role === 'reviewer' ? '专利审核员' : '系统管理员']
    )

    const permissions = permResult.rows.map(row => ({
      module: row.module,
      action: row.action,
    }))

    // 3. 返回完整用户信息
    return NextResponse.json(
      success({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        permissions,
      })
    )

  } catch (err: any) {
    console.error('获取用户信息失败:', err)
    return NextResponse.json(error('获取用户信息失败', 500))
  }
}
