/**
 * M08 初步审核 — 运行所有可计算的审核规则，自动发现问题并分级
 * POST /api/m08/reviews/[id]/preliminary
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface ReviewItem {
  type: string
  content: string
  severity: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { id: reviewId } = await params

    // 1. 获取审核和案件信息
    const reviewResult = await query(
      `SELECT r.id, r.case_id, c.title FROM reviews r JOIN cases c ON c.id = r.case_id WHERE r.id = $1`,
      [reviewId]
    )
    if (reviewResult.rows.length === 0) return NextResponse.json(error('审核任务不存在', 404))
    const caseId = reviewResult.rows[0].case_id

    // 2. 获取说明书自检数据
    const specResult = await query(
      `SELECT ai_rate, duplicate_rate, disclosure_coverage FROM patent_documents
       WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )
    const spec = specResult.rows[0] || {}

    // 3. 权利要求支持率
    const supportResult = await query(
      `SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE support_status = 'supported')::int AS supported,
         COUNT(*) FILTER (WHERE support_status = 'unsupported')::int AS unsupported
       FROM patent_documents
       WHERE case_id = $1 AND type = 'claim' AND claim_number > 0 AND content IS NOT NULL AND content != ''`,
      [caseId]
    )
    const { total: totalClaims, supported: supportedClaims, unsupported: unsupportedClaims } = supportResult.rows[0] || {}

    // 4. M06 交底完整性
    const discResult = await query(
      `SELECT tech_problem, tech_feature, action_relation, tech_effect, key_protection, alternative_solution
       FROM disclosure_documents WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )
    const disc = discResult.rows[0] || {}
    const discKeys: Record<string, string> = {
      tech_problem: '技术问题', tech_feature: '技术特征', action_relation: '作用关系',
      tech_effect: '技术效果', key_protection: '关键保护点', alternative_solution: '替代方案',
    }

    // 5. 从权引用有效
    const claimsResult = await query(
      `SELECT id, claim_number, content, parent_claim_id FROM patent_documents
       WHERE case_id = $1 AND type = 'claim' AND content IS NOT NULL AND content != '' ORDER BY claim_number ASC`,
      [caseId]
    )
    const claims = claimsResult.rows
    const numToId = new Map(claims.map((r: any) => [r.claim_number, r.id]))
    let refError: string | null = null
    for (const r of claims) {
      if (!r.parent_claim_id) continue
      const parentNum = claims.find((p: any) => p.id === r.parent_claim_id)?.claim_number
      if (!parentNum) { refError = `权利要求${r.claim_number}引用指向不存在的权利要求`; break }
      if (parentNum >= r.claim_number) { refError = `权利要求${r.claim_number}引用顺序错误（引用了权利要求${parentNum}）`; break }
    }

    // 6. 五书完整性
    const booksResult = await query(
      `SELECT type, COUNT(*)::int AS cnt FROM patent_documents
       WHERE case_id = $1 AND status IN ('writing','ai_checking','approved')
         AND type IN ('spec','claim','abstract','drawings')
         AND (type != 'claim' OR claim_number = 0)
         AND content IS NOT NULL AND content != ''
       GROUP BY type`,
      [caseId]
    )
    const bookTypes = booksResult.rows.map((r: any) => r.type)
    const figResult = await query(
      `SELECT id FROM document_images WHERE case_id = $1 AND is_abstract_figure = TRUE LIMIT 1`, [caseId]
    )
    const hasAbstractFig = figResult.rows.length > 0

    // ── 规则检查 ──
    const items: ReviewItem[] = []

    // AI 相似性 > 30% → critical
    const dupRate = Number(spec.duplicate_rate || 0)
    if (dupRate > 30) {
      items.push({ type: 'novelty', content: `说明书AI相似性(${dupRate}%)超过30%阈值`, severity: 'critical' })
    } else if (dupRate > 15) {
      items.push({ type: 'novelty', content: `说明书AI相似性(${dupRate}%)偏高，建议关注`, severity: 'medium' })
    }

    // AI 生成率 > 80% → medium
    const aiRate = Number(spec.ai_rate || 0)
    if (aiRate > 80) {
      items.push({ type: 'form', content: `说明书AI生成率(${aiRate}%)过高，可能存在质量问题`, severity: 'medium' })
    }

    // 交底覆盖率 < 70% → high
    const coverage = Number(spec.disclosure_coverage || 0)
    if (coverage > 0 && coverage < 70) {
      items.push({ type: 'completeness', content: `交底书覆盖率(${coverage}%)不足70%`, severity: 'high' })
    }

    // 交底书各项缺失 → high
    for (const [key, label] of Object.entries(discKeys)) {
      const val = (disc as any)[key]
      if (!val || String(val).trim().length === 0) {
        items.push({ type: 'completeness', content: `交底书「${label}」章节缺失`, severity: 'high' })
      }
    }

    // 权利要求支持率 < 70% → high
    const total = Number(totalClaims || 0)
    const supported = Number(supportedClaims || 0)
    const unsupported = Number(unsupportedClaims || 0)
    if (total > 0) {
      const supportRate = Math.round((supported / total) * 100)
      if (supportRate < 70) {
        items.push({ type: 'support', content: `权利要求支持率(${supportRate}%)不足70%，${unsupported}条权利要求无说明书支撑`, severity: 'high' })
      } else if (supportRate < 90) {
        items.push({ type: 'support', content: `权利要求支持率(${supportRate}%)偏低`, severity: 'medium' })
      }
    }

    // 从权引用错误 → high
    if (refError) {
      items.push({ type: 'form', content: refError, severity: 'high' })
    }

    // 五书缺失 → high
    const bookLabels: Record<string, string> = { spec: '说明书', claim: '权利要求书', abstract: '摘要', drawings: '附图说明' }
    for (const [key, label] of Object.entries(bookLabels)) {
      if (!bookTypes.includes(key)) {
        items.push({ type: 'completeness', content: `五书「${label}」缺失`, severity: 'high' })
      }
    }
    if (!hasAbstractFig) {
      items.push({ type: 'completeness', content: '摘要附图未设置', severity: 'medium' })
    }

    // ── 保存问题（只替换 step='preliminary' 的，不影响其他步骤）──
    await query(`DELETE FROM review_items WHERE review_id = $1 AND step = 'preliminary'`, [reviewId])

    for (const item of items) {
      await query(
        `INSERT INTO review_items (review_id, type, content, severity, status, step)
         VALUES ($1, $2, $3, $4, 'pending', 'preliminary')`,
        [reviewId, item.type, item.content, item.severity]
      )
    }

    // 标记初审完成
    await query(`UPDATE reviews SET preliminary_done = TRUE, updated_at = NOW() WHERE id = $1`, [reviewId])

    const blockingCount = items.filter(i => i.severity === 'critical' || i.severity === 'high').length
    const warningCount = items.filter(i => i.severity === 'medium').length

    return NextResponse.json(success({
      total: items.length,
      blockingCount,
      warningCount,
      items,
    }, `初审完成，发现${items.length}个问题（${blockingCount}个阻断，${warningCount}个警告）`))
  } catch (err: any) {
    console.error('Preliminary review error:', err)
    return NextResponse.json(error('初审失败: ' + err.message, 500), { status: 500 })
  }
}
