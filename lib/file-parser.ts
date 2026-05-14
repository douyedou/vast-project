/**
 * 文件解析工具
 * 提取 PDF、Word、图片中的文本内容
 * 
 * 使用方式：
 * import { parseFile } from '@/lib/file-parser'
 * const result = await parseFile(buffer, 'application/pdf')
 */

export interface ParseResult {
  text: string           // 提取的纯文本
  pages?: number         // PDF 页数（仅 PDF）
  paragraphs?: number    // 段落数
  wordCount?: number     // 字数估算
}

export interface ParseOptions {
  maxLength?: number     // 最大提取长度，默认 50000 字符
}

/**
 * 根据 MIME 类型自动选择解析器
 * @param buffer 文件 Buffer
 * @param mimeType MIME 类型
 * @param options 可选参数
 * @returns 解析结果
 */
export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { maxLength = 50000 } = options

  let result: ParseResult

  switch (mimeType) {
    case 'application/pdf':
      result = await parsePDF(buffer)
      break
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      result = await parseWord(buffer)
      break
    case 'image/png':
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/webp':
      result = await parseImage(buffer)
      break
    case 'text/plain':
    case 'text/markdown':
      result = parseText(buffer)
      break
    default:
      throw new Error(`不支持的文件类型: ${mimeType}`)
  }

  // 截断过长文本
  if (result.text.length > maxLength) {
    result.text = result.text.substring(0, maxLength) + '\n\n[内容过长，已截断...]'
  }

  // 统计字数
  result.wordCount = result.text.replace(/\s/g, '').length

  return result
}

/**
 * 解析 PDF 文件
 */
async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  try {
    // 动态导入，避免 ESM 兼容问题
    const pdfModule = await import('pdf-parse')
    const pdfParse = (pdfModule as any).default || pdfModule
    const data = await pdfParse(buffer)
    return {
      text: cleanText(data.text),
      pages: data.numpages,
      paragraphs: countParagraphs(data.text),
    }
  } catch (err: any) {
    throw new Error(`PDF 解析失败: ${err.message}`)
  }
}

/**
 * 解析 Word 文件（.doc 和 .docx）
 */
async function parseWord(buffer: Buffer): Promise<ParseResult> {
  try {
    const mammothModule = await import('mammoth')
    const extractRawText = (mammothModule as any).default?.extractRawText || (mammothModule as any).extractRawText
    const result = await extractRawText({ buffer })
    return {
      text: cleanText(result.value),
      paragraphs: countParagraphs(result.value),
    }
  } catch (err: any) {
    throw new Error(`Word 解析失败: ${err.message}`)
  }
}

/**
 * 解析图片（OCR）
 * 
 * 注意：当前使用简化版 OCR（调用 Python PaddleOCR 或 LLM 视觉）
 * 生产环境建议部署专门的 OCR 服务
 */
async function parseImage(buffer: Buffer): Promise<ParseResult> {
  // 方案1：如果 Python OCR 服务可用，调用它
  try {
    const ocrResult = await callPythonOCR(buffer)
    if (ocrResult && ocrResult.text) {
      return {
        text: cleanText(ocrResult.text),
        paragraphs: countParagraphs(ocrResult.text),
      }
    }
  } catch {
    // OCR 服务不可用，降级处理
  }

  // 方案2：降级为返回图片信息（前端提示用户手动输入）
  return {
    text: '[图片内容，OCR 识别服务暂未启动。建议：1. 手动输入图片描述；2. 确保 Python AI 服务已启动]',
    paragraphs: 0,
  }
}

/**
 * 解析纯文本文件
 */
function parseText(buffer: Buffer): ParseResult {
  const text = buffer.toString('utf-8')
  return {
    text: cleanText(text),
    paragraphs: countParagraphs(text),
  }
}

/**
 * 调用 Python OCR 服务
 * 需要 Python AI 微服务已启动
 */
async function callPythonOCR(buffer: Buffer): Promise<{ text: string } | null> {
  try {
    const response = await fetch('http://localhost:8000/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
    })

    if (!response.ok) return null

    const data = await response.json()
    return { text: data.text }
  } catch {
    return null
  }
}

// ─── 辅助函数 ───

/**
 * 清洗文本
 * 去除多余空白、控制字符等
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')           // 统一换行符
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')  // 去除控制字符
    .replace(/\n{3,}/g, '\n\n')      // 最多连续两个换行
    .replace(/[ \t]+/g, ' ')         // 多个空格合并
    .trim()
}

/**
 * 统计段落数
 */
function countParagraphs(text: string): number {
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 0)
  return paragraphs.length
}

/**
 * 检测文件 MIME 类型（基于文件头）
 * @param buffer 文件前几个字节
 * @returns MIME 类型或 null
 */
export function detectMimeType(buffer: Buffer): string | null {
  const header = buffer.slice(0, 8).toString('hex')

  // PDF: %PDF
  if (header.startsWith('25504446')) return 'application/pdf'
  
  // DOCX: PK (zip格式)
  if (header.startsWith('504b0304')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  
  // DOC: D0CF11E0 (OLE格式)
  if (header.startsWith('d0cf11e0')) return 'application/msword'
  
  // PNG: 89504E47
  if (header.startsWith('89504e47')) return 'image/png'
  
  // JPEG: FFD8FF
  if (header.startsWith('ffd8ff')) return 'image/jpeg'
  
  // GIF: GIF89a / GIF87a
  if (header.startsWith('47494638')) return 'image/gif'
  
  // WEBP: RIFF....WEBP
  if (header.startsWith('52494646') && buffer.slice(8, 12).toString('hex') === '57454250') {
    return 'image/webp'
  }

  return null
}
