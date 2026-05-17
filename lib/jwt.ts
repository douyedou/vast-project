/**
 * JWT 工具函数（自实现 HS256）
 * 
 * 注意：使用自实现而非 jsonwebtoken 库，以避免 Next.js Turbopack
 * 的 process.env 内联缓存问题（不同 bundle 可能内联不同的值）。
 */

import { createHmac } from 'crypto'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 未设置，请在 .env 文件中配置')
  }
  return secret
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str).toString('base64url')
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString()
}

function parseDuration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhm])$/)
  if (!match) return 7 * 86400
  const value = parseInt(match[1])
  const unit = match[2]
  const multipliers: Record<string, number> = { d: 86400, h: 3600, m: 60 }
  return value * (multipliers[unit] || 86400)
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
 */
export function sign(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresIn: string = '7d'
): string {
  const secret = getSecret()
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat: now, exp: now + parseDuration(expiresIn) }))
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

/**
 * 验证 JWT Token
 */
export function verify(token: string): JwtPayload | null {
  try {
    const secret = getSecret()
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) return null

    const expectedSignature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
    if (signature !== expectedSignature) return null

    const payload = JSON.parse(base64UrlDecode(body)) as JwtPayload
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

/**
 * 从请求头中提取 Token
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  return parts.length === 2 ? parts[1] : authHeader
}
