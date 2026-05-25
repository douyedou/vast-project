import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { query } from "@/lib/db"
import { createDefaultM06Content, mergeM06Content, sanitizeM06Text, sanitizeM06Value } from "@/lib/m06"
import { ensureKnowledgeSchema } from "@/lib/knowledge"

interface RouteParams {
  params: Promise<{ id: string }>
}

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

async function getLatestDisclosure(caseId: string) {
  const result = await query(
    `SELECT id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at
     FROM disclosure_documents
     WHERE case_id = $1
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [caseId]
  )
  return result.rows[0] || null
}

async function ensureDisclosure(caseData: any) {
  const existing = await getLatestDisclosure(caseData.id)
  if (existing) return existing

  const content = createDefaultM06Content(caseData)
  const result = await query(
    `INSERT INTO disclosure_documents (case_id, content_json, ai_suggestions, status)
     VALUES ($1, $2, $3, 'draft')
     RETURNING id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at`,
    [caseData.id, JSON.stringify(content), JSON.stringify({})]
  )
  return result.rows[0]
}

async function createVersion(document: any, action: string, userId: string) {
  await ensureKnowledgeSchema()
  await query(
    `INSERT INTO disclosure_document_versions (document_id, version, action, content_json, ai_suggestions, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      document.id,
      document.version,
      action,
      JSON.stringify(sanitizeM06Value(document.content_json || {})),
      JSON.stringify(sanitizeM06Value(document.ai_suggestions || {})),
      userId,
    ]
  )
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const shouldEnsure = searchParams.get("ensure") === "1"

    const caseData = await getCase(id)
    if (!caseData) return NextResponse.json(error("案件不存在", 404))

    const document = shouldEnsure
      ? await ensureDisclosure(caseData)
      : await getLatestDisclosure(id)

    if (!document) return NextResponse.json(error("交底书不存在", 404))

    return NextResponse.json(
      success({
        case: caseData,
        document: {
          ...document,
          content_json: mergeM06Content(document.content_json, caseData),
          ai_suggestions: sanitizeM06Value(document.ai_suggestions || {}),
        },
      })
    )
  } catch (err: any) {
    console.error("获取案件交底书失败:", sanitizeM06Text(err.message))
    return NextResponse.json(error("获取案件交底书失败", 500))
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const { id } = await params
    const body = await request.json()
    const { contentJson, aiSuggestions, status, action = "save" } = body

    const caseData = await getCase(id)
    if (!caseData) return NextResponse.json(error("案件不存在", 404))

    const existing = await ensureDisclosure(caseData)
    const nextContent = mergeM06Content(contentJson ?? existing.content_json, caseData)
    const nextSuggestions = sanitizeM06Value(aiSuggestions ?? existing.ai_suggestions ?? {})

    const updates: string[] = ["content_json = $1", "ai_suggestions = $2", "version = version + 1", "updated_at = NOW()"]
    const values: any[] = [JSON.stringify(sanitizeM06Value(nextContent)), JSON.stringify(nextSuggestions)]
    let paramIndex = 3

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(status)
    }

    values.push(existing.id)

    const result = await query(
      `UPDATE disclosure_documents
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at`,
      values
    )
    const saved = result.rows[0]
    await createVersion(saved, sanitizeM06Text(action) || "save", user.id)

    return NextResponse.json(
      success({
        case: caseData,
        document: {
          ...saved,
          content_json: mergeM06Content(saved.content_json, caseData),
          ai_suggestions: sanitizeM06Value(saved.ai_suggestions || {}),
        },
      }, "保存成功")
    )
  } catch (err: any) {
    console.error("保存案件交底书失败:", sanitizeM06Text(err.message))
    return NextResponse.json(error("保存案件交底书失败", 500))
  }
}
