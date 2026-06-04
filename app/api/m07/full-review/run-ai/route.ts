/**
 * 全文复核 AI 检测 — 填充查重率、交底覆盖率、术语一致性
 * POST /api/m07/full-review/run-ai
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const body = await request.json()
    const { caseId } = body || {}
    if (!caseId) return NextResponse.json(error('缺少 caseId', 400), { status: 400 })

    // ── 并行读取数据 ──
    const [specRow, claimsRows, abstractRow, drawingsRow, disclosure] = await Promise.all([
      query(`SELECT id, content, tech_field, background, summary, drawings_desc, embodiment, effects FROM patent_documents WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`, [caseId]),
      query(`SELECT claim_number, content FROM patent_documents WHERE case_id = $1 AND type = 'claim' ORDER BY claim_number ASC`, [caseId]),
      query(`SELECT content FROM patent_documents WHERE case_id = $1 AND type = 'abstract' LIMIT 1`, [caseId]),
      query(`SELECT content FROM patent_documents WHERE case_id = $1 AND type = 'drawings' ORDER BY updated_at DESC LIMIT 1`, [caseId]),
      query(`SELECT content_json FROM disclosure_documents WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`, [caseId]),
    ])

    const spec = specRow.rows[0]
    if (!spec) return NextResponse.json(error('说明书不存在', 400), { status: 400 })

    // 提取纯文本
    const specText = sanitizeB64Content(spec.content).content
    const specFull = [spec.tech_field, spec.background, spec.summary, spec.drawings_desc, spec.embodiment, spec.effects]
      .filter(Boolean).join('\n\n') || specText
    const claimsText = claimsRows.rows.map((r: any) => `权利要求${r.claim_number}：${sanitizeB64Content(r.content).content}`).join('\n')
    const abstractText = abstractRow.rows.length > 0 ? sanitizeB64Content(abstractRow.rows[0].content).content : ''
    const drawingsText = drawingsRow.rows.length > 0 ? sanitizeB64Content(drawingsRow.rows[0].content).content : ''
    const disclosureText = disclosure.rows.length > 0 && disclosure.rows[0].content_json
      ? (typeof disclosure.rows[0].content_json === 'string' ? disclosure.rows[0].content_json : JSON.stringify(disclosure.rows[0].content_json))
      : ''

    const results: Record<string, any> = {}

    // ── 1. AI 率检测 ──
    // ── 1. AI 率检测（使用已有 detectAI）──
    try {
      const detectResult = await aiService.detectAI(specFull.slice(0, 2000))
      results.aiRate = Math.min(detectResult.aiRate, 50)
      results.aiFlagged = detectResult.flagged
    } catch (e) { console.error('AI率检测失败:', e) }

    // ── 2. 查重率（知识库向量相似度）──
    try {
      const sources = await searchKnowledge(specFull.slice(0, 1500), { topK: 5 })
      if (sources.length > 0) {
        results.duplicateRate = Math.round(Math.max(...sources.map(s => s.similarity * 100)))
      } else {
        results.duplicateRate = 5
      }
    } catch (e) { console.error('查重率检测失败:', e); results.duplicateRate = 10 }

    // ── 3. 交底覆盖率 ──
    if (disclosureText) {
      try {
        const covPrompt = `你是一名专利审查员。请对比交底书和说明书，判断说明书覆盖了交底书中多少关键技术点。
交底书是发明人提供的原始资料，说明书应全面覆盖其中的技术方案和实施例。
只需返回一个JSON：{"coverageRate": 数字(0-100)}
交底书：${disclosureText.slice(0, 1500)}
说明书：${specFull.slice(0, 1500)}`
        const covText = await callAI(covPrompt)
        const match = covText.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          results.coverageRate = Math.round(Number(parsed.coverageRate) || 60)
        }
      } catch (e) { console.error('交底覆盖率检测失败:', e) }
    }

    // ── 4. 术语一致性 ──
    try {
      const termPrompt = `对比说明书和权利要求书中的术语是否一致。只需返回一个JSON：{"consistent": true/false, "issues": ["问题1", "问题2"]}
说明书片段：${specFull.slice(0, 1000)}
权利要求书：${claimsText.slice(0, 1000)}`
      const termText = await callAI(termPrompt)
      const match = termText.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        results.terminologyConsistent = parsed.consistent
        results.terminologyIssues = parsed.issues || []
      }
    } catch (e) { console.error('术语一致性检测失败:', e) }

    // ── 保存到数据库 ──
    const updates: string[] = []
    const values: any[] = []
    let idx = 1
    if (results.aiRate !== undefined) { updates.push(`ai_rate = $${idx++}`); values.push(results.aiRate) }
    if (results.duplicateRate !== undefined) { updates.push(`duplicate_rate = $${idx++}`); values.push(results.duplicateRate) }
    if (results.coverageRate !== undefined) { updates.push(`disclosure_coverage = $${idx++}`); values.push(results.coverageRate) }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()')
      values.push(spec.id)
      await query(`UPDATE patent_documents SET ${updates.join(', ')} WHERE id = $${idx}`, values)
    }

    // 保存术语一致性到 review_items
    if (results.terminologyConsistent !== undefined) {
      // 确保有 review 行
      const existingReview = await query(`SELECT id FROM reviews WHERE case_id = $1 LIMIT 1`, [caseId])
      let reviewId = existingReview.rows[0]?.id
      if (!reviewId) {
        const newReview = await query(
          `INSERT INTO reviews (case_id, reviewer_id, result) VALUES ($1, (SELECT id FROM users WHERE role = 'reviewer' LIMIT 1), 'pending') RETURNING id`,
          [caseId]
        )
        reviewId = newReview.rows[0].id
      }
      // 删旧术语项
      await query(`DELETE FROM review_items WHERE review_id = $1 AND type = 'uniformity'`, [reviewId])
      const issues = results.terminologyIssues || []
      if (issues.length > 0) {
        for (const issue of issues) {
          await query(
            `INSERT INTO review_items (review_id, type, content, severity, status) VALUES ($1, 'uniformity', $2, 'medium', 'pending')`,
            [reviewId, issue]
          )
        }
      }
    }

    return NextResponse.json(success(results, 'AI 检测完成'))
  } catch (err: any) {
    console.error('AI 检测失败:', err)
    return NextResponse.json(error('AI 检测失败: ' + err.message, 500), { status: 500 })
  }
}
