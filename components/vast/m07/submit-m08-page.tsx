"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, Send,
  FileText, FileCheck, BookOpen, Image, Search, Loader2, RotateCcw,
} from "lucide-react"

interface SubmitM08PageProps {
  caseId?: string | null
  onBack: () => void
  onNavigate?: (page: string) => void
  onCaseSelect?: (caseId: string) => void
}

interface ReviewItem {
  key: string; label: string; passed: boolean; severity: "blocking" | "warning"
  detail: string; location: string; position: string; value?: string
}

interface ReviewData {
  items: ReviewItem[]
  stats: { total: number; passed: number; blocking: number; blockingPassed: number; warningTotal: number; warningActive: number }
  canSubmit: boolean
}

interface BookItem { key: string; label: string; icon: string; ready: boolean; documentId: string | null; preview?: string }

const typeLabel = (t: string) => t === "invention" ? "发明" : t === "utility" ? "实用新型" : "外观设计"

export function SubmitM08Page({ caseId: initialCaseId, onBack, onNavigate, onCaseSelect }: SubmitM08PageProps) {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(initialCaseId ?? null)
  const [activeCaseTitle, setActiveCaseTitle] = useState("")
  const [casesList, setCasesList] = useState<{ id: string; case_id: string; title: string; type: string; status: string }[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState("")

  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isReverting, setIsReverting] = useState(false)

  // 载入案例列表（仅 writingcheck）
  useEffect(() => {
    if (activeCaseId) return
    setCasesLoading(true)
    const token = localStorage.getItem("vast_token")
    fetch("/api/cases?page=1&pageSize=200", { headers: { Authorization: "Bearer " + token } })
      .then(r => r.json())
      .then(d => {
        if (d.code === 200) {
          setCasesList((d.data.list || []).filter((c: any) => c.status === 'writingcheck'))
        }
      })
      .finally(() => setCasesLoading(false))
  }, [activeCaseId])

  // 载入复核 + 五书数据（仅 writingcheck）
  useEffect(() => {
    if (!activeCaseId) return
    const token = localStorage.getItem("vast_token")
    fetch(`/api/cases/${activeCaseId}`, { headers: { Authorization: "Bearer " + token } })
      .then(r => r.json())
      .then(d => {
        if (d.code === 200 && d.data?.status === 'writingcheck') {
          setActiveCaseTitle(d.data.title)
          setLoading(true)
          Promise.all([
            fetch("/api/m07/full-review/check?caseId=" + encodeURIComponent(activeCaseId), { headers: { Authorization: "Bearer " + token } }).then(r => r.json()),
            fetch("/api/m07/five-books/check?caseId=" + encodeURIComponent(activeCaseId) + "&includeLocked=true", { headers: { Authorization: "Bearer " + token } }).then(r => r.json()),
          ]).then(([review, bookData]) => {
            if (review?.code === 200) setReviewData(review.data)
            if (bookData?.code === 200) setBooks(bookData.data.books || [])
          }).finally(() => setLoading(false))
        } else {
          setActiveCaseId(null)
        }
      })
  }, [activeCaseId])

  const handleSelectCase = (id: string, title: string) => {
    setActiveCaseId(id)
    setActiveCaseTitle(title)
    onCaseSelect?.(id)
  }

  const handleSubmit = async () => {
    if (!activeCaseId) return
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ caseId: activeCaseId }),
      })
      const d = await res.json()
      if (d?.code === 200) setSubmitted(true)
    } finally { setIsSubmitting(false) }
  }

  const handleRevert = async () => {
    if (!activeCaseId) return
    setIsReverting(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ caseId: activeCaseId }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        setActiveCaseId(null)
        setReviewData(null)
        setBooks([])
      }
    } finally { setIsReverting(false) }
  }

  // ---- case picker ----
  if (!activeCaseId) {
    const filtered = casesList.filter(c =>
      !caseSearch || c.title.includes(caseSearch) || c.case_id.includes(caseSearch)
    )
    return (
      <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
        <div className="h-14 px-4 bg-white border-b flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" />返回</Button>
          <h1 className="text-sm font-semibold text-[#111827]">选择提交案例</h1>
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
            <div className="flex items-center justify-center py-20 text-[#9CA3AF]">暂无可提交的案例（需先通过五书提交进入撰写审核状态）</div>
          ) : (
            <div className="grid gap-2">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border bg-white hover:border-[#2F80ED] cursor-pointer" onClick={() => handleSelectCase(c.id, c.title)}>
                  <div><div className="text-sm font-medium">{c.title}</div><div className="text-xs text-[#9CA3AF]">{c.case_id} · {typeLabel(c.type)}</div></div>
                  <ChevronRight className="h-5 w-5 text-[#9CA3AF]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---- submitted ----
  if (submitted) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F5F7FA]">
        <Card className="w-[480px]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-8 w-8 text-green-600" /></div>
            <h2 className="text-xl font-semibold text-[#111827] mb-2">提交成功</h2>
            <p className="text-sm text-[#6B7280] mb-6">已成功提交至 M08 审核</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">返回工作台</Button>
              <Button onClick={() => onNavigate?.("m08-task-list")} className="flex-1 bg-[#2F80ED]">前往 M08 审核</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---- loading ----
  if (loading) {
    return <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F5F7FA]"><Loader2 className="h-8 w-8 animate-spin text-[#2F80ED]" /></div>
  }

  const items = reviewData?.items || []
  const canSubmit = reviewData?.canSubmit ?? false
  const blockingItems = items.filter(i => i.severity === "blocking" && !i.passed)
  const warningItems = items.filter(i => i.severity === "warning" && !i.passed)
  const iconMap: Record<string, any> = { BookOpen, FileCheck, FileText, Image }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      <div className="h-14 px-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setActiveCaseId(null); setReviewData(null); setBooks([]) }}><ChevronLeft className="h-4 w-4 mr-1" />返回选择</Button>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-sm font-semibold text-[#111827]">提交 M08 确认</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRevert} disabled={isReverting} className="text-orange-600 border-orange-200 hover:bg-orange-50">
            {isReverting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />退回中...</> : <><RotateCcw className="h-4 w-4 mr-2" />退回修改</>}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />提交中...</> : <><Send className="h-4 w-4 mr-2" />确认提交</>}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* 1. 提交条件检查（15项全展示） */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">提交条件检查</CardTitle>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600">通过 {items.filter(i => i.passed).length}</span>
                  <span className="text-[#9CA3AF]">/</span>
                  <span className="text-[#6B7280]">共 {items.length} 项</span>
                  {!canSubmit && <><span className="text-[#9CA3AF]">·</span><span className="text-red-600">阻断 {blockingItems.length}</span></>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {items.map(item => {
                  const isBlocking = item.severity === "blocking" && !item.passed
                  const isWarning = item.severity === "warning" && !item.passed
                  return (
                    <div key={item.key} className={"flex items-start gap-3 p-2.5 rounded-lg " + (isBlocking ? "bg-red-50" : isWarning ? "bg-orange-50" : "bg-[#F9FAFB]")}>
                      {item.passed ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" /> : isBlocking ? <XCircle className="h-4 w-4 text-red-600 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={"text-sm " + (isBlocking ? "text-red-700 font-medium" : isWarning ? "text-orange-700" : "text-[#374151]")}>{item.label}</span>
                          {isBlocking && <span className="text-xs text-red-500">*阻断</span>}
                          {isWarning && <span className="text-xs text-orange-500">*警告</span>}
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5 truncate">{item.detail}</div>
                      </div>
                      <span className="text-xs text-[#9CA3AF] whitespace-nowrap">{item.location}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 2. 五书文件确认 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">五书文件确认</CardTitle>
            </CardHeader>
            <CardContent>
              {books.length === 0 ? (
                <div className="text-sm text-[#9CA3AF] py-4 text-center">暂无五书数据</div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {books.map(book => {
                    const Icon = iconMap[book.icon] || FileText
                    return (
                      <div key={book.key} className={"p-3 rounded-lg border " + (book.ready ? "border-green-200 bg-green-50" : "border-border bg-[#F9FAFB]")}>
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-2 border">
                          <Icon className="h-5 w-5 text-[#6B7280]" />
                        </div>
                        <div className="text-sm font-medium text-[#111827] truncate">{book.label}</div>
                        <div className="text-xs mt-0.5">
                          {book.ready ? <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />已生成</span> : <span className="text-[#9CA3AF]">未生成</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. 复核结果确认 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">复核结果确认</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg border-green-200 bg-green-50">
                  <div className="text-lg font-bold text-green-600">{items.filter(i => i.passed).length}</div>
                  <div className="text-xs text-[#6B7280] mt-1">通过项</div>
                </div>
                <div className="text-center p-4 rounded-lg border-red-200 bg-red-50">
                  <div className="text-lg font-bold text-red-600">{blockingItems.length}</div>
                  <div className="text-xs text-[#6B7280] mt-1">阻断项</div>
                </div>
                <div className="text-center p-4 rounded-lg border-orange-200 bg-orange-50">
                  <div className="text-lg font-bold text-orange-600">{warningItems.length}</div>
                  <div className="text-xs text-[#6B7280] mt-1">警告项</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#F9FAFB]">
                  <div className={"text-lg font-bold " + (canSubmit ? "text-green-600" : "text-red-600")}>{canSubmit ? "可提交" : "不可提交"}</div>
                  <div className="text-xs text-[#6B7280] mt-1">提交状态</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. 审核锁定版本确认（暂不实现） */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">审核锁定版本确认</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-[#F9FAFB]">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileCheck className="h-6 w-6 text-[#9CA3AF]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#9CA3AF]">锁定版本功能暂未开放</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">后续版本将支持审核版本锁定与快照</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 阻断提示 */}
          {!canSubmit && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-red-800">存在 {blockingItems.length} 项阻断问题</div>
                    <div className="text-xs text-red-600 mt-1">可点击「退回修改」将案例退回撰写阶段，修改后重新提交五书</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
