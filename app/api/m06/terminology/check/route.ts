/**
 * 术语一致性检查
 * GET /api/m06/terminology/check?text=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401))

    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')

    if (!text) {
      return NextResponse.json(error('缺少 text 参数', 400))
    }

    // 获取所有术语及其同义词
    const termsResult = await query(
      'SELECT term, synonyms FROM terminology',
      []
    )

    const inconsistentTerms: Array<{ term: string; suggestedTerm: string; occurrences: number }> = []

    for (const row of termsResult.rows) {
      const mainTerm = row.term
      const synonyms: string[] = row.synonyms || []
      
      if (synonyms.length === 0) continue

      // 检查文本中是否同时出现了主术语和同义词
      const mainRegex = new RegExp(mainTerm, 'g')
      const mainCount = (text.match(mainRegex) || []).length

      for (const synonym of synonyms) {
        const synRegex = new RegExp(synonym, 'g')
        const synCount = (text.match(synRegex) || []).length

        if (mainCount > 0 && synCount > 0) {
          inconsistentTerms.push({
            term: synonym,
            suggestedTerm: mainTerm,
            occurrences: synCount,
          })
        }
      }
    }

    return NextResponse.json(success({ inconsistentTerms }))
  } catch (err: any) {
    console.error('术语一致性检查失败:', err)
    return NextResponse.json(error('术语一致性检查失败', 500))
  }
}
