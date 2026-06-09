/**
 * 强制保存 OnlyOffice 文档到数据库
 * POST /api/onlyoffice/forcesave
 * Body: { documentId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

const ONLYOFFICE_SERVER = process.env.ONLYOFFICE_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { documentId } = body || {}
    if (!documentId) return NextResponse.json(error('缺少 documentId', 400), { status: 400 })

    // 获取文档信息
    const docResult = await query(
      'SELECT id, type, version FROM patent_documents WHERE id = $1',
      [documentId]
    )
    if (docResult.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404), { status: 404 })
    }
    const doc = docResult.rows[0]

    // 构建文档 key
    const key = `${documentId}-v${doc.version}`

    // 调用 OnlyOffice CommandService forcesave
    const cmdUrl = `${ONLYOFFICE_SERVER}/coauthoring/CommandService.ashx`
    const cmdRes = await fetch(cmdUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c: 'forcesave', key }),
    })

    if (!cmdRes.ok) {
      console.error('[Forcesave] CommandService 返回错误:', cmdRes.status)
      return NextResponse.json(error('保存指令发送失败', 500), { status: 500 })
    }

    const cmdData = await cmdRes.json()
    if (cmdData.error && cmdData.error !== 0) {
      console.error('[Forcesave] 指令错误:', cmdData)
      return NextResponse.json(error('保存失败: ' + (cmdData.error || '未知'), 500), { status: 500 })
    }

    console.log('[Forcesave] 已触发保存, key:', key)
    return NextResponse.json(success(null, '保存指令已发送，文档正在保存'))
  } catch (err: any) {
    console.error('[Forcesave] 失败:', err)
    return NextResponse.json(error('保存失败: ' + err.message, 500), { status: 500 })
  }
}
