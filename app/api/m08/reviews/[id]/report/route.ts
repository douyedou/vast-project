/**
 * 生成审核报告
 * GET /api/m08/reviews/:id/report
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const reviewResult = await query(
      `SELECT r.*, c.title as case_title, c.case_id, c.type as case_type,
        reviewer.name as reviewer_name
       FROM reviews r
       JOIN cases c ON r.case_id = c.id
       LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
       WHERE r.id = $1`,
      [id]
    )

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(error('审核任务不存在', 404))
    }

    const review = reviewResult.rows[0]

    const itemsResult = await query(
      `SELECT type, content, severity, status
       FROM review_items WHERE review_id = $1 ORDER BY created_at DESC`,
      [id]
    )

    // 生成文本报告
    const reportLines = [
      `案件：${review.case_title} (${review.case_id})`,
      `审核结果：${review.result === 'pass' ? '通过' : review.result === 'reject' ? '驳回' : '待审核'}`,
      `审核人：${review.reviewer_name || '未分配'}`,
      `审核时间：${review.updated_at || review.created_at}`,
      '',
      '审核意见：',
      review.comments || '无',
      '',
      'AI 建议：',
      review.ai_suggestions ? JSON.stringify(review.ai_suggestions, null, 2) : '无',
      '',
      '审核项：',
      ...itemsResult.rows.map((item: any) => 
        `- [${item.type}] ${item.content} (严重度: ${item.severity}, 状态: ${item.status})`
      ),
    ]

    const report = reportLines.join('\n')

    return NextResponse.json(success({
      reviewId: id,
      report,
      generatedAt: new Date().toISOString(),
    }))
  } catch (err: any) {
    console.error('生成审核报告失败:', err)
    return NextResponse.json(error('生成审核报告失败', 500))
  }
}
