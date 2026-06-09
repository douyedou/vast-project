/**
 * 更新审核子步骤完成状态
 * PATCH /api/m08/reviews/[id]/step
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { disclosureDone, fiveBooksDone } = body || {}

    const sets: string[] = []
    const vals: any[] = []
    let idx = 1

    if (disclosureDone !== undefined) { sets.push(`disclosure_done = $${idx++}`); vals.push(disclosureDone) }
    if (fiveBooksDone !== undefined) { sets.push(`five_books_done = $${idx++}`); vals.push(fiveBooksDone) }

    if (sets.length === 0) return NextResponse.json(error('无更新内容', 400), { status: 400 })

    sets.push('updated_at = NOW()')
    vals.push(id)
    await query(`UPDATE reviews SET ${sets.join(', ')} WHERE id = $${idx}`, vals)

    return NextResponse.json(success({ id }, '状态已更新'))
  } catch (err: any) {
    console.error('Step update error:', err)
    return NextResponse.json(error('更新失败: ' + err.message, 500), { status: 500 })
  }
}
