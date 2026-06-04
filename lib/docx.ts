/**
 * Docx 工具 — B64 内容检测与文本提取
 */

// 从 docx ZIP 中提取纯文本（<w:t> 标签内容）
export function extractDocxText(buf: Buffer): string {
  const docXmlMarker = Buffer.from('word/document.xml')
  let offset = 0
  while (offset < buf.length - docXmlMarker.length) {
    const pos = buf.indexOf(docXmlMarker, offset)
    if (pos === -1) break
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
      const zlib = require('zlib')
      const xml = method === 8
        ? zlib.inflateRawSync(raw).toString('utf-8')
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

/**
 * 如果 content 是 B64 编码的 docx，解码并提取纯文本
 * 返回 { content: string, hasDocx: boolean }
 */
export function sanitizeB64Content(content: string | null): {
  content: string
  hasDocx: boolean
} {
  if (content && content.startsWith('B64:')) {
    try {
      const buf = Buffer.from(content.slice(4), 'base64')
      return { content: extractDocxText(buf), hasDocx: true }
    } catch {
      return { content: '', hasDocx: true }
    }
  }
  return { content: content || '', hasDocx: false }
}
