/**
 * 文件上传测试接口
 * POST /api/upload
 * 
 * 测试文件上传和解析功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { handleUpload } from '@/lib/upload'
import { parseFile } from '@/lib/file-parser'

export async function POST(request: NextRequest) {
  try {
    // 1. 上传文件
    const uploadResult = await handleUpload(request, {
      subDir: 'test',
    })

    // 2. 读取文件内容（如果是文本类文件）
    let parsedText = ''
    const textTypes = ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain']
    
    if (textTypes.includes(uploadResult.mimeType)) {
      const { readFileSync } = require('fs')
      const buffer = readFileSync(uploadResult.path)
      const parseResult = await parseFile(buffer, uploadResult.mimeType)
      parsedText = parseResult.text.substring(0, 500) + '...'
    }

    return NextResponse.json(success({
      ...uploadResult,
      extractedText: parsedText || undefined,
    }, '上传成功'))
  } catch (err: any) {
    console.error('上传失败:', err)
    return NextResponse.json(error(err.message || '上传失败'))
  }
}
