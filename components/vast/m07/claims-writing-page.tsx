"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Link2,
  ChevronRight,
  ChevronDown,
  GitBranch,
  FileText,
  Lightbulb,
  ArrowRight,
  Search,
  Loader2,
  Trash2,
  Send,
} from "lucide-react"

interface ClaimsWritingPageProps {
  caseId?: string | null
  onBack: () => void
  onEdit?: (caseId: string) => void
}

interface CaseItem {
  id: string
  case_id: string
  title: string
  type: string
  status: string
}

interface Claim {
  id: string
  number: number
  type: "independent" | "dependent"
  text: string
  refClaim?: number
  supportStatus: "supported" | "weak" | "unsupported" | "unchecked"
  supportParagraphs: string[]
  status?: string
}



const alternatives = [
  {
    id: "alt1",
    title: "强化学习算法替代方案",
    content: "作为替代方案，所述AI处理单元还可以采用强化学习算法，通过与环境交互不断优化控制策略。",
    source: "交底书-发明内容-替代方案",
  },
  {
    id: "alt2",
    title: "边缘计算替代方案",
    content: "所述AI处理单元可部署于边缘计算节点，减少数据传输延迟。",
    source: "交底书-具体实施方式-替代方案",
  },
]

const getSupportBadge = (status: string) => {
  switch (status) {
    case "supported":
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
          <CheckCircle className="h-3 w-3" />
          有支持
        </span>
      )
    case "weak":
      return (
        <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
          <AlertCircle className="h-3 w-3" />
          弱支持
        </span>
      )
    case "unsupported":
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
          <AlertCircle className="h-3 w-3" />
          无支持
        </span>
      )
    default:
      return (
        <span className="text-xs text-[#9CA3AF] bg-[#F0F3F8] px-2 py-0.5 rounded">
          未检查
        </span>
      )
  }
}

