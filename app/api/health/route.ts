/**
 * 健康检查接口
 * GET /api/health
 * 
 * 用于验证：
 * 1. 后端服务是否正常运行
 * 2. 数据库连接是否正常
 * 3. Ollama AI 服务是否可达
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { testConnection } from '@/lib/db'

export async function GET(request: NextRequest) {
  const checks: Record<string, boolean | string> = {}

  // 1. 基础服务状态
  checks.server = true

  // 2. 数据库连接检查
  try {
    const dbOk = await testConnection()
    checks.database = dbOk
  } catch (err) {
    checks.database = false
  }

  // 3. Ollama AI 服务检查（可选，不阻塞）
  try {
    const ollamaRes = await fetch(
      `${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/tags`,
      { signal: AbortSignal.timeout(3000) }
    )
    checks.ollama = ollamaRes.ok
  } catch (err) {
    checks.ollama = 'unreachable'
  }

  // 4. 环境变量检查
  checks.env_database_url = !!process.env.DATABASE_URL
  checks.env_jwt_secret = !!process.env.JWT_SECRET

  const allOk = checks.database === true

  return NextResponse.json(
    success(
      {
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks,
      },
      allOk ? '服务运行正常' : '服务部分异常'
    ),
    { status: allOk ? 200 : 503 }
  )
}
