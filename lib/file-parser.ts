export interface ParseResult {
  text: string
  pages?: number
  paragraphs?: number
  wordCount?: number
}

export interface ParseOptions {
  maxLength?: number
  fileName?: string
}

export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { maxLength = 50000 } = options
  const normalizedMime = normalizeMimeType(buffer, mimeType, options.fileName)

  let result: ParseResult
  switch (normalizedMime) {
    case "application/pdf":
      result = await parsePDF(buffer)
      break
    case "application/msword":
      result = await parseDoc(buffer)
      break
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      result = await parseDocx(buffer)
      break
    case "image/png":
    case "image/jpeg":
    case "image/jpg":
    case "image/webp":
      result = await parseImage(buffer)
      break
    case "text/plain":
    case "text/markdown":
      result = parseText(buffer)
      break
    default:
      throw new Error(`不支持的文件类型: ${normalizedMime}`)
  }

  if (result.text.length > maxLength) {
    result.text = `${result.text.substring(0, maxLength)}\n\n[内容过长，已截断...]`
  }

  result.wordCount = result.text.replace(/\s/g, "").length
  return result
}

async function parsePDF(buffer: Buffer): Promise<ParseResult> {
  try {
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    await parser.destroy()
    return {
      text: cleanText(data.text),
      pages: data.total,
      paragraphs: countParagraphs(data.text),
    }
  } catch (err: any) {
    throw new Error(`PDF 解析失败: ${err.message}`)
  }
}

async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  try {
    const mammothModule = await import("mammoth")
    const extractRawText = (mammothModule as any).default?.extractRawText || (mammothModule as any).extractRawText
    const result = await extractRawText({ buffer })
    return {
      text: cleanText(result.value),
      paragraphs: countParagraphs(result.value),
    }
  } catch (err: any) {
    throw new Error(`DOCX 解析失败: ${err.message}`)
  }
}

async function parseDoc(buffer: Buffer): Promise<ParseResult> {
  try {
    const module = await import("word-extractor")
    const WordExtractor = (module as any).default || module
    const extractor = new WordExtractor()
    const document = await extractor.extract(buffer)
    const text = document.getBody()
    return {
      text: cleanText(text),
      paragraphs: countParagraphs(text),
    }
  } catch (err: any) {
    throw new Error(`DOC 解析失败: ${err.message}`)
  }
}

async function parseImage(buffer: Buffer): Promise<ParseResult> {
  try {
    const ocrResult = await callPythonOCR(buffer)
    if (ocrResult?.text) {
      return {
        text: cleanText(ocrResult.text),
        paragraphs: countParagraphs(ocrResult.text),
      }
    }
  } catch {
    // The OCR service is optional in local demos.
  }

  return {
    text: "[图片内容：OCR 服务暂不可用。请补充图片中的关键结构、流程、部件名称或参数说明。]",
    paragraphs: 0,
  }
}

function parseText(buffer: Buffer): ParseResult {
  const text = buffer.toString("utf-8")
  return {
    text: cleanText(text),
    paragraphs: countParagraphs(text),
  }
}

async function callPythonOCR(buffer: Buffer): Promise<{ text: string } | null> {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000"
    const formData = new FormData()
    formData.append("file", new Blob([new Uint8Array(buffer)]), "image.png")

    const response = await fetch(`${aiServiceUrl}/api/ocr`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) return null

    const data = await response.json()
    return { text: data.text }
  } catch {
    return null
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim()
}

function countParagraphs(text: string): number {
  return text.split(/\n{2,}/).filter((paragraph) => paragraph.trim().length > 0).length
}

function normalizeMimeType(buffer: Buffer, mimeType: string, fileName?: string): string {
  const fromHeader = detectMimeType(buffer)
  if (fromHeader) return fromHeader

  const lower = (fileName || "").toLowerCase()
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (lower.endsWith(".doc")) return "application/msword"
  if (lower.endsWith(".txt")) return "text/plain"
  if (lower.endsWith(".md")) return "text/markdown"

  return mimeType || "text/plain"
}

export function detectMimeType(buffer: Buffer): string | null {
  const header = buffer.slice(0, 12).toString("hex")

  if (header.startsWith("25504446")) return "application/pdf"
  if (header.startsWith("504b0304")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (header.startsWith("d0cf11e0")) return "application/msword"
  if (header.startsWith("89504e47")) return "image/png"
  if (header.startsWith("ffd8ff")) return "image/jpeg"
  if (header.startsWith("52494646") && buffer.slice(8, 12).toString("hex") === "57454250") return "image/webp"

  return null
}
