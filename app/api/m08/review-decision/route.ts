/**
 * M08 审核决策 — 获取决策所需数据
 * GET /api/m08/review-decision?reviewId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

const typeLabelMap: Record<string, string> = {
  completeness: '交底覆盖',
  uniformity: '术语一致性',
  novelty: 'AI相似性',
  form: '形式审查',
  support: '权利要求支持',
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')
    if (!reviewId) return NextResponse.json(error('缺少 reviewId', 400), { status: 400 })

    // 1. 审核记录 + 案件
    const reviewResult = await query(
      `SELECT r.*, c.title AS case_title, c.case_id AS case_no, c.type AS case_type, c.status AS case_status,
         reviewer.name AS reviewer_name,
         r.preliminary_done, r.disclosure_done, r.five_books_done
       FROM reviews r
       JOIN cases c ON c.id = r.case_id
       LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
       WHERE r.id = $1`,
      [reviewId]
    )
    if (reviewResult.rows.length === 0) return NextResponse.json(error('审核任务不存在', 404))
    const review = reviewResult.rows[0]

    // 2. 审核问题（排除 checklist JSON blob）
    const itemsResult = await query(
      `SELECT id, type, content, severity, status
       FROM review_items WHERE review_id = $1
       AND NOT (type = 'completeness' AND content LIKE '{%}')
       ORDER BY severity = 'critical' DESC, severity = 'high' DESC`,
      [reviewId]
    )
    const items = itemsResult.rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      typeLabel: typeLabelMap[r.type] || r.type,
      content: r.content,
      severity: r.severity,
      status: r.status,
    }))

    const blocking = items.filter((i: any) => i.severity === 'critical' || i.severity === 'high')
    const warnings = items.filter((i: any) => i.severity === 'medium')
    const suggestions = items.filter((i: any) => i.severity === 'low')

    // 3. 自检指标摘要
    const specResult = await query(
      `SELECT ai_rate, duplicate_rate, disclosure_coverage
       FROM patent_documents WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`,
      [review.case_id]
    )
    const spec = specResult.rows[0] || {}

    // 4. 权利要求支持率
    const supportResult = await query(
      `SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE support_status = 'supported')::int AS supported,
         COUNT(*) FILTER (WHERE support_status = 'unsupported')::int AS unsupported
       FROM patent_documents
       WHERE case_id = $1 AND type = 'claim' AND claim_number > 0 AND content IS NOT NULL AND content != ''`,
      [review.case_id]
    )
    const { total: totalClaims, supported: supportedClaims, unsupported: unsupportedClaims } = supportResult.rows[0] || {}
    const supportRate = totalClaims > 0 ? Math.round((Number(supportedClaims) / Number(totalClaims)) * 100) : null

    // 5. 现有决策结果（pending 不算已提交）
    const FINAL_RESULTS = ['pass', 'reject', 'reject-m06', 'reject-m07', 'reject-case']
    const existingResult = FINAL_RESULTS.includes(review.result) ? review.result : null

    return NextResponse.json(success({
      reviewId,
      caseTitle: review.case_title,
      caseNo: review.case_no,
      caseType: review.case_type,
      caseStatus: review.case_status,
      reviewerName: review.reviewer_name || '未分配',
      existingResult,
      preliminaryDone: review.preliminary_done,
      disclosureDone: review.disclosure_done,
      fiveBooksDone: review.five_books_done,
      summary: {
        blockingCount: blocking.length,
        warningCount: warnings.length,
        suggestionCount: suggestions.length,
      },
      blocking,
      warnings,
      suggestions,
      spec: {
        aiRate: spec.ai_rate ?? null,
        duplicateRate: spec.duplicate_rate ?? null,
        coverageRate: spec.disclosure_coverage ?? null,
        supportRate,
        unsupportedClaims: Number(unsupportedClaims || 0),
      },
    }))
  } catch (err: any) {
    console.error('Review decision error:', err)
    return NextResponse.json(error('获取审核决策数据失败: ' + err.message, 500), { status: 500 })
  }
}
