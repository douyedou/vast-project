/**
 * 版本恢复
 * POST /api/m07/documents/:id/restore
 * Body: { versionId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { versionId } = body || {}
    if (!versionId) return NextResponse.json(error('缺少 versionId', 400), { status: 400 })

    // 获取目标版本内容
    const versionResult = await query(
      `SELECT content FROM document_versions WHERE id = $1 AND document_id = $2`,
      [versionId, id]
    )
    if (versionResult.rows.length === 0) {
      return NextResponse.json(error('版本不存在', 404), { status: 404 })
    }
    const targetContent = versionResult.rows[0].content

    // 获取当前文档
    const docResult = await query(
      `SELECT id, content, version FROM patent_documents WHERE id = $1`,
      [id]
    )
    if (docResult.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404), { status: 404 })
    }
    const currentDoc = docResult.rows[0]

    // 恢复内容
    const result = await query(
      `UPDATE patent_documents SET content = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2 RETURNING version`,
      [targetContent, id]
    )

    // 记录编辑日志
    if (currentDoc.content !== targetContent) {
      const oldLines = (currentDoc.content || '').split('\n')
      const newLines = (targetContent || '').split('\n')
      for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
        const oldLine = oldLines[i] || ''
        const newLine = newLines[i] || ''
        if (oldLine !== newLine && (oldLine || newLine)) {
          const op = !oldLine ? 'insert' : !newLine ? 'delete' : 'update'
          await query(
            `INSERT INTO edit_logs (document_id, paragraph_id, operation, old_value, new_value, user_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, `L${i + 1}`, op, oldLine, newLine, user.id]
          )
        }
      }
    }

    return NextResponse.json(success({
      version: result.rows[0].version,
      message: '版本恢复成功',
    }))
  } catch (err: any) {
    console.error('版本恢复失败:', err)
    return NextResponse.json(error('版本恢复失败: ' + err.message, 500), { status: 500 })
  }
}
