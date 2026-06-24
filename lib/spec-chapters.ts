/**
 * 从说明书纯文本中解析六章结构
 * 兼容多种常见章节标题写法
 */

export interface SpecChapters {
  tech_field: string
  background: string
  summary: string
  drawings_desc: string
  embodiment: string
  effects: string
}

const CHAPTER_PATTERNS: Record<keyof SpecChapters, RegExp[]> = {
  tech_field: [/^\s*技术领域\s*$/],
  background: [/^\s*背景技术\s*$/],
  summary: [/^\s*发明内容\s*$/, /^\s*技术方案\s*$/, /^\s*发明概述\s*$/, /^\s*摘要\s*$/],
  drawings_desc: [/^\s*附图说明\s*$/],
  embodiment: [/^\s*具体实施方式\s*$/, /^\s*实施方式\s*$/, /^\s*实施例\s*$/],
  effects: [/^\s*有益效果\s*$/, /^\s*技术效果\s*$/, /^\s*效果\s*$/],
}

function normalizeTitle(line: string): string {
  // 去掉 markdown 标题标记、序号、前后空白
  return line
    .replace(/^[#\s]+/, '')
    .replace(/^\d+[.、]\s*/, '')
    .replace(/\s+/g, '')
    .trim()
}

function matchChapter(title: string): keyof SpecChapters | null {
  if (title.length === 0 || title.length > 12) return null
  for (const [key, patterns] of Object.entries(CHAPTER_PATTERNS)) {
    if (patterns.some((p) => p.test(title))) {
      return key as keyof SpecChapters
    }
  }
  return null
}

export function extractSpecChapters(content: string): SpecChapters {
  const result: SpecChapters = {
    tech_field: '',
    background: '',
    summary: '',
    drawings_desc: '',
    embodiment: '',
    effects: '',
  }

  if (!content) return result

  const lines = content.split('\n')
  const positions: { key: keyof SpecChapters; lineIndex: number }[] = []

  for (let i = 0; i < lines.length; i++) {
    const title = normalizeTitle(lines[i])
    const key = matchChapter(title)
    if (key) {
      positions.push({ key, lineIndex: i })
    }
  }

  // 按出现顺序排序
  positions.sort((a, b) => a.lineIndex - b.lineIndex)

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].lineIndex + 1
    const end = i < positions.length - 1 ? positions[i + 1].lineIndex : lines.length
    const text = lines.slice(start, end).join('\n').trim()
    result[positions[i].key] = text
  }

  return result
}

export function buildSpecContent(chapters: SpecChapters): string {
  const parts: string[] = []
  if (chapters.tech_field) parts.push(`技术领域\n${chapters.tech_field}`)
  if (chapters.background) parts.push(`背景技术\n${chapters.background}`)
  if (chapters.summary) parts.push(`发明内容\n${chapters.summary}`)
  if (chapters.drawings_desc) parts.push(`附图说明\n${chapters.drawings_desc}`)
  if (chapters.embodiment) parts.push(`具体实施方式\n${chapters.embodiment}`)
  if (chapters.effects) parts.push(`有益效果\n${chapters.effects}`)
  return parts.join('\n\n')
}
