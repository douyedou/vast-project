"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FileCheck,
  Image,
  BookOpen,
  Download,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react"

interface FiveBooksPageProps {
  onBack: () => void
  onCaseSelect?: (caseId: string) => void
  caseId?: string | null
}

interface BookItem {
  key: string
  label: string
  icon: string
  ready: boolean
  documentId: string | null
  preview?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  FileCheck,
  FileText,
  Image,
}

export function FiveBooksPage({ onBack, onCaseSelect, caseId: initialCaseId }: FiveBooksPageProps) {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(initialCaseId ?? null)
  const [activeCaseTitle, setActiveCaseTitle] = useState("")
  const [casesList, setCasesList] = useState<{ id: string; case_id: string; title: string; type: string }[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState("")

  const [books, setBooks] = useState<BookItem[]>([])
  const [images, setImages] = useState<{ id: string; url: string; caption: string; position: number }[]>([])
  const [checking, setChecking] = useState(false)
  const [allReady, setAllReady] = useState(false)
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(null)
  const [showFigurePicker, setShowFigurePicker] = useState(false)

  useEffect(() => {
    if (activeCaseId) return
    setCasesLoading(true)
    const token = localStorage.getItem("vast_token")
    fetch("/api/cases?page=1&pageSize=100", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.code === 200) setCasesList((data.data.list || []).filter((c: any) => c.status === 'writing'))
      })
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
          checkFiveBooks(activeCaseId)
        } else {
          setActiveCaseId(null) // 状态不对，回选择器
        }
      })
  }, [activeCaseId])

  const checkFiveBooks = async (caseId: string) => {
    setChecking(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/m07/five-books/check?caseId=${encodeURIComponent(caseId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data?.code === 200) {
        setBooks(data.data.books || [])
        setImages(data.data.images || [])
        setAllReady(data.data.allReady)
        // Auto-select first ready doc book for preview
        const firstDoc = (data.data.books || []).find((b: BookItem) => b.ready && b.documentId)
        setSelectedBook(firstDoc?.key || null)
      }
    } finally {
      setChecking(false)
    }
  }

  const handleSelectCase = (id: string, title: string) => {
    setActiveCaseId(id)
    setActiveCaseTitle(title)
    onCaseSelect?.(id)
    const token = localStorage.getItem("vast_token")
    fetch(`/api/cases/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        checkFiveBooks(id)
      })
  }

  const handleDownload = (documentId: string) => {
    const token = localStorage.getItem("vast_token")
    window.open(`/api/onlyoffice/document/${documentId}?token=${token}`, "_blank")
  }

  const handleSelectFigure = async (imageId: string) => {
    if (!activeCaseId) return
    const token = localStorage.getItem("vast_token")
    const res = await fetch("/api/m07/five-books/select-figure", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ caseId: activeCaseId, imageId }),
    })
    const data = await res.json()
    if (data?.code === 200) {
      setBooks(prev => prev.map(b => b.key === "abstractFigure" ? { ...b, ready: true, documentId: imageId } : b))
      setAllReady(books.every(b => b.key === "abstractFigure" ? true : b.ready))
      setShowFigurePicker(false)
    }
  }

  // ---- submitted view (removed) ----

  // ---- case picker ----
  if (!activeCaseId) {
    const filtered = casesList.filter(c =>
      !caseSearch || c.title.includes(caseSearch) || c.case_id.includes(caseSearch)
    )
    const typeLabel = (t: string) => t === "invention" ? "发明" : t === "utility" ? "实用新型" : "外观设计"
    return (
      <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
        <div className="h-14 px-4 bg-white border-b flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />返回
          </Button>
          <h1 className="text-sm font-semibold text-[#111827]">选择五书案例</h1>
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
          ) : (
            <div className="grid gap-2">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border bg-white hover:border-[#2F80ED] cursor-pointer"
                  onClick={() => handleSelectCase(c.id, c.title)}>
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

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setActiveCaseId(null); setBooks([]) }}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回案例选择
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">五书生成</h1>
            <p className="text-xs text-[#9CA3AF]">{activeCaseTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => checkFiveBooks(activeCaseId!)} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            刷新
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        <Card className="w-80 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">五书文件清单</CardTitle>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex items-center justify-center py-12 text-[#9CA3AF]">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />检查中...
              </div>
            ) : (
              <div className="space-y-2">
                {books.map(book => {
                  const Icon = iconMap[book.icon] || FileText
                  const isSelected = selectedBook === book.key
                  const isFigure = book.key === "abstractFigure"
                  return (
                    <div
                      key={book.key}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-[#EAF4FF] border border-[#2F80ED]" : book.ready ? "bg-green-50 border border-green-200 hover:bg-green-100" : "bg-[#F9FAFB] border border-transparent hover:bg-[#F3F4F6]"}`}
                      onClick={() => {
                        if (isFigure && !book.ready) { setShowFigurePicker(true) }
                        else { setSelectedBook(book.key) }
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-border">
                        <Icon className="h-5 w-5 text-[#6B7280]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#111827]">{book.label}</div>
                        <div className="text-xs mt-0.5">
                          {book.ready ? (
                            <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />已生成</span>
                          ) : isFigure ? (
                            <span className="text-[#2F80ED] flex items-center gap-1 cursor-pointer">点击选择附图</span>
                          ) : (
                            <span className="text-[#9CA3AF] flex items-center gap-1"><AlertCircle className="h-3 w-3" />未就绪</span>
                          )}
                        </div>
                      </div>
                      {book.ready && book.documentId && !isFigure && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDownload(book.documentId!) }} title="下载 docx">
                          <Download className="h-4 w-4 text-[#2F80ED]" />
                        </Button>
                      )}
                      {book.ready && isFigure && (
                        <span className="text-xs text-[#9CA3AF]"><CheckCircle className="h-3 w-3 text-green-600 inline" /></span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 摘要附图选择器 */}
            {showFigurePicker && (
              <div className="mt-4 p-3 rounded-lg border border-[#2F80ED] bg-white">
                <div className="text-sm font-medium text-[#111827] mb-2">选择摘要附图</div>
                {images.length === 0 ? (
                  <div className="text-xs text-[#9CA3AF] py-4 text-center">暂无附图，请先在双文档工作台上传</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                      {images.map(img => (
                        <div
                          key={img.id}
                          className={`p-2 rounded border cursor-pointer transition-colors ${selectedFigureId === img.id ? "border-[#2F80ED] bg-[#EAF4FF]" : "border-border hover:border-[#2F80ED]"}`}
                          onClick={() => setSelectedFigureId(img.id)}
                        >
                          <img src={img.url} alt={img.caption} className="h-20 w-full object-cover rounded mb-1" />
                          <div className="text-xs text-[#6B7280] truncate">{img.caption}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => { setShowFigurePicker(false); setSelectedFigureId(null) }}>取消</Button>
                      <Button size="sm" onClick={() => {
                        if (selectedFigureId) handleSelectFigure(selectedFigureId)
                      }} disabled={!selectedFigureId}>
                        确认选择
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {allReady ? (
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">五书齐全，可以提交审核</span>
                </div>
              </div>
            ) : books.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <span className="text-sm text-orange-700">未满足提交条件</span>
                    <div className="text-xs text-orange-600 mt-1">
                      缺少：{books.filter(b => !b.ready).map(b => b.label).join('、')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 overflow-hidden">
          <CardContent className="h-full p-0">
            {!selectedBook ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p>选择左侧文件查看详情</p>
                </div>
              </div>
            ) : selectedBook === "abstractFigure" ? (
              <div className="w-full h-full flex flex-col p-6">
                {(() => {
                  const fig = books.find(b => b.key === "abstractFigure")
                  const img = images.find(i => i.id === fig?.documentId)
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-border mb-4">
                        <Image className="h-5 w-5 text-[#2F80ED]" />
                      </div>
                      <h3 className="text-base font-semibold text-[#111827] mb-2">摘要附图</h3>
                      {img ? (
                        <>
                          <span className="text-green-600 text-xs flex items-center gap-1 mb-3"><CheckCircle className="h-3 w-3" />已选择</span>
                          <img src={img.url} alt={img.caption} className="max-h-[60vh] max-w-full rounded-lg border border-border shadow-sm" />
                          <p className="text-sm text-[#6B7280] mt-3">{img.caption}</p>
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-[#6B7280] mb-4">尚未选择摘要附图</p>
                          <Button variant="outline" onClick={() => setShowFigurePicker(true)}>选择附图</Button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col p-6">
                {(() => {
                  const book = books.find(b => b.key === selectedBook)
                  const Icon = book ? iconMap[book.icon] || FileText : FileText
                  return (
                    <>
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-border">
                          <Icon className="h-5 w-5 text-[#2F80ED]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-[#111827]">{book?.label}</h3>
                          {book?.ready ? (
                            <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" />已就绪</span>
                          ) : (
                            <span className="text-[#9CA3AF] text-xs flex items-center gap-1"><AlertCircle className="h-3 w-3" />未就绪</span>
                          )}
                        </div>
                        {book?.ready && book.documentId && (
                          <Button variant="outline" size="sm" onClick={() => handleDownload(book.documentId!)}>
                            <Download className="h-4 w-4 mr-1" />下载 docx
                          </Button>
                        )}
                      </div>
                      <ScrollArea className="flex-1 min-h-0">
                        <pre className="text-sm text-[#374151] whitespace-pre-wrap font-sans leading-relaxed">{book?.preview || "暂无预览内容"}</pre>
                      </ScrollArea>
                    </>
                  )
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
