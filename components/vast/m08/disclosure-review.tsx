'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  FileText, ChevronDown, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, BookOpen, AlertTriangle, Loader2, Search, Pencil, Trash2, Plus,
} from 'lucide-react'

interface DisclosureReviewPageProps {
  onNavigate?: (page: string) => void
  reviewId?: string | null
  onReviewSelect?: (reviewId: string) => void
}

interface Section {
  id: string; key: string; title: string; complete: boolean; content: string
}

interface ChecklistItem {
  item: string; key: string; status: boolean
}

interface ReviewCase {
  reviewId: string; caseNo: string; title: string; type: string; status: string; created_at: string
}

export function DisclosureReviewPage({ onNavigate, reviewId: initialReviewId, onReviewSelect }: DisclosureReviewPageProps) {
  const [activeReviewId, setActiveReviewId] = useState<string | null>(initialReviewId ?? null)
  const [casesList, setCasesList] = useState<ReviewCase[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState('')

  const [expandedSections, setExpandedSections] = useState<string[]>(['section-1'])
  const [activeSection, setActiveSection] = useState('section-1')
  const [sections, setSections] = useState<Section[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [disclosureText, setDisclosureText] = useState('')
  const [customItems, setCustomItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [runningAI, setRunningAI] = useState(false)
  const [showProblemDialog, setShowProblemDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isChecklistEdit, setIsChecklistEdit] = useState(false)
  const [problemForm, setProblemForm] = useState({ content: '', type: 'form', severity: 'medium', status: 'pending' })
  // 审核结论
  const [conclusion, setConclusion] = useState<'pass' | 'fail' | null>(null)
  const [savingConclusion, setSavingConclusion] = useState(false)
  const [saving, setSaving] = useState(false)

  // 载入案例列表（仅 reviewing 且有交底书的）
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
          })))
        }
      })
      .finally(() => setCasesLoading(false))
  }, [activeReviewId])

  // 载入审核数据
  useEffect(() => {
    if (!activeReviewId) return
    setLoading(true)
    const token = localStorage.getItem('vast_token')
    fetch(`/api/m08/disclosure-review?reviewId=${encodeURIComponent(activeReviewId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d?.code === 200) {
          setSections(d.data.sections || [])
          setChecklist(d.data.checklist || [])
          setDisclosureText(d.data.disclosureText || '')
          setCustomItems(d.data.customItems || [])
          // 回填审核结论：找是否有 critical 的阻断项
          const hasRejectItem = (d.data.customItems || []).some((i: any) => i.severity === 'critical')
          setConclusion(hasRejectItem ? 'fail' : null)
        }
      })
      .finally(() => setLoading(false))
  }, [activeReviewId])

  const handleSelectCase = (reviewId: string) => {
    setActiveReviewId(reviewId)
    onReviewSelect?.(reviewId)
  }

  const runAI = async () => {
    if (!activeReviewId) return
    setRunningAI(true)
    try {
      const token = localStorage.getItem('vast_token')
      const res = await fetch('/api/m08/disclosure-review/run-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewId: activeReviewId }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        setChecklist(d.data.checklist || [])
        setSections(prev => prev.map(s => ({
          ...s,
          complete: d.data.checklist?.find((c: any) => c.key === s.key)?.status ?? s.complete,
        })))
        // 合并 AI 生成的问题（不覆盖手动添加的）
        if (d.data.problems?.length) {
          setCustomItems(prev => {
            const existingIds = new Set(prev.map(i => i.id))
            const newItems = d.data.problems.filter((p: any) => !existingIds.has(p.id))
            return [...newItems, ...prev]
          })
        }
      }
    } finally { setRunningAI(false) }
  }

  const openAddDialog = () => {
    setProblemForm({ content: '', type: 'form', severity: 'medium', status: 'pending' })
    setEditingItem(null)
    setIsChecklistEdit(false)
    setShowProblemDialog(true)
  }

  const openChecklistDialog = (item: ChecklistItem) => {
    setProblemForm({ content: item.item, type: 'completeness', severity: 'medium', status: item.status ? 'resolved' : 'pending' })
    setEditingItem(item as any)
    setIsChecklistEdit(true)
    setShowProblemDialog(true)
  }

  const openEditDialog = (item: any) => {
    setProblemForm({ content: item.content || '', type: item.type || 'form', severity: item.severity || 'medium', status: item.status || 'pending' })
    setEditingItem(item)
    setIsChecklistEdit(false)
    setShowProblemDialog(true)
  }

  const saveProblem = async () => {
    if (!activeReviewId) return
    if (!isChecklistEdit && !problemForm.content.trim()) return
    const token = localStorage.getItem('vast_token')
    if (!token) return

    // 编辑六项：同步更新前端状态并持久化
    if (isChecklistEdit) {
      const newStatus = problemForm.status === 'resolved'
      const updatedChecklist = checklist.map(c => c.key === (editingItem as any)?.key ? { ...c, status: newStatus } : c)
      setChecklist(updatedChecklist)
      // 同步更新 sections 的 complete
      setSections(prev => prev.map(s => s.key === (editingItem as any)?.key ? { ...s, complete: newStatus } : s))

      // 保存到后端
      const items: Record<string, boolean> = {}
      updatedChecklist.forEach(c => { items[c.key] = c.status })
      await fetch('/api/m08/disclosure-review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewId: activeReviewId, items }),
      })

      setShowProblemDialog(false)
      return
    }

    if (editingItem) {
      const res = await fetch(`/api/m08/review-items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(problemForm),
      })
      if (res.ok) {
        setCustomItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...problemForm } : i))
        setShowProblemDialog(false)
      }
    } else {
      const res = await fetch('/api/m08/review-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewId: activeReviewId, ...problemForm }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        setCustomItems(prev => [d.data, ...prev])
        setShowProblemDialog(false)
      }
    }
  }



  // 保存当前问题（不执行审核结论）
  const handleSave = async () => {
    if (!activeReviewId) return
    setSaving(true)
    const token = localStorage.getItem('vast_token')
    // 保存六项 checklist 状态
    const items: Record<string, boolean> = {}
    checklist.forEach(c => { items[c.key] = c.status })
    await fetch('/api/m08/disclosure-review', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reviewId: activeReviewId, items }),
    })
    setSaving(false)
  }

  const deleteItem = async (id: string) => {
    const token = localStorage.getItem('vast_token')
    const res = await fetch(`/api/m08/review-items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setCustomItems(prev => prev.filter(i => i.id !== id))
  }

  const savePass = async () => {
    if (!activeReviewId) return
    const token = localStorage.getItem('vast_token')
    if (!token) return
    setConclusion('pass')
    setSavingConclusion(true)
    try {
      // 清掉所有交底审核标记
      const oldItems = customItems.filter(i => i.step === 'disclosure')
      await Promise.all(oldItems.map(item =>
        fetch(`/api/m08/review-items/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      ))
      setCustomItems(prev => prev.filter(i => i.step !== 'disclosure'))
      await fetch(`/api/m08/reviews/${activeReviewId}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disclosureDone: true }),
      })
    } catch {} finally {
      setSavingConclusion(false)
    }
  }

  const saveFail = async () => {
    if (!activeReviewId) return
    const token = localStorage.getItem('vast_token')
    if (!token) return
    setConclusion('fail')
    setSavingConclusion(true)
    try {
      // 删掉旧的交底审核标记（step='disclosure'）
      const oldItems = customItems.filter(i => i.step === 'disclosure')
      await Promise.all(oldItems.map(item =>
        fetch(`/api/m08/review-items/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      ))
      // 新建，step='disclosure'，severity='critical' 自带阻断
      const res = await fetch('/api/m08/review-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewId: activeReviewId, content: '交底书审核不通过', type: 'completeness', severity: 'critical', status: 'pending', step: 'disclosure' }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        setCustomItems(prev => [d.data, ...prev.filter(i => i.step !== 'disclosure')])
      }
      await fetch(`/api/m08/reviews/${activeReviewId}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disclosureDone: true }),
      })
    } catch {} finally {
      setSavingConclusion(false)
    }
  }

  const toggleSection = (id: string) => {
    setExpandedSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  // 严重程度颜色
  const severityStyle = (severity: string) => {
    const map: Record<string, { bg: string; text: string; border: string; icon: string }> = {
      low: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', icon: '#16A34A' },
      medium: { bg: '#FEFCE8', text: '#CA8A04', border: '#FEF08A', icon: '#CA8A04' },
      high: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA', icon: '#EA580C' },
      critical: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: '#DC2626' },
    }
    return map[severity] || map.medium
  }

  // ---- case picker ----
  if (!activeReviewId) {
    const typeLabel = (t: string) => t === 'invention' ? '发明' : t === 'utility' ? '实用新型' : '外观设计'
    const filtered = casesList.filter(c => !caseSearch || c.title.includes(caseSearch) || c.caseNo.includes(caseSearch))
    return (
      <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
        <div className="h-14 px-4 bg-white border-b flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => onNavigate?.('m08-dashboard')}>
            <ChevronLeft className="w-4 h-4 mr-1" />返回
          </Button>
          <h1 className="text-sm font-semibold text-[#111827]">选择审核案例</h1>
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
                <span className="w-20">状态</span>
                <span className="w-8"></span>
              </div>
              {filtered.map(c => (
                <div key={c.reviewId} className="flex items-center px-4 py-3 border-b last:border-b-0 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                  onClick={() => handleSelectCase(c.reviewId)}>
                  <span className="font-mono text-xs text-[#374151] w-44">{c.caseNo}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#111827]">{c.title}</p>
                    <p className="text-xs text-[#9CA3AF]">{c.created_at ? new Date(c.created_at).toLocaleDateString('zh-CN') : ''}</p>
                  </div>
                  <span className="text-sm text-[#374151] w-20">{typeLabel(c.type)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#EAF4FF] text-[#2F80ED] w-20 text-center">审核中</span>
                  <span className="w-8 flex justify-end"><ChevronRight className="h-4 w-4 text-[#9CA3AF]" /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---- loading ----
  if (loading) {
    return <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="h-8 w-8 animate-spin text-[#2F80ED]" /></div>
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      <div className="h-14 px-4 bg-white border-b flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[#9CA3AF] h-7 px-2 -ml-2"
              onClick={() => { setActiveReviewId(null) }}>
              <ChevronLeft className="w-4 h-4 mr-1" />返回选择
            </Button>
          </div>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[#111827]">交底书审核</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-[#E5E9F0] text-[#374151] h-8 text-xs"
            onClick={runAI} disabled={runningAI || !activeReviewId}>
            {runningAI ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />检测中...</> : '运行AI审核'}
          </Button>
          <Button variant="outline" size="sm" className="border-[#2F80ED] text-[#2F80ED] h-8 text-xs"
            onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
          <Button size="sm" className="bg-[#2F80ED] text-white h-8 text-xs"
            onClick={() => onNavigate?.('m08-review-decision')}>
            进入审核决策
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
      {/* 三栏布局 */}
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* 左栏：交底书目录 */}
        <Card className="col-span-2 border-[#E5E9F0]">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold text-[#374151]">交底书目录</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3 space-y-0.5">
            <button
              onClick={() => setActiveSection('full')}
              className={`w-full text-left px-2 py-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                activeSection === 'full'
                  ? 'bg-[#EAF4FF] text-[#2F80ED] font-medium'
                  : 'text-[#374151] hover:bg-[#F5F7FA]'
              }`}
            >
              <span className="flex-1 truncate">完整</span>
              {disclosureText ? <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 ml-1" /> : <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] flex-shrink-0 ml-1" />}
            </button>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id); setExpandedSections((p) => p.includes(section.id) ? p : [...p, section.id]) }}
                className={`w-full text-left px-2 py-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                  activeSection === section.id
                    ? 'bg-[#EAF4FF] text-[#2F80ED] font-medium'
                    : 'text-[#374151] hover:bg-[#F5F7FA]'
                }`}
              >
                <span className="flex-1 truncate">{section.title}</span>
                {section.complete
                  ? <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 ml-1" />
                  : <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] flex-shrink-0 ml-1" />
                }
              </button>
            ))}
          </CardContent>
        </Card>

        {/* 中栏：交底书预览 */}
        <Card className="col-span-6 border-[#E5E9F0]">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold text-[#374151]">交底书预览</CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100vh-320px)] pr-2">
            {activeSection === 'full' ? (
              <div className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                {disclosureText || <span className="text-[#9CA3AF] italic">暂无完整交底书</span>}
              </div>
            ) : (() => {
              const section = sections.find(s => s.id === activeSection)
              if (!section) return <div className="text-sm text-[#9CA3AF] py-4 text-center">选择左侧目录查看内容</div>
              return (
                <div>
                  <div className="px-3 py-2.5 bg-[#F9FAFB] rounded-t-lg flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span className="text-sm font-medium text-[#2F80ED]">{section.title}</span>
                    {!section.complete && (
                      <span className="text-xs bg-[#FEF2F2] text-[#DC2626] px-1.5 py-0.5 rounded">缺失</span>
                    )}
                  </div>
                  <div className="px-3 py-2 text-sm text-[#374151] rounded-b-lg leading-relaxed">
                    {section.content || <span className="text-[#9CA3AF] italic">暂无内容</span>}
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* 右栏：审核清单 */}
        <Card className="col-span-4 border-[#E5E9F0] overflow-hidden">
          <CardHeader className="pb-2 pt-4 flex-shrink-0">
            <CardTitle className="text-xs font-semibold text-[#374151]">交底书问题清单</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 pb-3">
            {/* 滚动区域：问题列表 */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ minHeight: 0 }}>
              {/* 六项 M06 问题 */}
              {checklist.map((item) => (
                <div key={item.key} className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                  item.status ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-[#FECACA] bg-[#FEF2F2]'
                }`}>
                  {item.status
                    ? <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
                  }
                  <span className={`text-xs font-medium flex-1 ${item.status ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                    {item.item}
                  </span>
                  <button className="text-[#9CA3AF] hover:text-[#2F80ED] flex-shrink-0" onClick={() => openChecklistDialog(item)}><Pencil className="w-3 h-3" /></button>
                </div>
              ))}

              {/* 自定义问题 */}
              {customItems.map((item) => {
                const sev = severityStyle(item.severity)
                return (
                <div key={item.id} className="p-2.5 rounded-lg border flex items-start gap-2.5" style={{ borderColor: sev.border, backgroundColor: sev.bg }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: sev.icon }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-[#374151]">{item.content}</span>
                  </div>
                  <button className="text-[#9CA3AF] hover:text-[#2F80ED]" onClick={() => openEditDialog(item)}><Pencil className="w-3 h-3" /></button>
                  <button className="text-[#9CA3AF] hover:text-[#DC2626]" onClick={() => deleteItem(item.id)}><Trash2 className="w-3 h-3" /></button>
                </div>
                )
              })}

              {/* 新增问题按钮 */}
              <Button variant="outline" size="sm" className="w-full text-xs h-8 mt-1" onClick={openAddDialog}>
                <Plus className="w-3 h-3 mr-1" />新增问题
              </Button>
            </div>

            {/* 底部固定：审核结论 */}
            <div className="flex-shrink-0 pt-3 border-t mt-2 space-y-2">
              {checklist.filter(c => !c.status).length > 0 ? (
                <Alert className="border-[#FED7AA] bg-[#FFF7ED] py-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#EA580C]" />
                  <AlertDescription className="text-[#EA580C] text-xs ml-1">
                    缺少 {checklist.filter(c => !c.status).map(c => `「${c.item}」`).join('、')}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-[#BBF7D0] bg-[#F0FDF4] py-2.5">
                  <CheckCircle className="h-3.5 w-3.5 text-[#16A34A]" />
                  <AlertDescription className="text-[#16A34A] text-xs ml-1">
                    六项交底模型已完整
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-xs font-medium text-[#374151]">审核结论 {conclusion && <span className="text-[#9CA3AF]">(当前: {conclusion === 'pass' ? '通过' : '不通过'})</span>}</p>
              <div className="flex gap-2">
                <button
                  className={`flex-1 text-xs h-8 rounded-md font-medium transition-colors ${conclusion === 'pass' ? 'bg-[#16A34A] text-white' : 'border bg-white text-[#374151] hover:bg-[#F5F7FA]'}`}
                  onClick={savePass}>
                  通过审核
                </button>
                <button
                  className={`flex-1 text-xs h-8 rounded-md font-medium transition-colors ${conclusion === 'fail' ? 'bg-[#DC2626] text-white' : 'border bg-white text-[#374151] hover:bg-[#F5F7FA]'}`}
                  onClick={saveFail}>
                  不通过审核
                </button>
              </div>
            </div>
          </CardContent>

          {/* 编辑弹窗 */}
          <Dialog open={showProblemDialog} onOpenChange={setShowProblemDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{isChecklistEdit ? '修改六项状态' : editingItem ? '修改问题' : '新增问题'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {isChecklistEdit ? (
                  <>
                    <div className="p-3 rounded-lg border bg-[#F9FAFB]">
                      <span className="text-sm font-medium text-[#374151]">{problemForm.content}</span>
                    </div>
                    <div>
                      <label className="text-xs text-[#6B7280]">状态</label>
                      <select className="w-full text-sm border rounded px-2 py-2 mt-1" value={problemForm.status}
                        onChange={e => setProblemForm(p => ({ ...p, status: e.target.value }))}>
                        <option value="resolved">✅ 已完整</option><option value="pending">❌ 缺失</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-[#6B7280]">问题描述</label>
                      <input className="w-full text-sm border rounded px-3 py-2 mt-1" value={problemForm.content}
                        onChange={e => setProblemForm(p => ({ ...p, content: e.target.value }))} placeholder="请输入问题描述" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-[#6B7280]">类型</label>
                        <select className="w-full text-sm border rounded px-2 py-2 mt-1" value={problemForm.type}
                          onChange={e => setProblemForm(p => ({ ...p, type: e.target.value }))}>
                          <option value="completeness">完整性</option><option value="uniformity">统一性</option>
                          <option value="novelty">新颖性</option><option value="form">形式</option><option value="support">支持性</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[#6B7280]">严重程度</label>
                        <select className="w-full text-sm border rounded px-2 py-2 mt-1" value={problemForm.severity}
                          onChange={e => setProblemForm(p => ({ ...p, severity: e.target.value }))}>
                          <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="critical">严重</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[#6B7280]">状态</label>
                        <select className="w-full text-sm border rounded px-2 py-2 mt-1" value={problemForm.status}
                          onChange={e => setProblemForm(p => ({ ...p, status: e.target.value }))}>
                          <option value="pending">待处理</option><option value="resolved">已解决</option><option value="ignored">忽略</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setShowProblemDialog(false)}>取消</Button>
                <Button size="sm" onClick={saveProblem}>
                  {editingItem ? '保存' : '添加'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
      </div>
    </div>
  )
}
