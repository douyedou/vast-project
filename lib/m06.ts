import { sanitizeDeep, sanitizeDisplayText } from "@/lib/text-sanitize"

export type M06Stage =
  | "DECOMPOSITION"
  | "AI_PRE_CHECK"
  | "SUPPLEMENT"
  | "FINAL_DISCLOSURE"
  | "SECOND_SEARCH"
  | "COMPARE"
  | "RELATE"
  | "STRUCTURE"
  | "VALIDATE"
  | "PACKAGE"
  | "SUBMIT"
  | "VERSION_LOGS"

export type M06SectionKey =
  | "technicalProblem"
  | "backgroundTechnology"
  | "technicalSolution"
  | "embodiments"
  | "beneficialEffects"
  | "drawings"

export interface M06Sections {
  technicalProblem: string
  backgroundTechnology: string
  technicalSolution: string
  embodiments: string
  beneficialEffects: string
  drawings: string
}

export interface M06StructureNode {
  id: string
  type: string
  content: string
  sourceParaId?: string
  isCore?: boolean
  status?: "draft" | "confirmed"
}

export interface M06Structure {
  technicalFeatures: string[]
  relations: string[]
  distinguishingFeatures: string[]
  alternatives: string[]
  terminology: Record<string, string>
  protectionPoints: string[]
  factNodes: M06StructureNode[]
}

export interface M06Source {
  id?: string
  title: string
  content: string
  similarity?: number
  source?: string
  sourceType?: string
  url?: string
}

export interface M06SourceMaterial {
  id: string
  type: "text" | "image" | "file" | "url"
  name: string
  mimeType?: string
  source?: string
  text: string
  summary?: string
  targetSection?: M06SectionKey
  createdAt: string
}

export interface M06InnovationIdea {
  id: string
  title: string
  description: string
  basis: string
  riskLevel: "low" | "medium" | "high"
  selected?: boolean
  sources?: M06Source[]
  createdAt: string
}

export interface M06Figure {
  id: string
  title: string
  type: "system" | "flow" | "relation" | "other"
  mermaid: string
  description: string
  createdAt: string
}

export interface M06Judgment {
  result: "pass" | "supplement" | "return-m05" | "reject"
  notes: string
  updatedAt: string
  updatedBy?: string
}

export interface M06ExportRecord {
  id: string
  type: "json" | "markdown" | "docx" | "report"
  filename: string
  summary?: string
  createdAt: string
}

export interface M06AiResults {
  extraction?: {
    summary: string
    generatedAt: string
  }
  decomposition?: {
    summary: string
    generatedAt: string
  }
  initialInspection?: {
    answer: string
    riskLevel: "low" | "medium" | "high"
    keywords: string[]
    sources: M06Source[]
    generatedAt: string
  }
  supplement?: {
    section: M06SectionKey
    suggestion: string
    generatedAt: string
  }
  secondSearch?: {
    query: string
    answer: string
    sources: M06Source[]
    generatedAt: string
  }
  priorArtComparison?: {
    summary: string
    risks?: string[]
    suggestions?: string[]
    sources?: M06Source[]
    generatedAt: string
  }
  relation?: {
    summary: string
    generatedAt: string
  }
  innovationIdeas?: {
    ideas: M06InnovationIdea[]
    generatedAt: string
  }
  figure?: {
    figure: M06Figure
    generatedAt: string
  }
  completeness?: M06ValidationResult
  package?: {
    summary: string
    markdown?: string
    generatedAt: string
  }
  exportReport?: {
    markdown: string
    generatedAt: string
  }
  aiDetection?: {
    aiRate: number
    overallAssessment: string
    flaggedSections: any[]
    generatedAt: string
  }
}

export interface M06Workflow {
  completedSteps: M06Stage[]
  qualityScore: number
  submittedToM07: boolean
  submittedAt?: string
}

export interface M06Content {
  meta: {
    patentType: string
    modelMode: string
    currentStage: M06Stage
    caseTitle?: string
    caseNo?: string
  }
  sections: M06Sections
  structure: M06Structure
  sourceMaterials: M06SourceMaterial[]
  innovationIdeas: M06InnovationIdea[]
  figures: M06Figure[]
  judgment?: M06Judgment
  exports: M06ExportRecord[]
  aiResults: M06AiResults
  workflow: M06Workflow
}

