"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft, ChevronRight, RefreshCw, Lock,
  CheckCircle, AlertTriangle, XCircle, Search, Loader2,
} from "lucide-react"

interface FullReviewPageProps {
  onBack: () => void
  onSubmit: (caseId: string) => void
  onCaseSelect?: (caseId: string) => void
  caseId?: string | null
}

interface CheckItem {
  key: string
  label: string
  passed: boolean
  severity: "blocking" | "warning"
  detail: string
  value?: string
  location: string
  position: string
}

interface ReviewData {
  items: CheckItem[]
  stats: { total: number; passed: number; blocking: number; blockingPassed: number; warningTotal: number; warningActive: number }
  allPassed: boolean
  canSubmit: boolean
}

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "blocking": return <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded"><XCircle className="h-3 w-3" />阻断项</span>
    case "warning": return <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded"><AlertTriangle className="h-3 w-3" />警告项</span>
    default: return <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded"><CheckCircle className="h-3 w-3" />通过</span>
  }
}

const getStatusBadge = (severity: string) => {
  switch (severity) {
    case "blocking": return <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">待处理</span>
    case "warning": return <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">需整改</span>
    default: return <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">已通过</span>
  }
}

/** 根据数值返回颜色类：越高越好型 */
const rateColorHigh = (val: number) => val >= 90 ? 'text-green-600' : val >= 80 ? 'text-orange-600' : 'text-red-600'
/** 根据数值返回颜色类：越低越好型 */
const rateColorLow = (val: number) => val < 20 ? 'text-green-600' : val < 30 ? 'text-orange-600' : 'text-red-600'
/** 越高越好型卡片背景 */
const rateBgHigh = (val: number) => val >= 90 ? 'border-green-200 bg-green-50' : val >= 80 ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'
/** 越低越好型卡片背景 */
const rateBgLow = (val: number) => val < 20 ? 'border-green-200 bg-green-50' : val < 30 ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'

