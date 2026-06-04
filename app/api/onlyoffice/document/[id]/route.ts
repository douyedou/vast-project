/**
 * OnlyOffice 文档下载接口
 * GET /api/onlyoffice/document/:id
 *
 * 将数据库中的纯文本内容动态生成 docx 文件返回
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Document, Paragraph, Packer } from 'docx'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 查询文档内容
    const docResult = await query(
      'SELECT id, type, content FROM patent_documents WHERE id = $1',
      [id]
    )

    if (docResult.rows.length === 0) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 })
    }

    const doc = docResult.rows[0]
    const content = doc.content || ''

    // 如果已经是 OnlyOffice 保存的 docx（base64 格式），直接返回
    if (content.startsWith('B64:')) {
      const buf = Buffer.from(content.slice(4), 'base64')
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="document-${id.slice(0, 8)}.docx"`,
        },
      })
    }

    // 纯文本 → 生成 docx
    const paragraphs = content
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .map((line: string) => new Paragraph({ text: line.trim() }))

    if (paragraphs.length === 0) {
      paragraphs.push(new Paragraph({ text: '（文档内容为空）' }))
    }

    const document = new Document({
      sections: [{ children: paragraphs }],
    })

    const buffer = await Packer.toBuffer(document)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="document-${id.slice(0, 8)}.docx"`,
      },
    })
  } catch (err: any) {
    console.error('生成文档失败:', err.message, err.stack)
    return NextResponse.json({ error: '生成文档失败: ' + err.message }, { status: 500 })
  }
}
