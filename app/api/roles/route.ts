/**
 * 角色管理
 * GET  /api/roles
 * POST /api/roles
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireRole } from '@/middleware/auth'
import { query, transaction } from '@/lib/db'

// GET /api/roles — 角色列表（含权限）
export async function GET(request: NextRequest) {
  try {
    const admin = await requireRole(request, ['admin'])
    if (!admin) return NextResponse.json(error('无权访问', 403))

    const result = await query(
      `SELECT r.id, r.name, r.description, r.created_at,
        COALESCE(
          json_agg(
            json_build_object('id', p.id, 'module', p.module, 'action', p.action, 'description', p.description)
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       GROUP BY r.id
       ORDER BY r.created_at DESC`
    )

    return NextResponse.json(success(result.rows))
  } catch (err: any) {
    console.error('获取角色列表失败:', err)
    return NextResponse.json(error('获取角色列表失败', 500))
  }
}

// POST /api/roles — 创建角色
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, ['admin'])
    if (!admin) return NextResponse.json(error('无权访问', 403))

    const body = await request.json()
    const { name, description, permissionIds } = body

    if (!name) {
      return NextResponse.json(error('角色名称不能为空', 400))
    }

    const result = await transaction(async (client) => {
      // 创建角色
      const roleResult = await client.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at',
        [name, description || null]
      )
      const role = roleResult.rows[0]

      // 分配权限
      if (permissionIds && permissionIds.length > 0) {
        const values = permissionIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`,
          [role.id, ...permissionIds]
        )
      }

      return role
    })

    return NextResponse.json(success(result, '创建角色成功'))
  } catch (err: any) {
    console.error('创建角色失败:', err)
    if (err.code === '23505') {
      return NextResponse.json(error('角色名称已存在', 409))
    }
    return NextResponse.json(error('创建角色失败', 500))
  }
}
