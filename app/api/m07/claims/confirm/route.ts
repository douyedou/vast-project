/**
 * 权利要求书确认 — 将 draft 转为 B64 docx 并锁定
 * POST /api/m07/claims/confirm
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth, forbiddenResponse } from '@/middleware/auth'
import { query } from '@/lib/db'
import { Document, Paragraph, Packer } from 'docx'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId 参数', 400), { status: 400 })

    // 权限
    const caseResult = await query(
      `SELECT id, engineer_id FROM cases WHERE id = $1`,
      [caseId]
    )
    if (caseResult.rows.length === 0) return NextResponse.json(error('案件不存在', 404), { status: 404 })
    if (user.role !== 'admin' && user.id !== caseResult.rows[0].engineer_id) return forbiddenResponse()

    // 获取所有 draft/pending_review 状态的权利要求
    const claimsResult = await query(
      `SELECT id, claim_number, content, parent_claim_id, status
       FROM patent_documents
       WHERE case_id = $1 AND type = 'claim'
       ORDER BY claim_number ASC`,
      [caseId]
    )

    if (claimsResult.rows.length === 0) {
      return NextResponse.json(error('没有待确认的权利要求', 400), { status: 400 })
    }

    // 已锁定的不允许重复确认
    const alreadyLocked = claimsResult.rows.some(
      (r: any) => r.status !== 'draft' && r.status !== 'pending_review'
    )
    if (alreadyLocked) {
      return NextResponse.json(error('权利要求书已确认，请勿重复提交', 400), { status: 400 })
    }

    // 生成 docx：拼接所有权利要求
    const lines: string[] = ['权利要求书', '']
    for (const claim of claimsResult.rows) {
      if (claim.parent_claim_id) {
        const parent = claimsResult.rows.find((r: any) => r.id === claim.parent_claim_id)
        const refNum = parent ? parent.claim_number : '?'
        lines.push(`${claim.claim_number}. 根据权利要求${refNum}所述的${claim.content.trim()}`)
      } else {
        lines.push(`${claim.claim_number}. ${claim.content.trim()}`)
      }
      lines.push('')
    }

    const paragraphs = lines.map((text) => new Paragraph({ text }))
    const document = new Document({ sections: [{ children: paragraphs }] })
    const buffer = await Packer.toBuffer(document)
    const b64Content = 'B64:' + Buffer.from(buffer).toString('base64')

    // 删除旧的 claim_docx 行（如果有），插入新的
    await query(
      `DELETE FROM patent_documents WHERE case_id = $1 AND type = 'claim' AND status = 'writing'`,
      [caseId]
    )

    // 插入聚合后的 docx 行
    await query(
      `INSERT INTO patent_documents (case_id, type, content, status, claim_number)
       VALUES ($1, 'claim', $2, 'writing', 0)`,
      [caseId, b64Content]
    )

    // 将所有 draft 的 claim 行也标记为 writing（锁定）
    await query(
      `UPDATE patent_documents
       SET status = 'writing', updated_at = NOW()
       WHERE case_id = $1 AND type = 'claim' AND status IN ('draft', 'pending_review')`,
      [caseId]
    )

    // 版本快照
    await query(
      `INSERT INTO document_versions (document_id, content, operator_id, change_summary)
       SELECT id, content, $2, '权利要求书确认提交，转为 docx 格式'
       FROM patent_documents
       WHERE case_id = $1 AND type = 'claim' AND status = 'writing' AND claim_number = 0
       LIMIT 1`,
      [caseId, user.id]
    )

    // 案件状态推进
    await query(
      `UPDATE cases SET status = 'writing', updated_at = NOW()
       WHERE id = $1 AND status != 'writing'`,
      [caseId]
    )

    return NextResponse.json(success({ caseId, count: claimsResult.rows.length }, '权利要求书已确认提交'))
  } catch (err: any) {
    console.error('确认权利要求书失败:', err)
    return NextResponse.json(error('确认权利要求书失败', 500), { status: 500 })
  }
}
