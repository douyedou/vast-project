/**
 * 交底书详情/更新
 * GET /api/m06/documents/:id
 * PUT /api/m06/documents/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/m06/documents/:id
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const result = await query(
      `SELECT id, case_id, content_json, ai_suggestions, status, version, created_at, updated_at
       FROM disclosure_documents WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('交底书不存在', 404))
    }

    return NextResponse.json(success(result.rows[0]))
  } catch (err: any) {
    console.error('获取交底书失败:', err)
    return NextResponse.json(error('获取交底书失败', 500))
  }
}

// PUT /api/m06/documents/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { contentJson, status } = body

    const docCheck = await query('SELECT id, version FROM disclosure_documents WHERE id = $1', [id])
    if (docCheck.rows.length === 0) {
      return NextResponse.json(error('交底书不存在', 404))
    }

    function extractCols(cj: any) {
      const s = cj?.sections || {}
      const st = cj?.structure || {}
      const join = (arr: string[] | undefined) => (arr || []).filter(Boolean).join("\n")
      return {
        tech_problem: s.technicalProblem || "",
        tech_feature: join(st.technicalFeatures),
        action_relation: join(st.relations),
        tech_effect: s.beneficialEffects || "",
        key_protection: join(st.protectionPoints),
        alternative_solution: join(st.alternatives),
      }
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (contentJson !== undefined) {
      updates.push(`content_json = $${paramIndex++}`)
      values.push(JSON.stringify(contentJson))
      const cols = extractCols(contentJson)
      updates.push(`tech_problem = $${paramIndex++}`)
      values.push(cols.tech_problem)
      updates.push(`tech_feature = $${paramIndex++}`)
      values.push(cols.tech_feature)
      updates.push(`action_relation = $${paramIndex++}`)
      values.push(cols.action_relation)
      updates.push(`tech_effect = $${paramIndex++}`)
      values.push(cols.tech_effect)
      updates.push(`key_protection = $${paramIndex++}`)
      values.push(cols.key_protection)
      updates.push(`alternative_solution = $${paramIndex++}`)
      values.push(cols.alternative_solution)
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(status)
    }
    updates.push(`version = version + 1`)
    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE disclosure_documents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    return NextResponse.json(success(result.rows[0], '保存成功'))
  } catch (err: any) {
    console.error('更新交底书失败:', err)
    return NextResponse.json(error('更新交底书失败', 500))
  }
}
