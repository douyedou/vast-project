import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { query, transaction } from "@/lib/db"
import {
  buildM06FullText,
  evaluateM06Completeness,
  mergeM06Content,
  sanitizeM06Text,
  sanitizeM06Value,
} from "@/lib/m06"
import { buildM06ReportMarkdown } from "@/lib/m06-ai"
import { ensureKnowledgeSchema } from "@/lib/knowledge"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const body = await request.json()
    const { caseId, documentId, remarks } = body
    if (!caseId) return NextResponse.json(error("caseId 不能为空", 400))

    await ensureKnowledgeSchema()

    const caseResult = await query(
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
    const caseData = caseResult.rows[0]
    if (!caseData) return NextResponse.json(error("案件不存在", 404))

    const docResult = await query(
      `SELECT id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at
       FROM disclosure_documents
       WHERE case_id = $1 ${documentId ? "AND id = $2" : ""}
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1`,
      documentId ? [caseId, documentId] : [caseId]
    )
    const document = docResult.rows[0]
    if (!document) return NextResponse.json(error("请先创建或保存交底书", 400))

    const content = mergeM06Content(document.content_json, caseData)
    const validation = content.aiResults.completeness || evaluateM06Completeness(content)
    const hasBlocking = validation.issues.some((issue: any) => issue.severity === "blocking")
    if (hasBlocking) {
      return NextResponse.json(
        error(`完整性校验存在阻断项，请先处理阻断项后再提交`, 400)
      )
    }

    const submittedAt = new Date().toISOString()
    const markdown = content.aiResults.package?.markdown || buildM06ReportMarkdown(content, "M06提交M07数据包")
    const nextContent = sanitizeM06Value({
      ...content,
      aiResults: {
        ...content.aiResults,
        completeness: validation,
        package: {
          summary: content.aiResults.package?.summary || "交底书数据包已生成并提交 M07。",
          markdown,
          generatedAt: content.aiResults.package?.generatedAt || submittedAt,
        },
      },
      workflow: {
        ...content.workflow,
        qualityScore: validation.score,
        submittedToM07: true,
        submittedAt,
        completedSteps: Array.from(new Set([...(content.workflow.completedSteps || []), "SUBMIT" as const])),
      },
      meta: {
        ...content.meta,
        currentStage: "SUBMIT" as const,
      },
    })

    const result = await transaction(async (client) => {
      const updatedDoc = await client.query(
        `UPDATE disclosure_documents
         SET content_json = $1,
             status = 'approved',
             version = version + 1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at`,
        [JSON.stringify(nextContent), document.id]
      )

      await client.query(
        `INSERT INTO disclosure_document_versions (document_id, version, action, content_json, ai_suggestions, created_by)
         VALUES ($1, $2, 'submit-m07', $3, $4, $5)`,
        [
          document.id,
          updatedDoc.rows[0].version,
          JSON.stringify(nextContent),
          JSON.stringify(sanitizeM06Value(document.ai_suggestions || {})),
          user.id,
        ]
      )

      const specContent = [
        markdown,
        "",
        "## M06原始交底全文",
        buildM06FullText(nextContent),
      ].join("\n")

      const existingSpec = await client.query(
        `SELECT id FROM patent_documents WHERE case_id = $1 AND type = 'spec' LIMIT 1`,
        [caseId]
      )

      if (existingSpec.rows[0]) {
        await client.query(
          `UPDATE patent_documents
           SET content = $1,
               status = 'writing',
               version = version + 1,
               updated_at = NOW()
           WHERE id = $2`,
          [specContent, existingSpec.rows[0].id]
        )
      } else {
        await client.query(
          `INSERT INTO patent_documents (case_id, type, content, status, ai_rate)
           VALUES ($1, 'spec', $2, 'writing', 0)`,
          [caseId, specContent]
        )
      }

      if (nextContent.figures.length) {
        const drawingsContent = nextContent.figures
          .map((figure) => `# ${figure.title}\n\n${figure.description}\n\n\`\`\`mermaid\n${figure.mermaid}\n\`\`\``)
          .join("\n\n")
        const existingDrawings = await client.query(
          `SELECT id FROM patent_documents WHERE case_id = $1 AND type = 'drawings' LIMIT 1`,
          [caseId]
        )
        if (existingDrawings.rows[0]) {
          await client.query(
            `UPDATE patent_documents
             SET content = $1,
                 status = 'writing',
                 version = version + 1,
                 updated_at = NOW()
             WHERE id = $2`,
            [drawingsContent, existingDrawings.rows[0].id]
          )
        } else {
          await client.query(
            `INSERT INTO patent_documents (case_id, type, content, status, ai_rate)
             VALUES ($1, 'drawings', $2, 'writing', 0)`,
            [caseId, drawingsContent]
          )
        }
      }

      let updatedCase = caseData
      if (!["writing", "reviewing", "completed"].includes(caseData.status)) {
        const caseUpdate = await client.query(
          `UPDATE cases SET status = 'writing', updated_at = NOW() WHERE id = $1 RETURNING *`,
          [caseId]
        )
        updatedCase = {
          ...caseUpdate.rows[0],
          applicant_name: caseData.applicant_name,
          engineer_name: caseData.engineer_name,
          reviewer_name: caseData.reviewer_name,
        }

        await client.query(
          `INSERT INTO case_status_history (case_id, from_status, to_status, operator_id, remark)
           VALUES ($1, $2, 'writing', $3, $4)`,
          [
            caseId,
            caseData.status,
            user.id,
            remarks || "M06 交底书数据包提交 M07",
          ]
        )
      }

      return {
        case: updatedCase,
        document: {
          ...updatedDoc.rows[0],
          content_json: mergeM06Content(updatedDoc.rows[0].content_json, updatedCase),
          ai_suggestions: sanitizeM06Value(updatedDoc.rows[0].ai_suggestions || {}),
        },
      }
    })

    return NextResponse.json(success(result, "已提交 M07"))
  } catch (err: any) {
    console.error("提交 M07 失败:", sanitizeM06Text(err.message))
    return NextResponse.json(error(sanitizeM06Text(err.message) || "提交 M07 失败", 500))
  }
}