export interface M06ValidationIssue {
  id: string
  severity: "blocking" | "warning" | "info"
  title: string
  description: string
  target?: string
}

export interface M06ValidationResult {
  score: number
  passed: boolean
  issues: M06ValidationIssue[]
  generatedAt: string
}

export const M06_SECTION_DEFS: Array<{
  key: M06SectionKey
  label: string
  placeholder: string
  minLength: number
}> = [
  {
    key: "technicalProblem",
    label: "技术问题",
    placeholder: "说明现有技术中待解决的技术问题、痛点和约束条件。",
    minLength: 30,
  },
  {
    key: "backgroundTechnology",
    label: "背景技术",
    placeholder: "概述现有方案、相关系统结构和不足。",
    minLength: 30,
  },
  {
    key: "technicalSolution",
    label: "技术方案",
    placeholder: "描述核心技术构成、模块、步骤、数据流或控制逻辑。",
    minLength: 50,
  },
  {
    key: "embodiments",
    label: "实施方式",
    placeholder: "写明可落地的实施例、流程、参数、装置连接关系。",
    minLength: 40,
  },
  {
    key: "beneficialEffects",
    label: "有益效果",
    placeholder: "说明相比现有技术的效果、性能提升和可验证指标。",
    minLength: 25,
  },
  {
    key: "drawings",
    label: "附图说明",
    placeholder: "列出系统结构图、流程图、模块图等附图及说明。",
    minLength: 10,
  },
]

export const M06_STAGE_ROUTES: Record<M06Stage, string> = {
  DECOMPOSITION: "m06-p02-decomposition",
  AI_PRE_CHECK: "m06-p03-ai-inspection",
  SUPPLEMENT: "m06-p04-supplement",
  FINAL_DISCLOSURE: "m06-p05-final-disclosure",
  SECOND_SEARCH: "m06-p06-second-search",
  COMPARE: "m06-p07-prior-art",
  RELATE: "m06-p08-relation-mapping",
  STRUCTURE: "m06-p09-assets",
  VALIDATE: "m06-p10-quality",
  PACKAGE: "m06-p11-package",
  SUBMIT: "m06-p12-submit",
  VERSION_LOGS: "m06-p13-version",
}

export const M06_STAGE_LABELS: Record<M06Stage, string> = {
  DECOMPOSITION: "交底书解构",
  AI_PRE_CHECK: "AI初检",
  SUPPLEMENT: "交底补全",
  FINAL_DISCLOSURE: "完整交底",
  SECOND_SEARCH: "二次检索",
  COMPARE: "现有技术对比",
  RELATE: "关系建模",
  STRUCTURE: "事实结构化",
  VALIDATE: "完整性校验",
  PACKAGE: "数据包生成",
  SUBMIT: "提交M07",
  VERSION_LOGS: "版本日志",
}

export const M06_STAGE_STEP: Record<M06Stage, number> = {
  DECOMPOSITION: 1,
  AI_PRE_CHECK: 2,
  SUPPLEMENT: 3,
  FINAL_DISCLOSURE: 4,
  SECOND_SEARCH: 5,
  COMPARE: 6,
  RELATE: 7,
  STRUCTURE: 8,
  VALIDATE: 9,
  PACKAGE: 10,
  SUBMIT: 11,
  VERSION_LOGS: 12,
}

export function sanitizeM06Text(value: unknown): string {
  return sanitizeDisplayText(value)
}

export function sanitizeM06Value<T>(value: T): T {
  return sanitizeDeep(value)
}

export function isM06SectionKey(value: unknown): value is M06SectionKey {
  return M06_SECTION_DEFS.some((section) => section.key === value)
}

function mapPatentType(type?: string): string {
  const types: Record<string, string> = {
    invention: "发明",
    utility: "实用新型",
    design: "外观设计",
  }
  return types[type || ""] || sanitizeM06Text(type) || "发明"
}

function toStringValue(value: unknown): string {
  return sanitizeM06Text(value)
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map((item) => sanitizeM06Text(item)).filter(Boolean)))
}

