import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import {
  harvestCrossrefWorks,
  harvestOpenAlexWorks,
  harvestPatentsViewWorks,
  harvestSemanticScholarWorks,
  sanitizeKnowledgeText,
  upsertKnowledgeDocument,
} from "@/lib/knowledge"
import { sanitizeM06Text } from "@/lib/m06"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const body = await request.json()
    const { field, title, content, source, sourceType, sourceUrl, metadata } = body

    if (!field || !title || !content) {
      return NextResponse.json(error("领域、标题、内容不能为空", 400))
    }

    const result = await upsertKnowledgeDocument({
      field: sanitizeKnowledgeText(field),
      title: sanitizeKnowledgeText(title),
      content: sanitizeKnowledgeText(content),
      source: sanitizeKnowledgeText(source) || sanitizeKnowledgeText(title),
      sourceType: sourceType || "other",
      sourceUrl,
      metadata,
    })

    return NextResponse.json(success(result, "知识文档已写入并完成分块向量化"))
  } catch (err: any) {
    console.error("写入知识库失败:", err)
    return NextResponse.json(error(`写入知识库失败: ${sanitizeM06Text(err.message)}`, 500))
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const body = await request.json()
    const { query, topic, field = "通用", limit = 8, providers = ["openalex"] } = body
    const searchQuery = query || topic

    if (!searchQuery || typeof searchQuery !== "string") {
      return NextResponse.json(error("query/topic 不能为空", 400))
    }

    const results: any[] = []
    const providerSet = new Set(Array.isArray(providers) ? providers : [providers])

    if (providerSet.has("openalex")) {
      results.push(...await harvestOpenAlexWorks(searchQuery, field, limit))
    }
    if (providerSet.has("crossref")) {
      results.push(...await harvestCrossrefWorks(searchQuery, field, limit))
    }
    if (providerSet.has("semantic-scholar")) {
      results.push(...await harvestSemanticScholarWorks(searchQuery, field, limit))
    }
    if (providerSet.has("patentsview")) {
      results.push(...await harvestPatentsViewWorks(searchQuery, field, limit))
    }

    return NextResponse.json(success({ results, total: results.length }, "公开知识元数据已采集"))
  } catch (err: any) {
    console.error("采集公开知识元数据失败:", err)
    return NextResponse.json(error(`采集公开知识元数据失败: ${sanitizeM06Text(err.message)}`, 500))
  }
}
