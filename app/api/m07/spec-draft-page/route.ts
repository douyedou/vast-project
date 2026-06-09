/**
 * 说明书起草页 API
 *
 * @openapi
 * /api/m07/spec-draft-page:
 *   get:
 *     summary: 获取说明书文档
 *     description: 根据 caseId 获取说明书（自动创建如果不存在）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: 案件 ID
 *     responses:
 *       "200":
 *         description: 说明书文档
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 data:
 *                   $ref: '#/components/schemas/SpecDocument'
 *                 message:
 *                   type: string
 *   post:
 *     summary: 保存说明书内容
 *     description: 创建或更新说明书文档内容
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseId
 *             properties:
 *               caseId:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, writing, ai_checking, approved]
 *               aiRate:
 *                 type: number
 *     responses:
 *       "200":
 *         description: 保存成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 data:
 *                   $ref: '#/components/schemas/SpecDocument'
 *                 message:
 *                   type: string
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth, forbiddenResponse } from '@/middleware/auth'
import { query } from '@/lib/db'
import { sanitizeB64Content } from '@/lib/docx'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(error('未登录', 401), { status: 401 })
    }

    const url = new URL(request.url)
    const caseId = url.searchParams.get('caseId')
    if (!caseId) {
      return NextResponse.json(error('缺少 caseId 参数', 400), { status: 400 })
    }

    const caseResult = await query(
      `SELECT id, title, type, engineer_id, applicant_id, reviewer_id, status
       FROM cases WHERE id = $1`,
      [caseId]
    )

    if (caseResult.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404), { status: 404 })
    }

    const caseItem = caseResult.rows[0]
    const isAllowed = user.role === 'admin' || user.id === caseItem.engineer_id
    if (!isAllowed) {
      return forbiddenResponse()
    }

    const docResult = await query(
      `SELECT id, case_id, type, content, status, ai_rate, version,
              tech_field, background, summary, drawings_desc, embodiment, effects,
              created_at, updated_at
       FROM patent_documents
       WHERE case_id = $1 AND type = 'spec'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [caseId]
    )

    // 找到了
    if (docResult.rows.length > 0) {
      const row = docResult.rows[0]
      // 已确认锁定 → 返回纯文本内容（只读），前端用于支持段落选择等
      if (row.status !== 'draft') {
        const sanitized = sanitizeB64Content(row.content)
        return NextResponse.json(success({
          id: row.id,
          case_id: row.case_id,
          type: row.type,
          status: row.status,
          version: row.version,
          content: sanitized.content,
          tech_field: row.tech_field,
          background: row.background,
          summary: row.summary,
          drawings_desc: row.drawings_desc,
          embodiment: row.embodiment,
          effects: row.effects,
          locked: true,
          message: '说明书已确认提交，请在双文档工作台中使用 OnlyOffice 编辑',
        }))
      }
      // 草稿状态 → 返回纯文本
      const sanitized = sanitizeB64Content(row.content)
      row.content = sanitized.content
      if (sanitized.hasDocx) (row as any).has_docx = true
      return NextResponse.json(success(row))
    }

    // 没找到 → 自动创建说明书
    const insertResult = await query(
      `INSERT INTO patent_documents (case_id, type, content, status, ai_rate)
       VALUES ($1, 'spec', '', 'draft', 0)
       RETURNING id, case_id, type, content, status, ai_rate, version,
                 tech_field, background, summary, drawings_desc, embodiment, effects,
                 created_at, updated_at`,
      [caseId]
    )

    return NextResponse.json(success(insertResult.rows[0], '说明书已自动创建'))
  } catch (err: any) {
    console.error('获取说明书初稿失败:', err)
    return NextResponse.json(error('获取说明书初稿失败', 500), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(error('未登录', 401), { status: 401 })
    }

    const body = await request.json()
    const { caseId, content, status, aiRate } = body || {}

    // 六子项
    const chapterFields: Record<string, string | undefined> = {
      tech_field: body.tech_field,
      background: body.background,
      summary: body.summary,
      drawings_desc: body.drawings_desc,
      embodiment: body.embodiment,
      effects: body.effects,
    }

    if (!caseId) {
      return NextResponse.json(error('缺少 caseId 参数', 400), { status: 400 })
    }

    if (status && !['draft', 'writing', 'ai_checking', 'approved'].includes(status)) {
      return NextResponse.json(error('无效的 status 值', 400), { status: 400 })
    }

    const caseResult = await query(
      `SELECT id, title, type, engineer_id, applicant_id, reviewer_id, status
       FROM cases WHERE id = $1`,
      [caseId]
    )

    if (caseResult.rows.length === 0) {
      return NextResponse.json(error('案件不存在', 404), { status: 404 })
    }

    const caseItem = caseResult.rows[0]
    if (user.role !== 'admin' && user.id !== caseItem.engineer_id) {
      return forbiddenResponse()
    }

    const existingDoc = await query(
      `SELECT id, content, status, version,
              tech_field, background, summary, drawings_desc, embodiment, effects
       FROM patent_documents
       WHERE case_id = $1 AND type = 'spec'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [caseId]
    )

    let savedDoc
    if (existingDoc.rows.length === 0) {
      const insertResult = await query(
        `INSERT INTO patent_documents (case_id, type, content, status, ai_rate,
                   tech_field, background, summary, drawings_desc, embodiment, effects)
         VALUES ($1, 'spec', $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, case_id, type, content, status, ai_rate, version,
                   tech_field, background, summary, drawings_desc, embodiment, effects,
                   created_at, updated_at`,
        [caseId, content || '', status || 'draft', aiRate ?? 0,
         chapterFields.tech_field || '', chapterFields.background || '', chapterFields.summary || '',
         chapterFields.drawings_desc || '', chapterFields.embodiment || '', chapterFields.effects || '']
      )
      savedDoc = insertResult.rows[0]
    } else {
      const oldDoc = existingDoc.rows[0]
      const updates: string[] = []
      const values: any[] = []
      let idx = 1

      if (content !== undefined) {
        updates.push(`content = $${idx++}`)
        values.push(content)
      }
      if (status !== undefined) {
        updates.push(`status = $${idx++}`)
        values.push(status)
      }
      if (aiRate !== undefined) {
        updates.push(`ai_rate = $${idx++}`)
        values.push(aiRate)
      }
      // 六子项
      const chapterCols: [string, string | undefined][] = [
        ["tech_field", body.tech_field],
        ["background", body.background],
        ["summary", body.summary],
        ["drawings_desc", body.drawings_desc],
        ["embodiment", body.embodiment],
        ["effects", body.effects],
      ]
      for (const [col, val] of chapterCols) {
        if (val !== undefined) {
          updates.push(`${col} = $${idx++}`)
          values.push(val)
        }
      }

      // 章节字段有更新时，自动合并 content
      const hasChapterUpdate = chapterCols.some(([, v]) => v !== undefined)
      if (hasChapterUpdate) {
        const tf = body.tech_field ?? oldDoc.tech_field ?? ""
        const bg = body.background ?? oldDoc.background ?? ""
        const sm = body.summary ?? oldDoc.summary ?? ""
        const dd = body.drawings_desc ?? oldDoc.drawings_desc ?? ""
        const em = body.embodiment ?? oldDoc.embodiment ?? ""
        const ef = body.effects ?? oldDoc.effects ?? ""
        const merged = [tf && `技术领域\n${tf}`, bg && `背景技术\n${bg}`, sm && `发明内容\n${sm}`, dd && `附图说明\n${dd}`, em && `具体实施方式\n${em}`, ef && `有益效果\n${ef}`].filter(Boolean).join("\n\n")
        updates.push(`content = $${idx++}`)
        values.push(merged)
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()')
        values.push(existingDoc.rows[0].id)

        const updateResult = await query(
          `UPDATE patent_documents SET ${updates.join(', ')} WHERE id = $${idx}
           RETURNING id, case_id, type, content, status, ai_rate, version,
                     tech_field, background, summary, drawings_desc, embodiment, effects,
                     created_at, updated_at`,
          values
        )
        savedDoc = updateResult.rows[0]
      } else {
        const docResult = await query(
          `SELECT id, case_id, type, content, status, ai_rate, version,
                  tech_field, background, summary, drawings_desc, embodiment, effects,
                  created_at, updated_at
           FROM patent_documents WHERE id = $1`,
          [existingDoc.rows[0].id]
        )
        savedDoc = docResult.rows[0]
      }
    }

    if (status === 'writing' && caseItem.status !== 'writing') {
      await query(`UPDATE cases SET status = 'writing', updated_at = NOW() WHERE id = $1`, [caseId])
    }

    return NextResponse.json(success(savedDoc, '说明书保存成功'))
  } catch (err: any) {
    console.error('保存说明书初稿失败:', err)
    return NextResponse.json(error('保存说明书初稿失败', 500), { status: 500 })
  }
}
