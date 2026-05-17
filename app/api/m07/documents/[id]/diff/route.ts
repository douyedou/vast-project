/**
 * 专利文档版本对比
 * GET /api/m07/documents/:id/diff?v1=1&v2=2
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 简单的行级 diff
function simpleDiff(oldText: string, newText: string): Array<{ type: 'added' | 'removed' | 'unchanged'; content: string }> {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; content: string }> = []
  
  let i = 0, j = 0
  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      result.push({ type: 'added', content: newLines[j++] })
    } else if (j >= newLines.length) {
      result.push({ type: 'removed', content: oldLines[i++] })
    } else if (oldLines[i] === newLines[j]) {
      result.push({ type: 'unchanged', content: oldLines[i] })
      i++; j++
    } else {
      result.push({ type: 'removed', content: oldLines[i++] })
      result.push({ type: 'added', content: newLines[j++] })
    }
  }
  
  return result
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const v1 = parseInt(searchParams.get('v1') || '0')
    const v2 = parseInt(searchParams.get('v2') || '0')

    if (!v1 || !v2) {
      return NextResponse.json(error('缺少 v1 或 v2 参数', 400))
    }

    // 获取当前文档内容
    const docResult = await query('SELECT content FROM patent_documents WHERE id = $1', [id])
    if (docResult.rows.length === 0) {
      return NextResponse.json(error('文档不存在', 404))
    }

    // 获取版本历史
    const versionsResult = await query(
      `SELECT content, created_at FROM document_versions
       WHERE document_id = $1 ORDER BY created_at DESC`,
      [id]
    )

    const versions = [docResult.rows[0], ...versionsResult.rows]
    
    if (v1 > versions.length || v2 > versions.length) {
      return NextResponse.json(error('版本号无效', 400))
    }

    const oldContent = versions[v1 - 1]?.content || ''
    const newContent = versions[v2 - 1]?.content || ''

    const diff = simpleDiff(oldContent, newContent)

    return NextResponse.json(success({ diff }))
  } catch (err: any) {
    console.error('版本对比失败:', err)
    return NextResponse.json(error('版本对比失败', 500))
  }
}
