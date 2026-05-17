/**
 * 术语库管理
 * GET  /api/m06/terminology?keyword=xxx&field=xxx
 * POST /api/m06/terminology
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error, paginate } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

// GET /api/m06/terminology
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')?.trim()
    const field = searchParams.get('field')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (keyword) {
      conditions.push(`(term ILIKE $${paramIndex} OR definition ILIKE $${paramIndex})`)
      params.push(`%${keyword}%`)
      paramIndex++
    }
    if (field) {
      conditions.push(`field = $${paramIndex}`)
      params.push(field)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(`SELECT COUNT(*) FROM terminology ${whereClause}`, params)
    const total = parseInt(countResult.rows[0].count)

    const dataParams = [...params, pageSize, (page - 1) * pageSize]
    const dataResult = await query(
      `SELECT id, field, term, definition, synonyms, usage_example, created_at
       FROM terminology ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    )

    return NextResponse.json(paginate(dataResult.rows, total, page, pageSize))
  } catch (err: any) {
    console.error('获取术语库失败:', err)
    return NextResponse.json(error('获取术语库失败', 500))
  }
}

// POST /api/m06/terminology
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const body = await request.json()
    const { field, term, definition, synonyms, usageExample } = body

    if (!field || !term) {
      return NextResponse.json(error('领域和术语不能为空', 400))
    }

    const result = await query(
      `INSERT INTO terminology (field, term, definition, synonyms, usage_example)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [field, term, definition || null, synonyms || null, usageExample || null]
    )

    return NextResponse.json(success(result.rows[0], '添加术语成功'))
  } catch (err: any) {
    console.error('添加术语失败:', err)
    if (err.code === '23505') {
      return NextResponse.json(error('该术语已存在', 409))
    }
    return NextResponse.json(error('添加术语失败', 500))
  }
}
