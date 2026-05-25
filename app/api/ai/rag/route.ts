import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { aiService } from "@/lib/ai-service"
import { query } from "@/lib/db"
import { ensureKnowledgeSchema, getKnowledgeStats, searchKnowledge } from "@/lib/knowledge"
import { sanitizeM06Text } from "@/lib/m06"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const body = await request.json()
    const {
      question: rawQuestion,
      query: rawQuery,
      topK = 5,
      field,
      sourceTypes,
    } = body
    const question = rawQuestion || rawQuery

    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return NextResponse.json(error("问题不能为空", 400))
    }

    const sources = await searchKnowledge(question, {
      topK,
      field,
      sourceTypes: Array.isArray(sourceTypes) ? sourceTypes : undefined,
    })

    const context = sources
      .map((source, index) => {
        const similarity = Math.round(source.similarity * 100)
        return `【来源 ${index + 1} / 相似度 ${similarity}%】${source.title}
类型：${source.sourceType}
出处：${source.source}
内容：${source.content}`
      })
      .join("\n\n")

    const prompt = `请根据以下知识库分块回答问题。若来源不足，请明确说明不足，并给出下一步检索建议。

参考资料：
${context || "暂无高相关资料"}

用户问题：
${question}

请给出准确、结构化的中文回答，并在必要处引用来源编号。`

    const generateResult = await aiService.generate(prompt, {
      system: "你是专利知识库检索助手。只能基于提供的参考资料回答，不要编造来源中没有的信息。",
      temperature: 0.25,
      maxTokens: 2048,
    })

    return NextResponse.json(
      success({
        answer: sanitizeM06Text(generateResult.text),
        sources: sources.map((source) => ({
          ...source,
          similarity: Math.round(source.similarity * 100),
        })),
        stats: await getKnowledgeStats(),
        model: generateResult.model,
      })
    )
  } catch (err: any) {
    console.error("RAG 问答失败:", err)
    return NextResponse.json(error(`RAG 问答失败: ${sanitizeM06Text(err.message)}`, 500))
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    await ensureKnowledgeSchema()

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get("keyword")?.trim()
    const field = searchParams.get("field")
    const sourceType = searchParams.get("sourceType")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")))

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (keyword) {
      conditions.push(`(kb.title ILIKE $${paramIndex} OR kb.content ILIKE $${paramIndex} OR kb.source ILIKE $${paramIndex})`)
      params.push(`%${keyword}%`)
      paramIndex++
    }
    if (field) {
      conditions.push(`kb.field = $${paramIndex}`)
      params.push(field)
      paramIndex++
    }
    if (sourceType) {
      conditions.push(`kb.source_type = $${paramIndex}`)
      params.push(sourceType)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    const countResult = await query(`SELECT COUNT(*) FROM knowledge_base kb ${whereClause}`, params)
    const total = parseInt(countResult.rows[0].count)

    const dataParams = [...params, pageSize, (page - 1) * pageSize]
    const dataResult = await query(
      `SELECT kb.id, kb.field, kb.title, kb.content, kb.source, kb.source_type, kb.source_url, kb.created_at, kb.updated_at,
              COUNT(kc.id)::int AS chunk_count
       FROM knowledge_base kb
       LEFT JOIN knowledge_chunks kc ON kc.knowledge_id = kb.id
       ${whereClause}
       GROUP BY kb.id
       ORDER BY kb.updated_at DESC NULLS LAST, kb.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    )

    return NextResponse.json(
      success({
        list: dataResult.rows.map((row: any) => ({
          ...row,
          content: sanitizeM06Text(String(row.content || "").slice(0, 600)),
        })),
        total,
        page,
        pageSize,
        stats: await getKnowledgeStats(),
      })
    )
  } catch (err: any) {
    console.error("获取知识库失败:", err)
    return NextResponse.json(error(`获取知识库失败: ${sanitizeM06Text(err.message)}`, 500))
  }
}
