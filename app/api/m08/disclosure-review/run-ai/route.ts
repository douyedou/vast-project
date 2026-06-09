/**
 * M08 AI 审核
 * POST /api/m08/disclosure-review/run-ai
 * 单次 AI 调用：评判六书完整性 + 生成最多 3 个审核问题
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { aiService } from '@/lib/ai-service'

const CHECK_ITEMS = [
  { key: 'techProblem', label: '技术问题' },
  { key: 'techFeature', label: '技术特征' },
  { key: 'actionRelation', label: '作用关系' },
  { key: 'techEffect', label: '技术效果' },
  { key: 'keyProtection', label: '关键保护点' },
  { key: 'alternativeSolution', label: '替代方案' },
]

function parseAiJson(text: string): any | null {
  const t = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = t.indexOf('{'), end = t.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try { return JSON.parse(t.slice(start, end + 1)) } catch {}
  }
  try { return JSON.parse(t) } catch {}
  return null
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { reviewId } = body || {}
    if (!reviewId) return NextResponse.json(error('缺少 reviewId', 400), { status: 400 })

    const reviewResult = await query(
      `SELECT case_id FROM reviews WHERE id = $1`, [reviewId]
    )
    if (reviewResult.rows.length === 0) return NextResponse.json(error('审核任务不存在', 404))
    const caseId = reviewResult.rows[0].case_id

    const discResult = await query(
      `SELECT tech_problem, tech_feature, action_relation, tech_effect, key_protection, alternative_solution, content_json
       FROM disclosure_documents WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`, [caseId]
    )
    if (discResult.rows.length === 0) {
      return NextResponse.json(error('该案件没有交底书', 400), { status: 400 })
    }

    const d = discResult.rows[0]
    const parts: string[] = []
    if (d.tech_problem) parts.push(`【技术问题】${d.tech_problem}`)
    if (d.tech_feature) parts.push(`【技术特征】${d.tech_feature}`)
    if (d.action_relation) parts.push(`【作用关系】${d.action_relation}`)
    if (d.tech_effect) parts.push(`【技术效果】${d.tech_effect}`)
    if (d.key_protection) parts.push(`【关键保护点】${d.key_protection}`)
    if (d.alternative_solution) parts.push(`【替代方案】${d.alternative_solution}`)
    const disclosureText = parts.join('\n\n') || JSON.stringify(d.content_json || {})

    // 单次 AI 调用：评判六书 + 生成问题
    const prompt = `你是专利交底书审核专家。请仔细阅读以下交底书，完成两项任务。

任务1：逐项判断以下六个要素是否在交底书中充分体现（充分=true，缺失/不足=false）
1. 技术问题：是否描述了要解决的技术问题？
2. 技术特征：是否列出了发明的技术特征？
3. 作用关系：是否描述了各技术特征之间的作用关系？
4. 技术效果：是否说明了技术方案带来的技术效果？
5. 关键保护点：是否明确了关键保护点？
6. 替代方案：是否提供了替代技术方案？

任务2：找出交底书中最关键的缺陷（最多3个），每个问题写明描述(<=30字)、严重程度(low/medium/high/critical)、类型(completeness/uniformity/novelty/form/support)。

请严格按以下JSON格式输出（不要输出其他内容）：
{
  "checklist": [
    {"key": "techProblem", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "techFeature", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "actionRelation", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "techEffect", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "keyProtection", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "alternativeSolution", "status": true/false, "reason": "简短原因(<=15字)"}
  ],
  "problems": [
    {"content": "问题描述", "severity": "medium", "type": "completeness"}
  ]
}

交底书内容：
${disclosureText.slice(0, 4000)}`

    const result = await aiService.generate(prompt, {
      system: '你是专利交底书审核专家，只输出合法JSON，不输出解释文字。',
      temperature: 0.3,
      maxTokens: 1024,
    })

    const parsed = parseAiJson(result.text)

    // 解析 checklist
    const checklist = CHECK_ITEMS.map(item => {
      const found = parsed?.checklist?.find((c: any) => c.key === item.key)
      return {
        key: item.key,
        item: item.label,
        status: found?.status === true,
        reason: found?.reason || '',
      }
    })

    // 删除旧的 AI 生成问题（type=completeness 的问题不再用JSON blob存）
    await query(`DELETE FROM review_items WHERE review_id = $1 AND type = 'completeness' AND content LIKE '{%}'`, [reviewId])

    // 保存生成的审核问题（最多3个）
    const problems: any[] = []
    const generatedProblems = (parsed?.problems || []).slice(0, 3)
    for (const p of generatedProblems) {
      if (!p.content?.trim()) continue
      const content = String(p.content).slice(0, 200)
      const severity = ['low', 'medium', 'high', 'critical'].includes(p.severity) ? p.severity : 'medium'
      const type = ['completeness', 'uniformity', 'novelty', 'form', 'support'].includes(p.type) ? p.type : 'completeness'
      const insertResult = await query(
        `INSERT INTO review_items (review_id, type, content, severity, status, is_blocking)
         VALUES ($1, $2, $3, $4, 'pending', FALSE) RETURNING id, created_at`,
        [reviewId, type, content, severity]
      )
      problems.push({
        id: insertResult.rows[0].id,
        review_id: reviewId,
        type,
        content,
        severity,
        status: 'pending',
        isBlocking: false,
        created_at: insertResult.rows[0].created_at,
      })
    }

    const missingCount = checklist.filter(c => !c.status).length

    return NextResponse.json(success({
      reviewId,
      checklist,
      problems,
      missingCount,
      allPassed: missingCount === 0 && problems.length === 0,
    }))
  } catch (err: any) {
    console.error('Disclosure AI review error:', err)
    return NextResponse.json(error('AI 审核失败: ' + err.message, 500), { status: 500 })
  }
}
