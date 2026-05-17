/**
 * 登录接口
 * POST /api/auth/login
 * 
 * 请求体：{ username: string, password: string }
 * 响应：{ code, data: { token, user }, message }
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { query } from '@/lib/db'
import { sign } from '@/lib/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // 1. 参数校验
    if (!username || !password) {
      return NextResponse.json(error('用户名和密码不能为空'))
    }

    // 2. 查询用户
    const result = await query(
      'SELECT id, username, name, password_hash, role, email, status FROM users WHERE username = $1',
      [username]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('用户名或密码错误'))
    }

    const user = result.rows[0]

    // 3. 检查用户状态
    if (user.status !== 'active') {
      return NextResponse.json(error('账户已被禁用，请联系管理员'))
    }

    // 4. 密码校验
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(error('用户名或密码错误'))
    }

    // 5. 签发 JWT Token
    const token = sign({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    // 6. 返回用户信息（不包含密码）
    return NextResponse.json(
      success({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
        },
      }, '登录成功')
    )

  } catch (err: any) {
    console.error('登录失败:', err)
    return NextResponse.json(error('登录失败，请稍后重试', 500))
  }
}
