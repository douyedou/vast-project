"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { OnlyOfficeEditor } from "./onlyoffice-editor"
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  Link2,
  Eye,
  PanelLeftClose,
  PanelLeft,
  Upload,
  Loader2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  MessageCircle,
  Send,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react"

interface DualDocWorkspaceProps {
  onBack: () => void
  onCaseSelect?: (caseId: string) => void
  caseId?: string | null
}

// 交底六项覆盖状态
interface DisclosureItem {
  id: string
  label: string
  status: "covered" | "weak" | "uncovered"
  content: string
  reason?: string
  mappedTo?: string | null
}

const INITIAL_DISCLOSURE_SIX: DisclosureItem[] = [
  {
    id: "technicalProblem",
    label: "技术问题",
    status: "covered",
    content: "现有的温度控制系统通常采用简单的阈值控制方式，无法根据环境变化进行自适应调节，导致能源浪费和用户体验不佳。",
    mappedTo: "说明书-背景技术-段落1",
  },
  {
    id: "backgroundTechnology",
    label: "背景技术",
    status: "covered",
    content: "一种智能温控系统，包括：传感器模块、AI处理单元、执行机构和反馈回路。其中AI处理单元采用深度学习算法实现自适应温度调节。",
    mappedTo: "说明书-发明内容-段落1",
  },
  {
    id: "technicalSolution",
    label: "技术方案",
    status: "weak",
    content: "传感器模块采集环境温度数据→AI处理单元分析预测→执行机构调整温控设备→反馈回路验证效果并回传数据形成闭环。",
    reason: "说明书仅描述了各模块功能，未明确说明模块间的信号传递关系和数据流向",
    mappedTo: "说明书-发明内容-段落2",
  },
  {
    id: "embodiments",
    label: "实施方式",
    status: "uncovered",
    content: "本系统相比传统温控方案可节能30%以上，响应速度提升50%，用户舒适度评分提高40%。",
    reason: "说明书中未找到对应的技术效果量化数据描述",
    mappedTo: null,
  },
  {
    id: "beneficialEffects",
    label: "有益效果",
    status: "covered",
    content: "基于深度学习预测模型的温度控制方法；传感器-执行器-反馈回路的闭环控制架构。",
    mappedTo: "权利要求1、权利要求3",
  },
  {
    id: "drawings",
    label: "附图说明",
    status: "weak",
    content: "AI处理单元可采用强化学习算法替代深度学习，通过与环境交互优化控制策略；传感器可选用红外阵列替代单点温度传感器。",
    reason: "替代方案仅在发明内容中提及，未在具体实施方式中给出对应的实施例",
    mappedTo: "说明书-发明内容-段落4",
  },
]

const getStatusBadge = (status: string | boolean) => {
  if (status === true || status === "covered") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
        <CheckCircle className="h-3 w-3" />
        已覆盖
      </span>
    )
  }
  if (status === "weak") {
    return (
      <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
        <AlertCircle className="h-3 w-3" />
        弱覆盖
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
      <AlertCircle className="h-3 w-3" />
      未覆盖
    </span>
  )
}

