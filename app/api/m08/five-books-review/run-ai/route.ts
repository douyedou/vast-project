/**
 * M08 五书 AI 审核
 * POST /api/m08/five-books-review/run-ai
 * 单次 AI 调用：评判五书完整性 + 生成最多 3 个审核问题
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { aiService } from '@/lib/ai-service'
import { sanitizeB64Content } from '@/lib/docx'

const BOOK_ITEMS = [
  { key: 'spec', label: '说明书' },
  { key: 'claim', label: '权利要求书' },
  { key: 'abstract', label: '摘要' },
  { key: 'drawings', label: '说明书附图' },
  { key: 'abstractFigure', label: '摘要附图' },
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

    // 并行查询五书
    const [specRow, claimRow, abstractRow, drawingsRow, figRow] = await Promise.all([
      query(`SELECT content FROM patent_documents WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`, [caseId]),
      query(`SELECT COUNT(*) AS cnt FROM patent_documents WHERE case_id = $1 AND type = 'claim' AND claim_number > 0`, [caseId]),
      query(`SELECT content FROM patent_documents WHERE case_id = $1 AND type = 'abstract' LIMIT 1`, [caseId]),
      query(`SELECT content FROM patent_documents WHERE case_id = $1 AND type = 'drawings' ORDER BY updated_at DESC LIMIT 1`, [caseId]),
      query(`SELECT id FROM document_images WHERE case_id = $1 AND is_abstract_figure = TRUE LIMIT 1`, [caseId]),
    ])

    const hasSpec = specRow.rows.length > 0 && (specRow.rows[0].content || '').length > 0
    const hasClaim = claimRow.rows.length > 0 && parseInt(claimRow.rows[0].cnt) > 0
    const hasAbstract = abstractRow.rows.length > 0 && (abstractRow.rows[0].content || '').length > 0
    const hasDrawings = drawingsRow.rows.length > 0 && (drawingsRow.rows[0].content || '').length > 0
    const hasFig = figRow.rows.length > 0

    // 组装五书内容文本（解码 B64）
    const specText = sanitizeB64Content(specRow.rows[0]?.content || null).content
    const claimText = `权利要求共 ${claimRow.rows[0]?.cnt || 0} 条`
    const abstractText = sanitizeB64Content(abstractRow.rows[0]?.content || null).content
    const drawingsText = sanitizeB64Content(drawingsRow.rows[0]?.content || null).content
    const figText = hasFig ? '已设置摘要附图' : '未设置摘要附图'

    const booksText = [
      `【说明书】${specText.slice(0, 800)}`,
      `【权利要求书】${claimText}`,
      `【摘要】${abstractText.slice(0, 500)}`,
      `【说明书附图】${drawingsText.slice(0, 300)}`,
      `【摘要附图】${figText}`,
    ].join('\n\n')

    const prompt = `你是专利五书审核专家。请仔细阅读以下五书内容，完成两项任务。

任务1：逐项判断以下五个文件是否齐全、内容是否充分（充分=true，缺失/不足=false）
1. 说明书：是否有完整的说明书内容？
2. 权利要求书：是否有权利要求？
3. 摘要：是否有摘要内容？
4. 说明书附图：是否有附图说明？
5. 摘要附图：是否设置了摘要附图？

任务2：找出五书中最关键的缺陷（最多3个），每个问题写明描述(<=30字)、严重程度(low/medium/high/critical)、类型(completeness/uniformity/novelty/form/support)。

请严格按以下JSON格式输出（不要输出其他内容）：
{
  "checklist": [
    {"key": "spec", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "claim", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "abstract", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "drawings", "status": true/false, "reason": "简短原因(<=15字)"},
    {"key": "abstractFigure", "status": true/false, "reason": "简短原因(<=15字)"}
  ],
  "problems": [
    {"content": "问题描述", "severity": "medium", "type": "completeness"}
  ]
}

五书内容：
${booksText.slice(0, 4000)}`

    const result = await aiService.generate(prompt, {
      system: '你是专利五书审核专家，只输出合法JSON，不输出解释文字。',
      temperature: 0.3,
      maxTokens: 1024,
    })

    const parsed = parseAiJson(result.text)

    const checklist = BOOK_ITEMS.map(item => {
      const found = parsed?.checklist?.find((c: any) => c.key === item.key)
      return {
        key: item.key,
        item: item.label,
        status: found?.status === true,
        reason: found?.reason || '',
      }
    })

    // 删除旧的 AI 生成 JSON blob
    await query(`DELETE FROM review_items WHERE review_id = $1 AND type = 'completeness' AND content LIKE '{%}'`, [reviewId])

    // 保存生成的审核问题
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
    console.error('Five-books AI review error:', err)
    return NextResponse.json(error('AI 审核失败: ' + err.message, 500), { status: 500 })
  }
}
