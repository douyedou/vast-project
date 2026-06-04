/**
 * 五书提交审核
 * POST /api/m07/five-books/submit
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query, transaction } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId 参数', 400), { status: 400 })

    // 检查五书是否齐全（复用 check 逻辑）
    const check = await Promise.all([
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'spec' AND status = 'writing' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'claim' AND status = 'writing' AND claim_number = 0 LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'abstract' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'drawings' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM document_images WHERE case_id = $1 AND is_abstract_figure = TRUE LIMIT 1`, [caseId]),
    ])

    const missing: string[] = []
    if (check[0].rows.length === 0) missing.push('说明书')
    if (check[1].rows.length === 0) missing.push('权利要求书')
    if (check[2].rows.length === 0) missing.push('摘要')
    if (check[3].rows.length === 0) missing.push('附图说明')
    if (check[4].rows.length === 0) missing.push('摘要附图')

    if (missing.length > 0) {
      return NextResponse.json(error(`五书不齐全，缺少：${missing.join('、')}`, 400), { status: 400 })
    }

    // 事务：更新案件状态 + 文档状态
    await transaction(async (client) => {
      await client.query(
        `UPDATE cases SET status = 'writingcheck', updated_at = NOW() WHERE id = $1`,
        [caseId]
      )
      await client.query(
        `UPDATE patent_documents SET status = 'ai_checking', updated_at = NOW()
         WHERE case_id = $1 AND type IN ('spec', 'claim', 'abstract', 'drawings') AND status = 'writing'`,
        [caseId]
      )
      // 创建审核记录
      await client.query(
        `INSERT INTO reviews (case_id, reviewer_id, result)
         VALUES ($1, (SELECT id FROM users WHERE role = 'reviewer' LIMIT 1), 'pending')`,
        [caseId]
      )
    })

    return NextResponse.json(success({ caseId }, '提交审核成功'))
  } catch (err: any) {
    console.error('提交审核失败:', err)
    return NextResponse.json(error('提交审核失败', 500), { status: 500 })
  }
}