export function FullReviewPage({ onBack, onSubmit, onCaseSelect, caseId: initialCaseId }: FullReviewPageProps) {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(initialCaseId ?? null)
  const [activeCaseTitle, setActiveCaseTitle] = useState("")
  const [casesList, setCasesList] = useState<{ id: string; case_id: string; title: string; type: string }[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState("")

  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isRunningAI, setIsRunningAI] = useState(false)
  const [isLocking, setIsLocking] = useState(false)

  useEffect(() => {
    if (activeCaseId) return
    setCasesLoading(true)
    const token = localStorage.getItem("vast_token")
    fetch("/api/cases?page=1&pageSize=100", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.code === 200) setCasesList((d.data.list || []).filter((c: any) => c.status === 'writing')) })
      .finally(() => setCasesLoading(false))
  }, [activeCaseId])

  // 初始化：如果已有 caseId，验证状态后加载数据
  useEffect(() => {
    if (!activeCaseId) return
    const token = localStorage.getItem("vast_token")
    fetch(`/api/cases/${activeCaseId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.code === 200 && d.data?.status === 'writing') {
          setActiveCaseTitle(d.data.title)
          loadCheck(activeCaseId)
        } else {
          setActiveCaseId(null)
        }
      })
  }, [activeCaseId])

  const loadCheck = async (caseId: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/m07/full-review/check?caseId=${encodeURIComponent(caseId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d?.code === 200) setData(d.data)
    } finally { setLoading(false) }
  }

  const handleSelectCase = (id: string, title: string) => {
    setActiveCaseId(id)
    setActiveCaseTitle(title)
    onCaseSelect?.(id)
    loadCheck(id)
  }

  const handleRefresh = () => { if (activeCaseId) loadCheck(activeCaseId) }

  const handleRunAI = async () => {
    if (!activeCaseId) return
    setIsRunningAI(true)
    try {
      const token = localStorage.getItem("vast_token")
      await fetch("/api/m07/full-review/run-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caseId: activeCaseId }),
      })
      await loadCheck(activeCaseId)
    } finally { setIsRunningAI(false) }
  }

  const handleLock = async () => {
    if (!activeCaseId) return
    setIsLocking(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caseId: activeCaseId }),
      })
      const d = await res.json()
      if (d?.code === 200) onSubmit(activeCaseId)
    } finally { setIsLocking(false) }
  }

  // case picker
  if (!activeCaseId) {
    const filtered = casesList.filter(c => !caseSearch || c.title.includes(caseSearch) || c.case_id.includes(caseSearch))
    const typeLabel = (t: string) => t === "invention" ? "发明" : t === "utility" ? "实用新型" : "外观设计"
    return (
      <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
        <div className="h-14 px-4 bg-white border-b flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" />返回</Button>
          <h1 className="text-sm font-semibold text-[#111827]">选择复核案例</h1>
        </div>
        <div className="px-4 py-3"><div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" /><input className="w-full pl-9 pr-3 py-2 rounded border text-sm" placeholder="搜索案件..." value={caseSearch} onChange={e => setCaseSearch(e.target.value)} /></div></div>
        <div className="flex-1 overflow-auto px-4 pb-4">{casesLoading ? <div className="flex items-center justify-center py-20 text-[#9CA3AF]">加载中...</div> : <div className="grid gap-2">{filtered.map(c => (<div key={c.id} className="flex items-center justify-between p-4 rounded-lg border bg-white hover:border-[#2F80ED] cursor-pointer" onClick={() => handleSelectCase(c.id, c.title)}><div><div className="text-sm font-medium">{c.title}</div><div className="text-xs text-[#9CA3AF]">{c.case_id} · {typeLabel(c.type)}</div></div><ChevronRight className="h-5 w-5 text-[#9CA3AF]" /></div>))}</div>}</div>
      </div>
    )
  }

  const stats = data?.stats
  const items = data?.items || []
  const getItemValue = (key: string) => {
    const item = items.find(i => i.key === key)
    if (item?.value) return item.value
    return item?.detail || '-'
  }
  const getItemRateNum = (key: string) => {
    const item = items.find(i => i.key === key)
    const v = item?.value
    if (v && v.endsWith('%')) return parseInt(v)
    return -1
  }
  const hasBlocking = items.some(i => i.severity === "blocking" && !i.passed)
  // 未通过项按严重级别排序：阻断优先
  const problemItems = items.filter(i => !i.passed).sort((a, b) => {
    if (a.severity === 'blocking' && b.severity !== 'blocking') return -1
    if (a.severity !== 'blocking' && b.severity === 'blocking') return 1
    return 0
  })

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      {/* 顶部操作栏 */}
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setActiveCaseId(null); setData(null) }}>
            <ChevronLeft className="h-4 w-4 mr-1" />返回
          </Button>
          <div className="h-6 w-px bg-border" />
          <div><h1 className="text-sm font-semibold text-[#111827]">全文件与交底书复核</h1><p className="text-xs text-[#9CA3AF]">{activeCaseTitle}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRunAI} disabled={isRunningAI || loading}>
            {isRunningAI ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />AI 分析中...</> : <><RefreshCw className="h-4 w-4 mr-2" />AI 智能复核</>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />刷新结果</Button>
          <Button size="sm" onClick={handleLock} disabled={isLocking || loading || !data} className="bg-[#2F80ED] hover:bg-[#2563EB] text-white">
            {isLocking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />锁定中...</> : <><Lock className="h-4 w-4 mr-2" />锁定并提交审核</>}
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto min-w-0">
        <div className="p-4 space-y-4 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#2F80ED]" /></div>
          ) : data ? (<>
            {/* 复核结果卡片 */}
            <div className="grid grid-cols-7 gap-3">
              <Card className="border-red-200 bg-red-50"><CardContent className="p-3 text-center"><div className="text-lg font-bold text-red-600">{stats ? stats.blocking - stats.blockingPassed : 0}</div><div className="text-xs text-red-600 mt-1">阻断项</div></CardContent></Card>
              <Card className="border-orange-200 bg-orange-50"><CardContent className="p-3 text-center"><div className="text-lg font-bold text-orange-600">{stats?.warningActive || 0}</div><div className="text-xs text-orange-600 mt-1">警告项</div></CardContent></Card>
              <Card className="border-green-200 bg-green-50"><CardContent className="p-3 text-center"><div className="text-lg font-bold text-green-600">{stats?.passed || 0}</div><div className="text-xs text-green-600 mt-1">通过项</div></CardContent></Card>
              {(() => { const v = getItemRateNum('disclosure-coverage'); return <Card className={v >= 0 ? rateBgHigh(v) : ''}><CardContent className="p-3 text-center"><div className={`text-lg font-bold ${v >= 0 ? rateColorHigh(v) : 'text-[#6B7280]'}`}>{getItemValue('disclosure-coverage')}</div><div className="text-xs text-[#6B7280] mt-1 truncate">交底覆盖率</div></CardContent></Card> })()}
              {(() => { const v = getItemRateNum('support-rate'); return <Card className={v >= 0 ? rateBgHigh(v) : ''}><CardContent className="p-3 text-center"><div className={`text-lg font-bold ${v >= 0 ? rateColorHigh(v) : 'text-[#6B7280]'}`}>{getItemValue('support-rate')}</div><div className="text-xs text-[#6B7280] mt-1 truncate">权利要求支持率</div></CardContent></Card> })()}
              {(() => { const v = getItemRateNum('duplicate-rate'); return <Card className={v >= 0 ? rateBgLow(v) : ''}><CardContent className="p-3 text-center"><div className={`text-lg font-bold ${v >= 0 ? rateColorLow(v) : 'text-[#6B7280]'}`}>{getItemValue('duplicate-rate')}</div><div className="text-xs text-[#6B7280] mt-1">查重率</div></CardContent></Card> })()}
              {(() => { const v = getItemRateNum('ai-rate'); return <Card className={v >= 0 ? rateBgLow(v) : ''}><CardContent className="p-3 text-center"><div className={`text-lg font-bold ${v >= 0 ? rateColorLow(v) : 'text-[#6B7280]'}`}>{getItemValue('ai-rate')}</div><div className="text-xs text-[#6B7280] mt-1">AI相似性</div></CardContent></Card> })()}
            </div>

            {/* 问题列表 */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">问题列表</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <span>共 {items.length} 项</span><span>·</span>
                    <span className="text-red-600">阻断 {items.filter(i => i.severity === "blocking" && !i.passed).length}</span><span>·</span>
                    <span className="text-orange-600">警告 {items.filter(i => i.severity === "warning" && !i.passed).length}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table className="table-fixed">
                  <TableHeader><TableRow className="bg-[#F9FAFB]"><TableHead className="w-[120px]">问题类型</TableHead><TableHead className="w-[72px]">级别</TableHead><TableHead className="w-[360px]">问题描述</TableHead><TableHead className="w-[80px]">来源模块</TableHead><TableHead className="w-[110px]">定位位置</TableHead><TableHead className="w-[72px]">状态</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {problemItems.map(item => (
                      <TableRow key={item.key} className="hover:bg-[#F9FAFB]">
                        <TableCell className="text-sm text-[#374151] whitespace-normal break-words">{item.label}</TableCell>
                        <TableCell className="whitespace-nowrap">{getSeverityBadge(item.severity)}</TableCell>
                        <TableCell className="text-sm text-[#374151] whitespace-normal break-words">{item.detail}</TableCell>
                        <TableCell className="text-xs text-[#6B7280] whitespace-normal">{item.location}</TableCell>
                        <TableCell className="text-xs text-[#2F80ED] whitespace-normal break-words">{item.position}</TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusBadge(item.severity)}</TableCell>
                      </TableRow>
                    ))}
                    {problemItems.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-sm text-green-600 py-8"><CheckCircle className="h-5 w-5 inline mr-2" />全部通过</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 阻断提示 */}
            {hasBlocking && (
              <Card className="border-red-200 bg-red-50"><CardContent className="p-4"><div className="flex items-center gap-3"><XCircle className="h-5 w-5 text-red-600" /><div><div className="text-sm font-medium text-red-800">存在未通过的阻断项</div><div className="text-xs text-red-600 mt-1">请先处理所有阻断项后才能提交 M08 审核</div></div></div></CardContent></Card>
            )}
          </>) : null}
        </div>
      </div>
    </div>
  )
}
