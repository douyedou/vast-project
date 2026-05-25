import {
  M06Content,
  M06_SECTION_DEFS,
  M06Figure,
  M06InnovationIdea,
  M06SectionKey,
  M06Source,
  M06StructureNode,
  sanitizeM06Text,
} from "@/lib/m06"

export const M06_AI_SYSTEM_PROMPT =
  "你是中国专利交底书工程师助手。回答必须基于用户提供的交底材料、案件信息和检索来源，不编造不可验证事实。输出内容要能直接服务 M06 交底书解构、补全、检索、对比、质量校验和提交 M07。"

export const M06_JSON_SYSTEM_PROMPT =
  `${M06_AI_SYSTEM_PROMPT} 你必须只输出合法 JSON，不要输出 Markdown 代码块、解释文字或多余前后缀。`

export const M06_SECTION_LABELS: Record<M06SectionKey, string> = Object.fromEntries(
  M06_SECTION_DEFS.map((section) => [section.key, section.label])
) as Record<M06SectionKey, string>

export interface DecomposeJson {
  summary?: string
  technicalFeatures?: string[]
  distinguishingFeatures?: string[]
  protectionPoints?: string[]
  relations?: string[]
  alternatives?: string[]
  terminology?: Record<string, string>
  factNodes?: Array<Partial<M06StructureNode>>
}

export interface ExtractJson {
  summary?: string
  sections?: Partial<Record<M06SectionKey, string>>
  technicalFeatures?: string[]
  relations?: string[]
  distinguishingFeatures?: string[]
  alternatives?: string[]
  terminology?: Record<string, string>
  protectionPoints?: string[]
}

export interface RelationJson {
  summary?: string
  relations?: string[]
  alternatives?: string[]
  factNodes?: Array<Partial<M06StructureNode>>
}

export interface CompareJson {
  summary?: string
  distinguishingFeatures?: string[]
  risks?: string[]
  suggestions?: string[]
}

export interface InnovationIdeasJson {
  ideas?: Array<Partial<M06InnovationIdea>>
}

export interface FigureJson {
  title?: string
  type?: M06Figure["type"]
  mermaid?: string
  description?: string
}

export function parseM06Json<T>(text: string): Partial<T> | null {
  const sanitized = sanitizeM06Text(text)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim()

  const direct = tryParseJson<T>(sanitized)
  if (direct) return direct

  const start = sanitized.indexOf("{")
  const end = sanitized.lastIndexOf("}")
  if (start >= 0 && end > start) {
    return tryParseJson<T>(sanitized.slice(start, end + 1))
  }

  return null
}

function tryParseJson<T>(text: string): Partial<T> | null {
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

export function textList(value: unknown, fallback: string[] = [], max = 8): string[] {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|；|;|。|、|,/)
      : []

  const values = candidates
    .map((item) =>
      sanitizeM06Text(item)
        .replace(/^\s*[-*•\d.、；)]+/, "")
        .replace(/^特征[:：]?/, "")
    )
    .filter((item) => item.length >= 4 && !item.includes("```"))

  const unique = Array.from(new Set(values))
  return (unique.length ? unique : fallback.map((item) => sanitizeM06Text(item)).filter(Boolean)).slice(0, max)
}

export function normalizeFactNodes(
  value: unknown,
  fallback: string[],
  defaultType: string,
  sourcePrefix: string,
  max = 8
): M06StructureNode[] {
  if (Array.isArray(value)) {
    const nodes: M06StructureNode[] = value
      .map((node, index) => ({
        id: sanitizeM06Text(node?.id) || `${sourcePrefix}-${index + 1}`,
        type: sanitizeM06Text(node?.type) || defaultType,
        content: sanitizeM06Text(node?.content),
        sourceParaId: sanitizeM06Text(node?.sourceParaId) || `${sourcePrefix}-${index + 1}`,
        isCore: Boolean(node?.isCore ?? index < 3),
        status: node?.status === "confirmed" ? ("confirmed" as const) : ("draft" as const),
      }))
      .filter((node) => node.content)
      .slice(0, max)

    if (nodes.length) return nodes
  }

  return fallback.slice(0, max).map((content, index) => ({
    id: `${sourcePrefix}-${index + 1}`,
    type: defaultType,
    content: sanitizeM06Text(content),
    sourceParaId: `${sourcePrefix}-${index + 1}`,
    isCore: index < 3,
    status: "draft",
  }))
}

