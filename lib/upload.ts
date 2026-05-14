/**
 * 文件上传中间件
 * 基于 busboy，兼容 Next.js App Router
 * 
 * 使用方式（在 API Route 中）：
 * import { handleUpload } from '@/lib/upload'
 * 
 * export async function POST(request: NextRequest) {
 *   const result = await handleUpload(request, 'cases/123')
 *   return NextResponse.json(success(result))
 * }
 */

import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import Busboy from 'busboy'

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
 * 处理文件上传（使用 busboy 解析）
 * @param request Request
 * @param options 上传选项
 * @returns 上传结果
 */
export async function handleUpload(
  request: Request,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const subDir = opts.subDir || ''

  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    const busboy = Busboy({ headers })
    
    let uploadedFile: UploadResult | null = null
    let hasFile = false

    busboy.on('file', (fieldname, file, info) => {
      hasFile = true
      const { filename, mimeType } = info

      // 1. 文件类型检查
      if (opts.allowedTypes && opts.allowedTypes.length > 0) {
        const isAllowed = opts.allowedTypes.some(type => {
          if (type.endsWith('/*')) {
            return mimeType.startsWith(type.replace('/*', '/'))
          }
          return mimeType === type
        })
        
        if (!isAllowed) {
          file.resume() // 丢弃文件内容
          reject(new Error(`不支持的文件类型: ${mimeType}`))
          return
        }
      }

      // 2. 生成文件名和存储路径
      const fileId = uuidv4()
      const ext = filename.split('.').pop() || ''
      const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      const safeFilename = `${fileId}${safeExt ? '.' + safeExt : ''}`
      
      const targetDir = join(UPLOAD_DIR, subDir)
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }
      
      const filePath = join(targetDir, safeFilename)

      // 3. 写入文件
      const chunks: Buffer[] = []
      let fileSize = 0

      file.on('data', (chunk: Buffer) => {
        fileSize += chunk.length
        
        // 文件大小检查
        if (opts.maxSize && fileSize > opts.maxSize) {
          file.resume() // 停止接收
          reject(new Error(`文件过大: ${Math.round(fileSize / 1024 / 1024)}MB，最大允许 ${Math.round(opts.maxSize! / 1024 / 1024)}MB`))
          return
        }
        
        chunks.push(chunk)
      })

      file.on('end', () => {
        const buffer = Buffer.concat(chunks)
        writeFileSync(filePath, buffer)

        const relativeUrl = `/uploads/${subDir ? subDir.replace(/\\/g, '/') + '/' : ''}${safeFilename}`

        uploadedFile = {
          fileId,
          originalName: filename,
          filename: safeFilename,
          url: relativeUrl,
          mimeType,
          size: fileSize,
          path: filePath,
        }
      })

      file.on('error', (err: Error) => {
        reject(new Error(`文件读取失败: ${err.message}`))
      })
    })

    busboy.on('finish', () => {
      if (!hasFile) {
        reject(new Error('没有上传文件'))
        return
      }
      if (!uploadedFile) {
        reject(new Error('文件处理失败'))
        return
      }
      resolve(uploadedFile)
    })

    busboy.on('error', (err: Error) => {
      reject(new Error(`解析表单失败: ${err.message}`))
    })

    // 读取请求体并传入 busboy
    if (request.body) {
      const reader = request.body.getReader()
      const pump = (): Promise<void> => {
        return reader.read().then(({ done, value }) => {
          if (done) {
            busboy.end()
            return
          }
          busboy.write(Buffer.from(value))
          return pump()
        })
      }
      pump().catch(err => reject(new Error(`读取请求体失败: ${err.message}`)))
    } else {
      reject(new Error('请求体为空'))
    }
  })
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
