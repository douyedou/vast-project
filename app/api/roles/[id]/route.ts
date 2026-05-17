/**
 * 角色更新/删除
 * PUT    /api/roles/:id
 * DELETE /api/roles/:id
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireRole } from '@/middleware/auth'
import { query, transaction } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/roles/:id — 更新角色（含权限分配）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole(request, ['admin'])
    if (!admin) return NextResponse.json(error('无权访问', 403))

    const { id } = await params
    const body = await request.json()
    const { name, description, permissionIds } = body

    const result = await transaction(async (client) => {
      // 检查角色是否存在
      const roleCheck = await client.query('SELECT id FROM roles WHERE id = $1', [id])
      if (roleCheck.rows.length === 0) {
        throw new Error('ROLE_NOT_FOUND')
      }

      // 更新角色基本信息
      const updates: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(name) }
      if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description) }

      if (updates.length > 0) {
        values.push(id)
        await client.query(
          `UPDATE roles SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        )
      }

      // 更新权限分配
      if (permissionIds !== undefined) {
        // 删除旧权限
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id])
        // 添加新权限
        if (permissionIds.length > 0) {
          const placeholders = permissionIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
            [id, ...permissionIds]
          )
        }
      }

      // 返回更新后的角色
      const roleResult = await client.query(
        `SELECT r.id, r.name, r.description, r.created_at,
          COALESCE(
            json_agg(
              json_build_object('id', p.id, 'module', p.module, 'action', p.action)
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'
          ) as permissions
         FROM roles r
         LEFT JOIN role_permissions rp ON r.id = rp.role_id
         LEFT JOIN permissions p ON rp.permission_id = p.id
         WHERE r.id = $1
         GROUP BY r.id`,
        [id]
      )

      return roleResult.rows[0]
    })

    return NextResponse.json(success(result, '更新角色成功'))
  } catch (err: any) {
    console.error('更新角色失败:', err)
    if (err.message === 'ROLE_NOT_FOUND') {
      return NextResponse.json(error('角色不存在', 404))
    }
    if (err.code === '23505') {
      return NextResponse.json(error('角色名称已存在', 409))
    }
    return NextResponse.json(error('更新角色失败', 500))
  }
}

// DELETE /api/roles/:id — 删除角色
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole(request, ['admin'])
    if (!admin) return NextResponse.json(error('无权访问', 403))

    const { id } = await params

    // 检查是否有用户使用此角色
    const userCheck = await query('SELECT COUNT(*) FROM users WHERE role = (SELECT name FROM roles WHERE id = $1)', [id])
    const userCount = parseInt(userCheck.rows[0].count)
    if (userCount > 0) {
      return NextResponse.json(error(`该角色下还有 ${userCount} 个用户，无法删除`, 409))
    }

    const result = await query(
      'DELETE FROM roles WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(error('角色不存在', 404))
    }

    return NextResponse.json(success({ id: result.rows[0].id }, '删除成功'))
  } catch (err: any) {
    console.error('删除角色失败:', err)
    return NextResponse.json(error('删除角色失败', 500))
  }
}
