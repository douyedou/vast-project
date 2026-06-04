/**
 * 五书完整性校验
 * POST /api/m07/five-books/submit
 * 仅校验，不修改状态。锁定由 full-review/lock 负责。
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId 参数', 400), { status: 400 })

    const check = await Promise.all([
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'spec' AND status = 'writing' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'claim' AND status = 'writing' AND claim_number = 0 LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'abstract' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM patent_documents WHERE case_id = $1 AND type = 'drawings' AND content != '' LIMIT 1`, [caseId]),
      query(`SELECT 1 FROM document_images WHERE case_id = $1 AND is_abstract_figure = TRUE LIMIT 1`, [caseId]),
    ])

    const missing: string[] = []
    if (check[0].rows.length === 0) missing.push('说明书')
    if (check[1].rows.length === 0) missing.push('权利要求书')
    if (check[2].rows.length === 0) missing.push('摘要')
    if (check[3].rows.length === 0) missing.push('附图说明')
    if (check[4].rows.length === 0) missing.push('摘要附图')

    const allReady = missing.length === 0
    return NextResponse.json(success({ caseId, allReady, missing }, allReady ? '五书齐全' : `缺少: ${missing.join('、')}`))
  } catch (err: any) {
    console.error('五书校验失败:', err)
    return NextResponse.json(error('校验失败', 500), { status: 500 })
  }
}
