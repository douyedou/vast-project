/**
 * 全文复核检查
 * GET /api/m07/full-review/check?caseId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { success, error } from '@/lib/api-response'
import { requireAuth } from '@/middleware/auth'
import { query } from '@/lib/db'
import { sanitizeB64Content } from '@/lib/docx'

interface CheckItem {
  key: string
  label: string
  passed: boolean
  severity: 'blocking' | 'warning'
  detail: string
  value?: string
  location: string
  position: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return NextResponse.json(error('未登录', 401), { status: 401 })

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')
    if (!caseId) return NextResponse.json(error('缺少 caseId', 400), { status: 400 })

    // ── 并行查询 ──
    const [specRow, claimsRows, abstractRow, drawingsRow, imagesRows, fiveFigure, disclosure] = await Promise.all([
      query(`SELECT id, tech_field, background, summary, drawings_desc, embodiment, effects, ai_rate, disclosure_coverage, duplicate_rate, content FROM patent_documents WHERE case_id = $1 AND type = 'spec' ORDER BY updated_at DESC LIMIT 1`, [caseId]),
      query(`SELECT id, claim_number, content, parent_claim_id, support_status FROM patent_documents WHERE case_id = $1 AND type = 'claim' ORDER BY claim_number ASC`, [caseId]),
      query(`SELECT id, content FROM patent_documents WHERE case_id = $1 AND type = 'abstract' LIMIT 1`, [caseId]),
      query(`SELECT id, content FROM patent_documents WHERE case_id = $1 AND type = 'drawings' ORDER BY updated_at DESC LIMIT 1`, [caseId]),
      query(`SELECT id, caption, description, position FROM document_images WHERE case_id = $1 ORDER BY position`, [caseId]),
      query(`SELECT id FROM document_images WHERE case_id = $1 AND is_abstract_figure = TRUE LIMIT 1`, [caseId]),
      query(`SELECT content_json FROM disclosure_documents WHERE case_id = $1 ORDER BY updated_at DESC LIMIT 1`, [caseId]),
    ])

    const items: CheckItem[] = []

    // ── 1. 五书齐全 ──
    const booksReady = {
      spec: specRow.rows.length > 0 && (specRow.rows[0].content || '').length > 0,
      claims: claimsRows.rows.length > 0,
      abstract: abstractRow.rows.length > 0 && (abstractRow.rows[0].content || '').length > 0,
      drawings: drawingsRow.rows.length > 0 && (drawingsRow.rows[0].content || '').length > 0,
      figure: fiveFigure.rows.length > 0 || imagesRows.rows.length > 0,
    }
    const missingBooks = Object.entries(booksReady).filter(([, v]) => !v).map(([k]) => k)
    const bookNames: Record<string, string> = { spec: '说明书', claims: '权利要求书', abstract: '摘要', drawings: '说明书附图', figure: '摘要附图' }
    items.push({ key: 'five-books', label: '五书齐全', passed: missingBooks.length === 0, severity: 'blocking', detail: missingBooks.length > 0 ? `缺少 ${missingBooks.map(k => bookNames[k] || k).join('、')}` : '五书文件均已就绪', location: '五书文件', position: '五书清单' })

    // ── 2. 说明书六章完整 ──
    const spec = specRow.rows[0]
    if (spec) {
      const chapters = ['tech_field', 'background', 'summary', 'drawings_desc', 'embodiment', 'effects']
      const missing = chapters.filter(c => !(spec as any)[c])
      const chapterNames: Record<string, string> = { tech_field: '技术领域', background: '背景技术', summary: '发明内容', drawings_desc: '附图说明', embodiment: '具体实施方式', effects: '技术效果' }
      items.push({ key: 'spec-chapters', label: '说明书六章完整', passed: missing.length === 0, severity: 'blocking', detail: missing.length > 0 ? `缺少「${missing.map(c => chapterNames[c] || c).join('」「')}」章节` : '六章内容齐全', location: '说明书', position: '各章节标题' })
    } else {
    items.push({ key: 'spec-chapters', label: '说明书六章完整', passed: false, severity: 'blocking', detail: '说明书不存在，无法检查章节', location: '说明书', position: '各章节标题' })
    }

    // ── 3. 权利要求编号连续 ──
    const claimNumbers = claimsRows.rows.map((r: any) => r.claim_number).sort((a: number, b: number) => a - b)
    let claimSeqOk = true, missingNums: number[] = []
    if (claimNumbers.length > 0) {
      for (let i = 1; i <= claimNumbers[claimNumbers.length - 1]; i++) {
        if (!claimNumbers.includes(i)) { claimSeqOk = false; missingNums.push(i) }
      }
    }
    items.push({ key: 'claims-sequence', label: '权利要求编号连续', passed: claimSeqOk, severity: 'blocking', detail: claimSeqOk ? '权利要求编号连续完整' : `缺失第 ${missingNums.join('、')} 项权利要求`, location: '权利要求书', position: '权利要求编号' })

    // ── 4. 独权数量 ──
    const independentCount = claimsRows.rows.filter((r: any) => !r.parent_claim_id).length
    items.push({ key: 'independent-claims', label: '至少一条独立权利要求', passed: independentCount >= 1, severity: 'blocking', detail: independentCount >= 1 ? `共 ${independentCount} 条独立权利要求` : '缺少独立权利要求，至少需要 1 条', location: '权利要求书', position: '独立权利要求' })

    // ── 5. 从权引用有效 ──
    const idToNum = new Map<string, number>()
    for (const r of claimsRows.rows) idToNum.set(r.id, r.claim_number)
    let refError = ''
    for (const r of claimsRows.rows) {
      if (r.parent_claim_id) {
        const refNum = idToNum.get(r.parent_claim_id)
        if (!refNum) { refError = `权利要求${r.claim_number}引用不存在`; break }
        if (refNum >= r.claim_number) { refError = `权利要求${r.claim_number}引用顺序错误`; break }
        // 多项引多项检查
        if (r.content && (r.content.match(/根据权利要求\d+[和、及]\d+/))) {
          refError = `权利要求${r.claim_number}可能多项引多项`
        }
      }
    }
    items.push({ key: 'claims-ref', label: '从权引用有效', passed: !refError, severity: 'blocking', detail: refError || '从属权利要求引用关系正确', location: '权利要求书', position: '权利要求引用链' })

    // ── 6. 附图编号连续 ──
    const imgPositions = imagesRows.rows.map((r: any) => r.position).sort((a: number, b: number) => a - b)
    let imgSeqOk = true, missingImgs: number[] = []
    if (imgPositions.length > 0) {
      for (let i = 1; i <= imgPositions[imgPositions.length - 1]; i++) {
        if (!imgPositions.includes(i)) { imgSeqOk = false; missingImgs.push(i) }
      }
    }
    items.push({ key: 'images-sequence', label: '附图编号连续', passed: imgSeqOk, severity: 'warning', detail: imgSeqOk ? '附图编号连续完整' : `缺失第 ${missingImgs.join('、')} 张附图`, location: '附图', position: '附图编号列表' })

    // ── 7. 附图标记有说明 ──
    const missingCaps = imagesRows.rows.filter((r: any) => !r.caption && !r.description).length
    items.push({ key: 'images-caption', label: '附图有标记说明', passed: missingCaps === 0, severity: 'warning', detail: missingCaps > 0 ? `有 ${missingCaps} 张附图缺少标记说明文字` : '所有附图均有标记说明', location: '附图', position: '附图标注栏' })

    // ── 8. 摘要字数 ──
    if (abstractRow.rows.length > 0) {
      const abstractText = sanitizeB64Content(abstractRow.rows[0].content).content
      const len = abstractText.length
      items.push({ key: 'abstract-length', label: '摘要 ≤ 300 字', passed: len <= 300, severity: 'warning', detail: len > 300 ? `摘要共 ${len} 字，超出 300 字限制` : `摘要 ${len} 字，符合要求`, value: `${len} 字`, location: '摘要', position: '摘要正文' })
    } else {
      items.push({ key: 'abstract-length', label: '摘要 ≤ 300 字', passed: false, severity: 'warning', detail: '摘要文件不存在', location: '摘要', position: '摘要正文' })
    }

    // ── 9. 权利要求支持率 ──
    const actualClaims = claimsRows.rows.filter((r: any) => r.claim_number > 0)
    if (actualClaims.length > 0) {
      const supported = actualClaims.filter((r: any) => r.support_status === 'supported').length
      const rate = Math.round((supported / actualClaims.length) * 100)
      const supportPassed = rate >= 90
      const supportSeverity: 'blocking' | 'warning' = rate < 80 ? 'blocking' : rate < 90 ? 'warning' : 'warning'
      const supportDetail = rate >= 90 ? `支持率 ${rate}%，权利要求在说明书中均有充分支持`
        : rate >= 80 ? `支持率 ${rate}%，部分权利要求在说明书中支持不充分，建议补充`
        : `支持率仅 ${rate}%，大量权利要求在说明书中缺乏对应支持`
      items.push({ key: 'support-rate', label: '权利要求支持率', passed: supportPassed, severity: rate >= 90 ? 'warning' : supportSeverity, detail: supportDetail, value: `${rate}%`, location: '权利要求书', position: '权利要求书全文' })
    } else {
      items.push({ key: 'support-rate', label: '权利要求支持率', passed: false, severity: 'blocking', detail: '无权利要求，无法计算支持率', location: '权利要求书', position: '权利要求书全文' })
    }

    // ── 10. 交底覆盖率 ──
    const coverage = spec ? (spec as any).disclosure_coverage : null
    const covNum = coverage != null ? Number(coverage) : -1
    const covPassed = covNum >= 90
    const covSeverity: 'blocking' | 'warning' = covNum < 0 ? 'blocking' : covNum < 80 ? 'blocking' : covNum < 90 ? 'warning' : 'warning'
    const covDetail = covNum < 0 ? '尚未运行 AI 检测，请先点击「执行AI检测」'
      : covNum >= 90 ? `覆盖率 ${covNum}%，说明书充分覆盖了交底书的技术内容`
      : covNum >= 80 ? `覆盖率 ${covNum}%，说明书对交底书内容的覆盖略有不足，建议补充`
      : `覆盖率仅 ${covNum}%，说明书与交底书之间存在较大内容差距`
    items.push({
      key: 'disclosure-coverage', label: '交底覆盖率', passed: covPassed,
      severity: covNum >= 90 ? 'warning' : covSeverity,
      detail: covDetail,
      value: covNum >= 0 ? `${covNum}%` : undefined,
      location: '说明书',
      position: '说明书全文',
    })

    // ── 11. 查重率 ──
    const dupRate = spec ? (spec as any).duplicate_rate : null
    const dupNum = dupRate != null ? Number(dupRate) : -1
    const dupPassed = dupNum >= 0 && dupNum < 20
    const dupSeverity: 'blocking' | 'warning' = dupNum < 0 ? 'blocking' : dupNum >= 30 ? 'blocking' : 'warning'
    const dupDetail = dupNum < 0 ? '尚未运行 AI 检测'
      : dupNum < 20 ? `查重率 ${dupNum}%，与现有专利重复度低，原创性良好`
      : dupNum < 30 ? `查重率 ${dupNum}%，与现有专利存在一定相似度，需关注`
      : `查重率 ${dupNum}%，与现有专利高度相似，存在重复风险`
    items.push({
      key: 'duplicate-rate', label: '查重率', passed: dupPassed,
      severity: dupNum >= 0 && dupNum < 20 ? 'warning' : dupSeverity,
      detail: dupDetail,
      value: dupNum >= 0 ? `${dupNum}%` : undefined,
      location: '说明书',
      position: '说明书全文',
    })

    // ── 12. AI 生成率 ──
    const aiRate = spec ? (spec as any).ai_rate : null
    const aiNum = aiRate != null ? Number(aiRate) : -1
    const aiPassed = aiNum >= 0 && aiNum < 20
    const aiSeverity: 'blocking' | 'warning' = aiNum < 0 ? 'blocking' : aiNum >= 30 ? 'blocking' : 'warning'
    const aiDetail = aiNum < 0 ? '尚未运行 AI 检测'
      : aiNum < 20 ? `AI 痕迹 ${aiNum}%，文本自然，无明显 AI 生成特征`
      : aiNum < 30 ? `AI 痕迹 ${aiNum}%，部分段落疑似 AI 辅助撰写，建议人工润色`
      : `AI 痕迹 ${aiNum}%，文本高度疑似 AI 生成，需重点审查`
    items.push({
      key: 'ai-rate', label: 'AI 生成率', passed: aiPassed,
      severity: aiNum >= 0 && aiNum < 20 ? 'warning' : aiSeverity,
      detail: aiDetail,
      value: aiNum >= 0 ? `${aiNum}%` : undefined,
      location: '说明书',
      position: '说明书全文',
    })

    // ── 13. 术语一致性 ──
    const termResult = await query(
      `SELECT content FROM review_items ri
       JOIN reviews r ON r.id = ri.review_id
       WHERE r.case_id = $1 AND ri.type = 'uniformity'`,
      [caseId]
    )
    const termIssues = termResult.rows.map(r => (r as any).content)
    items.push({
      key: 'terminology',
      label: '术语一致性',
      passed: termIssues.length === 0,
      severity: 'warning',
      detail: termIssues.length > 0 ? termIssues.slice(0, 3).join('; ') : (disclosure.rows.length > 0 ? '说明书与权利要求书术语使用一致' : '需运行 AI 检测'),
      location: '说明书',
      position: '说明书与权利要求书',
    })

    // ── 14. 无多项引多项 ──（已在第5条中检查）
    
    // ── 15. 实施例 ──
    const hasEmbodiment = spec && (spec as any).embodiment
    items.push({ key: 'embodiment', label: '至少一个实施例', passed: !!hasEmbodiment, severity: 'blocking', detail: hasEmbodiment ? '具体实施方式章节内容充实' : '缺少具体实施方式章节', value: hasEmbodiment ? `${(spec as any).embodiment.length} 字` : undefined, location: '说明书', position: '具体实施方式章节' })

    // ── 交底书存在 ──
    const hasDisclosure = disclosure.rows.length > 0 && disclosure.rows[0].content_json
    items.push({ key: 'disclosure', label: '完整交底书可查看', passed: hasDisclosure, severity: 'blocking', detail: hasDisclosure ? '交底书已提交并可正常查看' : '该案件未关联交底书，无法进行对比复核', location: '交底书', position: '交底书文件' })

    // ── 汇总 ──
    const blocking = items.filter(i => i.severity === 'blocking')
    const warnings = items.filter(i => i.severity === 'warning')
    const allPassed = items.every(i => i.passed)
    const blockingPassed = blocking.every(i => i.passed)
    // 仅阻断项全部通过即可提交（警告不阻止提交）
    const canSubmit = items.filter(i => i.severity === 'blocking').every(i => i.passed)

    return NextResponse.json(success({
      items,
      stats: {
        total: items.length,
        passed: items.filter(i => i.passed).length,
        blocking: blocking.length,
        blockingPassed: blocking.filter(i => i.passed).length,
        warningTotal: warnings.length,
        warningActive: warnings.filter(i => !i.passed).length,
      },
      allPassed,
      blockingPassed,
      canSubmit,  // 阻断项全部通过即可提交
    }))
  } catch (err: any) {
    console.error('全文复核失败:', err)
    return NextResponse.json(error('全文复核失败', 500), { status: 500 })
  }
}
