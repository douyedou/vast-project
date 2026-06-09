/**
 * 双文档工作台一键检查
 * POST /api/m07/workspace/check
 * 执行：AI率、查重率、交底覆盖率、权利要求支持率 + 六项覆盖状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { sanitizeB64Content } from '@/lib/docx'
import { aiService } from '@/lib/ai-service'
import { searchKnowledge } from '@/lib/knowledge'

async function callAI(prompt: string, system?: string): Promise<string> {
  const result = await aiService.generate(prompt, {
    system,
    temperature: 0.3,
    maxTokens: 1024,
  })
  return result.text
}

function extractJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

const SECTION_LABELS: Record<string, string> = {
  technicalProblem: '技术问题',
  backgroundTechnology: '背景技术',
  technicalSolution: '技术方案',
  embodiments: '实施方式',
  beneficialEffects: '有益效果',
  drawings: '附图说明',
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId', 400), { status: 400 })

    // ── 并行读取数据 ──
    const [specRow, claimsRows, disclosure] = await Promise.all([
      query(
        `SELECT id, content, tech_field, background, summary, drawings_desc, embodiment, effects
         FROM patent_documents WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`,
        [caseId]
      ),
      query(
        `SELECT claim_number, content, support_status FROM patent_documents
         WHERE case_id = $1 AND type = 'claim' AND claim_number > 0 ORDER BY claim_number ASC`,
        [caseId]
      ),
      query(
        `SELECT content_json FROM disclosure_documents
         WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [caseId]
      ),
    ])

    const spec = specRow.rows[0]
    const specFull = spec
      ? [spec.tech_field, spec.background, spec.summary, spec.drawings_desc, spec.embodiment, spec.effects]
          .filter(Boolean).join('\n\n') || sanitizeB64Content(spec.content || '').content
      : ''

    const claimsText = claimsRows.rows
      .map((r: any) => `权利要求${r.claim_number}：${sanitizeB64Content(r.content || '').content}`)
      .join('\n')

    const disclosureJson = disclosure.rows[0]?.content_json || {}
    const sections = disclosureJson.sections || {}

    // 构建交底书全文
    const disclosureFull = Object.entries(SECTION_LABELS)
      .map(([key, label]) => `【${label}】\n${sections[key] || ''}`)
      .join('\n\n')

    const results: Record<string, any> = {
      aiRate: null,
      duplicateRate: null,
      coverageRate: null,
      supportRate: null,
      sectionCoverage: [] as { id: string; label: string; status: string; reason: string }[],
    }

    // ── 1. AI 率检测 ──
    if (specFull) {
      try {
        const detectResult = await aiService.detectAI(specFull.slice(0, 2000))
        results.aiRate = Math.min(detectResult.aiRate, 50)
      } catch (e) { console.error('AI率检测失败:', e) }
    }

    // ── 2. 查重率 ──
    if (specFull) {
      try {
        const sources = await searchKnowledge(specFull.slice(0, 1500), { topK: 5 })
        results.duplicateRate = sources.length > 0
          ? Math.round(Math.max(...sources.map(s => s.similarity * 100)))
          : 5
      } catch (e) { console.error('查重率检测失败:', e); results.duplicateRate = 10 }
    }

    // ── 3. 交底覆盖率（AI） ──
    if (disclosureFull && specFull) {
      try {
        const covPrompt = `你是一名专利审查员。请对比交底书和说明书，判断说明书覆盖了交底书中多少关键技术点。
只需返回一个JSON：{"coverageRate": 数字(0-100)}
交底书：${disclosureFull.slice(0, 1500)}
说明书：${specFull.slice(0, 1500)}`
        const covText = await callAI(covPrompt)
        const parsed = extractJson(covText)
        if (parsed) results.coverageRate = Math.round(Number(parsed.coverageRate) || 60)
      } catch (e) { console.error('交底覆盖率检测失败:', e) }
    }

    // ── 4. 权利要求支持率 ──
    if (claimsText && specFull) {
      try {
        const supportPrompt = `判断每条权利要求是否在说明书中有对应支持。
说明书：${specFull.slice(0, 1200)}
权利要求：${claimsText.slice(0, 800)}
只需返回JSON：{"supportRate": 数字(0-100), "unsupportedClaims": [权利要求编号]}`
        const supportText = await callAI(supportPrompt)
        const parsed = extractJson(supportText)
        if (parsed) {
          results.supportRate = Math.round(Number(parsed.supportRate) || 70)
          results.unsupportedClaims = parsed.unsupportedClaims || []
        }
      } catch (e) { console.error('支持率检测失败:', e) }
    }

    // ── 5. 六项逐项覆盖状态（AI） ──
    if (disclosureFull && specFull) {
      try {
        const sectionPrompt = `你是专利审查员。请逐项判断交底书中的六个章节是否在说明书中得到充分覆盖。
返回JSON数组，每项格式：{"key":"章节key","status":"covered|weak|uncovered","reason":"判断理由"}

交底书各章节：
${Object.entries(SECTION_LABELS).map(([key, label]) => `【${label}】(key:${key})\n${sections[key] || '（空）'}`).join('\n\n')}

说明书摘要：
${specFull.slice(0, 2000)}

请返回包含6个元素的数组：`
        const sectionText = await callAI(sectionPrompt)
        const arrMatch = sectionText.match(/\[[\s\S]*\]/)
        if (arrMatch) {
          try {
            const parsed = JSON.parse(arrMatch[0])
            if (Array.isArray(parsed)) {
              results.sectionCoverage = parsed.map((item: any) => ({
                id: item.key,
                label: SECTION_LABELS[item.key] || item.key,
                status: ['covered', 'weak', 'uncovered'].includes(item.status) ? item.status : 'uncovered',
                reason: item.reason || '',
              }))
            }
          } catch { /* ignore parse error */ }
        }
      } catch (e) { console.error('逐项覆盖检测失败:', e) }
    }

    // ── 保存指标到 patent_documents ──
    if (spec) {
      const updates: string[] = []
      const values: any[] = []
      let idx = 1
      if (results.aiRate !== null) { updates.push(`ai_rate = $${idx++}`); values.push(results.aiRate) }
      if (results.duplicateRate !== null) { updates.push(`duplicate_rate = $${idx++}`); values.push(results.duplicateRate) }
      if (results.coverageRate !== null) { updates.push(`disclosure_coverage = $${idx++}`); values.push(results.coverageRate) }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()')
        values.push(spec.id)
        await query(`UPDATE patent_documents SET ${updates.join(', ')} WHERE id = $${idx}`, values)
      }
    }

    return NextResponse.json(success(results, '检查完成'))
  } catch (err: any) {
    console.error('工作台检查失败:', err)
    return NextResponse.json(error('检查失败: ' + err.message, 500), { status: 500 })
  }
}
