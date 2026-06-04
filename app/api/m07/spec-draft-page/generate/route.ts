/**
 * AI 生成说明书初稿
 *
 * @openapi
 * /api/m07/spec-draft-page/generate:
 *   post:
 *     summary: AI 生成说明书初稿
 *     description: 基于交底书内容和已有附图，调用 AI 生成专利说明书各章节
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [caseId]
 *             properties:
 *               caseId:
 *                 type: string
 *               selectedChapters:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       "200":
 *         description: 生成成功
 */

import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { query } from "@/lib/db"
import { generateSpecification } from "@/lib/m07-ai"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const body = await request.json()
    const caseId = body?.caseId
    if (!caseId) return NextResponse.json(error("缺少 caseId", 400))

    const selectedChapters: string[] = body?.selectedChapters || [
      "tech-field", "background", "summary", "drawings", "embodiment", "effects",
    ]

    // 1. 查案件信息
    const caseResult = await query(
      `SELECT id, title FROM cases WHERE id = $1`,
      [caseId]
    )
    if (caseResult.rows.length === 0) {
      return NextResponse.json(error("案件不存在", 404))
    }
    const caseTitle = caseResult.rows[0].title || "未命名"

    // 2. 查交底书
    const disclosureResult = await query(
      `SELECT content_json FROM disclosure_documents WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )
    let disclosureContent = ""
    if (disclosureResult.rows.length > 0 && disclosureResult.rows[0].content_json) {
      const json = disclosureResult.rows[0].content_json
      // json 可能是对象，提取其中的 text 字段
      if (typeof json === "string") {
        disclosureContent = json
      } else if (json.content) {
        disclosureContent = json.content
      } else if (json.title) {
        // 结构化 JSON，转成文本
        disclosureContent = JSON.stringify(json, null, 2)
      } else {
        disclosureContent = JSON.stringify(json)
      }
    }

    // 3. 查已有说明书
    const specResult = await query(
      `SELECT content FROM patent_documents WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`,
      [caseId]
    )
    const specContent: string | null = specResult.rows.length > 0 ? specResult.rows[0].content : null

    // 4. 查附图描述
    const imagesResult = await query(
      `SELECT caption FROM document_images WHERE case_id = $1 ORDER BY position ASC`,
      [caseId]
    )
    const imageCaptions: string[] = imagesResult.rows.map((r: any) => r.caption || "").filter(Boolean)

    // 5. 调用 AI 生成
    const chapters = await generateSpecification({
      disclosureContent,
      specContent,
      imageCaptions,
      selectedChapters,
      caseTitle,
    })

    // 6. 保存到说明书文档
    const specDocResult = await query(
      `SELECT id FROM patent_documents WHERE case_id = $1 AND type = 'spec' LIMIT 1`,
      [caseId]
    )

    let specDocId: string
    if (specDocResult.rows.length === 0) {
      const created = await query(
        `INSERT INTO patent_documents (case_id, type, content, status, ai_rate)
         VALUES ($1, 'spec', '', 'draft', 30) RETURNING id`,
        [caseId]
      )
      specDocId = created.rows[0].id
    } else {
      specDocId = specDocResult.rows[0].id
    }

    // 更新各章节字段
    await query(
      `UPDATE patent_documents
       SET tech_field = $2, background = $3, summary = $4, drawings_desc = $5,
           embodiment = $6, effects = $7, content = $8,
           ai_rate = 30, status = 'draft', updated_at = NOW()
       WHERE id = $1`,
      [
        specDocId,
        chapters.tech_field,
        chapters.background,
        chapters.summary,
        chapters.drawings_desc,
        chapters.embodiment,
        chapters.effects,
        // 合并全文 content 用于整体展示
        [
          chapters.tech_field ? `技术领域\n${chapters.tech_field}` : "",
          chapters.background ? `背景技术\n${chapters.background}` : "",
          chapters.summary ? `发明内容\n${chapters.summary}` : "",
          chapters.drawings_desc ? `附图说明\n${chapters.drawings_desc}` : "",
          chapters.embodiment ? `具体实施方式\n${chapters.embodiment}` : "",
          chapters.effects ? `有益效果\n${chapters.effects}` : "",
        ].filter(Boolean).join("\n\n"),
      ]
    )

    return NextResponse.json(success({
      specDocId,
      chapters,
    }, "AI 生成完成"))
  } catch (err: any) {
    console.error("AI 生成说明书失败:", err)
    return NextResponse.json(error(err.message || "AI 生成失败", 500))
  }
}
