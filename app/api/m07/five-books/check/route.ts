/**
 * 五书检查 — 查看五书是否齐全
 * GET /api/m07/five-books/check?caseId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { sanitizeB64Content } from '@/lib/docx'

async function getPreviewText(docId: string | null): Promise<string> {
  if (!docId) return ''
  try {
    const r = await query('SELECT content FROM patent_documents WHERE id = $1', [docId])
    if (r.rows.length === 0) return ''
    return sanitizeB64Content(r.rows[0].content).content
  } catch { return '' }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    if (!caseId) return NextResponse.json(error('缺少 caseId 参数', 400), { status: 400 })

    // 说明书: type='spec', status='writing', content 非空
    const specResult = await query(
      `SELECT id FROM patent_documents
       WHERE case_id = $1 AND type = 'spec' AND status = 'writing' AND content != ''
       LIMIT 1`,
      [caseId]
    )

    // 权利要求书: type='claim', status='writing', claim_number=0 (汇总 docx)
    const claimsResult = await query(
      `SELECT id FROM patent_documents
       WHERE case_id = $1 AND type = 'claim' AND status = 'writing' AND claim_number = 0
       LIMIT 1`,
      [caseId]
    )

    // 摘要: type='abstract', content 非空
    const abstractResult = await query(
      `SELECT id FROM patent_documents
       WHERE case_id = $1 AND type = 'abstract' AND content != ''
       LIMIT 1`,
      [caseId]
    )

    // 附图说明: type='drawings'
    const drawingsResult = await query(
      `SELECT id FROM patent_documents
       WHERE case_id = $1 AND type = 'drawings'
       ORDER BY content != '' DESC, updated_at DESC
       LIMIT 1`,
      [caseId]
    )

    // 图片列表，含摘要附图标记
    const imagesResult = await query(
      `SELECT di.id, di.filename, di.original_name, di.url, di.caption, di.position, di.is_abstract_figure
       FROM document_images di
       WHERE di.case_id = $1
       ORDER BY di.position`,
      [caseId]
    )

    const savedFigure = imagesResult.rows.find((r: any) => r.is_abstract_figure)
    const savedFigureId = savedFigure?.id || null

    const specDocId = specResult.rows[0]?.id || null
    const claimsDocId = claimsResult.rows[0]?.id || null
    const abstractDocId = abstractResult.rows[0]?.id || null
    const drawingsDocId = drawingsResult.rows[0]?.id || null

    const [specPreview, claimsPreview, abstractPreview, drawingsPreview] = await Promise.all([
      getPreviewText(specDocId),
      getPreviewText(claimsDocId),
      getPreviewText(abstractDocId),
      getPreviewText(drawingsDocId),
    ])

    const books = [
      { key: 'spec', label: '说明书', icon: 'BookOpen', ready: !!specDocId, documentId: specDocId, preview: specPreview },
      { key: 'claims', label: '权利要求书', icon: 'FileCheck', ready: !!claimsDocId, documentId: claimsDocId, preview: claimsPreview },
      { key: 'abstract', label: '摘要', icon: 'FileText', ready: !!abstractDocId, documentId: abstractDocId, preview: abstractPreview },
      { key: 'drawings', label: '附图说明', icon: 'FileText', ready: !!drawingsDocId, documentId: drawingsDocId, preview: drawingsPreview },
      { key: 'abstractFigure', label: '摘要附图', icon: 'Image', ready: !!savedFigureId, documentId: savedFigureId, preview: '' },
    ]

    const allReady = books.every(b => b.ready)

    return NextResponse.json(success({
      books,
      images: imagesResult.rows,
      allReady,
    }))
  } catch (err: any) {
    console.error('五书检查失败:', err)
    return NextResponse.json(error('五书检查失败', 500), { status: 500 })
  }
}
