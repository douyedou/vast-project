/**
 * M08 交底书审核
 * GET  /api/m08/disclosure-review?reviewId=xxx — 获取交底书内容和审核结果
 * PUT  /api/m08/disclosure-review — 人工修改审核结论
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

const SECTION_KEYS = [
  'techProblem', 'techFeature', 'actionRelation',
  'techEffect', 'keyProtection', 'alternativeSolution',
]
const SECTION_LABELS = [
  '技术问题', '技术特征', '作用关系',
  '技术效果', '关键保护点', '替代方案',
]

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get('reviewId')
    if (!reviewId) return NextResponse.json(error('缺少 reviewId', 400), { status: 400 })

    // 获取 review → case → disclosure
    const reviewResult = await query(
      `SELECT r.id, r.case_id, c.title AS case_title, c.case_id AS case_no
       FROM reviews r JOIN cases c ON c.id = r.case_id WHERE r.id = $1`, [reviewId]
    )
    if (reviewResult.rows.length === 0) return NextResponse.json(error('审核任务不存在', 404))
    const { case_id: caseId, case_title, case_no } = reviewResult.rows[0]

    // 交底书六段内容（来自 M06，只读）
    const discResult = await query(
      `SELECT tech_problem, tech_feature, action_relation, tech_effect, key_protection, alternative_solution, content_json
       FROM disclosure_documents WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`, [caseId]
    )
    const disc = discResult.rows[0] || {}
    const disclosureText = typeof disc.content_json === 'string' ? disc.content_json : JSON.stringify(disc.content_json || {}, null, 2)

    // 已保存的审核结论（type=completeness）
    const savedResult = await query(
      `SELECT content FROM review_items WHERE review_id = $1 AND type = 'completeness' ORDER BY created_at DESC`, [reviewId]
    )
    const savedMap: Record<string, boolean> = {}
    if (savedResult.rows.length > 0) {
      try {
        const saved = JSON.parse(savedResult.rows[0].content)
        Object.assign(savedMap, saved)
      } catch {}
    }

    const sections = SECTION_KEYS.map((key, i) => ({
      id: `section-${i + 1}`,
      key,
      title: SECTION_LABELS[i],
      content: (disc as any)[key] || '',
      complete: !!(disc as any)[key],
    }))

    const checklist = SECTION_LABELS.map((label, i) => ({
      item: label,
      key: SECTION_KEYS[i],
      status: savedMap[SECTION_KEYS[i]] ?? !!(disc as any)[SECTION_KEYS[i]],
    }))

    // 自定义问题（非 completeness 类型，或 completeness 但非 JSON blob）
    const customResult = await query(
      `SELECT id, type, content, severity, status, is_blocking FROM review_items
       WHERE review_id = $1 AND NOT (type = 'completeness' AND content LIKE '{%}') ORDER BY created_at DESC`,
      [reviewId]
    )

    return NextResponse.json(success({
      reviewId,
      caseNo: case_no,
      caseTitle: case_title,
      disclosureText,
      sections,
      checklist,
      customItems: customResult.rows.map((r: any) => ({
        id: r.id,
        type: r.type,
        content: r.content,
        severity: r.severity,
        status: r.status,
        isBlocking: r.is_blocking,
      })),
    }))
  } catch (err: any) {
    console.error('Disclosure review error:', err)
    return NextResponse.json(error('获取交底书审核失败: ' + err.message, 500), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { reviewId, items } = body  // items: { techProblem: true, techBackground: false, ... }
    if (!reviewId || !items) return NextResponse.json(error('缺少 reviewId 或 items', 400), { status: 400 })

    // 只删除 checklist 类型的 JSON blob（content 以 { 开头），不动其他 completeness 项
    await query(`DELETE FROM review_items WHERE review_id = $1 AND type = 'completeness' AND content LIKE '{%}'`, [reviewId])
    await query(
      `INSERT INTO review_items (review_id, type, content, severity, status) VALUES ($1, 'completeness', $2, 'medium', 'resolved')`,
      [reviewId, JSON.stringify(items)]
    )

    return NextResponse.json(success({ reviewId, items }, '交底审核结论已保存'))
  } catch (err: any) {
    console.error('Disclosure review save error:', err)
    return NextResponse.json(error('保存失败: ' + err.message, 500), { status: 500 })
  }
}
