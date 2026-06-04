import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // 临时写死
    const engineerId =
      "eed9a9d8-6fa1-41c6-8e18-35b42062f087"

    // =========================
    // 1. 数据看板
    // =========================

    const statsResult = await query(`
      SELECT
        COUNT(*) FILTER (
          WHERE c.status = 'writing'
        ) as pending,

        COUNT(*) FILTER (
          WHERE pd.type='spec'
          AND pd.status='writing'
        ) as spec_writing,

        (SELECT COUNT(DISTINCT pd2.case_id)
         FROM patent_documents pd2
         WHERE pd2.case_id IN (
           SELECT c2.id FROM cases c2 WHERE c2.engineer_id = $1
         )
         AND pd2.type = 'claim'
        ) as claims_writing,

        COUNT(*) FILTER (
          WHERE r.result='reject'
        ) as returned_count,

        COUNT(*) FILTER (
          WHERE c.status='reviewing'
        ) as review_pending

      FROM cases c
      LEFT JOIN patent_documents pd
        ON pd.case_id = c.id
      LEFT JOIN reviews r
        ON r.case_id = c.id

      WHERE c.engineer_id = $1
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

    const myTasks = tasksResult.rows

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