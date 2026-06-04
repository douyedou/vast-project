/**
 * 说明书附图专用 API
 * 图片绑定到说明书文档（patent_documents type=spec）
 *
 * @openapi
 * /api/m07/spec-draft-page/images:
 *   get:
 *     summary: 获取说明书附图列表
 *     description: 根据说明书 documentId 获取所有附图
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 说明书文档 ID（patent_documents.id）
 *     responses:
 *       "200":
 *         description: 附图列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SpecImage'
 *                 message: { type: string }
 *   post:
 *     summary: 上传说明书附图
 *     description: 上传图片到指定说明书文档
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, documentId]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 图片文件 (PNG/JPG/WebP)
 *               documentId:
 *                 type: string
 *                 description: 说明书文档 ID（patent_documents.id）
 *               caption:
 *                 type: string
 *                 description: 图名描述
 *               position:
 *                 type: number
 *                 description: 排序序号
 *               section:
 *                 type: string
 *                 description: 所属章节
 *     responses:
 *       "200":
 *         description: 上传成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number }
 *                 data: { $ref: '#/components/schemas/SpecImage' }
 *                 message: { type: string }
 *   patch:
 *     summary: 修改图片信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: imageId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpecImageUpdateRequest'
 *     responses:
 *       "200":
 *         description: 更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code: { type: number }
 *                 data: { $ref: '#/components/schemas/SpecImage' }
 *                 message: { type: string }
 *   delete:
 *     summary: 删除图片
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: imageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       "200":
 *         description: 删除成功
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { mkdirSync, existsSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import Busboy from 'busboy'

// ============================================================
// GET — 获取说明书的所有附图
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    if (!documentId) return NextResponse.json(error('缺少 documentId 参数', 400))

    const result = await query(
      `SELECT id, case_id, document_id, filename, original_name, url, mime_type, size, caption, position, section, created_at
       FROM document_images
       WHERE document_id = $1
       ORDER BY position ASC, created_at ASC`,
      [documentId]
    )

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('获取说明书附图失败:', err)
    return NextResponse.json(error('获取说明书附图失败', 500))
  }
}

// ============================================================
// POST — 上传说明书附图
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const parsed = await parseFormData(request)
    if (!parsed.file) return NextResponse.json(error('未找到上传文件', 400))

    const documentId = parsed.fields.documentId
    if (!documentId) return NextResponse.json(error('缺少 documentId', 400))

    // 确认说明书存在
    const docResult = await query(
      `SELECT id, case_id, type FROM patent_documents WHERE id = $1 AND type = 'spec'`,
      [documentId]
    )
    if (docResult.rows.length === 0) return NextResponse.json(error('说明书文档不存在', 404))

    const specDoc = docResult.rows[0]
    const caption = parsed.fields.caption || ''
    const position = Number(parsed.fields.position || 0)
    const section = parsed.fields.section || 'drawings'

    // 存磁盘
    const dir = join(process.cwd(), 'public', 'spec_images', specDoc.case_id)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

    const ext = (parsed.file.originalName.split('.').pop() || 'png').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    const filename = `${uuidv4()}.${ext}`
    writeFileSync(join(dir, filename), parsed.file.buffer)

    const url = `/spec_images/${specDoc.case_id}/${filename}`

    // 写入数据库
    const insertResult = await query(
      `INSERT INTO document_images (case_id, document_id, filename, original_name, url, mime_type, size, caption, position, section)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, case_id, document_id, filename, original_name, url, mime_type, size, caption, position, section, created_at`,
      [specDoc.case_id, documentId, filename, parsed.file.originalName, url, parsed.file.mimeType, parsed.file.size, caption, position, section]
    )

    return NextResponse.json(success(insertResult.rows[0], '图片上传成功'))
  } catch (err: any) {
    console.error('上传说明书附图失败:', err)
    return NextResponse.json(error(err.message || '上传说明书附图失败', 500))
  }
}

// ============================================================
// PATCH / DELETE — 同上（不变）
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    if (!imageId) return NextResponse.json(error('缺少 imageId 参数', 400))

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (body.caption !== undefined) { updates.push(`caption = $${idx++}`); values.push(body.caption) }
    if (body.description !== undefined) { updates.push(`description = $${idx++}`); values.push(body.description) }
    if (body.position !== undefined) { updates.push(`position = $${idx++}`); values.push(body.position) }
    if (body.section !== undefined) { updates.push(`section = $${idx++}`); values.push(body.section) }

    if (updates.length === 0) return NextResponse.json(error('没有需要更新的字段', 400))

    values.push(imageId)
    const result = await query(
      `UPDATE document_images SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING id, case_id, document_id, filename, original_name, url, mime_type, size, caption, description, position, section, created_at`,
      values
    )
    if (result.rows.length === 0) return NextResponse.json(error('图片不存在', 404))

    return NextResponse.json(success(result.rows[0], '图片信息已更新'))
  } catch (err: any) {
    console.error('更新图片信息失败:', err)
    return NextResponse.json(error(err.message || '更新图片信息失败', 500))
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    if (!imageId) return NextResponse.json(error('缺少 imageId 参数', 400))

    const imgResult = await query(
      `SELECT id, url FROM document_images WHERE id = $1`,
      [imageId]
    )
    if (imgResult.rows.length === 0) return NextResponse.json(error('图片不存在', 404))

    try {
      const filePath = join(process.cwd(), 'public', imgResult.rows[0].url)
      if (existsSync(filePath)) unlinkSync(filePath)
    } catch (fsErr) {
      console.warn('删除图片文件失败:', fsErr)
    }

    await query('DELETE FROM document_images WHERE id = $1', [imageId])

    return NextResponse.json(success(null, '图片已删除'))
  } catch (err: any) {
    console.error('删除图片失败:', err)
    return NextResponse.json(error(err.message || '删除图片失败', 500))
  }
}

// ============================================================
// 工具：手动解析 multipart/form-data
// ============================================================
interface ParsedFile {
  originalName: string
  mimeType: string
  buffer: Buffer
  size: number
}

async function parseFormData(request: Request): Promise<{ file: ParsedFile | null; fields: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {}
    request.headers.forEach((v, k) => { headers[k] = v })

    const busboy = Busboy({ headers })
    let file: ParsedFile | null = null
    const fields: Record<string, string> = {}

    busboy.on('field', (name, value) => { fields[name] = value })

    busboy.on('file', (_fieldname, stream, info) => {
      const { filename, mimeType } = info
      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks)
        file = { originalName: filename, mimeType, buffer, size: buffer.length }
      })
    })

    busboy.on('finish', () => resolve({ file, fields }))
    busboy.on('error', (err: Error) => reject(err))

    if (request.body) {
      const reader = request.body.getReader()
      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) { busboy.end(); return }
          busboy.write(Buffer.from(value))
          return pump()
        })
      pump().catch(reject)
    } else {
      reject(new Error('请求体为空'))
    }
  })
}