export function buildReferenceContext(sources: M06Source[]) {
  return sources
    .filter((source) => source.title || source.content)
    .map((source, index) => {
      const similarity = typeof source.similarity === "number" ? `，相似度 ${source.similarity}%` : ""
      const sourceName = source.source ? `，来源：${sanitizeM06Text(source.source)}` : ""
      return `【参考 ${index + 1}${similarity}${sourceName}】${sanitizeM06Text(source.title)}\n${sanitizeM06Text(source.content)}`
    })
    .join("\n\n")
}

export function buildDisclosureTemplateHint() {
  return `结构化交底书必须覆盖：
1. 技术问题
2. 背景技术
3. 技术方案
4. 实施方式
5. 有益效果
6. 附图说明
7. 技术特征
8. 动作关系
9. 替代方案
10. 术语映射
11. 保护点`
}

export function buildM06ReportMarkdown(content: M06Content, title = "M06交底书报告") {
  const lines = [
    `# ${title}`,
    "",
    `案件：${content.meta.caseTitle || "未命名案件"}`,
    `专利类型：${content.meta.patentType || "未填写"}`,
    `质量分：${content.workflow.qualityScore || 0}`,
    "",
    "## 交底书章节",
    ...M06_SECTION_DEFS.flatMap((section) => [
      "",
      `### ${section.label}`,
      content.sections[section.key] || "未填写",
    ]),
    "",
    "## 技术特征",
    ...(content.structure.technicalFeatures.length
      ? content.structure.technicalFeatures.map((item) => `- ${item}`)
      : ["- 未填写"]),
    "",
    "## 区别特征",
    ...(content.structure.distinguishingFeatures.length
      ? content.structure.distinguishingFeatures.map((item) => `- ${item}`)
      : ["- 未填写"]),
    "",
    "## 保护点",
    ...(content.structure.protectionPoints.length
      ? content.structure.protectionPoints.map((item) => `- ${item}`)
      : ["- 未填写"]),
  ]

  if (content.figures.length) {
    lines.push("", "## 主要附图")
    content.figures.forEach((figure) => {
      lines.push("", `### ${figure.title}`, figure.description, "```mermaid", figure.mermaid, "```")
    })
  }

  return sanitizeM06Text(lines.join("\n"))
}