export function DualDocWorkspace({ onBack, onCaseSelect, caseId: initialCaseId }: DualDocWorkspaceProps) {
  // 案例选择
  const [activeCaseId, setActiveCaseId] = useState<string | null>(initialCaseId ?? null)
  const [activeCaseTitle, setActiveCaseTitle] = useState("")
  const [activeCaseOwner, setActiveCaseOwner] = useState("")
  const [casesList, setCasesList] = useState<{ id: string; case_id: string; title: string; type: string; status: string; isOwner: boolean; engineer_name?: string }[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState("")

  // ── 当前用户 ID ──
  const getUserId = () => {
    try {
      const token = localStorage.getItem("vast_token")
      if (!token) return ''
      const parts = token.split('.')
      if (parts.length !== 3) return ''
      // base64url → base64
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      return payload.userId || ''
    } catch { return '' }
  }

  // 加载案例列表（后端自动过滤本人的 + case_engineers 的）
  useEffect(() => {
    if (activeCaseId) return
    const uid = getUserId()
    if (!uid) return
    setCasesLoading(true)
    const token = localStorage.getItem("vast_token")
    const headers: any = { Authorization: `Bearer ${token}` }

    fetch("/api/m07/workspace/cases", { headers })
      .then(r => r.json())
      .then(data => {
        const allCases = (data?.data || []).filter((c: any) => c.status === 'writing')
        setCasesList(allCases.map((c: any) => ({
          ...c,
          isOwner: c.engineer_id === uid,
        })))
      })
      .finally(() => setCasesLoading(false))
  }, [activeCaseId])
  const [currentTab, setCurrentTab] = useState("spec")
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [leftTab, setLeftTab] = useState<"disclosure" | "ai-chat" | "coverage">("coverage")
  const [docsMap, setDocsMap] = useState<Record<string, string>>({})  // type → documentId
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [claimsList, setClaimsList] = useState<{ id: string; number: number; text: string }[]>([])
  const [selectedClaimId, setSelectedClaimId] = useState("")
  const [drawingImages, setDrawingImages] = useState<{ id: string; caption: string; description: string; url: string; position: number }[]>([])
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const [caseLocked, setCaseLocked] = useState(false)

  // ── 检查 & 版本 ──
  const [checkDialogOpen, setCheckDialogOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [savingVersion, setSavingVersion] = useState(false)
  const [checkData, setCheckData] = useState<{
    stats: { total: number; passed: number; blocking: number; blockingPassed: number; warningTotal: number; warningActive: number }
    items: { key: string; label: string; passed: boolean; severity: string; detail: string; value?: string; location: string; position: string }[]
  } | null>(null)
  // 底部状态栏数据
  const [footerStats, setFooterStats] = useState({
    coverage: { value: '--', color: 'text-[#6B7280]' },
    support: { value: '--', color: 'text-[#6B7280]' },
    duplicate: { value: '--', color: 'text-[#6B7280]' },
    aiRate: { value: '--', color: 'text-[#6B7280]' },
  })
  const [currentVersion, setCurrentVersion] = useState<string>('--')

  // ── 交底书全文数据 ──
  const [disclosureFullText, setDisclosureFullText] = useState<{ id: string; label: string; content: string }[]>([])

  // ── AI 问答 ──
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // ── 协作管理 ──
  const [collabDialogOpen, setCollabDialogOpen] = useState(false)
  const [collabList, setCollabList] = useState<any[]>([])
  const [collabSearch, setCollabSearch] = useState("")
  const [collabSearchResults, setCollabSearchResults] = useState<any[]>([])
  const [collabLoading, setCollabLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  // ── 覆盖状态数据（初始静态，检查后 AI 更新） ──
  const [disclosureSix, setDisclosureSix] = useState<DisclosureItem[]>(INITIAL_DISCLOSURE_SIX)

  // 加载案例文档 + 检查锁定状态
  useEffect(() => {
    if (!activeCaseId) return
    setLoadingDoc(true)
    const token = localStorage.getItem("vast_token")
    Promise.all([
      fetch(`/api/m07?caseId=${encodeURIComponent(activeCaseId)}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/cases/${activeCaseId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([docsData, caseData]) => {
        if (docsData?.code === 200 && Array.isArray(docsData.data)) {
          const map: Record<string, string> = {}
          for (const doc of docsData.data) {
            map[doc.type] = doc.id
          }
          setDocsMap(map)
        }
        if (caseData?.code === 200) {
          setCaseLocked(caseData.data?.status === 'writingcheck' || caseData.data?.status === 'reviewing')
          setActiveCaseTitle(caseData.data?.title || '')
        }
      })
      .finally(() => setLoadingDoc(false))
  }, [activeCaseId])

  // 切换到权利要求书 tab 时加载 claim 列表
  useEffect(() => {
    if (currentTab !== "claims" || !activeCaseId) return
    const token = localStorage.getItem("vast_token")
    fetch(`/api/m07/claims?caseId=${encodeURIComponent(activeCaseId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.code === 200) {
          setClaimsList(data.data.claims || [])
        }
      })
  }, [currentTab, activeCaseId])

  // 切换到附图说明 tab 时加载图片
  useEffect(() => {
    if (currentTab !== "drawings" || !activeCaseId) return
    // 用说明书的 documentId 查图片
    const specId = docsMap["spec"]
    if (!specId) return
    const token = localStorage.getItem("vast_token")
    fetch(`/api/m07/spec-draft-page/images?documentId=${encodeURIComponent(specId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.code === 200) setDrawingImages(data.data || [])
      })
  }, [currentTab, activeCaseId, docsMap])

  // ── 拉取底部状态栏数据 ──
  useEffect(() => {
    if (!activeCaseId) return
    const token = localStorage.getItem("vast_token")
    fetch(`/api/m07/full-review/check?caseId=${encodeURIComponent(activeCaseId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d?.code === 200 && d.data?.items) {
          const items = d.data.items as any[]
          const getVal = (key: string, fallback = '--') => {
            const item = items.find((i: any) => i.key === key)
            return item?.value || item?.detail || fallback
          }
          const getColorHigh = (v: string) => {
            const n = parseInt(v)
            if (isNaN(n)) return 'text-[#6B7280]'
            return n >= 90 ? 'text-green-600' : n >= 80 ? 'text-orange-600' : 'text-red-600'
          }
          const getColorLow = (v: string) => {
            const n = parseInt(v)
            if (isNaN(n)) return 'text-[#6B7280]'
            return n < 20 ? 'text-green-600' : n < 30 ? 'text-orange-600' : 'text-red-600'
          }
          setFooterStats({
            coverage: { value: getVal('disclosure-coverage'), color: getColorHigh(getVal('disclosure-coverage', '0')) },
            support: { value: getVal('support-rate'), color: getColorHigh(getVal('support-rate', '0')) },
            duplicate: { value: getVal('duplicate-rate'), color: getColorLow(getVal('duplicate-rate', '0')) },
            aiRate: { value: getVal('ai-rate'), color: getColorLow(getVal('ai-rate', '0')) },
          })
        }
      })
      .catch(() => {})

    // 拉取说明书版本号
    fetch(`/api/m07?caseId=${encodeURIComponent(activeCaseId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d?.code === 200 && Array.isArray(d.data)) {
          const spec = d.data.find((doc: any) => doc.type === 'spec')
          if (spec) setCurrentVersion(`v${spec.version || 1}`)
        }
      })
      .catch(() => {})
  }, [activeCaseId, docsMap])

  // ── 拉取交底书全文 ──
  useEffect(() => {
    if (!activeCaseId) return
    const token = localStorage.getItem("vast_token")
    fetch(`/api/m07/disclosure?caseId=${encodeURIComponent(activeCaseId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d?.code === 200 && Array.isArray(d.data)) {
          setDisclosureFullText(d.data)
        }
      })
      .catch(() => {})
  }, [activeCaseId])

  const currentDocId = docsMap[currentTab] || ""

  // 摘要自动创建（一个 case 只一个）
  useEffect(() => {
    if (currentTab !== "abstract" || !activeCaseId || docsMap["abstract"]) return
    const token = localStorage.getItem("vast_token")
    fetch("/api/m07", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ caseId: activeCaseId, type: "abstract", content: "" }),
    })
      .then(r => r.json())
      .then(data => {
        if (data?.code === 200 && data.data?.id) {
          setDocsMap(prev => ({ ...prev, abstract: data.data.id }))
        }
      })
  }, [currentTab, activeCaseId, docsMap])

  const handleSaveImageInfo = async () => {
    if (!editingImageId || !activeCaseId) return
    const token = localStorage.getItem("vast_token")
    // 同步到 document_images.description
    await fetch(`/api/m07/spec-draft-page/images?imageId=${editingImageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description: editDesc }),  // OnlyOffice 回调已更新 content
    })
    setDrawingImages(prev => prev.map(img =>
      img.id === editingImageId ? { ...img, description: editDesc } : img
    ))
  }

  const startEditImage = async (img: { id: string; caption: string; description: string }) => {
    setEditingImageId(img.id)
    setEditCaption(img.caption)
    setEditDesc(img.description || "")
    // 确保有 drawings 文档行
    const drawingsKey = `drawings-${img.id}`
    if (!docsMap[drawingsKey]) {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caseId: activeCaseId, type: "drawings", content: img.description || "" }),
      })
      const data = await res.json()
      if (data?.code === 200) {
        setDocsMap(prev => ({ ...prev, [drawingsKey]: data.data.id }))
      }
    }
  }

  const getDrawingsDocId = () => docsMap[`drawings-${editingImageId}`] || ""

  // ── 上传图片到说明书 ──
  const handleImageUpload = async (files: FileList | null) => {
    const specId = docsMap["spec"]
    if (!files?.length || !specId || !activeCaseId) return
    setUploadingImage(true)
    try {
      const token = localStorage.getItem("vast_token")
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("documentId", specId)
        formData.append("caption", file.name)
        formData.append("position", "1")
        formData.append("section", "drawings")
        await fetch("/api/m07/spec-draft-page/images", {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        })
      }
      // 重新加载图片列表
      if (currentTab === "drawings") {
        const res = await fetch(`/api/m07/spec-draft-page/images?documentId=${encodeURIComponent(specId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data?.code === 200) setDrawingImages(data.data || [])
      }
    } catch (err) {
      console.error("上传图片失败", err)
    } finally {
      setUploadingImage(false)
    }
  }

  // 案例选择器
  const handleSelectCase = (id: string, title: string) => {
    setActiveCaseId(id)
    setActiveCaseTitle(title)
    onCaseSelect?.(id)
    setDocsMap({})
  }

  const handleBackToPicker = () => {
    setActiveCaseId(null)
    setActiveCaseTitle("")
    setDocsMap({})
  }

  // ── 一键检查 ──
  const handleCheck = async () => {
    if (!activeCaseId) return
    setChecking(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch('/api/m07/workspace/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caseId: activeCaseId }),
      })
      const d = await res.json()
      if (d?.code === 200 && d.data) {
        const data = d.data

        // 更新底部状态栏
        const fmtPct = (v: any) => v != null ? `${v}%` : '--'
        const colorHigh = (v: any) => {
          if (v == null) return 'text-[#6B7280]'
          return v >= 90 ? 'text-green-600' : v >= 80 ? 'text-orange-600' : 'text-red-600'
        }
        const colorLow = (v: any) => {
          if (v == null) return 'text-[#6B7280]'
          return v < 20 ? 'text-green-600' : v < 30 ? 'text-orange-600' : 'text-red-600'
        }
        setFooterStats({
          coverage: { value: fmtPct(data.coverageRate), color: colorHigh(data.coverageRate) },
          support: { value: fmtPct(data.supportRate), color: colorHigh(data.supportRate) },
          duplicate: { value: fmtPct(data.duplicateRate), color: colorLow(data.duplicateRate) },
          aiRate: { value: fmtPct(data.aiRate), color: colorLow(data.aiRate) },
        })

        // 更新覆盖状态数据（如果有逐项覆盖结果）
        if (data.sectionCoverage && data.sectionCoverage.length > 0) {
          setDisclosureSix(data.sectionCoverage.map((item: any) => ({
            id: item.id,
            label: item.label,
            status: item.status as "covered" | "weak" | "uncovered",
            content: '', // 从交底全文取
            reason: item.reason || '',
            mappedTo: null,
          })))
        }

        // 构建检查弹窗数据
        const checkItems = [
          { key: 'ai-rate', label: 'AI 相似性', passed: (data.aiRate ?? 100) < 30, severity: (data.aiRate ?? 0) >= 30 ? 'blocking' : 'warning', detail: fmtPct(data.aiRate), value: fmtPct(data.aiRate), location: '说明书', position: '' },
          { key: 'duplicate-rate', label: '查重率', passed: (data.duplicateRate ?? 100) < 30, severity: (data.duplicateRate ?? 0) >= 30 ? 'blocking' : 'warning', detail: fmtPct(data.duplicateRate), value: fmtPct(data.duplicateRate), location: '说明书', position: '' },
          { key: 'coverage-rate', label: '交底覆盖率', passed: (data.coverageRate ?? 0) >= 80, severity: (data.coverageRate ?? 0) < 80 ? 'blocking' : 'warning', detail: fmtPct(data.coverageRate), value: fmtPct(data.coverageRate), location: '说明书↔交底书', position: '' },
          { key: 'support-rate', label: '权利要求支持率', passed: (data.supportRate ?? 0) >= 80, severity: (data.supportRate ?? 0) < 80 ? 'blocking' : 'warning', detail: fmtPct(data.supportRate), value: fmtPct(data.supportRate), location: '权利要求书', position: '' },
        ]
        const total = checkItems.length
        const passed = checkItems.filter(i => i.passed).length
        const blocking = checkItems.filter(i => i.severity === 'blocking').length
        const blockingPassed = checkItems.filter(i => i.severity === 'blocking' && i.passed).length
        const warningTotal = checkItems.filter(i => i.severity === 'warning').length
        const warningActive = checkItems.filter(i => i.severity === 'warning' && !i.passed).length

        setCheckData({
          stats: { total, passed, blocking, blockingPassed, warningTotal, warningActive },
          items: checkItems,
        })
        setCheckDialogOpen(true)
      }
    } catch (err) {
      console.error("检查失败", err)
    } finally {
      setChecking(false)
    }
  }

  // ── 保存文档（OnlyOffice → DB）──
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const docId = currentDocId
    if (!docId) return
    setSaving(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch('/api/onlyoffice/forcesave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentId: docId }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        console.log('[保存] 成功')
      }
    } catch (err) {
      console.error('保存失败', err)
    } finally {
      setSaving(false)
    }
  }

  // ── 保存版本（仅说明书）──
  const handleSaveVersion = async () => {
    const specId = docsMap["spec"]
    if (!specId) return
    setSavingVersion(true)
    try {
      const token = localStorage.getItem("vast_token")
      await fetch(`/api/m07/${specId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ forceVersion: true, changeSummary: `手动保存版本 - ${new Date().toLocaleString("zh-CN")}` }),
      })
      // 刷新版本号
      const res = await fetch(`/api/m07?caseId=${encodeURIComponent(activeCaseId!)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d?.code === 200 && Array.isArray(d.data)) {
        const spec = d.data.find((doc: any) => doc.type === 'spec')
        if (spec) setCurrentVersion(`v${spec.version || 1}`)
      }
    } catch (err) {
      console.error("保存版本失败", err)
    } finally {
      setSavingVersion(false)
    }
  }

  // ── 版本管理 ──
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [versionList, setVersionList] = useState<any[]>([])
  const [versionLoading, setVersionLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const handleOpenVersionManager = async () => {
    const specId = docsMap["spec"]
    if (!specId) return
    setVersionDialogOpen(true)
    setVersionLoading(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/m07/${specId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d?.code === 200) setVersionList(d.data || [])
    } catch (err) {
      console.error("加载版本列表失败", err)
    } finally {
      setVersionLoading(false)
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    const specId = docsMap["spec"]
    if (!specId) return
    setRestoringId(versionId)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/m07/${specId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ versionId }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        setCurrentVersion(`v${d.data.version}`)
        // 刷新版本列表
        const vRes = await fetch(`/api/m07/${specId}/versions`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const vd = await vRes.json()
        if (vd?.code === 200) setVersionList(vd.data || [])
      }
    } catch (err) {
      console.error("版本恢复失败", err)
    } finally {
      setRestoringId(null)
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    const specId = docsMap["spec"]
    if (!specId) return
    if (!confirm('确定要删除此版本记录吗？此操作不可撤销。')) return
    try {
      const token = localStorage.getItem("vast_token")
      await fetch(`/api/m07/${specId}/versions?versionId=${encodeURIComponent(versionId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      // 刷新版本列表
      const vRes = await fetch(`/api/m07/${specId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const vd = await vRes.json()
      if (vd?.code === 200) setVersionList(vd.data || [])
    } catch (err) {
      console.error("删除版本失败", err)
    }
  }

  // ── 协作管理 ──
  const handleOpenCollab = async () => {
    if (!activeCaseId) return
    setCollabDialogOpen(true)
    setCollabLoading(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/cases/${activeCaseId}/engineers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d?.code === 200) {
        setCollabList(d.data || [])
        setIsOwner((d.data || []).some((e: any) => e.role === 'owner' && e.engineerId === getUserId()))
      }
    } catch (err) {
      console.error("加载协作列表失败", err)
    } finally {
      setCollabLoading(false)
    }
  }

  const handleCollabSearch = async (keyword: string) => {
    setCollabSearch(keyword)
    if (!keyword.trim()) { setCollabSearchResults([]); return }
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/users/search?keyword=${encodeURIComponent(keyword)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d?.code === 200) {
        const existingIds = new Set(collabList.map((e: any) => e.engineerId))
        setCollabSearchResults((d.data || []).filter((u: any) => !existingIds.has(u.id)))
      }
    } catch (err) {
      console.error("搜索用户失败", err)
    }
  }

  const handleInvite = async (engineerId: string) => {
    if (!activeCaseId) return
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch(`/api/cases/${activeCaseId}/engineers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ engineerId }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        const listRes = await fetch(`/api/cases/${activeCaseId}/engineers`, { headers: { Authorization: `Bearer ${token}` } })
        const ld = await listRes.json()
        if (ld?.code === 200) setCollabList(ld.data || [])
        setCollabSearch("")
        setCollabSearchResults([])
      }
    } catch (err) {
      console.error("邀请失败", err)
    }
  }

  const handleRemoveCollaborator = async (engineerId: string) => {
    if (!activeCaseId) return
    if (!confirm('确定要移除此协作人吗？')) return
    try {
      const token = localStorage.getItem("vast_token")
      await fetch(`/api/cases/${activeCaseId}/engineers?engineerId=${encodeURIComponent(engineerId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const listRes = await fetch(`/api/cases/${activeCaseId}/engineers`, { headers: { Authorization: `Bearer ${token}` } })
      const ld = await listRes.json()
      if (ld?.code === 200) setCollabList(ld.data || [])
    } catch (err) {
      console.error("移除协作人失败", err)
    }
  }

  // ── AI 问答发送 ──
  const handleChatSend = async () => {
    const q = chatInput.trim()
    if (!q || !activeCaseId || chatLoading) return
    setChatMessages(prev => [...prev, { role: 'user', text: q }])
    setChatInput('')
    setChatLoading(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch('/api/m07/disclosure/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caseId: activeCaseId, question: q }),
      })
      const d = await res.json()
      if (d?.code === 200) {
        setChatMessages(prev => [...prev, { role: 'ai', text: d.data.answer }])
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: '抱歉，AI 服务暂时不可用：' + (d.message || '未知错误') }])
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: '网络错误，请稍后重试' }])
    } finally {
      setChatLoading(false)
    }
  }

  // 锁定视图
  if (activeCaseId && caseLocked) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F5F7FA]">
        <Card className="w-[480px]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-2">案件已提交审核</h2>
            <p className="text-sm text-[#6B7280] mb-6">文档已锁定，不可编辑，审核员正在审核中</p>
            <Button variant="outline" onClick={handleBackToPicker}>返回案例列表</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
          <h1 className="text-sm font-semibold text-[#111827]">选择撰写案例</h1>
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
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.title}</span>
                        {c.isOwner ? (
                          <span className="text-xs bg-[#EAF4FF] text-[#2F80ED] px-1.5 py-0.5 rounded">我的</span>
                        ) : (
                          <span className="text-xs bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded">协作</span>
                        )}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">{c.case_id} · {typeLabel(c.type)}</div>
                    </div>
                  </div>
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
      {/* 顶部操作栏 */}
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToPicker}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回案例选择
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">双文档工作台</h1>
            <p className="text-xs text-[#9CA3AF]">{activeCaseTitle || '未选择案例'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveVersion} disabled={savingVersion}>
            {savingVersion ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存版本
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenVersionManager}>
            <Clock className="h-4 w-4 mr-2" />
            版本管理
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenCollab}>
            <Users className="h-4 w-4 mr-2" />
            协作
          </Button>
          <Button variant="outline" size="sm" onClick={handleCheck} disabled={checking}>
            {checking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            检查
          </Button>
        </div>
      </div>

      {/* 主内容区 - 双栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：交底书协作面板 */}
        <div className={`border-r border-border bg-white flex flex-col transition-all duration-300 ${ 
          leftPanelCollapsed ? "w-0 overflow-hidden" : "w-[35%]"
        }`}>
          {/* 顶部 Tab 切换 */}
          <div className="px-3 pt-3 pb-0 border-b border-border">
            <div className="flex bg-[#F3F4F6] rounded-lg p-0.5">
              {([
                { key: "disclosure" as const, label: "交底全文", icon: FileText },
                { key: "ai-chat" as const, label: "AI 问答", icon: MessageCircle },
                { key: "coverage" as const, label: "覆盖状态", icon: ShieldCheck },
              ]).map((tab) => {
                const Icon = tab.icon
                const active = leftTab === tab.key
                return (
                  <button
                    key={tab.key}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"
                    }`}
                    onClick={() => setLeftTab(tab.key)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab 内容区 */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {leftTab === "coverage" && (
              <div>
                {/* 交底六项覆盖状态 */}
                <div className="p-3 border-b border-border">
                  <div className="text-xs font-medium text-[#6B7280] mb-2">交底六项覆盖状态</div>
                  <div className="space-y-0.5">
                    {disclosureSix.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 py-2 px-2 rounded hover:bg-[#F5F7FA] cursor-pointer transition-colors"
                      >
                        <span className="text-sm text-[#374151] flex-1">{item.label}</span>
                        {getStatusBadge(item.status)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 未覆盖 / 弱覆盖详情 */}
                <div className="p-3">
                  <div className="text-xs font-medium text-[#6B7280] mb-3">
                    覆盖问题（{disclosureSix.filter(i => i.status !== "covered").length} 项）
                  </div>
                  <div className="space-y-3">
                    {disclosureSix.filter(i => i.status !== "covered").map((para) => (
                      <Card key={para.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-[#2F80ED]">{para.label}</span>
                            {getStatusBadge(para.status)}
                          </div>
                          <p className="text-sm text-[#374151] leading-relaxed line-clamp-3 mb-2">
                            {para.content}
                          </p>
                          {para.reason && (
                            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded p-2 mb-2">
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-orange-700">{para.reason}</span>
                              </div>
                            </div>
                          )}
                          {para.mappedTo && (
                            <div className="flex items-center gap-1 text-xs text-[#9CA3AF] mb-2">
                              <Link2 className="h-3 w-3" />
                              映射至：{para.mappedTo}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                              <Eye className="h-3 w-3 mr-1" />
                              定位正文
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                              <Link2 className="h-3 w-3 mr-1" />
                              建立映射
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {leftTab === "disclosure" && (
              <div className="p-3 space-y-4">
                <div className="text-xs font-medium text-[#6B7280]">技术交底书全文</div>
                {disclosureFullText.length > 0 ? (
                  disclosureFullText.map((item) => (
                    <div key={item.id}>
                      <h3 className="text-sm font-semibold text-[#111827] mb-1">{item.label}</h3>
                      <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
                        {item.content || '（暂无内容）'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-[#9CA3AF] py-8 text-center">
                    该案件暂无交底书数据
                  </div>
                )}
              </div>
            )}

            {leftTab === "ai-chat" && (
              <div className="p-3 flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
                <div className="text-xs font-medium text-[#6B7280] mb-3">AI 文档助手</div>
                {/* 对话消息区 */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3">
                  {chatMessages.length === 0 ? (
                    <div className="bg-[#F3F4F6] rounded-lg p-3">
                      <p className="text-xs text-[#6B7280] mb-1">🤖 AI 助手</p>
                      <p className="text-sm text-[#374151]">
                        您好！我是交底书分析助手。您可以问我关于交底书内容的问题，例如：<br />
                        · "技术方案是否完整？"<br />
                        · "有益效果是否有数据支撑？"<br />
                        · "实施方式是否足够详细？"<br />
                        · "整体交底书还有哪些不足？"
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-[#EAF4FF] ml-6' : 'bg-[#F3F4F6] mr-6'}`}>
                        <p className="text-xs text-[#6B7280] mb-1">{msg.role === 'user' ? '👤 你' : '🤖 AI 助手'}</p>
                        <p className="text-sm text-[#374151] whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="bg-[#F3F4F6] rounded-lg p-3 mr-6">
                      <p className="text-xs text-[#6B7280] mb-1">🤖 AI 助手</p>
                      <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        正在思考...
                      </div>
                    </div>
                  )}
                </div>
                {/* 输入区 */}
                <div className="flex gap-2">
                  <Input
                    placeholder="输入问题..."
                    className="h-8 text-sm flex-1"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                  />
                  <Button size="sm" className="h-8 px-3" onClick={handleChatSend} disabled={chatLoading}>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 左侧面板折叠按钮 */}
        <button
          className="w-5 bg-[#F5F7FA] border-r border-border flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
        >
          {leftPanelCollapsed ? (
            <PanelLeft className="h-4 w-4 text-[#9CA3AF]" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-[#9CA3AF]" />
          )}
        </button>

        {/* 右侧：OnlyOffice 编辑器 */}
        <div className="flex-1 flex flex-col bg-white">
          {/* 文档 Tab */}
          <div className="px-4 pt-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList>
                  <TabsTrigger value="spec">说明书</TabsTrigger>
                  <TabsTrigger value="claims">权利要求书</TabsTrigger>
                  <TabsTrigger value="abstract">摘要</TabsTrigger>
                  <TabsTrigger value="drawings">附图说明</TabsTrigger>
                </TabsList>
              </Tabs>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                上传附图
              </Button>
            </div>
          </div>

          {/* OnlyOffice 编辑器区域 */}
          <div className="flex-1 p-4">
            {/* 权利要求书：显示选择器 */}
            {currentTab === "claims" ? (
              <div className="h-full flex flex-col">
                <p className="text-xs text-[#6B7280] mb-2">选择权利要求：</p>
                <div className="flex gap-2 flex-wrap">
                  {claimsList.map(c => (
                    <button
                      key={c.id}
                      className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                        selectedClaimId === c.id
                          ? "border-[#2F80ED] bg-[#EAF4FF] text-[#2F80ED]"
                          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#2F80ED]"
                      }`}
                      onClick={() => setSelectedClaimId(c.id)}
                    >
                      权{c.number}
                    </button>
                  ))}
                </div>
                {selectedClaimId && (
                  <div className="mt-3 flex-1">
                    <OnlyOfficeEditor documentId={selectedClaimId} onSave={() => {}} />
                  </div>
                )}
              </div>
            ) : currentTab === "drawings" ? (
              <div className="h-full flex flex-col">
                <p className="text-xs text-[#6B7280] mb-2">附图说明（{drawingImages.length} 张）</p>
                {drawingImages.length === 0 ? (
                  <div className="text-[#9CA3AF] text-sm">暂无附图，请在说明书起草页上传图片</div>
                ) : (
                  <>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {drawingImages.map((img, i) => (
                        <div
                          key={img.id}
                          className={`flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                            editingImageId === img.id ? "border-[#2F80ED]" : "border-transparent hover:border-[#D1D5DB]"
                          }`}
                          onClick={() => startEditImage(img)}
                        >
                          <img src={img.url} alt={img.caption} className="w-24 h-20 object-cover" />
                          <div className="text-[10px] text-center py-0.5 bg-white">{img.caption || `图${i + 1}`}</div>
                        </div>
                      ))}
                    </div>
                    {editingImageId && (
                      <div className="mt-3 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{editCaption}</span>
                          <div className="flex gap-2">
                            <button className="text-xs px-2 py-1 rounded border" onClick={() => setEditingImageId(null)}>返回</button>
                            <button className="text-xs px-2 py-1 rounded bg-[#2F80ED] text-white" onClick={handleSaveImageInfo}>保存说明</button>
                          </div>
                        </div>
                        {getDrawingsDocId() && (
                          <div className="flex-1">
                            <OnlyOfficeEditor documentId={getDrawingsDocId()} onSave={() => {}} />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : loadingDoc ? (
              <div className="h-full flex flex-col">
                <p className="text-xs text-[#6B7280] mb-2">选择权利要求：</p>
                <div className="flex gap-2 flex-wrap">
                  {claimsList.map(c => (
                    <button
                      key={c.id}
                      className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                        selectedClaimId === c.id
                          ? "border-[#2F80ED] bg-[#EAF4FF] text-[#2F80ED]"
                          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#2F80ED]"
                      }`}
                      onClick={() => setSelectedClaimId(c.id)}
                    >
                      权{c.number}
                    </button>
                  ))}
                </div>
                {selectedClaimId && (
                  <div className="mt-3 flex-1">
                    <OnlyOfficeEditor documentId={selectedClaimId} onSave={() => {}} />
                  </div>
                )}
              </div>
            ) : loadingDoc ? (
              <div className="flex items-center justify-center h-full text-[#9CA3AF]">加载文档中...</div>
            ) : currentDocId ? (
              <OnlyOfficeEditor documentId={currentDocId} version={parseInt(currentVersion.replace('v', '')) || undefined} onSave={() => {}} />
            ) : (
              <div className="flex items-center justify-center h-full text-[#9CA3AF]">
                该案例暂无文档，请先在说明书起草页生成内容
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="h-10 px-4 bg-white border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">覆盖率：</span>
            <span className={`font-medium ${footerStats.coverage.color}`}>{footerStats.coverage.value}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">支持率：</span>
            <span className={`font-medium ${footerStats.support.color}`}>{footerStats.support.value}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">查重率：</span>
            <span className={`font-medium ${footerStats.duplicate.color}`}>{footerStats.duplicate.value}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">AI相似性：</span>
            <span className={`font-medium ${footerStats.aiRate.color}`}>{footerStats.aiRate.value}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">当前版本：</span>
            <span className="font-medium text-[#374151]">{currentVersion}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[#6B7280]">已保存</span>
          </div>
        </div>
      </div>

      {/* ── 协作管理弹窗 ── */}
      <Dialog open={collabDialogOpen} onOpenChange={setCollabDialogOpen}>
        <DialogContent className="max-w-[480px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#2F80ED]" />
              协作撰写管理
            </DialogTitle>
            <DialogDescription>{activeCaseTitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 当前协作人列表 */}
            <div>
              <div className="text-xs font-medium text-[#6B7280] mb-2">撰写人列表</div>
              {collabLoading ? (
                <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
              ) : (
                <div className="space-y-1">
                  {collabList.map((e: any) => (
                    <div key={e.engineerId} className="flex items-center justify-between py-2 px-3 rounded bg-[#F9FAFB]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#374151]">{e.engineerName}</span>
                        {e.role === 'owner' ? (
                          <span className="text-xs bg-[#EAF4FF] text-[#2F80ED] px-1.5 py-0.5 rounded">主撰写</span>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">协作 · 邀请人：{e.invitedBy}</span>
                        )}
                      </div>
                      {isOwner && e.role !== 'owner' && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={() => handleRemoveCollaborator(e.engineerId)}>
                          移除
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 邀请新协作人（仅主撰写可见） */}
            {isOwner && (
              <div>
                <div className="text-xs font-medium text-[#6B7280] mb-2">邀请协作人</div>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
                  <Input
                    placeholder="搜索专利工程师..."
                    className="pl-8 h-8 text-sm"
                    value={collabSearch}
                    onChange={e => handleCollabSearch(e.target.value)}
                  />
                </div>
                {collabSearchResults.length > 0 && (
                  <div className="space-y-1">
                    {collabSearchResults.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between py-2 px-3 rounded bg-[#F9FAFB] hover:bg-[#F3F4F6]">
                        <span className="text-sm text-[#374151]">{u.name}</span>
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleInvite(u.id)}>邀请</Button>
                      </div>
                    ))}
                  </div>
                )}
                {collabSearch && collabSearchResults.length === 0 && (
                  <p className="text-xs text-[#9CA3AF] text-center py-2">未找到匹配的工程师</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 版本管理弹窗 ── */}
      <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
        <DialogContent className="max-w-[640px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#2F80ED]" />
              说明书版本管理
            </DialogTitle>
            <DialogDescription>
              当前版本：{currentVersion} · 共 {versionList.length} 个历史版本
            </DialogDescription>
          </DialogHeader>
          {versionLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#2F80ED]" />
            </div>
          ) : versionList.length === 0 ? (
            <div className="text-center py-8 text-[#9CA3AF] text-sm">暂无版本记录</div>
          ) : (
            <div className="space-y-2">
              {versionList.map((v, i) => {
                const isLatest = i === 0
                return (
                  <div key={v.id} className={`border rounded-lg p-3 ${isLatest ? 'border-[#2F80ED] bg-[#EAF4FF]' : 'border-[#E5E9F0]'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {isLatest && (
                          <span className="text-xs bg-[#2F80ED] text-white px-1.5 py-0.5 rounded">最新</span>
                        )}
                        <span className="text-sm font-medium text-[#111827]">
                          {v.change_summary || '内容更新'}
                        </span>
                      </div>
                      <span className="text-xs text-[#9CA3AF]">
                        {new Date(v.created_at).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6B7280]">
                        {v.operator_name || '系统'} · {v.content ? `${v.content.length} 字符` : '空'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={restoringId === v.id}
                          onClick={() => handleRestoreVersion(v.id)}
                        >
                          {restoringId === v.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3 mr-1" />
                          )}
                          恢复
                        </Button>
                        {!isLatest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-[#9CA3AF] hover:text-red-600"
                            onClick={() => handleDeleteVersion(v.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 检查结果弹窗 ── */}
      <Dialog open={checkDialogOpen} onOpenChange={setCheckDialogOpen}>
        <DialogContent className="max-w-[720px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#2F80ED]" />
              文档检查报告
            </DialogTitle>
            <DialogDescription>{activeCaseTitle}</DialogDescription>
          </DialogHeader>
          {checkData ? (
            <div className="space-y-4">
              {/* 统计卡片 */}
              <div className="grid grid-cols-4 gap-2">
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-2 text-center">
                    <div className="text-lg font-bold text-red-600">
                      {checkData.stats.blocking - checkData.stats.blockingPassed}
                    </div>
                    <div className="text-xs text-red-600">阻断项</div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-2 text-center">
                    <div className="text-lg font-bold text-orange-600">{checkData.stats.warningActive}</div>
                    <div className="text-xs text-orange-600">警告项</div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-2 text-center">
                    <div className="text-lg font-bold text-green-600">{checkData.stats.passed}</div>
                    <div className="text-xs text-green-600">通过项</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-2 text-center">
                    <div className="text-lg font-bold text-[#374151]">{checkData.stats.total}</div>
                    <div className="text-xs text-[#6B7280]">总计</div>
                  </CardContent>
                </Card>
              </div>

              {/* 问题列表 */}
              {checkData.items.filter(i => !i.passed).length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F9FAFB]">
                        <TableHead className="w-[140px]">问题类型</TableHead>
                        <TableHead className="w-[60px]">级别</TableHead>
                        <TableHead>问题描述</TableHead>
                        <TableHead className="w-[80px]">模块</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checkData.items.filter(i => !i.passed).sort((a, b) => {
                        if (a.severity === 'blocking' && b.severity !== 'blocking') return -1
                        if (a.severity !== 'blocking' && b.severity === 'blocking') return 1
                        return 0
                      }).map(item => (
                        <TableRow key={item.key}>
                          <TableCell className="text-sm">{item.label}</TableCell>
                          <TableCell>
                            {item.severity === 'blocking' ? (
                              <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="h-3 w-3" />阻断</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-orange-600"><AlertTriangle className="h-3 w-3" />警告</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-[#6B7280]">{item.detail}</TableCell>
                          <TableCell className="text-xs text-[#9CA3AF]">{item.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">全部检查通过</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#2F80ED]" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
