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

// API 基础 URL（OnlyOffice 容器需通过 host.docker.internal 访问宿主机）
const API_BASE_URL = process.env.ONLYOFFICE_CALLBACK_HOST || 'http://host.docker.internal:3000'

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

    // 查询文档信息（含状态）
    const docResult = await query(
      'SELECT id, type, content, version, status FROM patent_documents WHERE id = $1',
      [documentId]
    )

    if (docResult.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    const doc = docResult.rows[0]

    // 已提交审核 → 只读
    const isLocked = doc.status === 'ai_checking'

    // 文档类型映射
    const fileTypeMap: Record<string, string> = {
      spec: 'docx',
      abstract: 'docx',
      drawings: 'docx',
    }
    const fileType = fileTypeMap[doc.type] || 'docx'

    // 生成文档 key（同一版本同一 key，实现协同编辑）
    const key = `${documentId}-v${doc.version}`

    // 文档标题
    const titleMap: Record<string, string> = {
      spec: '说明书',
      abstract: '摘要',
      drawings: '附图说明',
    }
    const title = titleMap[doc.type] || '专利文档'

    // 构建回调 URL（OnlyOffice 容器通过 host.docker.internal 访问宿主机）
    const callbackUrl = `${API_BASE_URL}/api/onlyoffice/callback?documentId=${documentId}`

    // 文档下载 URL（OnlyOffice 容器通过 host.docker.internal 访问宿主机）
    const documentUrl = `${API_BASE_URL}/api/onlyoffice/document/${documentId}`

    const config = {
      document: {
        fileType,
        key,
        title: `${title}.docx`,
        url: documentUrl,
        permissions: {
          edit: !isLocked,
          download: true,
        },
      },
      editorConfig: {
        callbackUrl,
        lang: 'zh-CN',
        mode: isLocked ? 'view' : 'edit',
        // 协同编辑配置
        coEditing: {
          mode: 'fast',
          change: true,
        },
        user: {
          id: user.id,
          name: user.name || user.username,
        },
        customization: {
          forcesave: true,
          compactToolbar: false,
          toolbarHideFileName: false,
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
