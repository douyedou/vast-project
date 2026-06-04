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
    console.log("[OnlyOffice Callback]", JSON.stringify(body).slice(0, 200))
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
          const rawBuf = Buffer.from(await docResponse.arrayBuffer())
          // 存 base64 编码的 docx 二进制
          const content = 'B64:' + rawBuf.toString('base64')

          // 更新文档内容
          await query(
            `UPDATE patent_documents
             SET content = $1, version = version + 1, updated_at = NOW()
             WHERE id = $2`,
            [content, documentId]
          )

          // 如果是 drawings 类型，同步回对应的 document_images.description
          await query(
            `UPDATE document_images SET description = $1
             WHERE id = (
               SELECT d.id FROM document_images d
               JOIN patent_documents pd ON pd.case_id = d.case_id AND pd.type = 'drawings'
               WHERE pd.id = $2
               LIMIT 1
             )`,
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

// 从 docx ZIP 中提取纯文本
function extractDocxText(buf: Buffer): string {
  // 找 word/document.xml 在 ZIP 中的位置
  const docXmlMarker = Buffer.from('word/document.xml')
  let offset = 0
  while (offset < buf.length - docXmlMarker.length) {
    const pos = buf.indexOf(docXmlMarker, offset)
    if (pos === -1) break
    // ZIP local file header: 签名(4) + 版本(2) + 标志(2) + 压缩方法(2) + ...
    // 在文件名后面找压缩数据
    const headerStart = pos - 30 // 回退到 local header 附近
    // 压缩方法在偏移 8 处（从 local header 签名开始算）
    const sigPos = buf.lastIndexOf(Buffer.from('PK\x03\x04'), pos)
    if (sigPos === -1) { offset = pos + 1; continue }
    const method = buf.readUInt16LE(sigPos + 8)
    const compSize = buf.readUInt32LE(sigPos + 18)
    const nameLen = buf.readUInt16LE(sigPos + 26)
    const extraLen = buf.readUInt16LE(sigPos + 28)
    const dataStart = sigPos + 30 + nameLen + extraLen
    const dataEnd = dataStart + compSize

    if (dataEnd > buf.length) break
    const raw = buf.subarray(dataStart, dataEnd)

    try {
      const xml = method === 8
        ? require('zlib').inflateRawSync(raw).toString('utf-8')
        : method === 0 ? raw.toString('utf-8') : ''
      if (xml) {
        const texts: string[] = []
        const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g
        let m
        while ((m = re.exec(xml)) !== null) texts.push(m[1])
        return texts.join('').trim()
      }
    } catch {}
    offset = pos + 1
  }
  return ''
}
