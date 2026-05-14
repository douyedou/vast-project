/**
 * AI 生成测试接口
 * POST /api/ai/generate
 * 
 * 前端调用此接口 → Node.js 转发到 Python AI 服务或直接调用 Ollama
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { aiService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, temperature, maxTokens } = body

    if (!prompt) {
      return NextResponse.json(error('prompt 不能为空'))
    }

    const result = await aiService.generate(prompt, {
      temperature,
      maxTokens,
    })

    return NextResponse.json(success(result))
  } catch (err: any) {
    console.error('AI 生成失败:', err)
    return NextResponse.json(error(err.message || 'AI 生成失败', 503))
  }
}
