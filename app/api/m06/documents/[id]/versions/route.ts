import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { query } from "@/lib/db"
import { ensureKnowledgeSchema } from "@/lib/knowledge"
import { mergeM06Content, sanitizeM06Text, sanitizeM06Value } from "@/lib/m06"

interface RouteParams {
  params: Promise<{ id: string }>
}

async function getDocumentWithCase(documentId: string) {
  const result = await query(
    `SELECT d.id, d.case_id, d.content_json, d.ai_suggestions, d.status, d.version, d.created_at, d.updated_at,
            c.title, c.case_id as case_no, c.type, c.description, c.status as case_status,
            applicant.name as applicant_name,
            engineer.name as engineer_name,
            reviewer.name as reviewer_name
     FROM disclosure_documents d
     JOIN cases c ON c.id = d.case_id
     LEFT JOIN users applicant ON c.applicant_id = applicant.id
     LEFT JOIN users engineer ON c.engineer_id = engineer.id
     LEFT JOIN users reviewer ON c.reviewer_id = reviewer.id
     WHERE d.id = $1`,
    [documentId]
  )
  return result.rows[0] || null
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    await ensureKnowledgeSchema()
    const { id } = await params

    const result = await query(
      `SELECT v.id, v.document_id, v.version, v.action, v.content_json, v.ai_suggestions, v.created_at,
              u.name as created_by_name,
              v.content_json->'meta'->>'caseTitle' as case_title,
              v.content_json->'aiResults'->>'lastAction' as last_action
       FROM disclosure_document_versions v
       LEFT JOIN users u ON u.id = v.created_by
       WHERE v.document_id = $1
       ORDER BY v.created_at DESC`,
      [id]
    )

    return NextResponse.json(success({ list: sanitizeM06Value(result.rows) }))
  } catch (err: any) {
    console.error("获取版本历史失败:", err)
    return NextResponse.json(error("获取版本历史失败", 500))
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    await ensureKnowledgeSchema()
    const { id } = await params
    const { versionId } = await request.json()
    if (!versionId) return NextResponse.json(error("versionId 不能为空", 400))

    const version = await query(
      `SELECT id, document_id, content_json, ai_suggestions
       FROM disclosure_document_versions
       WHERE id = $1 AND document_id = $2`,
      [versionId, id]
    )
    if (!version.rows[0]) return NextResponse.json(error("版本不存在", 404))

    const updated = await query(
      `UPDATE disclosure_documents
       SET content_json = $1,
           ai_suggestions = $2,
           version = version + 1,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at`,
      [
        JSON.stringify(sanitizeM06Value(version.rows[0].content_json)),
        JSON.stringify(sanitizeM06Value(version.rows[0].ai_suggestions || {})),
        id,
      ]
    )

    await query(
      `INSERT INTO disclosure_document_versions (document_id, version, action, content_json, ai_suggestions, created_by)
       VALUES ($1, $2, 'restore', $3, $4, $5)`,
      [
        id,
        updated.rows[0].version,
        JSON.stringify(sanitizeM06Value(updated.rows[0].content_json)),
        JSON.stringify(sanitizeM06Value(updated.rows[0].ai_suggestions || {})),
        user.id,
      ]
    )

    const docWithCase = await getDocumentWithCase(id)
    const caseData = docWithCase
      ? {
          id: docWithCase.case_id,
          case_id: docWithCase.case_no,
          title: docWithCase.title,
          type: docWithCase.type,
          description: docWithCase.description,
          status: docWithCase.case_status,
          applicant_name: docWithCase.applicant_name,
          engineer_name: docWithCase.engineer_name,
          reviewer_name: docWithCase.reviewer_name,
        }
      : null

    return NextResponse.json(
      success({
        case: caseData,
        document: {
          ...updated.rows[0],
          content_json: mergeM06Content(updated.rows[0].content_json, caseData),
          ai_suggestions: sanitizeM06Value(updated.rows[0].ai_suggestions || {}),
        },
      }, "版本已恢复")
    )
  } catch (err: any) {
    console.error("恢复版本失败:", sanitizeM06Text(err.message))
    return NextResponse.json(error("恢复版本失败", 500))
  }
}
