import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { query } from "@/lib/db"
import { aiService } from "@/lib/ai-service"
import {
  buildM06FullText,
  evaluateM06Completeness,
  isM06SectionKey,
  markM06StepCompleted,
  mergeM06Content,
  M06Content,
  M06Figure,
  M06InnovationIdea,
  M06SectionKey,
  M06Stage,
  sanitizeM06Text,
  sanitizeM06Value,
} from "@/lib/m06"
import {
  buildM06ReportMarkdown,
  buildReferenceContext,
  CompareJson,
  DecomposeJson,
  ExtractJson,
  FigureJson,
  InnovationIdeasJson,
  M06_AI_PROMPTS,
  M06_AI_SYSTEM_PROMPT,
  M06_JSON_SYSTEM_PROMPT,
  normalizeFactNodes,
  parseM06Json,
  RelationJson,
  textList,
} from "@/lib/m06-ai"
import { ensureKnowledgeSchema, searchKnowledge, sourceToM06Source } from "@/lib/knowledge"

async function getCase(caseId: string) {
  const result = await query(
    `SELECT c.*,
      applicant.name as applicant_name,
      engineer.name as engineer_name,
      reviewer.name as reviewer_name
     FROM cases c
     LEFT JOIN users applicant ON c.applicant_id = applicant.id
     LEFT JOIN users engineer ON c.engineer_id = engineer.id
     LEFT JOIN users reviewer ON c.reviewer_id = reviewer.id
     WHERE c.id = $1`,
    [caseId]
  )
  return result.rows[0] || null
}

async function getOrCreateDocument(caseData: any, documentId?: string) {
  if (documentId) {
    const byId = await query(
      `SELECT id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at
       FROM disclosure_documents WHERE id = $1 AND case_id = $2`,
      [documentId, caseData.id]
    )
    if (byId.rows[0]) return byId.rows[0]
  }

  const existing = await query(
    `SELECT id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at
     FROM disclosure_documents
     WHERE case_id = $1
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [caseData.id]
  )
  if (existing.rows[0]) return existing.rows[0]

  const content = mergeM06Content({}, caseData)
  const created = await query(
    `INSERT INTO disclosure_documents (case_id, content_json, ai_suggestions, status)
     VALUES ($1, $2, $3, 'draft')
     RETURNING id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at`,
    [caseData.id, JSON.stringify(content), JSON.stringify({})]
  )
  return created.rows[0]
}

async function createDisclosureVersion(
  documentId: string,
  version: number,
  action: string,
  content: M06Content,
  aiSuggestions: any,
  userId: string
) {
  await ensureKnowledgeSchema()
  await query(
    `INSERT INTO disclosure_document_versions (document_id, version, action, content_json, ai_suggestions, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      documentId,
      version,
      action,
      JSON.stringify(sanitizeM06Value(content)),
      JSON.stringify(sanitizeM06Value(aiSuggestions || {})),
      userId,
    ]
  )
}

async function saveDocument(
  documentId: string,
  content: M06Content,
  aiSuggestions: any,
  userId: string,
  action: string,
  status?: string
) {
  const cleanContent = sanitizeM06Value(content)
  const cleanSuggestions = sanitizeM06Value(aiSuggestions || {})
  const updates = [
    "content_json = $1",
    "ai_suggestions = $2",
    "version = version + 1",
    "updated_at = NOW()",
  ]
  const values: any[] = [JSON.stringify(cleanContent), JSON.stringify(cleanSuggestions)]
  let paramIndex = 3

  if (status) {
    updates.push(`status = $${paramIndex++}`)
    values.push(status)
  }

  values.push(documentId)
  const result = await query(
    `UPDATE disclosure_documents
     SET ${updates.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at`,
    values
  )

  const saved = result.rows[0]
  await createDisclosureVersion(documentId, saved.version, action, cleanContent, cleanSuggestions, userId)
  return saved
}

function linesFromText(text: string, fallback: string[], max = 8): string[] {
  return textList(text, fallback, max)
}

