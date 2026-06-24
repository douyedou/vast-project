/**
 * 专利文档详情/更新
 * GET /api/m07/documents/:id
 * PUT /api/m07/documents/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { sanitizeB64Content } from '@/lib/docx'
import { extractSpecChapters } from '@/lib/spec-chapters'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/m07/documents/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const result = await query(
      `SELECT id, case_id, type, content, status, ai_rate, version, created_at, updated_at
       FROM patent_documents WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    return NextResponse.json(success(result.rows[0]))
  } catch (err: any) {
    console.error('获取专利文档失败:', err)
    return NextResponse.json(error('获取专利文档失败', 500))
  }
}

// PUT /api/m07/documents/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { content, status, aiRate } = body

    const docCheck = await query('SELECT id, content, version FROM patent_documents WHERE id = $1', [id])
    if (docCheck.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    const oldDoc = docCheck.rows[0]

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (content !== undefined) { updates.push(`content = $${paramIndex++}`); values.push(content) }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status) }
    if (aiRate !== undefined) { updates.push(`ai_rate = $${paramIndex++}`); values.push(aiRate) }

    // 内容更新时，自动解析并同步六章独立字段
    if (content !== undefined) {
      const plainText = sanitizeB64Content(content).content
      const chapters = extractSpecChapters(plainText)
      updates.push(`tech_field = $${paramIndex++}`); values.push(chapters.tech_field)
      updates.push(`background = $${paramIndex++}`); values.push(chapters.background)
      updates.push(`summary = $${paramIndex++}`); values.push(chapters.summary)
      updates.push(`drawings_desc = $${paramIndex++}`); values.push(chapters.drawings_desc)
      updates.push(`embodiment = $${paramIndex++}`); values.push(chapters.embodiment)
      updates.push(`effects = $${paramIndex++}`); values.push(chapters.effects)
    }

    updates.push(`version = version + 1`)
    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE patent_documents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    // 保存版本快照（仅 forceVersion 时）
    const forceVersion = body.forceVersion === true
    if (forceVersion) {
      await query(
        `INSERT INTO document_versions (document_id, content, operator_id, change_summary)
         VALUES ($1, $2, $3, $4)`,
        [id, oldDoc.content, user.id, body.changeSummary || '手动保存版本']
      )

      // ── 计算与上一版本的 diff，记录编辑日志（用于 AI 学习）──
      const prevResult = await query(
        `SELECT content FROM document_versions
         WHERE document_id = $1
         ORDER BY created_at DESC LIMIT 1 OFFSET 1`,
        [id]
      )
      if (prevResult.rows.length > 0) {
        const prevContent = prevResult.rows[0].content || ''
        const currContent = oldDoc.content || ''  // 刚存的快照即"旧版本"
        if (prevContent !== currContent) {
          const prevLines = prevContent.split('\n')
          const currLines = currContent.split('\n')
          // 简单行级 diff
          for (let i = 0; i < Math.max(prevLines.length, currLines.length); i++) {
            const oldLine = prevLines[i] || ''
            const newLine = currLines[i] || ''
            if (oldLine !== newLine && (oldLine || newLine)) {
              const op = !oldLine ? 'insert' : !newLine ? 'delete' : 'update'
              await query(
                `INSERT INTO edit_logs (document_id, paragraph_id, operation, old_value, new_value, user_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, `L${i + 1}`, op, oldLine, newLine, user.id]
              )
            }
          }
          console.log(`[版本记录] 已记录 ${Math.abs(prevLines.length - currLines.length) + Math.min(prevLines.length, currLines.length)} 行差异到 edit_logs`)
        }
      }
    }

    return NextResponse.json(success(result.rows[0], '保存成功'))
  } catch (err: any) {
    console.error('更新专利文档失败:', err)
    return NextResponse.json(error('更新专利文档失败', 500))
  }
}
