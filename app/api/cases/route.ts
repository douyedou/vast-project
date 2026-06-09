/**
 * 案件管理
 * GET  /api/cases?page=1&pageSize=20&status=xxx&keyword=xxx
 * POST /api/cases
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error, paginate } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query, transaction } from '@/lib/db'

// 生成业务编号：PAT-YYYYMMDD-NNNN
async function generateCaseId(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `PAT-${today}`
  const result = await query(
    "SELECT case_id FROM cases WHERE case_id LIKE $1 ORDER BY case_id DESC LIMIT 1",
    [`${prefix}%`]
  )
  let seq = 1
  if (result.rows.length > 0) {
    const lastId = result.rows[0].case_id
    const lastSeq = parseInt(lastId.split('-')[2])
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`
}

// GET /api/cases — 案件列表
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
    const status = searchParams.get('status')
    const keyword = searchParams.get('keyword')?.trim()
    const type = searchParams.get('type')

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (keyword) {
      conditions.push(`(title ILIKE $${paramIndex} OR case_id ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      params.push(`%${keyword}%`)
      paramIndex++
    }
    if (status) {
      conditions.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }
    if (type) {
      conditions.push(`type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    // 非管理员只能查看自己相关的案件
    if (user.role !== 'admin') {
      conditions.push(`(applicant_id = $${paramIndex} OR engineer_id = $${paramIndex} OR reviewer_id = $${paramIndex})`)
      params.push(user.id)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(`SELECT COUNT(*) FROM cases ${whereClause}`, params)
    const total = parseInt(countResult.rows[0].count)

    const dataParams = [...params, pageSize, (page - 1) * pageSize]
    const dataResult = await query(
      `SELECT c.*,
        applicant.name as applicant_name,
        engineer.name as engineer_name,
        reviewer.name as reviewer_name
       FROM cases c
       LEFT JOIN users applicant ON c.applicant_id = applicant.id
       LEFT JOIN users engineer ON c.engineer_id = engineer.id
       LEFT JOIN users reviewer ON c.reviewer_id = reviewer.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    )

    return NextResponse.json(paginate(dataResult.rows, total, page, pageSize))
  } catch (err: any) {
    console.error('获取案件列表失败:', err)
    return NextResponse.json(error('获取案件列表失败', 500))
  }
}

// POST /api/cases — 创建案件
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { title, type, description, priority } = body

    if (!title || !type) {
      return NextResponse.json(error('案件标题和类型不能为空', 400))
    }
    if (!['invention', 'utility', 'design'].includes(type)) {
      return NextResponse.json(error('无效的案件类型', 400))
    }

    const caseId = await generateCaseId()

    const result = await query(
      `INSERT INTO cases (case_id, title, type, description, priority, applicant_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [caseId, title, type, description || null, priority || 'normal', user.id, 'draft']
    )

    // 记录状态变更历史
    await query(
      `INSERT INTO case_status_history (case_id, from_status, to_status, operator_id, remark)
       VALUES ($1, NULL, $2, $3, $4)`,
      [result.rows[0].id, 'draft', user.id, '案件创建']
    )

    return NextResponse.json(success(result.rows[0], '创建案件成功'))
  } catch (err: any) {
    console.error('创建案件失败:', err)
    return NextResponse.json(error('创建案件失败', 500))
  }
}
