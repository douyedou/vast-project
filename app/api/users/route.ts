/**
 * 用户管理
 * GET  /api/users?page=1&pageSize=20&keyword=xxx&status=xxx&role=xxx
 * POST /api/users
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error, paginate } from '@/lib/api-response'
import { requireAuth, requireRole } from '@/middleware/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET /api/users — 用户列表
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(request, ['admin'])
    if (!admin) return NextResponse.json(error('无权访问', 403))

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const keyword = searchParams.get('keyword')?.trim()
    const status = searchParams.get('status')
    const role = searchParams.get('role')

    // 构建动态 WHERE 条件
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (keyword) {
      conditions.push(`(username ILIKE $${paramIndex} OR name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
      params.push(`%${keyword}%`)
      paramIndex++
    }
    if (status) {
      conditions.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }
    if (role) {
      conditions.push(`role = $${paramIndex}`)
      params.push(role)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 查询总数
    const countResult = await query(`SELECT COUNT(*) FROM users ${whereClause}`, params)
    const total = parseInt(countResult.rows[0].count)

    // 查询分页数据
    const dataParams = [...params, pageSize, (page - 1) * pageSize]
    const dataResult = await query(
      `SELECT id, username, name, email, phone, role, status, department, avatar_url, created_at, updated_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    )

    return NextResponse.json(paginate(dataResult.rows, total, page, pageSize))
  } catch (err: any) {
    console.error('获取用户列表失败:', err)
    return NextResponse.json(error('获取用户列表失败', 500))
  }
}

// POST /api/users — 创建用户
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, ['admin'])
    if (!admin) return NextResponse.json(error('无权访问', 403))

    const body = await request.json()
    const { username, password, name, email, role, department, phone } = body

    // 参数校验
    if (!username || !password || !name) {
      return NextResponse.json(error('用户名、密码、姓名不能为空', 400))
    }
    if (password.length < 6) {
      return NextResponse.json(error('密码长度不能少于6位', 400))
    }
    if (role && !['applicant', 'engineer', 'reviewer', 'admin'].includes(role)) {
      return NextResponse.json(error('无效的角色类型', 400))
    }

    // 检查用户名是否已存在
    const existing = await query('SELECT id FROM users WHERE username = $1', [username])
    if (existing.rows.length > 0) {
      return NextResponse.json(error('用户名已存在', 409))
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10)

    // 插入用户
    const result = await query(
      `INSERT INTO users (username, password_hash, name, email, role, department, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, name, email, role, status, department, created_at`,
      [username, passwordHash, name, email || null, role || 'applicant', department || null, phone || null]
    )

    return NextResponse.json(success(result.rows[0], '创建用户成功'))
  } catch (err: any) {
    console.error('创建用户失败:', err)
    if (err.code === '23505') {
      return NextResponse.json(error('用户名或邮箱已存在', 409))
    }
    return NextResponse.json(error('创建用户失败', 500))
  }
}
