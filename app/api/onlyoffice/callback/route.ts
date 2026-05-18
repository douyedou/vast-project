/**
 * OnlyOffice 文档保存回调
 * POST /api/onlyoffice/callback
 * 
 * OnlyOffice 在用户关闭文档或自动保存时调用此接口
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { status, url, key } = body
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 1, message: '缺少 documentId' })
    }

    // status 说明：
    // 0: 无变化
    // 1: 文档正在被编辑
    // 2: 已准备好保存（用户关闭文档）
    // 3: 保存失败
    // 4: 文档已关闭，无变化
    // 6: 文档正在编辑并保存
    // 7: 强制保存错误

    if (status === 2 || status === 6) {
      // 需要从 url 下载文档内容并保存到数据库
      if (url) {
        try {
          const docResponse = await fetch(url)
          const content = await docResponse.text()

          // 更新文档内容
          await query(
            `UPDATE patent_documents
             SET content = $1, version = version + 1, updated_at = NOW()
             WHERE id = $2`,
            [content, documentId]
          )

          // 记录版本快照
          const userResult = await query(
            'SELECT id FROM users WHERE role = $1 LIMIT 1',
            ['admin']
          )
          const operatorId = userResult.rows[0]?.id

          await query(
            `INSERT INTO document_versions (document_id, content, operator_id, change_summary)
             VALUES ($1, $2, $3, $4)`,
            [documentId, content, operatorId, 'OnlyOffice 在线编辑保存']
          )
        } catch (err) {
          console.error('下载/保存文档失败:', err)
          return NextResponse.json({ error: 1, message: '保存失败' })
        }
      }
    }

    // 返回成功响应给 OnlyOffice
    return NextResponse.json({ error: 0 })
  } catch (err: any) {
    console.error('OnlyOffice 回调处理失败:', err)
    return NextResponse.json({ error: 1, message: err.message })
  }
}