function normalizeSources(value: unknown): M06Source[] {
  if (!Array.isArray(value)) return []
  return value
    .map((source) => ({
      id: toStringValue(source?.id) || undefined,
      title: toStringValue(source?.title),
      content: toStringValue(source?.content),
      similarity: typeof source?.similarity === "number" ? source.similarity : undefined,
      source: toStringValue(source?.source) || undefined,
      sourceType: toStringValue(source?.sourceType) || undefined,
      url: toStringValue(source?.url) || undefined,
    }))
    .filter((source) => source.title || source.content)
}

function normalizeSourceMaterials(value: unknown): M06SourceMaterial[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => ({
      id: toStringValue(item?.id) || `source-${index + 1}`,
      type: ["text", "image", "file", "url"].includes(item?.type) ? item.type : "text",
      name: toStringValue(item?.name) || `来源材料 ${index + 1}`,
      mimeType: toStringValue(item?.mimeType) || undefined,
      source: toStringValue(item?.source) || undefined,
      text: toStringValue(item?.text),
      summary: toStringValue(item?.summary) || undefined,
      targetSection: isM06SectionKey(item?.targetSection) ? item.targetSection : undefined,
      createdAt: toStringValue(item?.createdAt) || new Date().toISOString(),
    }))
    .filter((item) => item.text || item.source)
}

function normalizeIdeas(value: unknown): M06InnovationIdea[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => ({
      id: toStringValue(item?.id) || `idea-${index + 1}`,
      title: toStringValue(item?.title) || `创新思路 ${index + 1}`,
      description: toStringValue(item?.description),
      basis: toStringValue(item?.basis),
      riskLevel: ["low", "medium", "high"].includes(item?.riskLevel) ? item.riskLevel : "medium",
      selected: Boolean(item?.selected),
      sources: normalizeSources(item?.sources),
      createdAt: toStringValue(item?.createdAt) || new Date().toISOString(),
    }))
    .filter((item) => item.description || item.basis)
}

function normalizeFigures(value: unknown): M06Figure[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => ({
      id: toStringValue(item?.id) || `figure-${index + 1}`,
      title: toStringValue(item?.title) || `主要附图 ${index + 1}`,
      type: ["system", "flow", "relation", "other"].includes(item?.type) ? item.type : "system",
      mermaid: toStringValue(item?.mermaid),
      description: toStringValue(item?.description),
      createdAt: toStringValue(item?.createdAt) || new Date().toISOString(),
    }))
    .filter((item) => item.mermaid || item.description)
}

function normalizeExports(value: unknown): M06ExportRecord[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => ({
      id: toStringValue(item?.id) || `export-${index + 1}`,
      type: ["json", "markdown", "docx", "report"].includes(item?.type) ? item.type : "markdown",
      filename: toStringValue(item?.filename) || `M06导出-${index + 1}`,
      summary: toStringValue(item?.summary) || undefined,
      createdAt: toStringValue(item?.createdAt) || new Date().toISOString(),
    }))
    .filter((item) => item.filename)
}

