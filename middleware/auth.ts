/**
 * 鉴权中间件
 * 用于保护需要登录的 API 接口
 * 
 * 使用方式（在 API Route 中）：
 * import { requireAuth } from '@/middleware/auth'
 * 
 * export async function GET(request: NextRequest) {
 *   const user = await requireAuth(request)
 *   if (!user) return NextResponse.json(error('未登录', 401))
 *   // ... 后续逻辑
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verify, extractToken } from '@/lib/jwt'
import { error } from '@/lib/api-response'
import { query } from '@/lib/db'

export interface AuthUser {
  id: string
  username: string
  name: string
  role: string
  email: string | null
}

/**
 * 验证请求是否已登录
 * @param request NextRequest
 * @returns 用户信息，未登录返回 null
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser | null> {
  const token = extractToken(request)
  if (!token) return null

  const payload = verify(token)
  if (!payload) return null

  // 从数据库查询最新用户信息（防止用户被删除/禁用后 Token 仍然有效）
  const result = await query(
    'SELECT id, username, name, role, email, status FROM users WHERE id = $1',
    [payload.userId]
  )

  if (result.rows.length === 0) return null
  
  const user = result.rows[0]
  if (user.status !== 'active') return null

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
  }
}

/**
 * 验证请求是否拥有指定角色
 * @param request NextRequest
 * @param roles 允许的角色列表
 * @returns 用户信息，无权限返回 null
 * 
 * 示例：
 * const user = await requireRole(request, ['engineer', 'admin'])
 * if (!user) return NextResponse.json(error('无权限', 403))
 */
export async function requireRole(
  request: NextRequest,
  roles: string[]
): Promise<AuthUser | null> {
  const user = await requireAuth(request)
  if (!user) return null
  if (!roles.includes(user.role)) return null
  return user
}

/**
 * 快速返回未登录响应
 */
export function unauthorizedResponse() {
  return NextResponse.json(error('请先登录', 401), { status: 401 })
}

/**
 * 快速返回无权限响应
 */
export function forbiddenResponse() {
  return NextResponse.json(error('无权访问此资源', 403), { status: 403 })
}
