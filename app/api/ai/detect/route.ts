/**
 * AI 率检测
 * POST /api/ai/detect
 * 请求体：{ content: string }
 * 响应：{ aiRate: 0-100, flaggedSections: [{ start, end, suggestion }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { generate } from '@/lib/ai-service'

// 将文本分段（每段约 500 字符）
function splitIntoSections(text: string, maxLength: number = 500): string[] {
  const sentences = text.split(/([。！？\.\!\?]+)/)
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

    if (!content || content.length < 50) {
      return NextResponse.json(error('文本长度不能少于50字符', 400))
    }

    // 1. 整体 AI 率检测
    const overallPrompt = `请判断以下文本是由 AI 生成的概率（0-100），只返回一个 0-100 的数字：

${content.substring(0, 2000)}`

    const overallResult = await generate(overallPrompt, {
      system: '你是一个文本分析专家。请判断给定文本是由 AI 生成还是人类撰写的概率。只返回一个 0-100 的整数数字，不要解释。',
      temperature: 0.1,
    })

    // 解析 AI 率
    const aiRateMatch = overallResult.text.match(/(\d+)/)
    const aiRate = aiRateMatch ? Math.min(100, Math.max(0, parseInt(aiRateMatch[1]))) : 50

    // 2. 分段检测（只检测较长的文本）
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
        // 最多检测 5 段
        const sectionPrompt = `判断以下文本由 AI 生成的概率（0-100），只返回数字：
${section}`

        try {
          const sectionResult = await generate(sectionPrompt, {
            system: '判断文本是否由 AI 生成。只返回 0-100 的整数数字。',
            temperature: 0.1,
          })
          const sectionRateMatch = sectionResult.text.match(/(\d+)/)
          const sectionRate = sectionRateMatch ? parseInt(sectionRateMatch[1]) : 50

          if (sectionRate > 60) {
            flaggedSections.push({
              start: currentIndex,
              end: currentIndex + section.length,
              aiProbability: sectionRate,
              suggestion: sectionRate > 80 ? '高度疑似 AI 生成，建议重写' : '可能包含 AI 生成内容，建议检查',
            })
          }
        } catch {
          // 单段检测失败，跳过
        }

        currentIndex += section.length
      }
    }

    return NextResponse.json(
      success({
        aiRate,
        flaggedSections,
        overallAssessment:
          aiRate > 80
            ? '高度疑似 AI 生成'
            : aiRate > 50
              ? '可能包含 AI 生成内容'
              : '大概率人类撰写',
      })
    )
  } catch (err: any) {
    console.error('AI 率检测失败:', err)
    return NextResponse.json(error('AI 率检测失败', 500))
  }
}