function inferKeywords(content: M06Content): string[] {
  const fromFeatures = content.structure.technicalFeatures
    .flatMap((item) => item.split(/[、，,；;\s]/))
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 16)

  const fromTitle = (content.meta.caseTitle || "")
    .split(/[、，,；;\s]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && item.length <= 16)

  return Array.from(new Set([...fromFeatures, ...fromTitle].map(sanitizeM06Text).filter(Boolean))).slice(0, 10)
}

async function ragSearch(question: string, topK = 5) {
  try {
    const sources = await searchKnowledge(question, { topK })
    const m06Sources = sources.map(sourceToM06Source)
    const generated = await aiService.generate(
      M06_AI_PROMPTS.initialInspection(question, buildReferenceContext(m06Sources)),
      {
        system: M06_AI_SYSTEM_PROMPT,
        temperature: 0.25,
        maxTokens: 1600,
      }
    )

    return {
      answer: sanitizeM06Text(generated.text) || "未生成检索总结，请检查 Ollama 模型状态。",
      sources: m06Sources,
    }
  } catch (err: any) {
    return {
      answer: `RAG 检索暂不可用：${sanitizeM06Text(err.message)}`,
      sources: [],
    }
  }
}

function withStage(content: M06Content, stage: M06Stage) {
  return markM06StepCompleted(
    {
      ...content,
      meta: {
        ...content.meta,
        currentStage: stage,
      },
    },
    stage
  )
}

function mergeExtractedSections(content: M06Content, parsed: Partial<ExtractJson>) {
  const sections = { ...content.sections }
  for (const section of Object.keys(parsed.sections || {})) {
    if (isM06SectionKey(section)) {
      const value = sanitizeM06Text(parsed.sections?.[section])
      if (value) sections[section] = value
    }
  }

  return {
    ...content,
    sections,
    structure: {
      ...content.structure,
      technicalFeatures: textList(parsed.technicalFeatures, content.structure.technicalFeatures, 10),
      relations: textList(parsed.relations, content.structure.relations, 10),
      distinguishingFeatures: textList(parsed.distinguishingFeatures, content.structure.distinguishingFeatures, 8),
      alternatives: textList(parsed.alternatives, content.structure.alternatives, 8),
      terminology: {
        ...content.structure.terminology,
        ...(parsed.terminology || {}),
      },
      protectionPoints: textList(parsed.protectionPoints, content.structure.protectionPoints, 8),
    },
  }
}

function fallbackFigure(content: M06Content): M06Figure {
  const features = content.structure.technicalFeatures.slice(0, 4)
  const nodes = features.length ? features : ["输入模块", "处理模块", "输出模块"]
  const lines = ["flowchart LR", ...nodes.map((node, index) => `  N${index + 1}[${node.slice(0, 18)}]`)]
  for (let index = 0; index < nodes.length - 1; index++) {
    lines.push(`  N${index + 1} --> N${index + 2}`)
  }

  return {
    id: `figure-${Date.now()}`,
    title: `${content.meta.caseTitle || "本案"}结构草图`,
    type: "system",
    mermaid: lines.join("\n"),
    description: "根据当前技术特征自动生成的系统结构草图，可继续编辑节点名称和关系。",
    createdAt: new Date().toISOString(),
  }
}

function normalizeIdeas(value: unknown, fallbackSources: any[] = []): M06InnovationIdea[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => ({
      id: sanitizeM06Text(item?.id) || `idea-${Date.now()}-${index + 1}`,
      title: sanitizeM06Text(item?.title) || `创新思路 ${index + 1}`,
      description: sanitizeM06Text(item?.description),
      basis: sanitizeM06Text(item?.basis),
      riskLevel: ["low", "medium", "high"].includes(item?.riskLevel) ? item.riskLevel : "medium",
      selected: Boolean(item?.selected),
      sources: fallbackSources,
      createdAt: new Date().toISOString(),
    }))
    .filter((idea) => idea.description || idea.basis)
}

