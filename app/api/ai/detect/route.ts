/**
 * AI generated-text probability endpoint.
 * POST /api/ai/detect
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { aiService } from '@/lib/ai-service'

function splitIntoSections(text: string, maxLength = 500): string[] {
  const sentences = text.split(/([。！？.!?]+)/)
  const sections: string[] = []
  let current = ''

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || '')
    if ((current + sentence).length > maxLength && current.length > 0) {
      sections.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }

  if (current.trim()) sections.push(current.trim())
  return sections
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      return NextResponse.json(error('文本长度不能少于50字符', 400))
    }

    const overall = await aiService.detectAI(content)
    const flaggedSections: Array<{
      start: number
      end: number
      aiProbability: number
      suggestion: string
    }> = []

    if (content.length > 200) {
      const sections = splitIntoSections(content, 400)
      let currentIndex = 0

      for (const section of sections.slice(0, 5)) {
        const sectionResult = await aiService.detectAI(section)
        if (sectionResult.aiRate > 60) {
          flaggedSections.push({
            start: currentIndex,
            end: currentIndex + section.length,
            aiProbability: sectionResult.aiRate,
            suggestion:
              sectionResult.aiRate > 80
                ? '高度疑似 AI 生成，建议结合真实研发细节重写'
                : '可能包含 AI 生成内容，建议补充人工事实和实验细节',
          })
        }
        currentIndex += section.length
      }
    }

    return NextResponse.json(
      success({
        aiRate: overall.aiRate,
        flaggedSections,
        overallAssessment:
          overall.aiRate > 80
            ? '高度疑似 AI 生成'
            : overall.aiRate > 50
              ? '可能包含 AI 生成内容'
              : '大概率为人工改写或事实性文本',
      })
    )
  } catch (err: any) {
    console.error('AI 率检测失败:', err)
    return NextResponse.json(error('AI 率检测失败', 500))
  }
}
