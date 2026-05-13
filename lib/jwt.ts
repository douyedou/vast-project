/**
 * JWT 工具函数
 * 用于签发和验证 Token
 * 
 * 使用方式：
 * 1. 登录成功后签发 Token：const token = sign({ userId, role })
 * 2. 请求时验证 Token：const payload = verify(token)
 */

import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET

if (!SECRET) {
  throw new Error('JWT_SECRET 未设置，请在 .env 文件中配置')
}

export interface JwtPayload {
  userId: string
  username: string
  role: string
  iat?: number
  exp?: number
}

/**
 * 签发 JWT Token
 * @param payload 用户信息（不要放敏感信息如密码）
 * @param expiresIn 过期时间（默认 7 天）
 * @returns Token 字符串
 * 
 * 示例：
 * const token = sign({ userId: user.id, username: user.username, role: user.role })
 */
export function sign(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresIn: string = '7d'
): string {
  return jwt.sign(payload, SECRET!, { expiresIn })
}

/**
 * 验证 JWT Token
 * @param token 从请求头中提取的 token
 * @returns 解析后的用户信息，失败返回 null
 * 
 * 示例：
 * const token = request.headers.get('authorization')?.replace('Bearer ', '')
 * const payload = verify(token)
 * if (!payload) return error('Token 无效或已过期', 401)
 */
export function verify(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET!) as JwtPayload
  } catch (err) {
    return null
  }
}

/**
 * 从请求头中提取 Token
 * @param request NextRequest 对象
 * @returns Token 字符串或 null
 * 
 * 支持两种格式：
 * Authorization: Bearer <token>
 * Authorization: <token>
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  
  // 支持 "Bearer xxx" 和直接 "xxx" 两种格式
  const parts = authHeader.split(' ')
  return parts.length === 2 ? parts[1] : authHeader
}
