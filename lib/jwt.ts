/**
 * JWT 工具函数（自实现 HS256）
 * 
 * 注意：开发环境使用硬编码密钥，避免 Next.js Turbopack 的 process.env
 * 内联缓存问题（不同编译产物可能内联不同值）。
 * 生产环境通过构建时的环境变量注入真实密钥。
 */

import { createHmac } from 'crypto'

// 开发环境密钥（仅本地开发使用，生产环境必须覆盖）
const DEV_SECRET = 'vast-dev-jwt-secret-key-change-in-production-2024'

function getSecret(): string {
  // 生产环境：从环境变量读取（构建时注入）
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET 未设置，请在生产环境配置')
    }
    return secret
  }
  // 开发环境：使用硬编码密钥（确保所有模块实例一致）
  return DEV_SECRET
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