function seedListFromText(text: string, fallback: string[]): string[] {
  const normalized = sanitizeM06Text(text).replace(/\s+/g, " ").trim()
  if (!normalized) return fallback
  const chunks = normalized
    .split(/[。；;,.，\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 6)
  return Array.from(new Set(chunks.length ? chunks : [normalized])).slice(0, 6)
}

export function createDefaultM06Content(caseData?: any): M06Content {
  const title = sanitizeM06Text(caseData?.title) || "未命名专利案件"
  const description = sanitizeM06Text(caseData?.description)
  const problemSeed =
    description || `${title}需要明确现有技术缺陷、核心改进点和可保护的技术特征。`

  return {
    meta: {
      patentType: mapPatentType(caseData?.type),
      modelMode: "standard",
      currentStage: "DECOMPOSITION",
      caseTitle: title,
      caseNo: sanitizeM06Text(caseData?.case_id),
    },
    sections: {
      technicalProblem: problemSeed,
      backgroundTechnology: description ? `现有方案与本案相关，但仍存在需要改进的技术问题：${description}` : "",
      technicalSolution: "",
      embodiments: "",
      beneficialEffects: "",
      drawings: "",
    },
    structure: {
      technicalFeatures: seedListFromText(description || title, ["核心模块", "处理流程", "控制策略"]),
      relations: [],
      distinguishingFeatures: [],
      alternatives: [],
      terminology: {},
      protectionPoints: [],
      factNodes: [],
    },
    sourceMaterials: [],
    innovationIdeas: [],
    figures: [],
    exports: [],
    aiResults: {},
    workflow: {
      completedSteps: [],
      qualityScore: 0,
      submittedToM07: false,
    },
  }
}

export function mergeM06Content(raw: any, caseData?: any): M06Content {
  const base = createDefaultM06Content(caseData)
  const source = raw && typeof raw === "object" ? sanitizeM06Value(raw) : {}
  const meta = source.meta && typeof source.meta === "object" ? source.meta : {}
  const sections = source.sections && typeof source.sections === "object" ? source.sections : {}
  const structure = source.structure && typeof source.structure === "object" ? source.structure : {}
  const workflow = source.workflow && typeof source.workflow === "object" ? source.workflow : {}

  return {
    meta: {
      ...base.meta,
      ...meta,
      patentType: toStringValue(meta.patentType) || base.meta.patentType,
      modelMode: toStringValue(meta.modelMode) || base.meta.modelMode,
      currentStage: (meta.currentStage as M06Stage) || base.meta.currentStage,
      caseTitle: toStringValue(meta.caseTitle) || base.meta.caseTitle,
      caseNo: toStringValue(meta.caseNo) || base.meta.caseNo,
    },
    sections: {
      technicalProblem: toStringValue(sections.technicalProblem) || base.sections.technicalProblem,
      backgroundTechnology: toStringValue(sections.backgroundTechnology) || base.sections.backgroundTechnology,
      technicalSolution: toStringValue(sections.technicalSolution) || base.sections.technicalSolution,
      embodiments: toStringValue(sections.embodiments) || base.sections.embodiments,
      beneficialEffects: toStringValue(sections.beneficialEffects) || base.sections.beneficialEffects,
      drawings: toStringValue(sections.drawings) || base.sections.drawings,
    },
    structure: {
      technicalFeatures: toStringArray(structure.technicalFeatures).length
        ? toStringArray(structure.technicalFeatures)
        : base.structure.technicalFeatures,
      relations: toStringArray(structure.relations),
      distinguishingFeatures: toStringArray(structure.distinguishingFeatures),
      alternatives: toStringArray(structure.alternatives),
      terminology:
        structure.terminology && typeof structure.terminology === "object"
          ? sanitizeM06Value(structure.terminology)
          : {},
      protectionPoints: toStringArray(structure.protectionPoints),
      factNodes: Array.isArray(structure.factNodes)
        ? structure.factNodes
            .map((node: any, index: number) => ({
              id: toStringValue(node?.id) || `node-${index + 1}`,
              type: toStringValue(node?.type) || "technical-solution",
              content: toStringValue(node?.content),
              sourceParaId: toStringValue(node?.sourceParaId) || undefined,
              isCore: Boolean(node?.isCore),
              status: node?.status === "confirmed" ? "confirmed" : "draft",
            }))
            .filter((node: M06StructureNode) => node.content)
        : [],
    },
    sourceMaterials: normalizeSourceMaterials(source.sourceMaterials),
    innovationIdeas: normalizeIdeas(source.innovationIdeas),
    figures: normalizeFigures(source.figures),
    judgment: source.judgment
      ? {
          result: ["pass", "supplement", "return-m05", "reject"].includes(source.judgment.result)
            ? source.judgment.result
            : "supplement",
          notes: toStringValue(source.judgment.notes),
          updatedAt: toStringValue(source.judgment.updatedAt) || new Date().toISOString(),
          updatedBy: toStringValue(source.judgment.updatedBy) || undefined,
        }
      : undefined,
    exports: normalizeExports(source.exports),
    aiResults: sanitizeM06Value(source.aiResults || {}),
    workflow: {
      completedSteps: Array.isArray(workflow.completedSteps) ? workflow.completedSteps : [],
      qualityScore:
        typeof workflow.qualityScore === "number" ? workflow.qualityScore : base.workflow.qualityScore,
      submittedToM07: Boolean(workflow.submittedToM07),
      submittedAt: toStringValue(workflow.submittedAt) || undefined,
    },
  }
}

export function markM06StepCompleted(content: M06Content, stage: M06Stage): M06Content {
  const completedSteps = Array.from(new Set([...(content.workflow.completedSteps || []), stage]))
  return {
    ...content,
    meta: {
      ...content.meta,
      currentStage: stage,
    },
    workflow: {
      ...content.workflow,
      completedSteps,
    },
  }
}

export function buildM06FullText(content: M06Content): string {
  const sections = M06_SECTION_DEFS.map(({ key, label }) => {
    const value = content.sections[key]?.trim()
    return value ? `【${label}】\n${value}` : ""
  }).filter(Boolean)

  const sourceMaterials = content.sourceMaterials.length
    ? [
        "【来源材料】",
        ...content.sourceMaterials.slice(0, 8).map((item) => `- ${item.name}: ${item.summary || item.text.slice(0, 500)}`),
      ].join("\n")
    : ""

  const structureLines = [
    content.structure.technicalFeatures.length
      ? `【技术特征】\n${content.structure.technicalFeatures.map((item) => `- ${item}`).join("\n")}`
      : "",
    content.structure.relations.length
      ? `【动作关系】\n${content.structure.relations.map((item) => `- ${item}`).join("\n")}`
      : "",
    content.structure.distinguishingFeatures.length
      ? `【区别特征】\n${content.structure.distinguishingFeatures.map((item) => `- ${item}`).join("\n")}`
      : "",
    content.structure.protectionPoints.length
      ? `【保护点】\n${content.structure.protectionPoints.map((item) => `- ${item}`).join("\n")}`
      : "",
    sourceMaterials,
  ].filter(Boolean)

  return [...sections, ...structureLines].join("\n\n")
}

export function evaluateM06Completeness(content: M06Content): M06ValidationResult {
  const issues: M06ValidationIssue[] = []
  let score = 100

  for (const def of M06_SECTION_DEFS) {
    const text = content.sections[def.key]?.trim() || ""
    if (!text) {
      issues.push({
        id: `missing-${def.key}`,
        severity: "blocking",
        title: `${def.label}为空`,
        description: `请补充${def.label}，否则无法形成可撰写交底包。`,
        target: def.key,
      })
      score -= 15
    } else if (text.length < def.minLength) {
      issues.push({
        id: `short-${def.key}`,
        severity: "warning",
        title: `${def.label}内容偏少`,
        description: `建议至少补充到 ${def.minLength} 字以上，当前约 ${text.length} 字。`,
        target: def.key,
      })
      score -= 6
    }
  }

  if (content.structure.technicalFeatures.length < 3) {
    issues.push({
      id: "few-features",
      severity: "warning",
      title: "技术特征不足",
      description: "建议提炼至少 3 个技术特征，便于后续权利要求撰写。",
      target: "technicalFeatures",
    })
    score -= 8
  }

  if (content.structure.protectionPoints.length === 0) {
    issues.push({
      id: "missing-protection-points",
      severity: "warning",
      title: "缺少保护点",
      description: "请补充核心保护点，或由 AI 生成建议后采纳。",
      target: "protectionPoints",
    })
    score -= 8
  }

  if (!content.aiResults.secondSearch?.sources?.length) {
    issues.push({
      id: "missing-second-search",
      severity: "info",
      title: "尚未完成二次检索",
      description: "建议在提交 M07 前执行二次检索并形成参考来源。",
      target: "secondSearch",
    })
    score -= 4
  }

  if (!content.figures.length && !content.sections.drawings.trim()) {
    issues.push({
      id: "missing-figure",
      severity: "info",
      title: "尚未生成主要附图",
      description: "可在交底书引擎内生成系统结构图、流程图或动作关系图草图。",
      target: "figures",
    })
    score -= 3
  }

  const normalizedScore = Math.max(0, Math.min(100, score))
  return {
    score: normalizedScore,
    passed: !issues.some((item) => item.severity === "blocking") && normalizedScore >= 70,
    issues,
    generatedAt: new Date().toISOString(),
  }
}

export function getM06RiskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 85) return "low"
  if (score >= 70) return "medium"
  return "high"
}
