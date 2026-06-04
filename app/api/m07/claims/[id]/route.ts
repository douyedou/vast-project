/**
 * 权利要求书 API — 单条操作（PATCH 修改 / DELETE 删除）
 * 操作对象是 patent_documents 中 type='claim' 的行
 *
 * @openapi
 * /api/m07/claims/{id}:
 *   patch:
 *     summary: 修改单条权利要求
 *     description: 修改文本、编号、从属关系、支持状态等
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClaimUpdateRequest'
 *     responses:
 *       "200":
 *         description: 修改成功
 *   delete:
 *     summary: 删除单条权利要求
 *     description: 删除权利要求，若被其他权利要求引用则拒绝（409）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: 删除成功
 *       "409":
 *         description: 被其他权利要求引用，无法删除
 */

import { NextRequest, NextResponse } from "next/server"
import { success, error } from "@/lib/api-response"
import { requireAuth } from "@/middleware/auth"
import { query } from "@/lib/db"

// ============================================================
// PATCH — 修改单条权利要求
// ============================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const { id } = await params
    if (!id) return NextResponse.json(error("缺少权利要求 ID", 400))

    const body = await request.json()
    const { text, number, refClaim, supportStatus, supportParagraphs } = body || {}

    // 1. 查当前权利要求
    const current = await query(
      `SELECT id, case_id, claim_number, parent_claim_id
       FROM patent_documents
       WHERE id = $1 AND type = 'claim'`,
      [id]
    )
    if (current.rows.length === 0) return NextResponse.json(error("权利要求不存在", 404))
    const claim = current.rows[0]

    const newNumber = number ?? claim.claim_number

    // 2. 唯一性检查
    if (number != null && number !== claim.claim_number) {
      const dup = await query(
        `SELECT id FROM patent_documents
         WHERE case_id = $1 AND type = 'claim' AND claim_number = $2 AND id != $3`,
        [claim.case_id, number, id]
      )
      if (dup.rows.length > 0) return NextResponse.json(error(`权利要求编号 ${number} 已存在`, 409))
    }

    // 3. 计算新的 parent_claim_id
    let newParentId: string | null = claim.parent_claim_id

    if (refClaim === null || (refClaim === undefined && newParentId === null)) {
      // 明确置为独立权利要求
      newParentId = null
    } else if (refClaim != null) {
      const parent = await query(
        `SELECT id FROM patent_documents
         WHERE case_id = $1 AND type = 'claim' AND claim_number = $2`,
        [claim.case_id, refClaim]
      )
      if (parent.rows.length === 0) {
        return NextResponse.json(error(`引用的权利要求 ${refClaim} 不存在`, 400))
      }
      if (refClaim >= newNumber) {
        return NextResponse.json(error(`只能引用序号小于自己的权利要求（当前 ${newNumber} 引用 ${refClaim}）`, 400))
      }
      newParentId = parent.rows[0].id
    }

    // 4. 执行更新（修改支持字段时自动进入待审核）
    const hasSupportChange = supportStatus !== undefined || supportParagraphs !== undefined
    const statusSql = hasSupportChange ? ", status = 'pending_review'" : ""
    const updateResult = await query(
      `UPDATE patent_documents
       SET content = COALESCE($2, content),
           claim_number = $3,
           parent_claim_id = $4,
           support_status = COALESCE($5, support_status),
           support_paragraphs = COALESCE($6, support_paragraphs)${statusSql},
           updated_at = NOW()
       WHERE id = $1 AND type = 'claim'
       RETURNING id, case_id, claim_number, content, parent_claim_id, status,
                 support_status, support_paragraphs, updated_at`,
      [id, text ?? null, newNumber, newParentId, supportStatus ?? null, supportParagraphs ?? null]
    )

    const row = updateResult.rows[0]
    return NextResponse.json(success({
      id: row.id,
      caseId: row.case_id,
      number: row.claim_number,
      type: row.parent_claim_id ? "dependent" : "independent",
      text: row.content,
      refClaim: refClaim,
      supportStatus: row.support_status,
      supportParagraphs: row.support_paragraphs || [],
      status: row.status,
    }, "权利要求更新成功"))
  } catch (err: any) {
    console.error("更新权利要求失败:", err)
    if (err.message?.includes("foreign") || err.message?.includes("violates")) {
      return NextResponse.json(error("从属关系校验失败", 400))
    }
    return NextResponse.json(error(err.message || "更新权利要求失败", 500))
  }
}

// ============================================================
// DELETE — 删除单条权利要求
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error("未登录", 401))

    const { id } = await params
    if (!id) return NextResponse.json(error("缺少权利要求 ID", 400))

    // 1. 检查存在
    const current = await query(
      `SELECT id, claim_number FROM patent_documents WHERE id = $1 AND type = 'claim'`,
      [id]
    )
    if (current.rows.length === 0) return NextResponse.json(error("权利要求不存在", 404))

    // 2. 检查是否有从属引用（ON DELETE RESTRICT 会阻止，先友好提示）
    const dependents = await query(
      `SELECT id, claim_number FROM patent_documents WHERE parent_claim_id = $1 AND type = 'claim'`,
      [id]
    )
    if (dependents.rows.length > 0) {
      const nums = dependents.rows.map((r: any) => r.claim_number).join("、")
      return NextResponse.json(
        error(`无法删除：权利要求 ${current.rows[0].claim_number} 被权利要求 ${nums} 引用，请先解除从属关系`, 409)
      )
    }

    // 3. 删除
    await query("DELETE FROM patent_documents WHERE id = $1 AND type = 'claim'", [id])
    return NextResponse.json(success({ deletedId: id }, "权利要求已删除"))
  } catch (err: any) {
    console.error("删除权利要求失败:", err)
    if (err.message?.includes("foreign") || err.message?.includes("violates")) {
      return NextResponse.json(error("该权利要求被其他权利要求引用，无法删除", 409))
    }
    return NextResponse.json(error(err.message || "删除权利要求失败", 500))
  }
}
