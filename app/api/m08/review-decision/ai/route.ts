/**
 * M08 审核决策 — AI 智能推荐决策
 * POST /api/m08/review-decision/ai
 *
 * 根据阻断项/警告项、自检数据、权利要求支持率等综合分析，给出推荐决策
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { aiService } from '@/lib/ai-service'

const DECISION_OPTIONS = [
  {
    value: 'pass',
    label: '审核通过',
    desc: '所有问题已处理，可进入M09待交案',
    nextStatus: 'completed',
  },
  {
    value: 'reject-m06',
    label: '退回M06',
    desc: '交底书存在问题，需补充/重做交底模型',
    nextStatus: 'disclosure_pending',
  },
  {
    value: 'reject-m07',
    label: '退回M07',
    desc: '申请文件存在问题，需修改说明书/权利要求',
    nextStatus: 'writing',
  },
  {
    value: 'reject-case',
    label: '标记废案',
    desc: '不具备申报基础，进入M09案件管理',
    nextStatus: 'rejected',
  },
]

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { reviewId } = body || {}
    if (!reviewId) return NextResponse.json(error('缺少 reviewId', 400), { status: 400 })

    // 1. 获取审核数据
    const reviewResult = await query(
      `SELECT r.id, r.case_id, c.title AS case_title
       FROM reviews r JOIN cases c ON c.id = r.case_id WHERE r.id = $1`, [reviewId]
    )
    if (reviewResult.rows.length === 0) return NextResponse.json(error('审核任务不存在', 404))

    // 2. 审核问题
    const itemsResult = await query(
      `SELECT type, content, severity, status
       FROM review_items WHERE review_id = $1
       AND NOT (type = 'completeness' AND content LIKE '{%}')
       ORDER BY severity = 'critical' DESC`, [reviewId]
    )
    const items = itemsResult.rows

    const blockingItems = items.filter((r: any) => r.severity === 'critical' || r.severity === 'high')
    const hasBlocking = blockingItems.length > 0

    // 3. 自检数据
    const specResult = await query(
      `SELECT ai_rate, duplicate_rate, disclosure_coverage
       FROM patent_documents WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`,
      [reviewResult.rows[0].case_id]
    )
    const spec = specResult.rows[0] || {}
    const dupRate = spec.duplicate_rate ?? 0
    const coverage = spec.disclosure_coverage ?? 0
    const aiRate = spec.ai_rate ?? 0

    // 4. 权利要求支持率
    const supportResult = await query(
      `SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE support_status = 'supported')::int AS supported,
         COUNT(*) FILTER (WHERE support_status = 'unsupported')::int AS unsupported
       FROM patent_documents
       WHERE case_id = $1 AND type = 'claim' AND claim_number > 0`, [reviewResult.rows[0].case_id]
    )
    const sup = supportResult.rows[0] || {}
    const unsupportedClaims = Number(sup.unsupported || 0)

    // 5. 交底书完整性
    const discResult = await query(
      `SELECT tech_problem, tech_feature, action_relation, tech_effect, key_protection, alternative_solution
       FROM disclosure_documents WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [reviewResult.rows[0].case_id]
    )
    const disc = discResult.rows[0] || {}
    const discKeys = ['tech_problem', 'tech_feature', 'action_relation', 'tech_effect', 'key_protection', 'alternative_solution']
    const discMissing = discKeys.filter(k => !(disc as any)[k] || String((disc as any)[k]).trim().length === 0).length

    // 6. 构建 AI prompt
    const itemSummary = items.map((r: any) => `[${r.severity === 'critical' || r.severity === 'high' ? '阻断' : r.severity === 'medium' ? '警告' : '建议'}] ${r.type}: ${r.content}`).join('\n')

    const prompt = `你是一名资深专利审核员。请根据以下数据给出审核决策建议。

审核问题列表：
${itemSummary || '（无问题）'}

自检数据：
- AI 生成率：${aiRate}%
- 查重率：${dupRate}%
- 交底覆盖率：${coverage}%
- 权利要求无支持数：${unsupportedClaims}条
- 交底书缺失项数：${discMissing}/6

决策选项：
1. pass（审核通过）：无阻断项，所有低风险问题可接受
2. reject-m06（退回M06）：交底书缺失项多(>=2)，或交底覆盖率低(<70%)
3. reject-m07（退回M07）：存在权利要求无支持，或形式/术语问题严重
4. reject-case（标记废案）：AI率极高(>80%)且查重率高(>30%)，或交底书完全缺失(>=4项)

请返回一个JSON：{"recommendation": "pass|reject-m06|reject-m07|reject-case", "reason": "详细审核意见（50-150字）", "confidence": 0.0-1.0}`

    // 7. 调用 AI
    let recommendation = 'pass'
    let reason = '根据当前数据分析，建议审核通过。'
    let confidence = 0.7

    try {
      const aiResult = await aiService.generate(prompt, {
        temperature: 0.3,
        maxTokens: 512,
      })
      const match = aiResult.text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (parsed.recommendation && ['pass', 'reject-m06', 'reject-m07', 'reject-case'].includes(parsed.recommendation)) {
          recommendation = parsed.recommendation
        }
        if (parsed.reason) reason = parsed.reason
        if (typeof parsed.confidence === 'number') confidence = parsed.confidence
      }
    } catch (aiErr) {
      console.error('AI 决策分析失败，使用规则兜底:', aiErr)
      // 规则兜底
      if (discMissing >= 4) { recommendation = 'reject-case'; reason = '交底书严重缺失，不具备申报基础。'; }
      else if (discMissing >= 2 || coverage < 70) { recommendation = 'reject-m06'; reason = '交底书覆盖率不足，需补充交底模型。'; }
      else if (hasBlocking || unsupportedClaims > 0) { recommendation = 'reject-m07'; reason = '存在未处理的阻断项或无支持的权利要求。'; }
      else { recommendation = 'pass'; reason = '未发现严重问题，建议通过。'; }
      confidence = 0.5
    }

    const decision = DECISION_OPTIONS.find(d => d.value === recommendation)!

    return NextResponse.json(success({
      recommendation: decision.value,
      label: decision.label,
      desc: decision.desc,
      reason,
      confidence: Math.round(confidence * 100) / 100,
      aiFallback: false,
    }, 'AI 决策分析完成'))
  } catch (err: any) {
    console.error('AI decision error:', err)
    return NextResponse.json(error('AI 分析失败: ' + err.message, 500), { status: 500 })
  }
}
