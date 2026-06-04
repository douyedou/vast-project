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
         WHERE c2.engineer_id = $1 AND pd.type = 'spec' AND pd.status IN ('draft','writing')) AS spec_writing,

        (SELECT COUNT(*)
         FROM patent_documents pd2
         JOIN cases c3 ON c3.id = pd2.case_id
         WHERE c3.engineer_id = $1 AND pd2.type = 'claim' AND pd2.status IN ('draft','writing')) AS claims_writing,

        (SELECT COUNT(*) FROM cases c4 WHERE c4.engineer_id = $1 AND c4.status = 'returned') AS returned_count,

        (SELECT COUNT(*) FROM cases c5 WHERE c5.engineer_id = $1 AND c5.status = 'writingcheck') AS review_pending

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
        c.created_at

      FROM cases c

      WHERE c.engineer_id = $1
        AND c.status = 'writing'

      ORDER BY c.updated_at DESC
      LIMIT 10
    `, [engineerId])

    const now = new Date()
    const twoYearMs = 2 * 365 * 24 * 60 * 60 * 1000

    const myTasks = tasksResult.rows.map((row) => ({
      id: row.id,
      name: row.title,
      type: row.type,
      status: row.status,
      statusLabel: (() => {
        const map: Record<string, string> = {
          writing: '创作中',
          writingcheck: '待提交审核',
          returned: '退回修改',
          reviewing: '审核中',
        }
        return map[row.status] || row.status
      })(),
      deadline: (() => {
        const dl = row.deadline ? new Date(row.deadline) : new Date(new Date(row.created_at).getTime() + twoYearMs)
        return dl.toISOString().slice(0, 10)
      })(),
      priority: (() => {
        const dl = row.deadline ? new Date(row.deadline) : new Date(new Date(row.created_at).getTime() + twoYearMs)
        const daysLeft = Math.ceil((dl.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        if (daysLeft < 0) return 'overdue'
        if (daysLeft <= 7) return 'urgent'
        if (daysLeft <= 30) return 'high'
        return 'normal'
      })(),
    }))

    // =========================
    // 3. 风险提醒
    // =========================

    const riskResult = await query(`
      SELECT
        (SELECT COUNT(*) FROM patent_documents pd
         JOIN cases c ON c.id = pd.case_id
         WHERE c.engineer_id = $1 AND pd.type = 'spec' AND pd.ai_rate >= 30
        ) as ai_too_high,

        (SELECT COUNT(*) FROM patent_documents pd
         JOIN cases c ON c.id = pd.case_id
         WHERE c.engineer_id = $1 AND pd.type = 'spec' AND pd.duplicate_rate >= 30
        ) as duplicate_too_high,

        (SELECT COUNT(*) FROM patent_documents pd
         JOIN cases c ON c.id = pd.case_id
         WHERE c.engineer_id = $1 AND pd.type = 'spec' AND pd.disclosure_coverage < 80
        ) as coverage_low,

        (SELECT COUNT(*) FROM patent_documents pd
         JOIN cases c ON c.id = pd.case_id
         WHERE c.engineer_id = $1 AND pd.type = 'claim' AND pd.claim_number > 0
           AND pd.support_status IN ('unsupported','weak')
        ) as unsupported_claims
    `, [engineerId])

    const risks = [
      { type: "AI相似性超标", count: Number(riskResult.rows[0].ai_too_high || 0), severity: "error" as const },
      { type: "查重率过高", count: Number(riskResult.rows[0].duplicate_too_high || 0), severity: "warning" as const },
      { type: "交底覆盖率不足", count: Number(riskResult.rows[0].coverage_low || 0), severity: "warning" as const },
      { type: "权利要求无支持", count: Number(riskResult.rows[0].unsupported_claims || 0), severity: "error" as const },
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