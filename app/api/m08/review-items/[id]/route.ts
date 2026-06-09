/**
 * M08 审核问题 单个操作
 * PUT    /api/m08/review-items/[id] — 修改
 * DELETE /api/m08/review-items/[id] — 删除
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

const VALID_SEVERITY = ['low', 'medium', 'high', 'critical']
const VALID_STATUS = ['pending', 'resolved', 'ignored']

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { content, severity, status } = body

    const updates: string[] = []
    const vals: any[] = []
    let idx = 1

    if (content !== undefined) { updates.push(`content = $${idx++}`); vals.push(content) }
    if (severity && VALID_SEVERITY.includes(severity)) { updates.push(`severity = $${idx++}`); vals.push(severity) }
    if (status && VALID_STATUS.includes(status)) { updates.push(`status = $${idx++}`); vals.push(status) }

    if (updates.length === 0) return NextResponse.json(error('无更新内容', 400), { status: 400 })

    vals.push(id)
    await query(`UPDATE review_items SET ${updates.join(', ')} WHERE id = $${idx}`, vals)

    return NextResponse.json(success({ id }, '已更新'))
  } catch (err: any) {
    console.error('Update error:', err)
    return NextResponse.json(error('更新失败: ' + err.message, 500), { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { id } = await params
    const result = await query(`DELETE FROM review_items WHERE id = $1 RETURNING id`, [id])
    if (result.rows.length === 0) return NextResponse.json(error('问题不存在', 404), { status: 404 })

    return NextResponse.json(success({ id }, '已删除'))
  } catch (err: any) {
    console.error('Delete error:', err)
    return NextResponse.json(error('删除失败: ' + err.message, 500), { status: 500 })
  }
}
