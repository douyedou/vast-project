/**
 * AI text generation endpoint.
 * POST /api/ai/generate
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { aiService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, system, temperature, maxTokens, model } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(error('prompt 不能为空', 400))
    }

    const result = await aiService.generate(prompt, {
      system,
      temperature,
      maxTokens,
      model,
    })

    return NextResponse.json(success(result))
  } catch (err: any) {
    console.error('AI 生成失败:', err)
    return NextResponse.json(error(err.message || 'AI 生成失败', 503))
  }
}
