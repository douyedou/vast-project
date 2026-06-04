/**
 * 权利要求书 API — 集合级操作（GET 列表 / POST 批量保存）
 * 每条权利要求是 patent_documents 中 type='claim' 的一行
 * 从属关系通过 parent_claim_id 自引用外键实现
 * 单条操作见 [id]/route.ts (PATCH / DELETE)
 *
 * @openapi
 * /api/m07/claims:
 *   get:
 *     summary: 获取权利要求列表
 *     description: 根据 caseId 获取案件的全部权利要求（含从属关系）
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
 *         description: 权利要求列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClaimsListResponse'
 *   post:
 *     summary: 批量保存权利要求
 *     description: 事务内全量替换案件的权利要求（含从属关系校验）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClaimsSaveRequest'
 *     responses:
 *       "200":
 *         description: 保存成功
 */

import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { query, transaction } from "@/lib/db"
import { sanitizeB64Content } from "@/lib/docx"
import type { PoolClient } from "pg"

// ─── 类型 ───────────────────────────────────────────────────
interface ClaimInput {
  id?: string
  number: number
  type: "independent" | "dependent"
  text: string
  refClaim?: number
  supportStatus?: string
  supportParagraphs?: string[]
}

// ─── 校验 ───────────────────────────────────────────────────
function validateDependencies(claims: ClaimInput[]): string | null {
  const numbers = new Set(claims.map(c => c.number))
  for (const c of claims) {
    if (c.type === "independent") {
      if (c.refClaim != null) return `独立权利要求 ${c.number} 不应设置引用关系`
    } else {
      if (c.refClaim == null) return `从属权利要求 ${c.number} 缺少引用对象（refClaim）`
      if (!numbers.has(c.refClaim)) return `从属权利要求 ${c.number} 引用了不存在的权利要求 ${c.refClaim}`
      if (c.refClaim >= c.number) return `从属权利要求 ${c.number} 只能引用序号小于自己的权利要求（当前引用 ${c.refClaim}）`
    }
  }
  return null
}

// ============================================================
// GET — 获取权利要求列表
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get("caseId")
    if (!caseId) return NextResponse.json(error("缺少 caseId 参数", 400))

    const result = await query(
      `SELECT id, case_id, claim_number, content, parent_claim_id, status,
              support_status, support_paragraphs, created_at, updated_at
       FROM patent_documents
       WHERE case_id = $1 AND type = 'claim'
       ORDER BY claim_number ASC`,
      [caseId]
    )

    // 检查是否已锁定
    const locked = result.rows.some(row => row.status !== 'draft' && row.status !== 'pending_review')

    // 构建 number → id 映射，还原 refClaim（前端用 number）
    const numToId: Record<number, string> = {}
    const idToNum: Record<string, number> = {}
    for (const row of result.rows) {
      numToId[row.claim_number] = row.id
      idToNum[row.id] = row.claim_number
    }

    const claims = result.rows.map(row => {
      const sanitized = sanitizeB64Content(row.content)
      return {
        id: row.id,
        number: row.claim_number,
        type: (row.parent_claim_id ? "dependent" : "independent") as "independent" | "dependent",
        text: sanitized.content,
        _hasDocx: sanitized.hasDocx,
        refClaim: row.parent_claim_id ? idToNum[row.parent_claim_id] : undefined,
        supportStatus: row.support_status as string,
        supportParagraphs: row.support_paragraphs || [],
        status: row.status,
      }
    })

    return NextResponse.json(success({
      claims,
      caseId,
      locked,
      isSubmitted: result.rows.some(row => row.status === 'ai_checking'),
      message: locked ? '权利要求书已确认提交，请在双文档工作台中使用 OnlyOffice 编辑' : undefined,
    }))
  } catch (err: any) {
    console.error("获取权利要求失败:", err)
    return NextResponse.json(error("获取权利要求失败", 500))
  }
}

// ============================================================
// POST — 批量保存权利要求书（事务内全量替换）
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const body = await request.json()
    const { caseId, claims } = body || {}
    if (!caseId || !Array.isArray(claims)) {
      return NextResponse.json(error("缺少 caseId 或 claims 参数", 400))
    }

    const claimInputs = claims as ClaimInput[]

    // 1. 从属关系校验
    const depError = validateDependencies(claimInputs)
    if (depError) return NextResponse.json(error(depError, 400))

    // 2. 事务：删旧 → 批量插入 → 回填 parent_claim_id
    const result = await transaction(async (client: PoolClient) => {
      // 2a. 删除该 case 下所有 type='claim' 的行
      await client.query(
        "DELETE FROM patent_documents WHERE case_id = $1 AND type = 'claim'",
        [caseId]
      )

      // 2b. 逐条插入（parent_claim_id 先置 NULL）
      const inserted: { number: number; id: string }[] = []
      for (let i = 0; i < claimInputs.length; i++) {
        const c = claimInputs[i]
        const ins = await client.query(
          `INSERT INTO patent_documents (case_id, type, content, claim_number, parent_claim_id, support_status, support_paragraphs, status, ai_rate)
           VALUES ($1, 'claim', $2, $3, NULL, $4, $5, 'draft', 0)
           RETURNING id, claim_number`,
          [caseId, c.text || "", c.number, c.supportStatus || "unchecked", c.supportParagraphs || []]
        )
        inserted.push({ number: ins.rows[0].claim_number, id: ins.rows[0].id })
      }

      // 2c. 回填 parent_claim_id（用 number → UUID 映射）
      const numToId = new Map(inserted.map(x => [x.number, x.id]))
      for (const c of claimInputs) {
        if (c.type === "dependent" && c.refClaim != null) {
          const parentId = numToId.get(c.refClaim)
          if (!parentId) throw new Error(`内部错误：找不到引用权利要求 ${c.refClaim}`)
          const childId = numToId.get(c.number)
          await client.query(
            "UPDATE patent_documents SET parent_claim_id = $1 WHERE id = $2",
            [parentId, childId]
          )
        }
      }

      // 返回带 ID 的 claims 列表
      const savedResult = await client.query(
        `SELECT id, claim_number, content, parent_claim_id, status, support_status, support_paragraphs
         FROM patent_documents WHERE case_id = $1 AND type = 'claim' ORDER BY claim_number ASC`,
        [caseId]
      )
      const idToNum: Record<string, number> = {}
      for (const r of savedResult.rows) idToNum[r.id] = r.claim_number
      const savedClaims = savedResult.rows.map(r => ({
        id: r.id,
        number: r.claim_number,
        type: r.parent_claim_id ? "dependent" : "independent",
        text: r.content,
        refClaim: r.parent_claim_id ? idToNum[r.parent_claim_id] : undefined,
        supportStatus: r.support_status,
        supportParagraphs: r.support_paragraphs,
        status: r.status,
      }))
      return { count: inserted.length, claims: savedClaims }
    })

    return NextResponse.json(success(result, "权利要求保存成功"))
  } catch (err: any) {
    console.error("保存权利要求失败:", err)
    if (err.message?.includes("foreign") || err.message?.includes("violates")) {
      return NextResponse.json(error("从属关系校验失败，请检查引用链", 400))
    }
    return NextResponse.json(error(err.message || "保存权利要求失败", 500))
  }
}
