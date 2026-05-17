/**
 * 仪表盘统计数据
 * GET /api/dashboard/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    // 1. 案件总数和状态分布
    const statusResult = await query(
      `SELECT status, COUNT(*) as count FROM cases GROUP BY status`,
      []
    )
    const statusMap: Record<string, number> = {}
    let totalCases = 0
    for (const row of statusResult.rows) {
      statusMap[row.status] = parseInt(row.count)
      totalCases += parseInt(row.count)
    }

    // 2. 各模块案件数（简化：所有案件都算到 M09，其他模块根据关联表统计）
    // M05: 立案阶段的案件
    const m05Result = await query(
      `SELECT COUNT(*) as count FROM cases WHERE status IN ('draft', 'assigning', 'searching', 'confirming', 'filing')`,
      []
    )
    const m05Count = parseInt(m05Result.rows[0].count)

    // M06: 有交底书的案件
    const m06Result = await query(
      `SELECT COUNT(DISTINCT case_id) as count FROM disclosure_documents`,
      []
    )
    const m06Count = parseInt(m06Result.rows[0].count)

    // M07: 有专利文档的案件
    const m07Result = await query(
      `SELECT COUNT(DISTINCT case_id) as count FROM patent_documents`,
      []
    )
    const m07Count = parseInt(m07Result.rows[0].count)

    // M08: 有审核任务的案件
    const m08Result = await query(
      `SELECT COUNT(DISTINCT case_id) as count FROM reviews`,
      []
    )
    const m08Count = parseInt(m08Result.rows[0].count)

    // M09: 全部案件
    const m09Count = totalCases

    // 3. 待处理数量
    const pendingCount =
      (statusMap['draft'] || 0) +
      (statusMap['assigning'] || 0) +
      (statusMap['searching'] || 0) +
      (statusMap['confirming'] || 0) +
      (statusMap['filing'] || 0) +
      (statusMap['disclosure_pending'] || 0) +
      (statusMap['writing'] || 0) +
      (statusMap['reviewing'] || 0)

    const completedCount = statusMap['completed'] || 0

    // 4. 近期趋势（最近6个月）
    const trendResult = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as count
       FROM cases
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month`,
      []
    )

    const trendData = trendResult.rows.map((row: any) => ({
      month: row.month,
      count: parseInt(row.count),
    }))

    // 5. 待办事项（基于实际数据）
    const todoItems = []

    // 待分配案件
    const assigningResult = await query(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'assigning'`, []
    )
    const assigningCount = parseInt(assigningResult.rows[0].count)
    if (assigningCount > 0) {
      todoItems.push({ title: '待分配案件', count: assigningCount, type: 'urgent', module: 'M05' })
    }

    // 交底书补全中
    const disclosureResult = await query(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'disclosure_pending'`, []
    )
    const disclosureCount = parseInt(disclosureResult.rows[0].count)
    if (disclosureCount > 0) {
      todoItems.push({ title: '交底书补全中', count: disclosureCount, type: 'warning', module: 'M06' })
    }

    // 撰写中
    const writingResult = await query(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'writing'`, []
    )
    const writingCount = parseInt(writingResult.rows[0].count)
    if (writingCount > 0) {
      todoItems.push({ title: '专利撰写中', count: writingCount, type: 'normal', module: 'M07' })
    }

    // 待审核
    const reviewingResult = await query(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'reviewing'`, []
    )
    const reviewingCount = parseInt(reviewingResult.rows[0].count)
    if (reviewingCount > 0) {
      todoItems.push({ title: '待审核案件', count: reviewingCount, type: 'urgent', module: 'M08' })
    }

    // 驳回待修改
    const rejectedResult = await query(
      `SELECT COUNT(*) as count FROM cases WHERE status = 'rejected'`, []
    )
    const rejectedCount = parseInt(rejectedResult.rows[0].count)
    if (rejectedCount > 0) {
      todoItems.push({ title: '驳回待修改', count: rejectedCount, type: 'warning', module: 'M09' })
    }

    return NextResponse.json(success({
      totalCases,
      pendingCount,
      completedCount,
      moduleStats: {
        m05: { total: m05Count, pending: assigningCount },
        m06: { total: m06Count },
        m07: { total: m07Count },
        m08: { total: m08Count },
        m09: { total: m09Count },
      },
      statusDistribution: [
        { name: '已完成', value: statusMap['completed'] || 0, color: '#10B981' },
        { name: '进行中', value: (statusMap['writing'] || 0) + (statusMap['reviewing'] || 0), color: '#3B82F6' },
        { name: '待处理', value: pendingCount - (statusMap['writing'] || 0) - (statusMap['reviewing'] || 0), color: '#F59E0B' },
        { name: '已退回', value: statusMap['rejected'] || 0, color: '#EF4444' },
      ],
      trendData,
      todoItems: todoItems.length > 0 ? todoItems : [{ title: '暂无待办', count: 0, type: 'normal', module: '-' }],
    }))
  } catch (err: any) {
    console.error('获取仪表盘数据失败:', err)
    return NextResponse.json(error('获取仪表盘数据失败', 500))
  }
}
