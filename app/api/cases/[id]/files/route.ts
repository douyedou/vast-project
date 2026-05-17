/**
 * 案件附件上传
 * POST /api/cases/:id/files
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { handleUpload } from '@/lib/upload'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    // 检查案件是否存在
    const caseCheck = await query('SELECT id FROM cases WHERE id = $1', [id])
    if (caseCheck.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404))
    }

    // 上传文件
    const uploadResult = await handleUpload(request, { subDir: `cases/${id}` })

    // 保存到数据库
    const result = await query(
      `INSERT INTO case_files (case_id, filename, original_name, url, mime_type, size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, uploadResult.filename, uploadResult.originalName, uploadResult.url, uploadResult.mimeType, uploadResult.size]
    )

    return NextResponse.json(success(result.rows[0], '上传成功'))
  } catch (err: any) {
    console.error('上传附件失败:', err)
    return NextResponse.json(error(err.message || '上传附件失败', 500))
  }
}