export function ClaimsWritingPage({ caseId, onBack, onEdit }: ClaimsWritingPageProps) {
  // 案例选择
  const [activeCaseId, setActiveCaseId] = useState<string | null>(caseId ?? null)
  const [activeCaseTitle, setActiveCaseTitle] = useState("")
  const [casesList, setCasesList] = useState<CaseItem[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState("")

  // 权利要求
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [claimsDocId, setClaimsDocId] = useState<string | null>(null)
  const [selectedClaim, setSelectedClaim] = useState<string>("")
  const [showHierarchy, setShowHierarchy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [showSupportDialog, setShowSupportDialog] = useState(false)
  const [specContent, setSpecContent] = useState("")
  const [loadingSpec, setLoadingSpec] = useState(false)
  const [claimsLocked, setClaimsLocked] = useState(false)
  const [claimsLockedMessage, setClaimsLockedMessage] = useState("")
  const [claimsSubmitted, setClaimsSubmitted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [tempSelections, setTempSelections] = useState<{ text: string; start: number; end: number }[]>([])

  const toggleExpand = (num: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

  // 加载案例列表（选择器用）
  useEffect(() => {
    if (activeCaseId) return
    setCasesLoading(true)
    const token = localStorage.getItem("vast_token")
    fetch("/api/cases?page=1&pageSize=100", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) setCasesList((data.data.list || []).filter((c: any) => c.status === 'writing'))
      })
      .finally(() => setCasesLoading(false))
  }, [activeCaseId])

  // 加载权利要求
  useEffect(() => {
    if (!activeCaseId) return
    setLoading(true)
    const token = localStorage.getItem("vast_token")
    fetch(`/api/m07/claims?caseId=${encodeURIComponent(activeCaseId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.code === 200) {
          if (data.data.locked) {
            setClaimsLocked(true)
            setClaimsSubmitted(data.data.isSubmitted || false)
            setClaimsLockedMessage(data.data.message || "权利要求书已确认提交")
            return
          }
          setClaimsLocked(false)
          setClaimsSubmitted(false)
          const loaded = data.data.claims || []
          setClaims(loaded)
          if (loaded.length > 0) setSelectedClaim(loaded[0].id)
        }
      })
      .finally(() => setLoading(false))
  }, [activeCaseId])

  const handleSelectCase = (id: string) => {
    setActiveCaseId(id)
    setClaims([])
    setClaimsLocked(false)
    setSelectedClaim("")
  }

  const handleBackToCasePicker = () => {
    setActiveCaseId(null)
    setActiveCaseTitle("")
    setClaims([])
    setClaimsLocked(false)
    setSelectedClaim("")
  }

  const handleConfirmClaims = async () => {
    if (!activeCaseId) return
    setConfirming(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/claims/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseId: activeCaseId }),
      })
      const data = await res.json()
      if (data?.code === 200) {
        setClaimsLocked(true)
        setClaimsLockedMessage("权利要求书已确认提交，转为 docx 格式，请在双文档工作台中使用 OnlyOffice 编辑")
      } else {
        alert(data.message || "确认失败")
      }
    } finally {
      setConfirming(false)
    }
  }

  const handleCheckSupport = async () => {
    if (!activeCaseId || claims.length === 0) return
    setChecking(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/claims/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseId: activeCaseId, claims }),
      })
      const data = await res.json()
      if (data?.code === 200 && Array.isArray(data.data)) {
        setClaims((prev) =>
          prev.map((c) => {
            const result = data.data.find((r: any) => r.number === c.number)
            return result
              ? { ...c, supportStatus: result.status, supportParagraphs: result.paragraphs || [] }
              : c
          })
        )
      }
    } finally {
      setChecking(false)
    }
  }

  const handleSave = async () => {
    if (!activeCaseId) return
    setSaving(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseId: activeCaseId, claims }),
      })
      const data = await res.json()
      if (data?.code === 200 && data.data?.claims) {
        // 用后端返回的 ID 更新前端 claims
        setClaims(data.data.claims.map((c: any) => ({
          id: c.id,
          number: c.number,
          type: c.type,
          text: c.text,
          refClaim: c.refClaim,
          supportStatus: c.supportStatus || "unchecked",
          supportParagraphs: c.supportParagraphs || [],
          status: c.status,
        })))
      } else if (data?.code !== 200) {
        alert(data?.message || "保存失败")
      }
    } finally {
      setSaving(false)
    }
  }

  const currentClaim = claims.find((c) => c.id === selectedClaim)
  const independentClaims = claims.filter((c) => c.type === "independent")

  // ========== 案例选择器视图 ==========
  if (!activeCaseId) {
    const filtered = casesList.filter((c) =>
      !caseSearch || c.title.includes(caseSearch) || c.case_id.includes(caseSearch)
    )
    const typeLabel = (t: string) => t === "invention" ? "发明" : t === "utility" ? "实用新型" : "外观设计"
    const statusLabel = (s: string) => {
      const m: Record<string, string> = { draft: "草稿", writing: "撰写中", reviewing: "审核中", completed: "已完成" }
      return m[s] || s
    }

    return (
      <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
        <div className="h-14 px-4 bg-white border-b border-border flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />返回
          </Button>
          <h1 className="text-sm font-semibold text-[#111827]">选择权利要求案件</h1>
          <p className="text-xs text-[#9CA3AF]">选择一个已接受说明书的案件</p>
        </div>
        <div className="px-4 py-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded border border-border text-sm"
              placeholder="搜索案件..."
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-4 pb-4">
          {casesLoading ? (
            <div className="flex items-center justify-center py-20 text-[#9CA3AF]">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />加载中...
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-white hover:border-[#2F80ED] hover:shadow-sm cursor-pointer transition-all"
                  onClick={() => { handleSelectCase(c.id); setActiveCaseTitle(c.title) }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#111827] truncate">{c.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">{typeLabel(c.type)}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#EAF4FF] text-[#2F80ED]">{statusLabel(c.status)}</span>
                    </div>
                    <div className="text-xs text-[#9CA3AF] mt-1">{c.case_id}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#9CA3AF] flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========== 权利要求撰写视图 ==========

  const nextNumber = () => claims.length === 0 ? 1 : Math.max(...claims.map((c) => c.number)) + 1

  const handleAddIndependent = () => {
    const n = nextNumber()
    const newClaim: Claim = {
      id: `c${n}`,
      number: n,
      type: "independent",
      text: "",
      supportStatus: "unchecked",
      supportParagraphs: [],
    }
    setClaims([...claims, newClaim])
    setSelectedClaim(newClaim.id)
  }

  const handleAddDependent = () => {
    if (!currentClaim) return
    const n = nextNumber()
    const newClaim: Claim = {
      id: `c${n}`,
      number: n,
      type: "dependent",
      text: `根据权利要求${currentClaim.number}所述的系统，其特征在于，`,
      refClaim: currentClaim.number,
      supportStatus: "unchecked",
      supportParagraphs: [],
    }
    setClaims([...claims, newClaim])
    setSelectedClaim(newClaim.id)
  }

  const updateClaimText = (text: string) => {
    setClaims(
      claims.map((c) => (c.id === selectedClaim ? { ...c, text } : c))
    )
  }

  const handleOpenSupportDialog = async () => {
    if (!currentClaim) { alert("请先选择一条权利要求"); return }
    if (!activeCaseId) return
    setLoadingSpec(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/m07/spec-draft-page?caseId=${encodeURIComponent(activeCaseId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data?.code === 200) {
        setSpecContent(data.data?.content || "")
        // 预加载已有支持段落
        const existing = currentClaim.supportParagraphs || []
        setTempSelections(existing.map((t, i) => {
          const idx = (data.data?.content || "").indexOf(t)
          return { text: t, start: idx >= 0 ? idx : 0, end: idx >= 0 ? idx + t.length : 0 }
        }))
        setShowSupportDialog(true)
      }
    } finally {
      setLoadingSpec(false)
    }
  }

  const handleAddSelection = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString().trim()
    if (!text) return
    // 找位置
    const container = document.getElementById("spec-content-area")
    if (!container) return
    const fullText = specContent
    const start = fullText.indexOf(text)
    if (start === -1) return
    // 去重
    if (tempSelections.some(s => s.text === text)) return
    setTempSelections(prev => [...prev, { text, start, end: start + text.length }])
  }

  const handleRemoveSelection = (index: number) => {
    setTempSelections(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveSupport = async () => {
    if (!currentClaim || !activeCaseId) return
    const paras = tempSelections.map(s => s.text)
    const token = localStorage.getItem("vast_token")
    try {
      const newStatus = paras.length > 0 ? "supported" : "unsupported"
      const res = await fetch(`/api/m07/claims/${currentClaim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ supportParagraphs: paras, supportStatus: newStatus }),
      })
      const data = await res.json()
      if (data?.code === 200) {
        setClaims(prev => prev.map(c => c.id === currentClaim.id ? {
          ...c, supportParagraphs: paras, supportStatus: newStatus, status: "pending_review"
        } : c))
        setShowSupportDialog(false)
      }
    } catch { alert("保存失败") }
  }

  const handleDeleteClaim = async (claimId: string) => {
    if (!confirm("确定删除该权利要求？")) return
    setDeleting(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/m07/claims/${claimId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data?.code === 200) {
        setClaims(prev => prev.filter(c => c.id !== claimId))
        if (selectedClaim === claimId) setSelectedClaim("")
      } else {
        alert(data?.message || "删除失败")
      }
    } catch {
      alert("删除请求失败")
    } finally {
      setDeleting(false)
    }
  }

  // ========== 权利要求锁定视图 ==========
  if (claimsLocked) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F5F7FA]">
        <Card className="w-[480px]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-2">
              {claimsSubmitted ? '案件已提交审核' : '权利要求书已确认提交'}
            </h2>
            <p className="text-sm text-[#6B7280] mb-6">
              {claimsSubmitted ? '文档已锁定，审核员正在审核中' : claimsLockedMessage}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBackToCasePicker}>
                返回案例选择
              </Button>
              {!claimsSubmitted && (
                <Button onClick={() => (onEdit || onBack)(activeCaseId!)}>
                  前往双文档工作台
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      {/* 顶部操作栏 */}
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToCasePicker}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回案例选择
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">权利要求书撰写</h1>
            <p className="text-xs text-[#9CA3AF]">{activeCaseTitle || "权利要求撰写"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddIndependent}>
            <Plus className="h-4 w-4 mr-2" />
            新增独权
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddDependent} disabled={!currentClaim}>
            <Plus className="h-4 w-4 mr-2" />
            新增从权
          </Button>
          <Button variant="outline" size="sm" onClick={handleCheckSupport} disabled={checking}>
            <CheckCircle className="h-4 w-4 mr-2" />
            {checking ? "检查中..." : "支持检查"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHierarchy(!showHierarchy)}>
            <GitBranch className="h-4 w-4 mr-2" />
            层级图
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleConfirmClaims} disabled={confirming || claims.length === 0}>
            {confirming ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />提交中...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" />确认提交</>
            )}
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：权利要求树 */}
        <Card className="w-72 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">权利要求树</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-3 space-y-1">
                {(() => {
                  // 递归渲染从属权利要求
                  const renderChildren = (parentNum: number, depth: number) => {
                    const children = claims.filter(
                      c => c.type === "dependent" && c.refClaim === parentNum
                    )
                    if (children.length === 0 || !expandedNodes.has(parentNum)) return null
                    const sizeClass = depth === 0 ? "text-xs" : depth === 1 ? "text-[11px]" : "text-[10px]"
                    const expanded = expandedNodes.has(parentNum)
                    return (
                      <div className="ml-6 space-y-1 mt-1">
                        {children.map(child => {
                          const hasGrandChildren = claims.some(
                            c => c.type === "dependent" && c.refClaim === child.number
                          )
                          const childExpanded = expandedNodes.has(child.number)
                          return (
                            <div key={child.id}>
                              <div
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                  selectedClaim === child.id ? "bg-[#EAF4FF] text-[#2F80ED]" : "hover:bg-[#F5F7FA]"
                                }`}
                                onClick={() => setSelectedClaim(child.id)}
                              >
                                {hasGrandChildren ? (
                                  <button
                                    className="p-0.5 rounded hover:bg-gray-200"
                                    onClick={(e) => { e.stopPropagation(); toggleExpand(child.number) }}
                                  >
                                    {childExpanded
                                      ? <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                                      : <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                                    }
                                  </button>
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={sizeClass}>权利要求 {child.number}</span>

                                  </div>
                                </div>
                                {getSupportBadge(child.supportStatus)}                              {child.status === "pending_review" && (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-purple-50 text-purple-600">待审</span>
                              )}                                <button
                                  className="ml-1 p-1 rounded hover:bg-red-50 text-[#D1D5DB] hover:text-red-500"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteClaim(child.id) }}
                                  title="删除"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              {renderChildren(child.number, depth + 1)}
                            </div>
                          )
                        })}
                      </div>
                    )
                  }

                  return independentClaims.map(indClaim => {
                    const hasChildren = claims.some(
                      c => c.type === "dependent" && c.refClaim === indClaim.number
                    )
                    const expanded = expandedNodes.has(indClaim.number)
                    return (
                    <div key={indClaim.id}>
                      <div
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedClaim === indClaim.id ? "bg-[#EAF4FF] text-[#2F80ED]" : "hover:bg-[#F5F7FA]"
                        }`}
                        onClick={() => setSelectedClaim(indClaim.id)}
                      >
                        {hasChildren ? (
                          <button
                            className="p-0.5 rounded hover:bg-gray-200"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(indClaim.number) }}
                          >
                            {expanded
                              ? <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                              : <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                            }
                          </button>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">权利要求 {indClaim.number}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[#2F80ED] text-white">独权</span>
                          </div>
                        </div>
                        {getSupportBadge(indClaim.supportStatus)}
                        {indClaim.status === "pending_review" && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-purple-50 text-purple-600">待审</span>
                        )}
                        <button
                          className="ml-1 p-1 rounded hover:bg-red-50 text-[#D1D5DB] hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleDeleteClaim(indClaim.id) }}
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {expanded && renderChildren(indClaim.number, 0)}
                    </div>
                  )
                })
                })()}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 中部：权利要求正文编辑区 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {currentClaim ? (
                  <>
                    权利要求 {currentClaim.number}
                    <span className="ml-2 text-xs font-normal text-[#6B7280]">
                      {currentClaim.type === "independent" ? "独立权利要求" : "从属权利要求"}
                    </span>
                  </>
                ) : (
                  "选择或新建权利要求"
                )}
              </CardTitle>
              {currentClaim && (
                <div className="flex items-center gap-2">
                  {currentClaim.status === "pending_review" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">待审核</span>
                  )}
                  {getSupportBadge(currentClaim.supportStatus)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 flex flex-col">
            <>
            {currentClaim?.type === "dependent" && (
              <div className="mb-4">
                <label className="text-sm text-[#6B7280] mb-2 block">引用关系</label>
                <Select
                  value={String(currentClaim.refClaim)}
                  onValueChange={(v) => {
                    setClaims(
                      claims.map((c) =>
                        c.id === selectedClaim ? { ...c, refClaim: parseInt(v) } : c
                      )
                    )
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {claims
                      .filter((c) => c.number < (currentClaim?.number || 0))
                      .map((c) => (
                        <SelectItem key={c.id} value={String(c.number)}>
                          权利要求 {c.number}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
              className="flex-1 min-h-[300px] text-sm leading-relaxed resize-none"
              value={currentClaim?.text || ""}
              onChange={(e) => updateClaimText(e.target.value)}
              placeholder="请输入权利要求内容..."
            />
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleOpenSupportDialog} disabled={!currentClaim || loadingSpec}>
                <Link2 className="h-4 w-4 mr-2" />
                {loadingSpec ? "加载中..." : "选择支持段落"}
              </Button>
              <div className="text-xs text-[#9CA3AF]">
                字数：{currentClaim?.text.length || 0}
              </div>
            </div>
            </>
          </CardContent>
        </Card>

        {/* 右侧：说明书支持关系 / 替代方案素材 */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* 支持段落 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2F80ED]" />
                说明书支持
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentClaim?.supportParagraphs.length ? (
                <div className="space-y-2">
                  {currentClaim.supportParagraphs.map((para, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-[#F5F7FA] text-xs text-[#374151] cursor-pointer hover:bg-[#EAF4FF]"
                    >
                      <Link2 className="h-3 w-3 text-[#2F80ED]" />
                      {para}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-[#9CA3AF]">
                  {currentClaim?.supportStatus === "unsupported" ? (
                    <div className="text-red-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      无说明书支持，请补充说明书内容
                    </div>
                  ) : (
                    "暂无支持段落"
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 替代方案素材 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-orange-500" />
                替代方案素材
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-3 rounded border border-border hover:border-[#2F80ED] cursor-pointer transition-colors"
                    >
                      <div className="text-sm font-medium text-[#111827] mb-1">{alt.title}</div>
                      <p className="text-xs text-[#6B7280] line-clamp-2">{alt.content}</p>
                      <div className="text-xs text-[#9CA3AF] mt-2 flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {alt.source}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 选择支持段落弹窗 */}
      {showSupportDialog && currentClaim && (
        <div className="fixed inset-0 z-50 bg-black/40 flex" onClick={() => setShowSupportDialog(false)}>
          <div className="bg-white w-full max-w-5xl h-full flex flex-col ml-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-base font-semibold">选择支持段落 — 权利要求 {currentClaim.number}</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">在说明书中拖选文字，点击"+ 添加选中"加入支持段落</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleAddSelection}>+ 添加选中</Button>
                <Button size="sm" onClick={handleSaveSupport}>保存</Button>
                <button className="text-[#9CA3AF] hover:text-[#111827] text-lg" onClick={() => setShowSupportDialog(false)}>✕</button>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-auto p-6">
                <div id="spec-content-area" className="text-sm leading-relaxed text-[#374151] whitespace-pre-wrap border rounded-lg p-4 bg-[#F9FAFB] select-text min-h-full">
                  {specContent || <span className="text-[#9CA3AF]">暂无说明书内容</span>}
                </div>
              </div>
              <div className="w-72 border-l bg-[#F9FAFB] p-4 overflow-auto">
                <h4 className="text-sm font-medium text-[#374151] mb-3">支持段落（{tempSelections.length}）</h4>
                {tempSelections.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">选中说明书文字后点击"+ 添加选中"</p>
                ) : (
                  <div className="space-y-2">
                    {tempSelections.map((s, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-white border border-[#DBEAFE] text-[#374151] relative group">
                        <p className="line-clamp-4">{s.text}</p>
                        <button className="absolute top-1 right-1 text-[#D1D5DB] hover:text-red-500 opacity-0 group-hover:opacity-100"
                          onClick={() => handleRemoveSelection(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 层级图弹窗 */}
      {showHierarchy && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-8" onClick={() => setShowHierarchy(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-[#111827]">权利要求层级图</h3>
              <button className="text-[#9CA3AF] hover:text-[#111827] text-lg" onClick={() => setShowHierarchy(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-auto p-8">
              <svg width="100%" height="100%" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid meet">
                {(() => {
                  const elements: React.ReactNode[] = []
                  const levelGap = 140
                  const nodeW = 70, nodeH = 36
                  const nodeRx = 8

                  // 计算每个节点的 Y 坐标
                  const getSubtreeHeight = (parentNum: number): number => {
                    const children = claims.filter(c => c.type === "dependent" && c.refClaim === parentNum)
                    if (children.length === 0) return 60
                    return children.reduce((sum, c) => sum + getSubtreeHeight(c.number), 0)
                  }

                  const layoutNodes = (parentNum: number, parentX: number, parentY: number, yStart: number): { num: number; x: number; y: number; isInd: boolean }[] => {
                    const children = claims.filter(c => c.type === "dependent" && c.refClaim === parentNum)
                    if (children.length === 0) return []
                    const result: { num: number; x: number; y: number; isInd: boolean }[] = []
                    let currentY = yStart
                    for (const child of children) {
                      const subtreeH = getSubtreeHeight(child.number)
                      const childY = currentY + subtreeH / 2 - nodeH / 2
                      const childX = parentX + levelGap
                      result.push({ num: child.number, x: childX, y: childY, isInd: false })
                      // 连线：父节点右边缘 → 子节点左边缘
                      elements.push(
                        <line key={`line-${child.number}`}
                          x1={parentX + nodeW} y1={parentY + nodeH / 2}
                          x2={childX} y2={childY + nodeH / 2}
                          stroke="#D1D5DB" strokeWidth="1.5" />
                      )
                      const subNodes = layoutNodes(child.number, childX, childY, currentY)
                      result.push(...subNodes)
                      currentY += subtreeH
                    }
                    return result
                  }

                  // 计算独权布局
                  const indClaims = claims.filter(c => c.type === "independent").sort((a, b) => a.number - b.number)
                  let totalY = 20
                  const gap = 20

                  for (const ind of indClaims) {
                    const children = claims.filter(c => c.type === "dependent" && c.refClaim === ind.number)
                    const subtreeH = children.length > 0
                      ? children.reduce((sum, c) => sum + getSubtreeHeight(c.number), 0)
                      : 60

                    const indY = totalY + subtreeH / 2 - nodeH / 2
                    // 独权节点
                    elements.push(
                      <rect key={`ind-${ind.number}`} x={20} y={indY} width={nodeW} height={nodeH} rx={nodeRx}
                        fill="#2F80ED" />
                    )
                    elements.push(
                      <text key={`indt-${ind.number}`} x={20 + nodeW / 2} y={indY + nodeH / 2} textAnchor="middle"
                        dominantBaseline="central" fill="white" fontSize="14" fontWeight="600">
                        权{ind.number}
                      </text>
                    )

                    // 从属节点
                    const depNodes = layoutNodes(ind.number, 20, indY, totalY)
                    for (const dn of depNodes) {
                      elements.push(
                        <rect key={`dep-${dn.num}`} x={dn.x} y={dn.y} width={nodeW} height={nodeH} rx={nodeRx}
                          fill="white" stroke="#D1D5DB" strokeWidth="1.5" />
                      )
                      elements.push(
                        <text key={`dept-${dn.num}`} x={dn.x + nodeW / 2} y={dn.y + nodeH / 2} textAnchor="middle"
                          dominantBaseline="central" fill="#374151" fontSize="14">
                          权{dn.num}
                        </text>
                      )
                    }

                    totalY += subtreeH + gap
                  }

                  // 动态设置 SVG 高度
                  elements.unshift(
                    <rect key="bg" x={0} y={0} width={900} height={Math.max(totalY + 20, 600)} fill="white" />
                  )

                  return elements
                })()}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
