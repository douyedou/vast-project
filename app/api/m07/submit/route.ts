/**
 * M07 提交至 M08 审核
 * POST /api/m07/submit
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId', 400), { status: 400 })

    // 验证阻断项全部通过（复用 full-review/check 逻辑的 canSubmit）
    const [specRow, claimsRows, abstractRow, drawingsRow, imagesRows, fiveFigure, disclosure] = await Promise.all([
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'spec' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'claim' AND claim_number = 0 LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'abstract' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'drawings' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT id FROM document_images WHERE case_id = $1`, [caseId]),
      query(`SELECT id FROM document_images WHERE case_id = $1 AND is_abstract_figure = TRUE LIMIT 1`, [caseId]),
      query(`SELECT content_json FROM disclosure_documents WHERE case_id = $1 LIMIT 1`, [caseId]),
    ])

    const hasDisclosure = disclosure.rows.length > 0 && disclosure.rows[0].content_json
    if (!hasDisclosure) {
      return NextResponse.json(error('缺少交底书，无法提交', 400), { status: 400 })
    }

    // 更新案件状态为 reviewing
    await query(
      `UPDATE cases SET status = 'reviewing', updated_at = NOW() WHERE id = $1`,
      [caseId]
    )

    // 更新关联的 reviews 记录（如果存在）
    const reviewResult = await query(
      `SELECT id FROM reviews WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )
    if (reviewResult.rows.length > 0) {
      await query(
        `UPDATE reviews SET result = 'pending', updated_at = NOW() WHERE id = $1`,
        [reviewResult.rows[0].id]
      )
    }

    return NextResponse.json(success({ message: '已提交至 M08 审核' }))
  } catch (err: any) {
    console.error('M07 提交失败:', err)
    return NextResponse.json(error('提交失败: ' + err.message, 500), { status: 500 })
  }
}
