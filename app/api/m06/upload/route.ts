import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { handleUpload } from "@/lib/upload"
import { parseFile } from "@/lib/file-parser"
import { query } from "@/lib/db"
import {
  isM06SectionKey,
  mergeM06Content,
  M06Content,
  M06SourceMaterial,
  sanitizeM06Text,
  sanitizeM06Value,
} from "@/lib/m06"
import { ensureKnowledgeSchema } from "@/lib/knowledge"

async function getCase(caseId: string) {
  const result = await query(`SELECT * FROM cases WHERE id = $1`, [caseId])
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
     FROM disclosure_documents WHERE case_id = $1
     ORDER BY updated_at DESC, created_at DESC LIMIT 1`,
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

function applyMaterial(content: M06Content, material: M06SourceMaterial) {
  const nextContent = {
    ...content,
    sourceMaterials: [material, ...content.sourceMaterials.filter((item) => item.id !== material.id)].slice(0, 50),
  }

  if (material.targetSection && material.text) {
    nextContent.sections = {
      ...nextContent.sections,
      [material.targetSection]: [nextContent.sections[material.targetSection], material.text]
        .filter(Boolean)
        .join("\n\n"),
    }
  }

  return nextContent
}

async function persistMaterial(
  caseId: string | null,
  documentId: string | null,
  material: M06SourceMaterial,
  userId: string
) {
  if (!caseId) return null

  await ensureKnowledgeSchema()
  const caseData = await getCase(caseId)
  if (!caseData) throw new Error("案件不存在")
  const document = await getOrCreateDocument(caseData, documentId || undefined)
  const content = applyMaterial(mergeM06Content(document.content_json, caseData), material)

  const updated = await query(
    `UPDATE disclosure_documents
     SET content_json = $1,
         version = version + 1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at`,
    [JSON.stringify(sanitizeM06Value(content)), document.id]
  )

  await query(
    `INSERT INTO disclosure_document_versions (document_id, version, action, content_json, ai_suggestions, created_by)
     VALUES ($1, $2, 'upload', $3, $4, $5)`,
    [
      updated.rows[0].id,
      updated.rows[0].version,
      JSON.stringify(sanitizeM06Value(updated.rows[0].content_json)),
      JSON.stringify(sanitizeM06Value(updated.rows[0].ai_suggestions || {})),
      userId,
    ]
  )

  return {
    case: caseData,
    document: {
      ...updated.rows[0],
      content_json: mergeM06Content(updated.rows[0].content_json, caseData),
      ai_suggestions: sanitizeM06Value(updated.rows[0].ai_suggestions || {}),
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get("caseId")
    const documentId = searchParams.get("documentId")
    const targetSectionParam = searchParams.get("targetSection")
    const targetSection = isM06SectionKey(targetSectionParam) ? targetSectionParam : undefined
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const body = await request.json()
      const text = sanitizeM06Text(body.text)
      if (!text) return NextResponse.json(error("文本内容不能为空", 400))

      const material: M06SourceMaterial = {
        id: `source-${Date.now()}`,
        type: "text",
        name: sanitizeM06Text(body.name) || "手动输入材料",
        text,
        summary: text.slice(0, 300),
        targetSection: isM06SectionKey(body.targetSection) ? body.targetSection : targetSection,
        createdAt: new Date().toISOString(),
      }

      const persisted = await persistMaterial(body.caseId || caseId, body.documentId || documentId, material, user.id)
      return NextResponse.json(success({ material, persisted }, "文本材料已写入"))
    }

    const uploadResult = await handleUpload(request, { subDir: "m06" })
    const fileBuffer = await readFile(uploadResult.path)
    const parseResult = await parseFile(fileBuffer, uploadResult.mimeType, { fileName: uploadResult.originalName, maxLength: 80000 })
    const extractedText = sanitizeM06Text(parseResult.text)
    const material: M06SourceMaterial = {
      id: uploadResult.fileId,
      type: uploadResult.mimeType.startsWith("image/") ? "image" : "file",
      name: uploadResult.originalName,
      mimeType: uploadResult.mimeType,
      source: uploadResult.url,
      text: extractedText,
      summary: extractedText.slice(0, 300),
      targetSection,
      createdAt: new Date().toISOString(),
    }

    const persisted = await persistMaterial(caseId, documentId, material, user.id)

    return NextResponse.json(
      success({
        fileId: uploadResult.fileId,
        originalName: uploadResult.originalName,
        filename: uploadResult.filename,
        url: uploadResult.url,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        extractedText: extractedText.substring(0, 2000),
        parseInfo: {
          pages: parseResult.pages,
          paragraphs: parseResult.paragraphs,
          wordCount: parseResult.wordCount,
        },
        material,
        persisted,
      }, "上传成功")
    )
  } catch (err: any) {
    console.error("上传失败:", err)
    return NextResponse.json(error(sanitizeM06Text(err.message) || "上传失败", 500))
  }
}