export const M06_AI_PROMPTS = {
  extract(sourceText: string, caseTitle?: string) {
    return `请从来源材料中抽取可写入交底书的信息，并只输出 JSON：
{
  "summary": "100-200字材料摘要",
  "sections": {
    "technicalProblem": "技术问题",
    "backgroundTechnology": "背景技术",
    "technicalSolution": "技术方案",
    "embodiments": "实施方式",
    "beneficialEffects": "有益效果",
    "drawings": "附图说明"
  },
  "technicalFeatures": ["技术特征1", "技术特征2"],
  "relations": ["动作关系1"],
  "distinguishingFeatures": ["区别特征1"],
  "alternatives": ["替代方案1"],
  "terminology": {"术语": "定义"},
  "protectionPoints": ["保护点1"]
}

案件：${sanitizeM06Text(caseTitle) || "未命名案件"}
${buildDisclosureTemplateHint()}

来源材料：
${sourceText}`
  },

  decompose(fullText: string) {
    return `请解构以下交底材料，并只输出 JSON：
{
  "summary": "100-200字解构摘要",
  "technicalFeatures": ["技术特征1", "技术特征2", "技术特征3"],
  "relations": ["特征A通过某动作影响特征B并产生某技术效果"],
  "distinguishingFeatures": ["区别特征1", "区别特征2"],
  "alternatives": ["替代方案1"],
  "terminology": {"术语": "定义"},
  "protectionPoints": ["保护点1", "保护点2"],
  "factNodes": [
    {"type": "technical-solution", "content": "事实节点内容", "sourceParaId": "AI-1", "isCore": true, "status": "draft"}
  ]
}

交底材料：
${fullText}`
  },

  supplement(section: M06SectionKey, existing: string, fullText: string, caseTitle?: string) {
    const label = M06_SECTION_LABELS[section]
    return `请补全交底书的“${label}”章节。要求：
1. 只基于已给事实补写，不编造不可验证参数。
2. 输出可直接写入交底书的中文段落。
3. 不要输出标题、列表编号或 Markdown。

案件：${sanitizeM06Text(caseTitle) || "未命名案件"}
当前章节内容：${existing || "暂无"}

完整上下文：
${fullText}`
  },

  initialInspection(question: string, referenceContext: string) {
    return `请基于参考资料完成专利新创性初检。输出包括：
1. 风险等级判断：低/中/高。
2. 相似点。
3. 可能区别点。
4. 建议补充的技术事实。

参考资料：
${referenceContext || "暂无高相关资料"}

检索问题：
${question}`
  },

  compare(fullText: string, referenceContext: string) {
    return `请做现有技术对比，并只输出 JSON：
{
  "summary": "对比结论摘要",
  "distinguishingFeatures": ["区别特征1", "区别特征2"],
  "risks": ["风险点1", "风险点2"],
  "suggestions": ["规避建议1", "规避建议2"]
}

本案交底：
${fullText}

参考文献：
${referenceContext || "暂无参考文献"}`
  },

  relation(fullText: string) {
    return `请基于交底书生成技术关系和结构化事实，并只输出 JSON：
{
  "summary": "关系建模摘要",
  "relations": ["特征A通过某动作影响特征B并产生某技术效果"],
  "alternatives": ["替代方案1"],
  "factNodes": [
    {"type": "relation", "content": "事实节点内容", "sourceParaId": "AI-R1", "isCore": true, "status": "draft"}
  ]
}

交底书：
${fullText}`
  },

  innovationIdeas(fullText: string, referenceContext: string) {
    return `请基于本案交底和参考资料生成可供工程师选择的创新思路，并只输出 JSON：
{
  "ideas": [
    {
      "title": "创新思路标题",
      "description": "该思路的技术内容",
      "basis": "来自交底材料或参考资料的依据",
      "riskLevel": "low"
    }
  ]
}

本案交底：
${fullText}

参考资料：
${referenceContext || "暂无参考资料"}`
  },

  figure(fullText: string) {
    return `请为本案生成一个主要附图草图，并只输出 JSON：
{
  "title": "系统结构图",
  "type": "system",
  "description": "图中模块和关系说明",
  "mermaid": "flowchart LR\\n  A[输入模块] --> B[处理模块]\\n  B --> C[输出模块]"
}

要求：
1. mermaid 使用 flowchart、sequenceDiagram 或 graph 语法。
2. 节点文字简短，避免过长。
3. 图必须表达核心技术模块、流程或动作关系。

交底书：
${fullText}`
  },

  validate(fullText: string) {
    return `请检查交底书是否满足提交 M07 的要求。输出中文结论，包含阻断项、风险项和修改建议。

交底书：
${fullText}`
  },

  package(fullText: string) {
    return `请生成提交给 M07 专利撰写模块的数据包摘要。必须包括：技术主题、核心技术特征、区别特征、保护重点、主要附图、待注意风险。输出中文分段文本，不要输出 JSON。

交底书：
${fullText}`
  },
}
