/**
 * 说明书起草确认 — 将 draft 转为 B64 docx 并锁定
 * POST /api/m07/spec-draft-page/confirm
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
      `SELECT id, title, engineer_id, status FROM cases WHERE id = $1`,
      [caseId]
    )
    if (caseResult.rows.length === 0) return NextResponse.json(error('案件不存在', 404), { status: 404 })
    if (user.role !== 'admin' && user.id !== caseResult.rows[0].engineer_id) return forbiddenResponse()

    // 找 draft 状态的 spec
    const docResult = await query(
      `SELECT id, content, tech_field, background, summary, drawings_desc, embodiment, effects, status
       FROM patent_documents
       WHERE case_id = $1 AND type = 'spec' AND status = 'draft'
       ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )

    if (docResult.rows.length === 0) {
      return NextResponse.json(error('没有待确认的说明书草稿', 400), { status: 400 })
    }

    const doc = docResult.rows[0]

    // 生成 docx
    const lines: string[] = []
    if (doc.tech_field) { lines.push('技术领域'); lines.push(doc.tech_field); lines.push('') }
    if (doc.background) { lines.push('背景技术'); lines.push(doc.background); lines.push('') }
    if (doc.summary) { lines.push('发明内容'); lines.push(doc.summary); lines.push('') }
    if (doc.drawings_desc) { lines.push('附图说明'); lines.push(doc.drawings_desc); lines.push('') }
    if (doc.embodiment) { lines.push('具体实施方式'); lines.push(doc.embodiment); lines.push('') }
    if (doc.effects) { lines.push('有益效果'); lines.push(doc.effects); lines.push('') }

    // 如果章节字段为空但有 content，用 content
    if (lines.length === 0 && doc.content) {
      lines.push(doc.content)
    }

    const paragraphs = lines
      .map((text) => new Paragraph({ text }))

    const document = new Document({
      sections: [{ children: paragraphs }],
    })

    const buffer = await Packer.toBuffer(document)
    const b64Content = 'B64:' + Buffer.from(buffer).toString('base64')

    // 更新为 B64 + 锁定
    const updateResult = await query(
      `UPDATE patent_documents
       SET content = $1, status = 'writing', version = version + 1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, case_id, type, content, status, ai_rate, version,
                 tech_field, background, summary, drawings_desc, embodiment, effects,
                 created_at, updated_at`,
      [b64Content, doc.id]
    )

    // 版本快照
    await query(
      `INSERT INTO document_versions (document_id, content, operator_id, change_summary)
       VALUES ($1, $2, $3, $4)`,
      [doc.id, doc.content, user.id, '说明书确认提交，转为 docx 格式']
    )

    // 案件状态推进
    if (caseResult.rows[0].status !== 'writing') {
      await query(`UPDATE cases SET status = 'writing', updated_at = NOW() WHERE id = $1`, [caseId])
    }

    return NextResponse.json(success(updateResult.rows[0], '说明书已确认提交'))
  } catch (err: any) {
    console.error('确认说明书失败:', err)
    return NextResponse.json(error('确认说明书失败', 500), { status: 500 })
  }
}
