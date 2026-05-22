function fromCodePoints(codes: number[]) {
  return String.fromCodePoint(...codes)
}

const COMMON_REPLACEMENTS: Array<[string, string]> = [
  [`${String.fromCharCode(0xfffd)}${String.fromCharCode(0xfffd)}${String.fromCharCode(0xfffd)}整性评分`, "完整性评分"],
  [`${String.fromCharCode(0xfffd)}${String.fromCharCode(0xfffd)}拽文件到此处或点击上传`, "拖拽文件到此处或点击上传"],
  [fromCodePoints([0x93b6, 0x20ac, 0x93c8]), "技术"],
  [fromCodePoints([0x9473, 0x5c7e, 0x6ad9]), "背景"],
  [fromCodePoints([0x6dc7, 0x6fc7, 0x59e2]), "保护"],
  [fromCodePoints([0x5997, 0x581c, 0x6b22]), "案件"],
  [fromCodePoints([0x9359, 0x509d, 0x20ac]), "参考"],
  [fromCodePoints([0x7eeb, 0x8bf2, 0x7037]), "类型"],
  [fromCodePoints([0x93c2, 0x89c4, 0xe50d]), "方案"],
  [fromCodePoints([0x95c4, 0x52eb, 0x6d58]), "附图"],
  [fromCodePoints([0x93bb, 0x612a, 0x6c26]), "提交"],
  [fromCodePoints([0x7039, 0x5c7e, 0x66a3]), "完整"],
  [fromCodePoints([0x6d5c, 0x3085, 0x7c33]), "交底"],
]

const SUSPICIOUS_PATTERNS = COMMON_REPLACEMENTS.map(([pattern]) => pattern)
const LATIN1_MOJIBAKE_RE = /(?:[\u00c2\u00c3\u00c5\u00c6\u00e4\u00e5\u00e6\u00e7].*){2}/

function countChinese(text: string) {
  return (text.match(/[\u3400-\u9fff]/g) || []).length
}

function countReplacement(text: string) {
  return (text.match(/\ufffd/g) || []).length
}

function tryDecodeLatin1AsUtf8(text: string) {
  if (!LATIN1_MOJIBAKE_RE.test(text) || typeof TextDecoder === "undefined") return text

  try {
    const bytes = Uint8Array.from(Array.from(text).map((char) => char.charCodeAt(0) & 0xff))
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
    const originalScore = countChinese(text) * 3 - countReplacement(text) * 5
    const decodedScore = countChinese(decoded) * 3 - countReplacement(decoded) * 5
    return decodedScore > originalScore + 3 ? decoded : text
  } catch {
    return text
  }
}

export function fixMojibake(value: unknown): string {
  if (typeof value !== "string") return ""

  let text = tryDecodeLatin1AsUtf8(value)
    .replace(/\ufffd+/g, "")
    .replace(/\\uFFFD/gi, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, "")

  for (const [pattern, replacement] of COMMON_REPLACEMENTS) {
    text = text.split(pattern).join(replacement)
  }

  return text
}

export function sanitizeDisplayText(value: unknown): string {
  return fixMojibake(value)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
}

export function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") return sanitizeDisplayText(value) as T
  if (Array.isArray(value)) return value.map((item) => sanitizeDeep(item)) as T
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, sanitizeDeep(item)])
    ) as T
  }
  return value
}

export function hasSuspiciousMojibake(value: unknown): boolean {
  if (typeof value !== "string") return false
  if (value.includes("\ufffd") || /\\uFFFD/i.test(value) || LATIN1_MOJIBAKE_RE.test(value)) return true
  return SUSPICIOUS_PATTERNS.some((pattern) => value.includes(pattern))
}
