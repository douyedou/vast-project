/**
 * AI 交底书问答
 * POST /api/m07/disclosure/chat
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { aiService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId, question } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId', 400), { status: 400 })
    if (!question || !question.trim()) return NextResponse.json(error('请输入问题', 400), { status: 400 })

    // 获取交底书全文
    const disclosureResult = await query(
      `SELECT content_json FROM disclosure_documents
       WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )

    if (disclosureResult.rows.length === 0) {
      return NextResponse.json(error('该案件暂无交底书', 404), { status: 404 })
    }

    const contentJson = disclosureResult.rows[0].content_json || {}
    const sections = contentJson.sections || {}

    // 构建交底书上下文
    const sectionLabels: Record<string, string> = {
      technicalProblem: '技术问题',
      backgroundTechnology: '背景技术',
      technicalSolution: '技术方案',
      embodiments: '实施方式',
      beneficialEffects: '有益效果',
      drawings: '附图说明',
    }

    const disclosureContext = Object.entries(sectionLabels)
      .map(([key, label]) => `【${label}】\n${sections[key] || '（未填写）'}`)
      .join('\n\n')

    // 构建 AI prompt
    const system = `你是一位资深的中国专利代理师，正在帮助专利工程师分析一份技术交底书。
请根据交底书内容，专业、准确地回答用户的问题。
如果交底书中没有相关信息，请如实说明。
回答应简洁、专业，使用中文。`

    const prompt = `以下是技术交底书的完整内容：

${disclosureContext}

---
用户问题：${question.trim()}

请根据以上交底书内容回答用户的问题：`

    const result = await aiService.generate(prompt, {
      system,
      temperature: 0.5,
      maxTokens: 1024,
    })

    return NextResponse.json(success({
      question: question.trim(),
      answer: result.text,
      model: result.model,
    }))
  } catch (err: any) {
    console.error('AI 问答失败:', err)
    return NextResponse.json(error('AI 问答失败: ' + err.message, 500), { status: 500 })
  }
}
