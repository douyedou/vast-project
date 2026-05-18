/**
 * OnlyOffice 编辑器配置
 * GET /api/onlyoffice?documentId=xxx
 * 
 * 返回 OnlyOffice JS 初始化所需的配置参数
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

// OnlyOffice Document Server 地址（本地 Docker）
const ONLYOFFICE_SERVER = process.env.ONLYOFFICE_URL || 'http://localhost:8080'

// JWT 密钥（用于回调验证）
const ONLYOFFICE_JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || 'onlyoffice-secret'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const caseId = searchParams.get('caseId')

    if (!documentId) {
      return NextResponse.json(error('缺少 documentId 参数', 400))
    }

    // 查询文档信息
    const docResult = await query(
      'SELECT id, type, content, version FROM patent_documents WHERE id = $1',
      [documentId]
    )

    if (docResult.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    const doc = docResult.rows[0]

    // 文档类型映射
    const fileTypeMap: Record<string, string> = {
      spec: 'docx',
      claims: 'docx',
      abstract: 'docx',
      drawings: 'docx',
    }
    const fileType = fileTypeMap[doc.type] || 'docx'

    // 生成文档 key（用于 OnlyOffice 缓存控制）
    const key = `${documentId}-v${doc.version}-${Date.now()}`

    // 文档标题
    const titleMap: Record<string, string> = {
      spec: '说明书',
      claims: '权利要求书',
      abstract: '摘要',
      drawings: '附图说明',
    }
    const title = titleMap[doc.type] || '专利文档'

    // 构建回调 URL
    const callbackUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/onlyoffice/callback?documentId=${documentId}`

    // 文档下载 URL（临时方案：通过 API 提供文档内容）
    const documentUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/onlyoffice/document/${documentId}`

    const config = {
      document: {
        fileType,
        key,
        title: `${title}.docx`,
        url: documentUrl,
      },
      editorConfig: {
        callbackUrl,
        lang: 'zh-CN',
        mode: 'edit',
        user: {
          id: user.id,
          name: user.name || user.username,
        },
        permissions: {
          edit: true,
          download: true,
        },
      },
      documentType: 'word',
      height: '100%',
      width: '100%',
    }

    return NextResponse.json(success({
      config,
      onlyofficeServer: ONLYOFFICE_SERVER,
    }))
  } catch (err: any) {
    console.error('获取 OnlyOffice 配置失败:', err)
    return NextResponse.json(error('获取 OnlyOffice 配置失败', 500))
  }
}
