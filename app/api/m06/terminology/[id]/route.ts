/**
 * 术语更新/删除
 * PUT    /api/m06/terminology/:id
 * DELETE /api/m06/terminology/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/m06/terminology/:id
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const body = await request.json()
    const { field, term, definition, synonyms, usageExample } = body

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (field !== undefined) { updates.push(`field = $${paramIndex++}`); values.push(field) }
    if (term !== undefined) { updates.push(`term = $${paramIndex++}`); values.push(term) }
    if (definition !== undefined) { updates.push(`definition = $${paramIndex++}`); values.push(definition) }
    if (synonyms !== undefined) { updates.push(`synonyms = $${paramIndex++}`); values.push(synonyms) }
    if (usageExample !== undefined) { updates.push(`usage_example = $${paramIndex++}`); values.push(usageExample) }

    if (updates.length === 0) {
      return NextResponse.json(error('没有要更新的字段', 400))
    }

    values.push(id)

    const result = await query(
      `UPDATE terminology SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('术语不存在', 404))
    }

    return NextResponse.json(success(result.rows[0], '更新成功'))
  } catch (err: any) {
    console.error('更新术语失败:', err)
    if (err.code === '23505') {
      return NextResponse.json(error('该术语已存在', 409))
    }
    return NextResponse.json(error('更新术语失败', 500))
  }
}

// DELETE /api/m06/terminology/:id
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const result = await query(
      'DELETE FROM terminology WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('术语不存在', 404))
    }

    return NextResponse.json(success({ id: result.rows[0].id }, '删除成功'))
  } catch (err: any) {
    console.error('删除术语失败:', err)
    return NextResponse.json(error('删除术语失败', 500))
  }
}
