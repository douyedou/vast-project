/**
 * 文件上传中间件
 * 基于 multer，统一封装文件上传逻辑
 * 
 * 使用方式（在 API Route 中）：
 * import { upload, handleUpload } from '@/lib/upload'
 * 
 * export async function POST(request: NextRequest) {
 *   const result = await handleUpload(request, 'cases/123')
 *   return NextResponse.json(success(result))
 * }
 */

import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'

// 上传文件存储根目录
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

// 确保上传目录存在
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}

export interface UploadResult {
  fileId: string
  originalName: string
  filename: string
  url: string
  mimeType: string
  size: number
  path: string
}

export interface UploadOptions {
  allowedTypes?: string[]      // 允许的文件类型，如 ['image/*', 'application/pdf']
  maxSize?: number             // 最大文件大小（字节），默认 50MB
  subDir?: string              // 子目录，如 'cases/123'
}

const DEFAULT_OPTIONS: UploadOptions = {
  allowedTypes: [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
  maxSize: 50 * 1024 * 1024,  // 50MB
}

/**
 * 处理单文件上传
 * @param request NextRequest
 * @param options 上传选项
 * @returns 上传结果
 */
export async function handleUpload(
  request: Request,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const subDir = opts.subDir || ''
  
  // 1. 解析 multipart/form-data
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    throw new Error('没有上传文件')
  }

  // 2. 文件类型检查
  if (opts.allowedTypes && opts.allowedTypes.length > 0) {
    const isAllowed = opts.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'))
      }
      return file.type === type
    })
    
    if (!isAllowed) {
      throw new Error(`不支持的文件类型: ${file.type}。允许: ${opts.allowedTypes.join(', ')}`)
    }
  }

  // 3. 文件大小检查
  if (opts.maxSize && file.size > opts.maxSize) {
    const maxMB = Math.round(opts.maxSize / 1024 / 1024)
    throw new Error(`文件过大: ${Math.round(file.size / 1024 / 1024)}MB，最大允许 ${maxMB}MB`)
  }

  // 4. 生成文件名和存储路径
  const fileId = uuidv4()
  const originalName = file.name
  const ext = originalName.split('.').pop() || ''
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  const filename = `${fileId}${safeExt ? '.' + safeExt : ''}`
  
  const targetDir = join(UPLOAD_DIR, subDir)
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }
  
  const filePath = join(targetDir, filename)

  // 5. 写入文件
  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  // 6. 返回结果
  const relativeUrl = `/uploads/${subDir ? subDir + '/' : ''}${filename}`

  return {
    fileId,
    originalName,
    filename,
    url: relativeUrl,
    mimeType: file.type,
    size: file.size,
    path: filePath,
  }
}

/**
 * 处理多文件上传
 * @param request NextRequest
 * @param options 上传选项
 * @returns 上传结果数组
 */
export async function handleMultipleUploads(
  request: Request,
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const formData = await request.formData()
  const files = formData.getAll('files') as File[]

  if (files.length === 0) {
    throw new Error('没有上传文件')
  }

  const results: UploadResult[] = []
  for (const file of files) {
    // 构造一个模拟的 Request 对象
    const mockFormData = new FormData()
    mockFormData.append('file', file)
    const mockRequest = new Request(request.url, {
      method: 'POST',
      body: mockFormData,
    })
    
    const result = await handleUpload(mockRequest, options)
    results.push(result)
  }

  return results
}

/**
 * 根据 fileId 获取文件路径
 * @param fileId 文件ID
 * @param subDir 子目录
 * @returns 文件绝对路径，不存在返回 null
 */
export function getFilePath(fileId: string, subDir?: string): string | null {
  const searchDir = subDir ? join(UPLOAD_DIR, subDir) : UPLOAD_DIR
  
  // 简单查找：fileId 开头的文件
  // 实际项目中应该维护一个文件索引表
  try {
    const { readdirSync } = require('fs')
    const files = readdirSync(searchDir)
    const matched = files.find((f: string) => f.startsWith(fileId))
    if (matched) {
      return join(searchDir, matched)
    }
  } catch {
    return null
  }
  
  return null
}

/**
 * 删除上传的文件
 * @param filePath 文件绝对路径
 */
export async function deleteFile(filePath: string): Promise<void> {
  const { unlink } = require('fs/promises')
  try {
    await unlink(filePath)
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err
  }
}
