/**
 * 交底书多模态输入上传
 * POST /api/m06/upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { handleUpload } from '@/lib/upload'
import { parseFile } from '@/lib/file-parser'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const uploadResult = await handleUpload(request, { subDir: 'm06' })
    const parseResult = await parseFile(uploadResult.path, uploadResult.mimeType)

    return NextResponse.json(success({
      fileId: uploadResult.fileId,
      originalName: uploadResult.originalName,
      filename: uploadResult.filename,
      url: uploadResult.url,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      extractedText: parseResult.text?.substring(0, 1000),
    }, '上传成功'))
  } catch (err: any) {
    console.error('上传失败:', err)
    return NextResponse.json(error(err.message || '上传失败', 500))
  }
}
