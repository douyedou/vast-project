'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Loader2, Sparkles, Search } from 'lucide-react'

interface ReviewDecisionPageProps {
  reviewId?: string | null
  onNavigate?: (page: string) => void
  onReviewSelect?: (reviewId: string) => void
}

interface IssueItem { id: string; title: string; module: string }
interface ReviewCase { reviewId: string; caseNo: string; title: string; type: string; status: string; created_at: string; preliminaryDone: boolean; disclosureDone: boolean; fiveBooksDone: boolean }

export function ReviewDecisionPage({ reviewId: initialReviewId, onNavigate, onReviewSelect }: ReviewDecisionPageProps) {
  const [activeReviewId, setActiveReviewId] = useState<string | null>(initialReviewId ?? null)
  const [casesList, setCasesList] = useState<ReviewCase[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState('')

  const [decision, setDecision] = useState('')
  const [decisionComment, setDecisionComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [runningAI, setRunningAI] = useState(false)

  const [blockingIssues, setBlockingIssues] = useState<IssueItem[]>([])
  const [warningIssues, setWarningIssues] = useState<IssueItem[]>([])
  const [suggestionCount, setSuggestionCount] = useState(0)
  const [aiReason, setAiReason] = useState('')
  const [existingResult, setExistingResult] = useState<string | null>(null)

  // 载入案例列表
  useEffect(() => {
    if (activeReviewId) return
    setCasesLoading(true)
    const token = localStorage.getItem('vast_token')
    fetch('/api/m08/reviews?page=1&pageSize=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.code === 200) {
          setCasesList((d.data.list || []).map((r: any) => ({
            reviewId: r.reviewId,
            caseNo: r.case_id,
            title: r.title,
            type: r.type,
            status: r.status,
            created_at: r.created_at,
            preliminaryDone: r.preliminaryDone,
            disclosureDone: r.disclosureDone,
            fiveBooksDone: r.fiveBooksDone,
          })))
        }
      })
      .finally(() => setCasesLoading(false))
  }, [activeReviewId])

  // 载入决策数据
  useEffect(() => {
    if (!activeReviewId) return
    setLoading(true)
    const token = localStorage.getItem('vast_token')
    fetch(`/api/m08/review-decision?reviewId=${encodeURIComponent(activeReviewId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d?.code === 200) {
          // 检查三步骤是否全部完成（不满足静默退回，不弹窗）
          const allDone = d.data.preliminaryDone && d.data.disclosureDone && d.data.fiveBooksDone
          if (!allDone) { setActiveReviewId(null); setLoading(false); return }
          setBlockingIssues((d.data.blocking || []).map((i: any) => ({ id: i.id, title: i.content, module: i.typeLabel })))
          setWarningIssues((d.data.warnings || []).map((i: any) => ({ id: i.id, title: i.content, module: i.typeLabel })))
          setSuggestionCount(d.data.suggestions?.length || 0)
          setExistingResult(d.data.existingResult)
        }
      })
      .finally(() => setLoading(false))
  }, [activeReviewId])

  const handleSelectCase = (reviewId: string) => {
    const c = casesList.find(x => x.reviewId === reviewId)
    if (!c) return
    const missing: string[] = []
    if (!c.preliminaryDone) missing.push('初步审核')
    if (!c.disclosureDone) missing.push('交底审核')
    if (!c.fiveBooksDone) missing.push('五书审核')
    if (missing.length > 0) { alert(`请先完成${missing.join('、')}后再进行审核决策`); return }
    setActiveReviewId(reviewId)
    onReviewSelect?.(reviewId)
  }

  const runAI = async () => {
    if (!activeReviewId) return
    setRunningAI(true)
    setAiReason('')
    try {
      const token = localStorage.getItem('vast_token')
      const res = await fetch('/api/m08/review-decision/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewId: activeReviewId }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        setDecision(d.data.recommendation)
        setAiReason(d.data.reason)
        if (d.data.reason) setDecisionComment(d.data.reason)
      }
    } finally { setRunningAI(false) }
  }

  const handleSubmitDecision = async () => {
    if (!activeReviewId) return
    setIsSubmitting(true)
    const token = localStorage.getItem('vast_token')
    try {
      const res = await fetch(`/api/m08/reviews/${activeReviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ result: decision, comments: decisionComment }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        if (decision === 'pass') onNavigate?.('m09-dashboard')
        else if (decision === 'reject-m06') onNavigate?.('m06-dashboard')
        else if (decision === 'reject-m07') onNavigate?.('m07-dashboard')
        else if (decision === 'reject-case') onNavigate?.('m09-scrap-cases')
      } else {
        alert(d?.message || '提交失败')
      }
    } catch (e: any) {
      alert('提交异常: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const decisionOptions = [
    { value: 'pass', label: '审核通过', desc: '所有问题已处理，可进入M09待交案', color: 'border-[#BBF7D0] bg-[#F0FDF4]', activeColor: 'border-[#16A34A] bg-[#F0FDF4]' },
    { value: 'reject-m06', label: '退回M06', desc: '交底书存在问题，需补充/重做交底模型', color: 'border-[#E5E9F0] bg-white', activeColor: 'border-[#EA580C] bg-[#FFF7ED]' },
    { value: 'reject-m07', label: '退回M07', desc: '申请文件存在问题，需修改说明书/权利要求', color: 'border-[#E5E9F0] bg-white', activeColor: 'border-[#EA580C] bg-[#FFF7ED]' },
    { value: 'reject-case', label: '标记废案', desc: '不具备申报基础，进入M09案件管理', color: 'border-[#E5E9F0] bg-white', activeColor: 'border-[#DC2626] bg-[#FEF2F2]' },
  ]

  // ── 案例选择器 ──
  if (!activeReviewId) {
    const typeLabel = (t: string) => t === 'invention' ? '发明' : t === 'utility' ? '实用新型' : '外观设计'
    const filtered = casesList.filter(c => !caseSearch || c.title.includes(caseSearch) || c.caseNo.includes(caseSearch))
    return (
      <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
        <div className="h-14 px-4 bg-white border-b flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('m08-dashboard')}>
            <ChevronLeft className="w-4 h-4 mr-1" />返回
          </Button>
          <h1 className="text-sm font-semibold text-[#111827]">选择审核案例 — 审核决策</h1>
        </div>
        <div className="px-4 py-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input className="w-full pl-9 pr-3 py-2 rounded border text-sm" placeholder="搜索案件..." value={caseSearch} onChange={e => setCaseSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4">
          {casesLoading ? (
            <div className="flex items-center justify-center py-20 text-[#9CA3AF]">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-[#9CA3AF]">暂无待审核的案件</div>
          ) : (
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="bg-[#F9FAFB] px-4 py-2 flex items-center text-xs text-[#9CA3AF] border-b">
                <span className="w-44">案件编号</span>
                <span className="flex-1">专利名称</span>
                <span className="w-20">类型</span>
                <span className="w-32">审核进度</span>
                <span className="w-8"></span>
              </div>
              {filtered.map(c => {
                const allDone = c.preliminaryDone && c.disclosureDone && c.fiveBooksDone
                return (
                <div key={c.reviewId} className={`flex items-center px-4 py-3 border-b last:border-b-0 transition-colors ${allDone ? 'hover:bg-[#F9FAFB] cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                  onClick={() => handleSelectCase(c.reviewId)}>
                  <span className="font-mono text-xs text-[#374151] w-44">{c.caseNo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#111827]">{c.title}</p>
                    <p className="text-xs text-[#9CA3AF]">{c.created_at ? new Date(c.created_at).toLocaleDateString('zh-CN') : ''}</p>
                  </div>
                  <span className="text-sm text-[#374151] w-20">{typeLabel(c.type)}</span>
                  <div className="w-32 flex gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${c.preliminaryDone ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#F5F7FA] text-[#9CA3AF]'}`}>初审</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${c.disclosureDone ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#F5F7FA] text-[#9CA3AF]'}`}>交底</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${c.fiveBooksDone ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#F5F7FA] text-[#9CA3AF]'}`}>五书</span>
                  </div>
                  <span className="w-8 flex justify-end"><ChevronRight className="h-4 w-4 text-[#9CA3AF]" /></span>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="w-full p-6 flex items-center justify-center min-h-[400px]"><Loader2 className="w-6 h-6 animate-spin text-[#2F80ED]" /><span className="ml-2 text-sm text-[#9CA3AF]">加载中...</span></div>
  }

  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-[#9CA3AF] h-7 px-2 -ml-2"
              onClick={() => setActiveReviewId(null)}>
              <ChevronLeft className="w-4 h-4 mr-1" />返回选择
            </Button>
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">审核决策</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">汇总所有审核结果，确定最终决策</p>
        </div>
        <Button variant="outline" size="sm" className="border-[#2F80ED] text-[#2F80ED] h-8 text-xs"
          onClick={runAI} disabled={runningAI || !activeReviewId || !!existingResult}>
          {runningAI ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />分析中...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />AI 审核建议</>}
        </Button>
      </div>

      {existingResult && (
        <Alert className="border-[#BBF7D0] bg-[#F0FDF4] py-3">
          <CheckCircle className="h-4 w-4 text-[#16A34A]" />
          <AlertDescription className="text-[#16A34A] text-sm">
            已提交审核决策，无法再次修改。
          </AlertDescription>
        </Alert>
      )}

      {blockingIssues.length > 0 && !existingResult && (
        <Alert className="border-[#FECACA] bg-[#FEF2F2] py-3">
          <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
          <AlertDescription className="text-[#DC2626] text-sm font-medium">
            存在 {blockingIssues.length} 个阻断项，必须处理所有阻断项才能通过审核
          </AlertDescription>
        </Alert>
      )}

      {aiReason && (
        <Alert className="border-[#EAF4FF] bg-[#EAF4FF] py-3">
          <Sparkles className="h-4 w-4 text-[#2F80ED]" />
          <AlertDescription className="text-[#2F80ED] text-sm">{aiReason}</AlertDescription>
        </Alert>
      )}

      {/* 审核结果汇总 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '阻断项', value: blockingIssues.length, sub: '必须处理', color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]' },
          { label: '警告项', value: warningIssues.length, sub: '需确认', color: 'text-[#EA580C]', bg: 'bg-[#FFF7ED]' },
          { label: '建议项', value: suggestionCount, sub: '参考处理', color: 'text-[#2F80ED]', bg: 'bg-[#EAF4FF]' },
        ].map((item) => (
          <Card key={item.label} className="border-[#E5E9F0]">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#9CA3AF]">{item.label}</p>
                  <p className={`text-3xl font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{item.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 问题详情 */}
        <Card className="border-[#E5E9F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#111827]">审核问题详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#DC2626] mb-2">阻断项 ({blockingIssues.length})</p>
              <div className="space-y-1.5">
                {blockingIssues.map((issue) => (
                  <div key={issue.id} className="p-2.5 border-2 border-[#FECACA] bg-[#FEF2F2] rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111827]">{issue.title}</p>
                        <span className="text-xs bg-white/70 text-[#374151] px-1.5 py-0.5 rounded mt-1 inline-block">{issue.module}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#EA580C] mb-2">警告项 ({warningIssues.length})</p>
              <div className="space-y-1.5">
                {warningIssues.map((issue) => (
                  <div key={issue.id} className="p-2.5 border-2 border-[#FED7AA] bg-[#FFF7ED] rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#EA580C] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111827]">{issue.title}</p>
                        <span className="text-xs bg-white/70 text-[#374151] px-1.5 py-0.5 rounded mt-1 inline-block">{issue.module}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 决策表单 */}
        <Card className="border-[#E5E9F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#111827]">审核决策</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#374151] mb-2">决策结果</p>
              <div className="space-y-2">
                {decisionOptions.map((opt) => (
                  <label key={opt.value}
                    className={`flex items-center gap-3 p-2.5 border-2 rounded-lg cursor-pointer transition-colors ${
                      decision === opt.value ? opt.activeColor : opt.color
                    } hover:border-[#2F80ED]`}>
                    <input type="radio" name="decision" value={opt.value}
                      checked={decision === opt.value}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-4 h-4 accent-[#2F80ED]" />
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{opt.label}</p>
                      <p className="text-xs text-[#9CA3AF]">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {(decision === 'reject-m06' || decision === 'reject-m07') && (
              <div>
                <p className="text-xs font-medium text-[#374151] mb-1.5">预计回稿时间</p>
                <input type="date" className="w-full px-3 py-2 text-sm border border-[#E5E9F0] rounded-lg focus:outline-none focus:border-[#2F80ED]" />
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-[#374151] mb-1.5">决策说明</p>
              <textarea
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder="请输入审核决策的详细说明..."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-[#E5E9F0] rounded-lg focus:outline-none focus:border-[#2F80ED] resize-none"
              />
              <p className="text-xs text-[#9CA3AF] text-right mt-0.5">{decisionComment.length}/500</p>
            </div>

            <div className="flex gap-2">
              <Button
                disabled={!decision || (decision !== 'pass' && !decisionComment) || isSubmitting || !!existingResult}
                onClick={handleSubmitDecision}
                className="flex-1 bg-[#2F80ED] text-white h-9 text-sm">
                {isSubmitting ? '提交中...' : '提交审核决策'}
              </Button>
              <Button variant="outline" className="flex-1 border-[#E5E9F0] text-[#374151] h-9 text-sm">
                保存草稿
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
