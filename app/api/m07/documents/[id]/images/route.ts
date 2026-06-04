/**
 * 专利文档图片管理
 * GET    /api/m07/documents/:id/images
 * POST   /api/m07/documents/:id/images
 * PATCH  /api/m07/documents/:id/images?imageId=xxx
 * DELETE /api/m07/documents/:id/images?imageId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { handleUpload } from '@/lib/upload'
import { unlinkSync, existsSync } from 'fs'
import { join } from 'path'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const docResult = await query(
      `SELECT id, case_id FROM patent_documents WHERE id = $1`,
      [id]
    )
    if (docResult.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    const imagesResult = await query(
      `SELECT id, case_id, document_id, filename, original_name, url, mime_type, size, caption, position, section, created_at
       FROM document_images
       WHERE document_id = $1
       ORDER BY position ASC, created_at ASC`,
      [id]
    )

    return NextResponse.json(success(imagesResult.rows))
  } catch (err: any) {
    console.error('获取文档图片失败:', err)
    return NextResponse.json(error('获取文档图片失败', 500))
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params

    const docResult = await query(
      `SELECT id, case_id, type FROM patent_documents WHERE id = $1`,
      [id]
    )
    if (docResult.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    const document = docResult.rows[0]
    const uploadResult = await handleUpload(request, {
      subDir: `m07/documents/${id}`,
      allowedTypes: ['image/*'],
    })

    const caption = uploadResult.fields?.caption || ''
    const position = Number(uploadResult.fields?.position || 0)
    const section = uploadResult.fields?.section || 'drawings'

    const insertResult = await query(
      `INSERT INTO document_images (case_id, document_id, filename, original_name, url, mime_type, size, caption, position, section)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, case_id, document_id, filename, original_name, url, mime_type, size, caption, position, section, created_at`,
      [document.case_id, id, uploadResult.filename, uploadResult.originalName, uploadResult.url, uploadResult.mimeType, uploadResult.size, caption, position, section]
    )

    return NextResponse.json(success(insertResult.rows[0], '图片上传并绑定成功'))
  } catch (err: any) {
    console.error('上传文档图片失败:', err)
    return NextResponse.json(error(err.message || '上传文档图片失败', 500))
  }
}

// PATCH /api/m07/documents/:id/images?imageId=xxx
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    if (!imageId) return NextResponse.json(error('缺少 imageId 参数', 400))

    // 确认图片属于该文档
    const imgResult = await query(
      `SELECT id FROM document_images WHERE id = $1 AND document_id = $2`,
      [imageId, id]
    )
    if (imgResult.rows.length === 0) {
      return NextResponse.json(error('图片不存在', 404))
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.caption !== undefined) { updates.push(`caption = $${paramIndex++}`); values.push(body.caption) }
    if (body.position !== undefined) { updates.push(`position = $${paramIndex++}`); values.push(body.position) }
    if (body.section !== undefined) { updates.push(`section = $${paramIndex++}`); values.push(body.section) }

    if (updates.length === 0) {
      return NextResponse.json(error('没有需要更新的字段', 400))
    }

    values.push(imageId)
    const result = await query(
      `UPDATE document_images SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, case_id, document_id, filename, original_name, url, mime_type, size, caption, position, section, created_at`,
      values
    )

    return NextResponse.json(success(result.rows[0], '图片信息更新成功'))
  } catch (err: any) {
    console.error('更新图片信息失败:', err)
    return NextResponse.json(error(err.message || '更新图片信息失败', 500))
  }
}

// DELETE /api/m07/documents/:id/images?imageId=xxx
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    if (!imageId) return NextResponse.json(error('缺少 imageId 参数', 400))

    // 查图片记录
    const imgResult = await query(
      `SELECT id, filename, url FROM document_images WHERE id = $1 AND document_id = $2`,
      [imageId, id]
    )
    if (imgResult.rows.length === 0) {
      return NextResponse.json(error('图片不存在', 404))
    }

    const image = imgResult.rows[0]

    // 删除物理文件
    try {
      const filePath = join(process.cwd(), 'public', image.url)
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    } catch (fsErr) {
      console.warn('删除图片文件失败（可能已不存在）:', fsErr)
    }

    // 删除数据库记录
    await query('DELETE FROM document_images WHERE id = $1', [imageId])

    return NextResponse.json(success(null, '图片已删除'))
  } catch (err: any) {
    console.error('删除图片失败:', err)
    return NextResponse.json(error(err.message || '删除图片失败', 500))
  }
}
