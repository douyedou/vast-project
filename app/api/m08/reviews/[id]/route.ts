/**
 * 审核任务详情/更新
 * GET /api/m08/reviews/:id
 * PUT /api/m08/reviews/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 审核进度推导（基于 review 状态和 review_items）
function buildProgress(review: any, items: any[]) {
  const hasPendingItems = items.some((r: any) => r.status === 'pending')
  const hasResolvedItems = items.some((r: any) => r.status === 'resolved')
  const hasDecision = review.result && review.result !== 'pending'

  const steps = [
    { step: '提交审核', key: 'submitted' },
    { step: '审核中', key: 'reviewing' },
    { step: '问题处理', key: 'issues' },
    { step: '审核决策', key: 'decision' },
  ]

  return steps.map((s, i) => {
    let status: string; let time: string | null = null
    if (i === 0) {
      status = '完成'; time = review.created_at
    } else if (i === 1) {
      status = hasDecision ? '完成' : '进行中'; time = hasDecision ? review.updated_at : null
    } else if (i === 2) {
      if (hasResolvedItems && hasDecision) { status = '完成'; time = review.updated_at }
      else if (hasPendingItems) { status = '进行中'; time = null }
      else if (hasDecision && items.length === 0) { status = '跳过'; time = null }
      else { status = '待开始'; time = null }
    } else {
      if (hasDecision) { status = '完成'; time = review.updated_at }
      else { status = '待开始'; time = null }
    }
    return { ...s, status, time }
  })
}

// 状态变更 → 操作日志可读描述
function statusActionLabel(from: string | null, to: string, remark: string | null): string {
  if (remark && remark.trim()) return remark
  if (from === 'writing' && to === 'reviewing') return '提交审核'
  if (from === 'reviewing' && to === 'completed') return '审核通过'
  if (from === 'reviewing' && to === 'rejected') return '审核驳回'
  if (to === 'reviewing') return '进入审核'
  if (to === 'completed') return '已完成'
  if (to === 'rejected') return '已驳回'
  return to || '状态变更'
}

// GET /api/m08/reviews/:id — 审核任务详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    // 1. 审核记录 + 案件信息
    const reviewResult = await query(
      `SELECT r.*, c.id AS case_id, c.title AS case_title, c.case_id AS case_no,
         c.type AS case_type, c.status AS case_status, c.priority, c.created_at AS case_created_at,
         reviewer.name AS reviewer_name, engineer.name AS engineer_name,
         r.preliminary_done, r.disclosure_done, r.five_books_done
       FROM reviews r
       JOIN cases c ON r.case_id = c.id
       LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
       LEFT JOIN users engineer ON c.engineer_id = engineer.id
       WHERE r.id = $1`,
      [id]
    )
    if (reviewResult.rows.length === 0) return NextResponse.json(error('审核任务不存在', 404))

    const review = reviewResult.rows[0]
    const caseId = review.case_id

    // 2. M06 交底六项 — 从 disclosure_documents 各列判断实际状态
    const disclosureResult = await query(
      `SELECT tech_problem, tech_feature, action_relation, tech_effect, key_protection, alternative_solution
       FROM disclosure_documents WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )
    const disc = disclosureResult.rows[0] || {}
    const sectionDefs = [
      { label: '技术问题', key: 'tech_problem' },
      { label: '技术特征', key: 'tech_feature' },
      { label: '作用关系', key: 'action_relation' },
      { label: '技术效果', key: 'tech_effect' },
      { label: '关键保护点', key: 'key_protection' },
      { label: '替代方案', key: 'alternative_solution' },
    ]
    const disclosureItems = sectionDefs.map(({ label, key }) => {
      const val = (disc as any)[key]
      const has = val && String(val).trim().length > 0
      return { label, status: has ? '已完整' : '未覆盖', ok: has }
    })

    // 3. 自检结果（含 support_rate）
    const specResult = await query(
      `SELECT ai_rate, duplicate_rate, disclosure_coverage
       FROM patent_documents WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )
    const spec = specResult.rows[0] || {}

    // 3b. 权利要求支持率 — 从 claims 表实时计算（排除 claim_number=0 的占位行）
    const supportRateResult = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE support_status = 'supported')::int AS supported
       FROM patent_documents
       WHERE case_id = $1 AND type = 'claim' AND claim_number > 0 AND content IS NOT NULL AND content != ''`,
      [caseId]
    )
    const { total: totalClaims, supported: supportedClaims } = supportRateResult.rows[0] || { total: 0, supported: 0 }
    const supportRate = totalClaims > 0 ? Math.round((supportedClaims / totalClaims) * 100) : null

    // 4. 五书文件
    const booksResult = await query(
      `SELECT id AS document_id, type,
         CASE type WHEN 'spec' THEN '说明书' WHEN 'claim' THEN '权利要求书' WHEN 'abstract' THEN '摘要' WHEN 'drawings' THEN '附图说明' END AS label,
         CASE WHEN content IS NOT NULL AND content != '' THEN TRUE ELSE FALSE END AS ready
       FROM patent_documents
       WHERE case_id = $1 AND status IN ('writing','ai_checking','approved')
         AND type IN ('spec','claim','abstract','drawings')
         AND (type != 'claim' OR claim_number = 0)`,
      [caseId]
    )
    const figResult = await query(
      `SELECT id, TRUE AS ready FROM document_images WHERE case_id = $1 AND is_abstract_figure = TRUE LIMIT 1`,
      [caseId]
    )
    const books = [
      ...booksResult.rows.map((r: any) => ({ id: r.id, key: r.type, label: r.label, ready: r.ready, documentId: r.document_id })),
      ...figResult.rows.map((r: any) => ({ id: r.id, key: 'abstractFigure', label: '摘要附图', ready: r.ready, documentId: r.id })),
    ]

    // 5. 审核问题列表（含 is_blocking，排除 checklist JSON blob）
    const itemsResult = await query(
      `SELECT id, type, content, severity, status, step, created_at
       FROM review_items WHERE review_id = $1
       AND NOT (type = 'completeness' AND content LIKE '{%}')
       ORDER BY is_blocking DESC, severity = 'critical' DESC, severity = 'high' DESC, created_at DESC`,
      [id]
    )

    // 6. 阻断/警告计数（severity 决定性质）
    const blockingCount = itemsResult.rows.filter((r: any) => r.severity === 'critical' || r.severity === 'high').length
    const warningCount = itemsResult.rows.filter((r: any) => r.severity === 'medium').length

    // 7. 操作日志
    const logsResult = await query(
      `SELECT h.from_status, h.to_status, h.remark, h.created_at, u.name AS operator_name
       FROM case_status_history h
       LEFT JOIN users u ON u.id = h.operator_id
       WHERE h.case_id = $1
       ORDER BY h.created_at DESC LIMIT 20`,
      [caseId]
    )

    // 8. 审核进度（根据 review 状态推导）
    const progress = buildProgress(review, itemsResult.rows)

    // type → 中文映射
    const typeLabelMap: Record<string, string> = {
      completeness: '交底覆盖',
      uniformity: '术语一致性',
      novelty: 'AI相似性',
      form: '形式审查',
      support: '权利要求支持',
    }

    return NextResponse.json(success({
      review: {
        id: review.id,
        result: review.result,
        comments: review.comments,
        preliminaryDone: review.preliminary_done,
        disclosureDone: review.disclosure_done,
        fiveBooksDone: review.five_books_done,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      },
      case: {
        id: review.case_id,
        caseNo: review.case_no,
        title: review.case_title,
        type: review.case_type === 'invention' ? '发明专利' : review.case_type === 'utility' ? '实用新型' : '外观设计',
        typeRaw: review.case_type,
        applicationMethod: '电子申请',
        status: review.case_status === 'reviewing' ? '审核中' : review.case_status === 'completed' ? '已完成' : review.case_status === 'rejected' ? '已驳回' : review.case_status,
        statusRaw: review.case_status,
        priority: review.priority,
        reviewId: review.id,
        reviewerName: review.reviewer_name || '未分配',
        submitTime: review.case_created_at,
        engineerName: review.engineer_name,
      },
      blockingCount,
      warningCount,
      spec: {
        aiRate: spec.ai_rate ?? null,
        duplicateRate: spec.duplicate_rate ?? null,
        disclosureCoverage: spec.disclosure_coverage ?? null,
        supportRate,
        ipcPrediction: null, // 暂无 AI 推导，预留
      },
      disclosureItems,
      books,
      reviewItems: itemsResult.rows.map((r: any) => ({
        id: r.id,
        type: r.type,
        typeLabel: typeLabelMap[r.type] || r.type,
        content: r.content,
        severity: r.severity,
        status: r.status,
        isBlocking: r.is_blocking,
        createdAt: r.created_at,
      })),
      progress,
      logs: logsResult.rows.map((r: any) => ({
        action: statusActionLabel(r.from_status, r.to_status, r.remark),
        user: r.operator_name || '系统',
        time: r.created_at,
      })),
    }))
  } catch (err: any) {
    console.error('获取审核详情失败:', err)
    return NextResponse.json(error('获取审核详情失败', 500))
  }
}

// PUT /api/m08/reviews/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { result, comments, aiSuggestions } = body

    const VALID_RESULTS = ['pass', 'reject', 'pending', 'reject-m06', 'reject-m07', 'reject-case']
    if (!result || !VALID_RESULTS.includes(result)) {
      return NextResponse.json(error('无效的审核结果', 400))
    }

    const result_query = await query(
      `UPDATE reviews SET result = $1, comments = $2, ai_suggestions = $3, reviewer_id = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [result, comments || null, aiSuggestions ? JSON.stringify(aiSuggestions) : null, user.id, id]
    )

    if (result_query.rows.length === 0) {
      return NextResponse.json(error('审核任务不存在', 404))
    }

    const review = result_query.rows[0]

    // 更新 case 状态
    const statusMap: Record<string, string> = {
      'pass': 'completed',
      'reject': 'rejected',
      'reject-m06': 'disclosure_pending',
      'reject-m07': 'writing',
      'reject-case': 'rejected',
    }
    const targetStatus = statusMap[result] || null
    if (targetStatus) {
      await query(
        `UPDATE cases SET status = $1, updated_at = NOW() WHERE id = $2`,
        [targetStatus, review.case_id]
      )
    }

    // 退回时增加 returned_count
    if (result === 'reject-m06' || result === 'reject-m07') {
      await query(
        `UPDATE cases SET returned_count = COALESCE(returned_count, 0) + 1 WHERE id = $1`,
        [review.case_id]
      )
    }

    // 退回M06：交底书存在问题 → 重置交底书和申请文件为草稿
    if (result === 'reject-m06') {
      await query(
        `UPDATE disclosure_documents SET status = 'draft', updated_at = NOW() WHERE case_id = $1`,
        [review.case_id]
      )
      await query(
        `UPDATE patent_documents SET status = 'draft', updated_at = NOW() WHERE case_id = $1`,
        [review.case_id]
      )
    }

    // 退回M07：申请文件存在问题 → 重置申请文件为草稿，交底书不动
    if (result === 'reject-m07') {
      await query(
        `UPDATE patent_documents SET status = 'draft', updated_at = NOW() WHERE case_id = $1`,
        [review.case_id]
      )
    }

    // 记录审核决策到状态历史
    const remarkMap: Record<string, string> = {
      'pass': '审核通过，案件已完成',
      'reject': '审核驳回',
      'reject-m06': '退回 M06：交底书需补充',
      'reject-m07': '退回 M07：申请文件需修改',
      'reject-case': '驳回立案',
    }
    await query(
      `INSERT INTO case_status_history (case_id, from_status, to_status, operator_id, remark)
       VALUES ($1, $2, $3, $4, $5)`,
      [review.case_id, 'reviewing', targetStatus || 'reviewing', user.id, remarkMap[result] || comments || '审核决策']
    )

    return NextResponse.json(success(result_query.rows[0], '提交审核意见成功'))
  } catch (err: any) {
    console.error('更新审核任务失败:', err)
    return NextResponse.json(error('更新审核任务失败', 500))
  }
}
