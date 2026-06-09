/**
 * 案件协作撰写人管理
 * GET    /api/cases/[id]/engineers            — 列出所有撰写人
 * POST   /api/cases/[id]/engineers            — 邀请协作人
 * DELETE /api/cases/[id]/engineers?engineerId=xxx — 移除协作人
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET — 列出主撰写人 + 协作人
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { id } = await params

    // 查主撰写人
    const caseResult = await query(
      `SELECT c.engineer_id, u.name as engineer_name
       FROM cases c LEFT JOIN users u ON u.id = c.engineer_id
       WHERE c.id = $1`,
      [id]
    )
    if (caseResult.rows.length === 0) return NextResponse.json(error('案件不存在', 404), { status: 404 })

    const owner = {
      engineerId: caseResult.rows[0].engineer_id,
      engineerName: caseResult.rows[0].engineer_name,
      role: 'owner' as const,
    }

    // 查协作人
    const collabResult = await query(
      `SELECT ce.engineer_id, u.name as engineer_name, ce.invited_by, inv.name as invited_by_name, ce.created_at
       FROM case_engineers ce
       JOIN users u ON u.id = ce.engineer_id
       LEFT JOIN users inv ON inv.id = ce.invited_by
       WHERE ce.case_id = $1
       ORDER BY ce.created_at ASC`,
      [id]
    )

    const collaborators = collabResult.rows.map(r => ({
      engineerId: r.engineer_id,
      engineerName: r.engineer_name,
      role: 'collaborator' as const,
      invitedBy: r.invited_by_name || '—',
      invitedAt: r.created_at,
    }))

    return NextResponse.json(success([owner, ...collaborators]))
  } catch (err: any) {
    console.error('获取撰写人列表失败:', err)
    return NextResponse.json(error('获取失败', 500), { status: 500 })
  }
}

// POST — 邀请协作人（仅主 engineer 可操作）
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { engineerId } = body || {}
    if (!engineerId) return NextResponse.json(error('缺少 engineerId', 400), { status: 400 })

    // 权限：仅主 engineer 或 admin
    const caseCheck = await query(`SELECT engineer_id FROM cases WHERE id = $1`, [id])
    if (caseCheck.rows.length === 0) return NextResponse.json(error('案件不存在', 404), { status: 404 })
    if (user.role !== 'admin' && user.id !== caseCheck.rows[0].engineer_id) {
      return NextResponse.json(error('仅主撰写人可邀请协作人', 403), { status: 403 })
    }

    // 不能邀请自己
    if (engineerId === caseCheck.rows[0].engineer_id) {
      return NextResponse.json(error('不能邀请自己', 400), { status: 400 })
    }

    // 目标用户必须是 engineer 角色
    const targetCheck = await query(
      `SELECT id, name, role FROM users WHERE id = $1 AND role = 'engineer'`,
      [engineerId]
    )
    if (targetCheck.rows.length === 0) {
      return NextResponse.json(error('目标用户不存在或不是专利工程师', 400), { status: 400 })
    }

    // 插入（忽略重复）
    await query(
      `INSERT INTO case_engineers (case_id, engineer_id, invited_by)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [id, engineerId, user.id]
    )

    return NextResponse.json(success({
      engineerId,
      engineerName: targetCheck.rows[0].name,
    }, '邀请成功'))
  } catch (err: any) {
    console.error('邀请协作人失败:', err)
    return NextResponse.json(error('邀请失败', 500), { status: 500 })
  }
}

// DELETE — 移除协作人（仅主 engineer 可操作）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const engineerId = searchParams.get('engineerId')
    if (!engineerId) return NextResponse.json(error('缺少 engineerId', 400), { status: 400 })

    // 权限
    const caseCheck = await query(`SELECT engineer_id FROM cases WHERE id = $1`, [id])
    if (caseCheck.rows.length === 0) return NextResponse.json(error('案件不存在', 404), { status: 404 })
    if (user.role !== 'admin' && user.id !== caseCheck.rows[0].engineer_id) {
      return NextResponse.json(error('仅主撰写人可移除协作人', 403), { status: 403 })
    }

    await query(`DELETE FROM case_engineers WHERE case_id = $1 AND engineer_id = $2`, [id, engineerId])

    return NextResponse.json(success(null, '已移除'))
  } catch (err: any) {
    console.error('移除协作人失败:', err)
    return NextResponse.json(error('移除失败', 500), { status: 500 })
  }
}
