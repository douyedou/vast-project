/**
 * 获取交底书全文（来自 content_json.sections）
 * GET /api/m07/disclosure?caseId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

const SECTION_LABELS: Record<string, string> = {
  technicalProblem: '技术问题',
  backgroundTechnology: '背景技术',
  technicalSolution: '技术方案',
  embodiments: '实施方式',
  beneficialEffects: '有益效果',
  drawings: '附图说明',
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    if (!caseId) return NextResponse.json(error('缺少 caseId', 400), { status: 400 })

    const result = await query(
      `SELECT content_json
       FROM disclosure_documents
       WHERE case_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [caseId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(success([]))
    }

    const contentJson = result.rows[0].content_json || {}
    const sections = contentJson.sections || {}

    const items = Object.entries(SECTION_LABELS).map(([key, label]) => ({
      id: key,
      label,
      content: typeof sections[key] === 'string' ? sections[key] : '',
    }))

    return NextResponse.json(success(items))
  } catch (err: any) {
    console.error('获取交底内容失败:', err)
    return NextResponse.json(error('获取交底内容失败', 500), { status: 500 })
  }
}
