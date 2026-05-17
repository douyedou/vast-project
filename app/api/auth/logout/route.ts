/**
 * 用户登出
 * POST /api/auth/logout
 *
 * 请求头：Authorization: Bearer <token>
 * 响应：{ code, data: { success: true }, message }
 *
 * 说明：登出只需客户端清除 Token，服务端不做额外处理（无 Token 黑名单）
 */

import { NextRequest, NextResponse } from 'next/server'
import { success } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  // 可选：验证 Token 是否有效
  const user = await requireAuth(request)
  if (!user) {
    // 即使 Token 无效，也返回登出成功（客户端反正要清 Token）
    return NextResponse.json(success({ success: true }, '登出成功'))
  }

  return NextResponse.json(success({ success: true }, '登出成功'))
}
