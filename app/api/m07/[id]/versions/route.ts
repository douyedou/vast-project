/**
 * 专利文档版本历史
 * GET /api/m07/documents/:id/versions
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const result = await query(
      `SELECT v.id, v.document_id, v.content, v.operator_id, u.name as operator_name, v.change_summary, v.created_at
       FROM document_versions v
       LEFT JOIN users u ON v.operator_id = u.id
       WHERE v.document_id = $1
       ORDER BY v.created_at DESC`,
      [id]
    )

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('获取版本历史失败:', err)
    return NextResponse.json(error('获取版本历史失败', 500))
  }
}
