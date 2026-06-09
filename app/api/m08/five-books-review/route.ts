/**
 * M08 五书审核
 * GET  /api/m08/five-books-review?reviewId=xxx — 获取五书内容和审核结果
 * PUT  /api/m08/five-books-review — 保存 checklist
 *
 * 五书查询逻辑复用 M07 five-books/check 的实现
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { sanitizeB64Content } from '@/lib/docx'

const BOOK_KEYS = ['spec', 'claims', 'abstract', 'drawings', 'abstractFigure']
const BOOK_LABELS = ['说明书', '权利要求书', '摘要', '附图说明', '摘要附图']

async function getPreview(docId: string | null): Promise<string> {
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
    const reviewId = searchParams.get('reviewId')
    if (!reviewId) return NextResponse.json(error('缺少 reviewId', 400), { status: 400 })

    const reviewResult = await query(
      `SELECT r.id, r.case_id, c.title AS case_title, c.case_id AS case_no
       FROM reviews r JOIN cases c ON c.id = r.case_id WHERE r.id = $1`, [reviewId]
    )
    if (reviewResult.rows.length === 0) return NextResponse.json(error('审核任务不存在', 404))
    const { case_id: caseId, case_title, case_no } = reviewResult.rows[0]

    // ── 五书查询（复用 M07 five-books/check 逻辑）──
    const statusFilter = "IN ('writing','ai_checking','approved')"

    const [specResult, claimsListResult, abstractResult, drawingsResult, imagesResult] = await Promise.all([
      query(`SELECT id FROM patent_documents
        WHERE case_id = $1 AND type = 'spec' AND status ${statusFilter} AND content != ''
        LIMIT 1`, [caseId]),
      query(`SELECT id, claim_number, content, parent_claim_id, support_status, support_paragraphs
        FROM patent_documents
        WHERE case_id = $1 AND type = 'claim' AND claim_number > 0
        ORDER BY claim_number ASC`, [caseId]),
      query(`SELECT id FROM patent_documents
        WHERE case_id = $1 AND type = 'abstract' AND content != ''
        LIMIT 1`, [caseId]),
      query(`SELECT id FROM patent_documents
        WHERE case_id = $1 AND type = 'drawings'
        ORDER BY content != '' DESC, updated_at DESC
        LIMIT 1`, [caseId]),
      query(`SELECT id, is_abstract_figure FROM document_images
        WHERE case_id = $1 ORDER BY position`, [caseId]),
    ])

    const savedFigure = imagesResult.rows.find((r: any) => r.is_abstract_figure)
    const specDocId = specResult.rows[0]?.id || null
    const abstractDocId = abstractResult.rows[0]?.id || null
    const drawingsDocId = drawingsResult.rows[0]?.id || null
    const figureDocId = savedFigure?.id || null

    // 构建权利要求统一文本（逐条格式化）
    const claimsRows = claimsListResult.rows
    const numToClaimMap = new Map<number, any>()
    claimsRows.forEach((r: any) => numToClaimMap.set(r.claim_number, r))

    const claimsPreview = claimsRows.map((r: any) => {
      const parts: string[] = []
      // 标题行
      if (r.parent_claim_id) {
        const parentNum = [...numToClaimMap.values()].find((p: any) => p.id === r.parent_claim_id)?.claim_number
        parts.push(`权利要求 ${r.claim_number}（从属，引用权利要求 ${parentNum || '?'}）`)
      } else {
        parts.push(`权利要求 ${r.claim_number}（独立）`)
      }
      // 内容
      parts.push(`内容：${sanitizeB64Content(r.content).content}`)
      // 支撑段落
      if (r.support_paragraphs && r.support_paragraphs.length > 0) {
        parts.push(`支撑段落：${r.support_paragraphs.join('；')}`)
      }
      // 支持状态
      parts.push(`状态：${r.support_status === 'supported' ? '已支持' : r.support_status === 'weak' ? '弱支持' : r.support_status === 'unsupported' ? '无支持' : '未检查'}`)
      return parts.join('\n')
    }).join('\n\n')

    // 说明书/摘要/附图 仍用原逻辑
    const [specPreview, abstractPreview, drawingsPreview] = await Promise.all([
      getPreview(specDocId),
      getPreview(abstractDocId),
      getPreview(drawingsDocId),
    ])

    const claimsReady = claimsRows.length > 0

    const sections = BOOK_KEYS.map((key, i) => {
      const previewMap: Record<string, string> = {
        spec: specPreview, claims: claimsPreview, abstract: abstractPreview,
        drawings: drawingsPreview, abstractFigure: '',
      }
      return {
        id: `section-${i + 1}`,
        key,
        title: BOOK_LABELS[i],
        content: previewMap[key] || (key === 'abstractFigure' && figureDocId ? '已设置摘要附图' : ''),
        complete: key === 'abstractFigure' ? !!figureDocId : key === 'claims' ? claimsReady : !!previewMap[key],
      }
    })

    const checklist = BOOK_KEYS.map((key, i) => ({
      item: BOOK_LABELS[i],
      key,
      status: key === 'abstractFigure' ? !!figureDocId : key === 'claims' ? claimsReady : !!({
        spec: specDocId, claims: true, abstract: abstractDocId, drawings: drawingsDocId,
      } as any)[key],
    }))

    // 组装完整预览文本
    const fullText = [
      `【说明书】\n${specPreview || '（无内容）'}`,
      `【权利要求书】\n${claimsPreview || '（无内容）'}`,
      `【摘要】\n${abstractPreview || '（无内容）'}`,
      `【附图说明】\n${drawingsPreview || '（无内容）'}`,
    ].join('\n\n')

    // 自定义问题
    const customResult = await query(
      `SELECT id, type, content, severity, status, is_blocking FROM review_items
       WHERE review_id = $1 AND NOT (type = 'completeness' AND content LIKE '{%}') ORDER BY created_at DESC`,
      [reviewId]
    )

    return NextResponse.json(success({
      reviewId,
      caseNo: case_no,
      caseTitle: case_title,
      fullText,
      sections,
      checklist,
      customItems: customResult.rows.map((r: any) => ({
        id: r.id,
        type: r.type,
        content: r.content,
        severity: r.severity,
        status: r.status,
        isBlocking: r.is_blocking,
      })),
    }))
  } catch (err: any) {
    console.error('Five-books review error:', err)
    return NextResponse.json(error('获取五书审核失败: ' + err.message, 500), { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { reviewId, items } = body
    if (!reviewId || !items) return NextResponse.json(error('缺少 reviewId 或 items', 400), { status: 400 })

    await query(`DELETE FROM review_items WHERE review_id = $1 AND type = 'completeness' AND content LIKE '{%}'`, [reviewId])
    await query(
      `INSERT INTO review_items (review_id, type, content, severity, status) VALUES ($1, 'completeness', $2, 'medium', 'resolved')`,
      [reviewId, JSON.stringify(items)]
    )

    return NextResponse.json(success({ reviewId, items }, '五书审核结论已保存'))
  } catch (err: any) {
    console.error('Five-books review save error:', err)
    return NextResponse.json(error('保存失败: ' + err.message, 500), { status: 500 })
  }
}
