/**
 * @openapi
 * /api/m07/dashboard:
 *   get:
 *     summary: 获取 M07 仪表盘数据
 *     description: 返回当前工程师的仪表盘统计、任务、风险提醒和最近动态。
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: 仪表盘数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 */
import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireRole, unauthorizedResponse } from "@/middleware/auth"

console.log(
  "DATABASE_URL =",
  process.env.DATABASE_URL
)

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["engineer", "admin"])
    if (!user) {
      return unauthorizedResponse()
    }

    const engineerId = user.id

    // =========================
    // 1. 数据看板
    // =========================

    // 使用子查询避免 JOIN 导致的重复行影响聚合计数
    const statsResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM cases c WHERE c.engineer_id = $1 AND c.status = 'writing') AS pending,

        (SELECT COUNT(*)
         FROM patent_documents pd
         JOIN cases c2 ON c2.id = pd.case_id
         WHERE c2.engineer_id = $1 AND pd.type = 'spec' AND pd.status = 'draft') AS spec_writing,

        (SELECT COUNT(DISTINCT pd2.case_id)
         FROM patent_documents pd2
         JOIN cases c3 ON c3.id = pd2.case_id
         WHERE c3.engineer_id = $1 AND pd2.type = 'claim') AS claims_writing,

        (SELECT COUNT(*)
         FROM reviews r
         JOIN cases c4 ON c4.id = r.case_id
         WHERE c4.engineer_id = $1 AND r.result = 'reject') AS returned_count,

        (SELECT COUNT(*) FROM cases c5 WHERE c5.engineer_id = $1 AND c5.status IN ('reviewing','pending_submit')) AS review_pending

    `, [engineerId])

    const stats = {
      pending: Number(statsResult.rows[0].pending || 0),
      specWriting: Number(statsResult.rows[0].spec_writing || 0),
      claimsWriting: Number(statsResult.rows[0].claims_writing || 0),
      returned: Number(statsResult.rows[0].returned_count || 0),
      reviewPending: Number(statsResult.rows[0].review_pending || 0),
    }

    // =========================
    // 2. 我的任务
    // =========================

    const tasksResult = await query(`
      SELECT
        c.id,
        c.title,
        c.type,
        c.status,
        c.priority,
        c.deadline,

        MAX(pd.duplicate_rate) as duplicate_rate,
        MAX(pd.disclosure_coverage) as disclosure_coverage,
        MAX(pd.support_rate) as support_rate

      FROM cases c

      LEFT JOIN patent_documents pd
        ON pd.case_id = c.id

      WHERE c.engineer_id = $1

      GROUP BY
        c.id,
        c.title,
        c.type,
        c.status,
        c.priority,
        c.deadline

      ORDER BY c.updated_at DESC
      LIMIT 10
    `, [engineerId])

    const myTasks = tasksResult.rows.map((row) => ({
      id: row.id,
      name: row.title,
      type: row.type,
      status: row.status,
      // 前端展示用的中文状态文案
      statusLabel: (() => {
        const map: Record<string, string> = {
          writing: "说明书生成中",
          spec: "说明书生成中",
          claims: "权利要求撰写中",
          claims_writing: "权利要求撰写中",
          returned: "退回修改",
          reviewing: "全文件复核中",
          pending_submit: "待提交审核",
        }

        return map[row.status] || row.status
      })(),
      priority: row.priority,
      // 格式化为 YYYY-MM-DD，前端期望简短日期字符串
      deadline: row.deadline ? new Date(row.deadline).toISOString().slice(0, 10) : null,
      duplicate_rate: row.duplicate_rate,
      disclosure_coverage: row.disclosure_coverage,
      support_rate: row.support_rate,
    }))

    // =========================
    // 3. 风险提醒
    // =========================

    const riskResult = await query(`
      SELECT

        COUNT(*) FILTER (
          WHERE disclosure_coverage < 70
        ) as disclosure_not_covered,

        COUNT(*) FILTER (
          WHERE support_rate < 70
        ) as unsupported_claims,

        COUNT(*) FILTER (
          WHERE ai_rate > 80
        ) as ai_too_high,

        COUNT(*) FILTER (
          WHERE duplicate_rate > 30
        ) as duplicate_too_high

      FROM patent_documents pd

      JOIN cases c
        ON c.id = pd.case_id

      WHERE c.engineer_id = $1
    `, [engineerId])

    const risks = [
      {
        type: "交底未覆盖",
        count: Number(
          riskResult.rows[0].disclosure_not_covered
        ),
        severity: "warning",
      },
      {
        type: "权利要求无支持",
        count: Number(
          riskResult.rows[0].unsupported_claims
        ),
        severity: "error",
      },
      {
        type: "AI相似性超标",
        count: Number(
          riskResult.rows[0].ai_too_high
        ),
        severity: "error",
      },
      {
        type: "查重率异常",
        count: Number(
          riskResult.rows[0].duplicate_too_high
        ),
        severity: "warning",
      },
    ]

    // =========================
    // 4. 最近动态
    // =========================

    const activityResult = await query(`
      SELECT
        c.title,
        h.from_status,
        h.to_status,
        h.created_at,
        u.name

      FROM case_status_history h

      JOIN cases c
        ON c.id = h.case_id

      LEFT JOIN users u
        ON u.id = h.operator_id

      WHERE c.engineer_id = $1

      ORDER BY h.created_at DESC

      LIMIT 20
    `, [engineerId])

    const recentActivities =
      activityResult.rows.map((row) => ({
        time: new Date(
          row.created_at
        ).toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),

        action:
          `${row.from_status || "开始"} → ${row.to_status}`,

        target: row.title,

        user: row.name || "系统",
      }))

    return NextResponse.json({
      success: true,
      data: {
        stats,
        myTasks,
        risks,
        recentActivities,
      },
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: "获取 Dashboard 失败",
      },
      { status: 500 }
    )
  }
}