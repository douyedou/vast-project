/**
 * 删除案件附件
 * DELETE /api/cases/:id/files/:fileId
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { unlinkSync } from 'fs'
import { join } from 'path'

interface RouteParams {
  params: Promise<{ id: string; fileId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id, fileId } = await params

    // 查询文件信息
    const fileResult = await query(
      'SELECT id, filename, url FROM case_files WHERE id = $1 AND case_id = $2',
      [fileId, id]
    )

    if (fileResult.rows.length === 0) {
      return NextResponse.json(error('附件不存在', 404))
    }

    const file = fileResult.rows[0]

    // 删除物理文件
    try {
      const filePath = join(process.cwd(), 'public', file.url)
      unlinkSync(filePath)
    } catch {
      // 文件可能已删除，忽略错误
    }

    // 删除数据库记录
    await query('DELETE FROM case_files WHERE id = $1', [fileId])

    return NextResponse.json(success({ id: fileId }, '删除成功'))
  } catch (err: any) {
    console.error('删除附件失败:', err)
    return NextResponse.json(error('删除附件失败', 500))
  }
}
