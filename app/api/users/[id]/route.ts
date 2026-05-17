/**
 * 用户详情/更新/删除
 * GET    /api/users/:id
 * PUT    /api/users/:id
 * DELETE /api/users/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth, requireRole } from '@/middleware/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/users/:id — 用户详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    // 普通用户只能查看自己的信息
    if (user.role !== 'admin' && user.id !== id) {
      return NextResponse.json(error('无权访问', 403))
    }

    const result = await query(
      `SELECT id, username, name, email, phone, role, status, department, avatar_url, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('用户不存在', 404))
    }

    return NextResponse.json(success(result.rows[0]))
  } catch (err: any) {
    console.error('获取用户详情失败:', err)
    return NextResponse.json(error('获取用户详情失败', 500))
  }
}

// PUT /api/users/:id — 更新用户
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole(request, ['admin'])
    const currentUser = await requireAuth(request)
    if (!currentUser) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { name, email, role, status, department, phone, password } = body

    // 非管理员只能修改自己
    if (!admin && currentUser.id !== id) {
      return NextResponse.json(error('无权访问', 403))
    }

    // 非管理员不能修改角色和状态
    if (!admin && (role || status)) {
      return error('无权修改角色或状态', 403)
    }

    // 检查用户是否存在
    const userResult = await query('SELECT id FROM users WHERE id = $1', [id])
    if (userResult.rows.length === 0) {
      return NextResponse.json(error('用户不存在', 404))
    }

    // 构建动态更新字段
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name) }
    if (email !== undefined) { updates.push(`email = $${paramIndex++}`); values.push(email) }
    if (role !== undefined) { updates.push(`role = $${paramIndex++}`); values.push(role) }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status) }
    if (department !== undefined) { updates.push(`department = $${paramIndex++}`); values.push(department) }
    if (phone !== undefined) { updates.push(`phone = $${paramIndex++}`); values.push(phone) }
    if (password !== undefined) {
      if (password.length < 6) return NextResponse.json(error('密码长度不能少于6位', 400))
      const passwordHash = await bcrypt.hash(password, 10)
      updates.push(`password_hash = $${paramIndex++}`)
      values.push(passwordHash)
    }

    if (updates.length === 0) {
      return NextResponse.json(error('没有要更新的字段', 400))
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, username, name, email, phone, role, status, department, updated_at`,
      values
    )

    return NextResponse.json(success(result.rows[0], '更新成功'))
  } catch (err: any) {
    console.error('更新用户失败:', err)
    if (err.code === '23505') {
      return error('邮箱已存在', 409)
    }
    return NextResponse.json(error('更新用户失败', 500))
  }
}

// DELETE /api/users/:id — 删除用户
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole(request, ['admin'])
    if (!admin) return NextResponse.json(error('无权访问', 403))

    const { id } = await params

    // 不能删除自己
    if (admin.id === id) {
      return NextResponse.json(error('不能删除当前登录用户', 400))
    }

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('用户不存在', 404))
    }

    return NextResponse.json(success({ id: result.rows[0].id }, '删除成功'))
  } catch (err: any) {
    console.error('删除用户失败:', err)
    return NextResponse.json(error('删除用户失败', 500))
  }
}