async function recordM05Feedback(caseData: any, userId: string, result: string, notes: string) {
  const toStatus = result === "return-m05" ? "assigning" : result === "reject" ? "completed" : caseData.status
  await query(
    `INSERT INTO case_status_history (case_id, from_status, to_status, operator_id, remark)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      caseData.id,
      caseData.status,
      toStatus,
      userId,
      `M06 初检反馈：${notes || result}`,
    ]
  )

  if (toStatus !== caseData.status) {
    await query(`UPDATE cases SET status = $2, updated_at = NOW() WHERE id = $1`, [caseData.id, toStatus])
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const body = await request.json()
    const { caseId, documentId, action, input = {}, content: clientContent } = body

    if (!caseId) return NextResponse.json(error("caseId 不能为空", 400))
    if (!action) return NextResponse.json(error("action 不能为空", 400))

    const caseData = await getCase(caseId)
    if (!caseData) return NextResponse.json(error("案件不存在", 404))

    const document = await getOrCreateDocument(caseData, documentId)
    let content = mergeM06Content(clientContent ?? document.content_json, caseData)
    const aiSuggestions = sanitizeM06Value(document.ai_suggestions || {})
    let result: any = null
    let status: string | undefined

    if (action === "extract") {
      const sourceText =
        sanitizeM06Text(input.text) ||
        content.sourceMaterials.map((item) => `${item.name}\n${item.text}`).join("\n\n")
      if (!sourceText) return NextResponse.json(error("请先上传或输入来源材料", 400))

      const generated = await aiService.generate(
        M06_AI_PROMPTS.extract(sourceText, content.meta.caseTitle),
        { system: M06_JSON_SYSTEM_PROMPT, temperature: 0.15, maxTokens: 2200 }
      )
      const generatedText = sanitizeM06Text(generated.text)
      const parsed = parseM06Json<ExtractJson>(generatedText)
      content = withStage(
        mergeExtractedSections(content, parsed || { summary: generatedText }),
        "DECOMPOSITION"
      )
      content.aiResults.extraction = {
        summary: sanitizeM06Text(parsed?.summary) || generatedText,
        generatedAt: new Date().toISOString(),
      }
      result = content.aiResults.extraction
    } else if (action === "decompose") {
      const fullText = buildM06FullText(content)
      const generated = await aiService.generate(
        M06_AI_PROMPTS.decompose(fullText),
        { system: M06_JSON_SYSTEM_PROMPT, temperature: 0.15, maxTokens: 2000 }
      )
      const generatedText = sanitizeM06Text(generated.text)
      const parsed = parseM06Json<DecomposeJson>(generatedText)
      const fallback = linesFromText(content.sections.technicalSolution || content.sections.technicalProblem, content.structure.technicalFeatures)
      const features = textList(parsed?.technicalFeatures, fallback, 8)
      const relations = textList(parsed?.relations, content.structure.relations, 8)
      const distinctions = textList(parsed?.distinguishingFeatures, features.slice(0, 5), 6)
      const alternatives = textList(parsed?.alternatives, content.structure.alternatives, 6)
      const protectionPoints = textList(parsed?.protectionPoints, features.slice(0, 6), 6)
      const factNodes = normalizeFactNodes(parsed?.factNodes, features, "technical-solution", "AI", 10)

      content = withStage(
        {
          ...content,
          structure: {
            ...content.structure,
            technicalFeatures: features,
            relations,
            distinguishingFeatures: distinctions,
            alternatives,
            terminology: { ...content.structure.terminology, ...(parsed?.terminology || {}) },
            protectionPoints,
            factNodes,
          },
          aiResults: {
            ...content.aiResults,
            decomposition: {
              summary: sanitizeM06Text(parsed?.summary) || generatedText,
              generatedAt: new Date().toISOString(),
            },
          },
        },
        "DECOMPOSITION"
      )
      result = content.aiResults.decomposition
    } else if (action === "supplement") {
      const requestedSection = sanitizeM06Text(input.section)
      const section: M06SectionKey = isM06SectionKey(requestedSection) ? requestedSection : "technicalSolution"
      const generated = await aiService.generate(
        M06_AI_PROMPTS.supplement(section, content.sections[section] || "", buildM06FullText(content), content.meta.caseTitle),
        { system: M06_AI_SYSTEM_PROMPT, temperature: 0.3, maxTokens: 1800 }
      )
      const suggestion = sanitizeM06Text(generated.text)
      content = withStage(
        {
          ...content,
          sections: {
            ...content.sections,
            [section]: suggestion,
          },
          aiResults: {
            ...content.aiResults,
            supplement: {
              section,
              suggestion,
              generatedAt: new Date().toISOString(),
            },
          },
        },
        "SUPPLEMENT"
      )
      result = content.aiResults.supplement
    } else if (action === "initialInspection") {
      const keywords = textList(input.keywords, inferKeywords(content), 10)
      const question = `请检索并初步判断“${content.meta.caseTitle}”的新创性风险。关键词：${keywords.join("、")}。核心方案：${content.sections.technicalSolution || content.sections.technicalProblem}`
      const rag = await ragSearch(question, 6)
      const riskLevel = rag.sources.some((source) => (source.similarity || 0) >= 80)
        ? "high"
        : rag.sources.some((source) => (source.similarity || 0) >= 60)
          ? "medium"
          : "low"

      content = withStage(
        {
          ...content,
          aiResults: {
            ...content.aiResults,
            initialInspection: {
              answer: rag.answer,
              riskLevel,
              keywords,
              sources: rag.sources,
              generatedAt: new Date().toISOString(),
            },
          },
        },
        "AI_PRE_CHECK"
      )
      result = content.aiResults.initialInspection
    } else if (action === "secondSearch") {
      const queryText =
        sanitizeM06Text(input.query) ||
        `围绕${content.meta.caseTitle}进行二次检索，重点关注区别特征：${content.structure.distinguishingFeatures.join("、") || content.structure.technicalFeatures.join("、")}`
      const rag = await ragSearch(queryText, 8)
      content = withStage(
        {
          ...content,
          aiResults: {
            ...content.aiResults,
            secondSearch: {
              query: queryText,
              answer: rag.answer,
              sources: rag.sources,
              generatedAt: new Date().toISOString(),
            },
          },
        },
        "SECOND_SEARCH"
      )
      result = content.aiResults.secondSearch
    } else if (action === "compare") {
      const sources = content.aiResults.secondSearch?.sources || content.aiResults.initialInspection?.sources || []
      const generated = await aiService.generate(
        M06_AI_PROMPTS.compare(buildM06FullText(content), buildReferenceContext(sources)),
        { system: M06_JSON_SYSTEM_PROMPT, temperature: 0.2, maxTokens: 1800 }
      )
      const generatedText = sanitizeM06Text(generated.text)
      const parsed = parseM06Json<CompareJson>(generatedText)
      const risks = textList(parsed?.risks, [], 6)
      const suggestions = textList(parsed?.suggestions, [], 6)
      const distinctions = textList(parsed?.distinguishingFeatures, linesFromText(generatedText, content.structure.distinguishingFeatures, 8), 8)
      const summary = sanitizeM06Text(parsed?.summary) || generatedText

      content = withStage(
        {
          ...content,
          structure: {
            ...content.structure,
            distinguishingFeatures: distinctions,
          },
          aiResults: {
            ...content.aiResults,
            priorArtComparison: {
              summary,
              risks,
              suggestions,
              sources,
              generatedAt: new Date().toISOString(),
            },
          },
        },
        "COMPARE"
      )
      result = content.aiResults.priorArtComparison
    } else if (action === "relation" || action === "structure") {
      const generated = await aiService.generate(
        M06_AI_PROMPTS.relation(buildM06FullText(content)),
        { system: M06_JSON_SYSTEM_PROMPT, temperature: 0.2, maxTokens: 1700 }
      )
      const generatedText = sanitizeM06Text(generated.text)
      const parsed = parseM06Json<RelationJson>(generatedText)
      const fallbackLines = linesFromText(generatedText, content.structure.technicalFeatures, 10)
      const relations = textList(parsed?.relations, fallbackLines.slice(0, 6), 8)
      const alternatives = textList(parsed?.alternatives, fallbackLines.slice(6, 10), 6)
      const factNodes = normalizeFactNodes(parsed?.factNodes, [...relations, ...alternatives], action === "relation" ? "relation" : "technical-solution", "AI-R", 10)
      const stage = action === "relation" ? "RELATE" : "STRUCTURE"
      content = withStage(
        {
          ...content,
          structure: {
            ...content.structure,
            relations,
            alternatives,
            factNodes,
          },
          aiResults: {
            ...content.aiResults,
            relation: {
              summary: sanitizeM06Text(parsed?.summary) || generatedText,
              generatedAt: new Date().toISOString(),
            },
          },
        },
        stage
      )
      result = {
        relations: content.structure.relations,
        alternatives: content.structure.alternatives,
        factNodes: content.structure.factNodes,
        summary: content.aiResults.relation?.summary,
      }
    } else if (action === "innovationIdeas") {
      const queryText = `围绕${content.meta.caseTitle}和技术方案生成创新思路：${content.sections.technicalSolution || content.sections.technicalProblem}`
      const rag = await ragSearch(queryText, 5)
      const generated = await aiService.generate(
        M06_AI_PROMPTS.innovationIdeas(buildM06FullText(content), buildReferenceContext(rag.sources)),
        { system: M06_JSON_SYSTEM_PROMPT, temperature: 0.35, maxTokens: 1800 }
      )
      const parsed = parseM06Json<InnovationIdeasJson>(generated.text)
      const ideas = normalizeIdeas(parsed?.ideas, rag.sources)
      content = withStage(
        {
          ...content,
          innovationIdeas: ideas.length ? ideas : content.innovationIdeas,
          aiResults: {
            ...content.aiResults,
            innovationIdeas: {
              ideas: ideas.length ? ideas : content.innovationIdeas,
              generatedAt: new Date().toISOString(),
            },
          },
        },
        "SUPPLEMENT"
      )
      result = content.aiResults.innovationIdeas
    } else if (action === "figure") {
      const generated = await aiService.generate(
        M06_AI_PROMPTS.figure(buildM06FullText(content)),
        { system: M06_JSON_SYSTEM_PROMPT, temperature: 0.2, maxTokens: 1200 }
      )
      const parsed = parseM06Json<FigureJson>(generated.text)
      const figure: M06Figure = parsed?.mermaid
        ? {
            id: `figure-${Date.now()}`,
            title: sanitizeM06Text(parsed.title) || `${content.meta.caseTitle || "本案"}主要附图`,
            type: ["system", "flow", "relation", "other"].includes(parsed.type as string) ? parsed.type as M06Figure["type"] : "system",
            mermaid: sanitizeM06Text(parsed.mermaid),
            description: sanitizeM06Text(parsed.description),
            createdAt: new Date().toISOString(),
          }
        : fallbackFigure(content)

      content = withStage(
        {
          ...content,
          figures: [figure, ...content.figures.filter((item) => item.id !== figure.id)].slice(0, 8),
          sections: {
            ...content.sections,
            drawings: content.sections.drawings || `${figure.title}：${figure.description}`,
          },
          aiResults: {
            ...content.aiResults,
            figure: {
              figure,
              generatedAt: new Date().toISOString(),
            },
          },
        },
        "FINAL_DISCLOSURE"
      )
      result = content.aiResults.figure
    } else if (action === "detect") {
      const fullText = buildM06FullText(content)
      const detect = await aiService.detectAI(fullText)
      content = withStage(
        {
          ...content,
          aiResults: {
            ...content.aiResults,
            aiDetection: {
              aiRate: detect.aiRate,
              overallAssessment:
                detect.aiRate > 80 ? "高度疑似 AI 生成" : detect.aiRate > 50 ? "可能包含 AI 生成内容" : "人工改写痕迹较充分",
              flaggedSections: detect.flagged.map((fragment, index) => ({
                start: index,
                end: index + fragment.length,
                suggestion: sanitizeM06Text(fragment),
              })),
              generatedAt: new Date().toISOString(),
            },
          },
        },
        "VALIDATE"
      )
      result = content.aiResults.aiDetection
    } else if (action === "validate") {
      const validation = evaluateM06Completeness(content)
      content = withStage(
        {
          ...content,
          aiResults: {
            ...content.aiResults,
            completeness: validation,
          },
          workflow: {
            ...content.workflow,
            qualityScore: validation.score,
          },
        },
        "VALIDATE"
      )
      result = validation
    } else if (action === "package") {
      const validation = content.aiResults.completeness || evaluateM06Completeness(content)
      const generated = await aiService.generate(
        M06_AI_PROMPTS.package(buildM06FullText(content)),
        { system: M06_AI_SYSTEM_PROMPT, temperature: 0.2, maxTokens: 1600 }
      )
      const summary = sanitizeM06Text(generated.text)
      const markdown = buildM06ReportMarkdown(content, "M06提交M07数据包")
      content = withStage(
        {
          ...content,
          aiResults: {
            ...content.aiResults,
            completeness: validation,
            package: {
              summary,
              markdown,
              generatedAt: new Date().toISOString(),
            },
          },
          workflow: {
            ...content.workflow,
            qualityScore: validation.score,
          },
        },
        "PACKAGE"
      )
      status = validation.passed ? "completed" : "generating"
      result = content.aiResults.package
    } else if (action === "exportReport") {
      const markdown = buildM06ReportMarkdown(content, sanitizeM06Text(input.title) || "M06交底书报告")
      const record = {
        id: `export-${Date.now()}`,
        type: "report" as const,
        filename: `${content.meta.caseNo || "M06"}-交底书报告.md`,
        summary: "交底书 Markdown 报告",
        createdAt: new Date().toISOString(),
      }
      content = {
        ...content,
        exports: [record, ...content.exports].slice(0, 20),
        aiResults: {
          ...content.aiResults,
          exportReport: {
            markdown,
            generatedAt: new Date().toISOString(),
          },
        },
      }
      result = { markdown, record }
    } else if (action === "feedbackM05") {
      const judgmentResult = ["pass", "supplement", "return-m05", "reject"].includes(input.result)
        ? input.result
        : "supplement"
      const notes = sanitizeM06Text(input.notes) || "工程师已完成 M06 初检反馈"
      content = {
        ...content,
        judgment: {
          result: judgmentResult,
          notes,
          updatedAt: new Date().toISOString(),
          updatedBy: user.name,
        },
      }
      await recordM05Feedback(caseData, user.id, judgmentResult, notes)
      result = content.judgment
    } else {
      return NextResponse.json(error(`不支持的 M06 AI 动作: ${action}`, 400))
    }

    result = sanitizeM06Value(result)
    const saved = await saveDocument(
      document.id,
      content,
      {
        ...aiSuggestions,
        lastAction: action,
        lastResult: result,
        updatedAt: new Date().toISOString(),
      },
      user.id,
      action,
      status
    )

    const refreshedCase = await getCase(caseId)

    return NextResponse.json(
      success({
        case: refreshedCase || caseData,
        document: {
          ...saved,
          content_json: mergeM06Content(saved.content_json, refreshedCase || caseData),
          ai_suggestions: sanitizeM06Value(saved.ai_suggestions || {}),
        },
        result,
      })
    )
  } catch (err: any) {
    console.error("M06 AI 动作失败:", sanitizeM06Text(err.message))
    return NextResponse.json(error(sanitizeM06Text(err.message) || "M06 AI 动作失败", 500))
  }
}
