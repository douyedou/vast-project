/**
 * M08 审核工作台
 * GET /api/m08/dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { CASE_STATUS_LABELS } from '@/lib/case-state-machine'

const STATUS_LABELS: Record<string, string> = {
  ...CASE_STATUS_LABELS,
  writingcheck: '撰写审核',
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    // =========================
    // 1. 统计卡片
    // =========================
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id
         WHERE c.status = 'reviewing' AND r.result = 'pending' AND r.preliminary_done = FALSE) AS pending,

        (SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id
         WHERE c.status = 'reviewing' AND r.result = 'pending' AND r.preliminary_done = TRUE) AS reviewing,

        (SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id
         WHERE c.status = 'rejected' AND r.result IN ('reject', 'reject-case')) AS rejected,

        (SELECT COUNT(*) FROM reviews r JOIN cases c ON c.id = r.case_id
         WHERE c.status = 'completed' AND r.result = 'pass') AS passed,

        (SELECT COUNT(DISTINCT r.id) FROM reviews r
         JOIN cases c ON c.id = r.case_id
         JOIN review_items ri ON ri.review_id = r.id
         WHERE c.status = 'reviewing' AND ri.severity IN ('high','critical')) AS high_risk,

        (SELECT COUNT(*) FROM reviews r
         JOIN cases c ON c.id = r.case_id
         WHERE c.status = 'reviewing' AND r.result = 'pending'
           AND c.deadline IS NOT NULL AND c.deadline < NOW()) AS overdue
    `, [])

    const stats = {
      pending: Number(statsResult.rows[0].pending || 0),
      reviewing: Number(statsResult.rows[0].reviewing || 0),
      rejected: Number(statsResult.rows[0].rejected || 0),
      passed: Number(statsResult.rows[0].passed || 0),
      highRisk: Number(statsResult.rows[0].high_risk || 0),
      overdue: Number(statsResult.rows[0].overdue || 0),
    }

    // =========================
    // 2. 我的审核任务（展示全部待审核案件，不限制当前 reviewer）
    // =========================
    const tasksResult = await query(`
      SELECT DISTINCT ON (c.id)
        r.id AS review_id,
        c.id AS case_id,
        c.case_id AS case_no,
        c.title,
        c.type,
        c.priority,
        c.deadline,
        r.result,
        r.reviewer_id,
        r.preliminary_done,
        r.updated_at,
        (SELECT COUNT(*) FROM review_items ri
         WHERE ri.review_id = r.id AND ri.severity IN ('high','critical')) AS blocking_count,
        u.name AS reviewer_name
      FROM reviews r
      JOIN cases c ON c.id = r.case_id
      LEFT JOIN users u ON u.id = r.reviewer_id
      WHERE c.status = 'reviewing' AND r.result = 'pending'
      ORDER BY c.id, c.priority = 'urgent' DESC, c.priority = 'high' DESC, c.updated_at DESC
      LIMIT 10
    `, [])

    const myTasks = tasksResult.rows.map((row: any) => ({
      id: row.review_id,
      caseId: row.case_id,
      caseNo: row.case_no,
      title: row.title,
      type: row.type,
      status: row.result !== 'pending' ? (row.result === 'reject' ? '已退回' : row.result === 'pass' ? '已通过' : row.result) : (row.preliminary_done ? '审核中' : '待审核'),
      priority: row.priority || 'normal',
      dueDate: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : null,
      blocking: Number(row.blocking_count || 0),
      reviewerName: row.reviewer_name,
    }))

    // =========================
    // 3. 风险提醒（按 type 汇总 review_items）
    // =========================
    const riskResult = await query(`
      SELECT
        ri.type,
        COUNT(*) as cnt,
        CASE
          WHEN ri.severity = 'critical' THEN 'blocking'
          WHEN ri.severity = 'high' THEN 'blocking'
          WHEN ri.severity = 'medium' THEN 'warning'
          ELSE 'suggestion'
        END as sev,
        ARRAY_AGG(DISTINCT c.case_id) AS case_nos
      FROM review_items ri
      JOIN reviews r ON r.id = ri.review_id
      JOIN cases c ON c.id = r.case_id
      WHERE c.status = 'reviewing'
      GROUP BY ri.type, sev
      ORDER BY cnt DESC
      LIMIT 5
    `, [])

    const typeNames: Record<string, string> = {
      completeness: '交底不完整',
      uniformity: '术语不一致',
      novelty: '新创性不足',
      form: '形式缺陷',
      support: '权利要求无支持',
    }

    const riskAlerts = riskResult.rows.map((row: any) => ({
      type: typeNames[row.type] || row.type,
      count: Number(row.cnt),
      severity: row.sev,
      cases: row.case_nos || [],
    }))

    // =========================
    // 4. 最近动态
    // =========================
    const activityResult = await query(`
      SELECT
        h.from_status,
        h.to_status,
        h.created_at,
        c.case_id,
        c.title,
        u.name AS operator_name
      FROM case_status_history h
      JOIN cases c ON c.id = h.case_id
      LEFT JOIN users u ON u.id = h.operator_id
      WHERE c.status = 'reviewing'
         OR h.to_status IN ('reviewing','completed','rejected')
      ORDER BY h.created_at DESC
      LIMIT 10
    `, [])

    const recentActivity = activityResult.rows.map((row: any) => ({
      time: new Date(row.created_at).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      action:
        `${STATUS_LABELS[row.from_status] || row.from_status || "开始"} → ${STATUS_LABELS[row.to_status] || row.to_status}`,
      caseNo: row.case_id,
      title: row.title,
      user: row.operator_name || '系统',
    }))

    return NextResponse.json(success({
      stats,
      myTasks,
      riskAlerts,
      recentActivity,
    }))
  } catch (err: any) {
    console.error('M08 dashboard error:', err)
    return NextResponse.json(error('获取工作台数据失败: ' + err.message, 500), { status: 500 })
  }
}
