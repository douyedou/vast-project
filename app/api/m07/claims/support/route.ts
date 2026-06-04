/**
 * 权利要求-说明书支持关系 API
 *
 * @openapi
 * /api/m07/claims/support:
 *   get:
 *     summary: 获取说明书段落
 *     description: 获取指定案件的说明书各章节段落，用于权利要求支持关系映射
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: 说明书段落列表
 *   post:
 *     summary: 检查权利要求支持度
 *     description: 根据 caseId 自动取说明书和权利要求，AI 逐条检查支撑情况
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
 *     responses:
 *       "200":
 *         description: 支持度检查结果
 */

import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { query } from "@/lib/db"
import { sanitizeB64Content } from "@/lib/docx"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000"

// ============================================================
// GET — 获取说明书段落列表
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get("caseId")
    if (!caseId) return NextResponse.json(error("缺少 caseId 参数", 400))

    const result = await query(
      `SELECT content
       FROM patent_documents
       WHERE case_id = $1 AND type = 'spec'
       LIMIT 1`,
      [caseId]
    )

    if (result.rows.length === 0) return NextResponse.json(success([]))

    const content: string = sanitizeB64Content(result.rows[0].content).content

    // 按段落拆分
    const paragraphs: { id: string; chapter: string; text: string }[] = []
    const lines = content.split(/\n+/).filter((l: string) => l.trim())
    lines.forEach((line: string, i: number) => {
      paragraphs.push({
        id: `p${i + 1}`,
        chapter: "说明书",
        text: line.trim(),
      })
    })

    return NextResponse.json(success(paragraphs))
  } catch (err: any) {
    console.error("获取说明书段落失败:", err)
    return NextResponse.json(error("获取说明书段落失败", 500))
  }
}

// ============================================================
// POST — AI 检查权利要求支持度
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error("缺少 caseId 参数", 400))

    // 1. 后台自己取权利要求
    const claimsResult = await query(
      `SELECT claim_number, content, parent_claim_id
       FROM patent_documents
       WHERE case_id = $1 AND type = 'claim'
       ORDER BY claim_number`,
      [caseId]
    )
    if (claimsResult.rows.length === 0) {
      return NextResponse.json(error("未找到权利要求", 400))
    }

    const claims = claimsResult.rows.map(row => ({
      number: row.claim_number,
      type: row.parent_claim_id ? "dependent" : "independent",
      text: row.content,
    }))

    // 2. 获取说明书全文
    const specResult = await query(
      `SELECT content
       FROM patent_documents
       WHERE case_id = $1 AND type = 'spec'
       LIMIT 1`,
      [caseId]
    )
    if (specResult.rows.length === 0) {
      return NextResponse.json(error("未找到说明书，请先生成说明书", 400))
    }

    const specFull = sanitizeB64Content(specResult.rows[0].content).content

    // 获取附图信息
    const imgResult = await query(
      `SELECT caption, position FROM document_images WHERE case_id = $1 ORDER BY position`,
      [caseId]
    )
    const imgText = imgResult.rows.length > 0
      ? "\n【附图列表】\n" + imgResult.rows.map((r: any) => `图${r.position}：${r.caption}`).join("\n")
      : ""

    const claimsText = claims
      .map((c: any) => `权利要求${c.number}（${c.type === "independent" ? "独立" : "从属"}）：\n${c.text}`)
      .join("\n\n")

    const prompt = `你是一名专利审查员。下面是一篇专利说明书和一组权利要求。

逐条判断每条权利要求是否能在说明书中找到对应支撑。必须诚实判断，找不到就是找不到。

输出纯 JSON 数组：
[
  {"number": 1, "status": "supported", "paragraphs": ["说明书中的原句1", "说明书中的原句2"]},
  {"number": 2, "status": "unsupported", "paragraphs": []}
]

status: "supported" / "weak" / "unsupported"
paragraphs: 必须从「说明书」中逐字摘取，禁止编造，禁止引用权利要求的文字。找不到就留空数组。

## 说明书
${specFull}
${imgText}

## 权利要求
${claimsText}`

    // 2. 调用 AI
    const aiRes = await fetch(`${AI_SERVICE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature: 0.3, max_tokens: 2048 }),
    })

    if (!aiRes.ok) throw new Error(`AI 服务调用失败 (${aiRes.status})`)

    const aiData = await aiRes.json() as { text: string }
    
    // 3. 解析 AI 结果，并补齐漏掉的权利要求
    let aiResults: { number: number; status: string; paragraphs: string[] }[] = []
    try {
      const jsonMatch = aiData.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) aiResults = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json(error("AI 返回解析失败，请重试", 500))
    }

    // 确保每条权利要求都有结果，AI 漏掉的标 unsupported
    const aiMap = new Map(aiResults.map(r => [r.number, r]))
    const results = claims.map(c => {
      const hit = aiMap.get(c.number)
      return hit
        ? { number: c.number, status: hit.status, paragraphs: hit.paragraphs || [] }
        : { number: c.number, status: "unsupported", paragraphs: [] }
    })

    return NextResponse.json(success(results, "支持度检查完成"))
  } catch (err: any) {
    console.error("支持度检查失败:", err)
    return NextResponse.json(error(err.message || "支持度检查失败", 500))
  }
}
