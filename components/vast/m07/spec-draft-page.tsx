"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Check,
  AlertTriangle,
  Link2,
  Loader2,
  FileText,
  Image as ImageIcon,
  Trash2,
  Pencil,
  Upload,
  X,
  Save,
  ArrowRight,
  Search,
  Send,
  CheckCircle,
} from "lucide-react"

interface PatentDocument {
  id: string
  case_id: string
  type: string
  content: string
  status: string
  ai_rate: number
  version: number
  tech_field?: string
  background?: string
  summary?: string
  drawings_desc?: string
  embodiment?: string
  effects?: string
}

interface DocumentImage {
  id: string
  case_id: string
  document_id: string
  filename: string
  original_name: string
  url: string
  mime_type: string
  size: number
  caption: string
  position: number
  section: string
  created_at: string
}

interface SpecDraftPageProps {
  caseId?: string | null
  onBack: () => void
  onEdit: (caseId: string) => void
}

const chapters = [
  { id: "tech-field", label: "技术领域", checked: true },
  { id: "background", label: "背景技术", checked: true },
  { id: "summary", label: "发明内容", checked: true },
  { id: "drawings", label: "附图说明", checked: true },
  { id: "embodiment", label: "具体实施方式", checked: true },
  { id: "effects", label: "有益效果", checked: true },
]

const sectionLabels: Record<string, string> = {
  "tech-field": "技术领域",
  "background": "背景技术",
  "summary": "发明内容",
  "drawings": "附图说明",
  "embodiment": "具体实施方式",
  "effects": "有益效果",
}

const generatedContent = {
  "tech-field": {
    content: "本发明涉及智能控制技术领域，尤其涉及一种基于人工智能的温度控制系统及方法。",
    sources: ["交底书-技术领域-段落1"],
    risks: [],
  },
  "background": {
    content: `现有的温度控制系统通常采用简单的阈值控制方式，当温度超过或低于设定阈值时，系统才会启动制冷或制热设备。

这种控制方式存在以下技术问题：

1、响应滞后：由于是被动式控制，系统只有在温度已经偏离舒适范围后才会采取措施，导致用户体验不佳。

2、能源浪费：无法根据环境变化和用户习惯进行自适应调节，造成不必要的能源消耗。

3、缺乏预测能力：传统系统无法预测温度变化趋势，无法提前进行调控准备。`,
    sources: ["交底书-背景技术-段落1", "交底书-背景技术-段落2"],
    risks: [],
  },
  "summary": {
    content: `为解决上述技术问题，本发明提供一种智能温控系统，包括：传感器模块、AI处理单元、执行机构和反馈回路。

所述传感器模块用于采集环境温度、湿度、光照强度等多维环境参数。

所述AI处理单元接收所述传感器模块采集的数据，并基于深度学习模型进行分析处理，预测温度变化趋势。

所述执行机构根据所述AI处理单元的控制指令，执行相应的温度调节操作。

所述反馈回路用于将执行结果反馈至所述AI处理单元，实现闭环控制。`,
    sources: ["交底书-发明内容-核心方案", "交底书-发明内容-保护点1"],
    risks: ["建议补充：替代方案中的强化学习算法尚未覆盖"],
  },
  "drawings": {
    content: `图1是本发明实施例提供的智能温控系统的结构框图；
图2是本发明实施例提供的AI处理单元的内部结构示意图；
图3是本发明实施例提供的控制方法的流程图；
图4是本发明实施例提供的深度学习模型的网络结构图。`,
    sources: ["交底书-附图说明"],
    risks: [],
  },
  "embodiment": {
    content: `下面将结合本发明实施例中的附图，对本发明实施例中的技术方案进行清楚、完整地描述。

实施例一

如图1所示，本实施例提供一种智能温控系统，包括：传感器模块100、AI处理单元200、执行机构300和反馈回路400。

所述传感器模块100包括温度传感器101、湿度传感器102和光照传感器103，分别用于采集环境温度、湿度和光照强度数据。

所述AI处理单元200采用深度神经网络模型，包括输入层、隐藏层和输出层。输入层接收多维环境参数，隐藏层包含LSTM单元用于处理时序数据，输出层生成控制指令。`,
    sources: ["交底书-具体实施方式-实施例1"],
    risks: [],
  },
  "effects": {
    content: `本发明提供的智能温控系统具有以下有益效果：

1、通过AI处理单元的深度学习模型，能够预测温度变化趋势，实现提前调控，显著提升用户舒适度。

2、基于多维环境参数的综合分析，系统能够进行自适应调节，相比传统方案节能约20%-30%。

3、闭环反馈机制确保系统持续优化，控制精度可达±0.5℃。`,
    sources: ["交底书-有益效果"],
    risks: [],
  },
}

interface CaseItem {
  id: string
  case_id: string
  title: string
  type: string
  status: string
}

export function SpecDraftPage({ caseId, onBack, onEdit }: SpecDraftPageProps) {
  // 案例选择
  const [activeCaseId, setActiveCaseId] = useState<string | null>(caseId ?? null)
  const [activeCaseTitle, setActiveCaseTitle] = useState<string>("")
  const [casesList, setCasesList] = useState<CaseItem[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState("")

  // 说明书创作
  const [patentType, setPatentType] = useState("invention")
  const [applyMethod, setApplyMethod] = useState("preliminary")
  const [template, setTemplate] = useState("system")
  const [selectedChapters, setSelectedChapters] = useState(chapters.map((c) => c.id))
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [activeChapter, setActiveChapter] = useState("tech-field")
  const [documentImages, setDocumentImages] = useState<DocumentImage[]>([])
  const [specDocument, setSpecDocument] = useState<PatentDocument | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [newImageCaption, setNewImageCaption] = useState<string>("")
  const [newImagePosition, setNewImagePosition] = useState<number>(1)
  const [uploadSection, setUploadSection] = useState<string>("drawings")
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [editingImageId, setEditingImageId] = useState<string | null>(null)
  const [editCaptionValue, setEditCaptionValue] = useState<string>("")
  const [editSectionValue, setEditSectionValue] = useState<string>("drawings")
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  const [accepted, setAccepted] = useState(false)
  const [specLocked, setSpecLocked] = useState(false)
  const [specLockedStatus, setSpecLockedStatus] = useState("")
  const [specLockedMessage, setSpecLockedMessage] = useState("")
  const [confirmingSpec, setConfirmingSpec] = useState(false)
  const [editingSpec, setEditingSpec] = useState(false)
  const [draftChapters, setDraftChapters] = useState<Record<string, string>>({})
  const [savingSpec, setSavingSpec] = useState(false)

  // 加载案例列表（选择器用）
  useEffect(() => {
    if (activeCaseId) return  // 已选案例，不加载列表
    setCasesLoading(true)
    const token = typeof window !== "undefined" ? localStorage.getItem("vast_token") : null
    fetch("/api/cases?page=1&pageSize=100", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) setCasesList((data.data.list || []).filter((c: any) => c.status === 'writing'))
      })
      .finally(() => setCasesLoading(false))
  }, [activeCaseId])

  // 加载说明书文档
  useEffect(() => {
    if (!activeCaseId) return

    const loadSpecDocument = async () => {
      const res = await fetch(`/api/m07/spec-draft-page?caseId=${encodeURIComponent(activeCaseId)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("vast_token")}` },
      })
      const data = await res.json()
      if (data?.code === 200 && data?.data?.id) {
        const doc = data.data
        // 已确认锁定
        if (doc.locked) {
          setSpecLocked(true)
          setSpecLockedStatus(doc.status || "")
          setSpecLockedMessage(doc.message || "说明书已确认提交，请在双文档工作台中使用 OnlyOffice 编辑")
          setSpecDocument(doc)
          return
        }
        setSpecLocked(false)
        setSpecDocument(doc)
        loadImages(doc.id)
        // 已有 docx 或章节内容 → 直接显示章节视图
        if (
          (doc as any).has_docx ||
          doc.tech_field || doc.background || doc.summary ||
          doc.drawings_desc || doc.embodiment || doc.effects
        ) {
          setGenerated(true)
        }
      }
    }

    loadSpecDocument().catch((error) => {
      console.error("加载说明书文档失败", error)
    })
  }, [activeCaseId])

  const handleSelectCase = (id: string) => {
    setActiveCaseId(id)
    setDocumentImages([])
    setSpecDocument(null)
    setSpecLocked(false)
    setGenerated(false)
  }

  const handleBackToCasePicker = () => {
    setActiveCaseId(null)
    setActiveCaseTitle("")
    setDocumentImages([])
    setSpecDocument(null)
    setSpecLocked(false)
    setGenerated(false)
    setAccepted(false)
  }

  const loadImages = async (documentId: string) => {
    try {
      const response = await fetch(`/api/m07/spec-draft-page/images?documentId=${encodeURIComponent(documentId)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("vast_token")}` },
      })
      const result = await response.json()
      if (result?.code === 200 && Array.isArray(result.data)) {
        setDocumentImages(
          result.data.sort((a: DocumentImage, b: DocumentImage) => a.position - b.position)
        )
        setNewImagePosition(result.data.length + 1)
      }
    } catch (error) {
      console.error("加载附图失败", error)
    }
  }

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length || !specDocument?.id) return
    setUploadError(null)
    setUploadingImage(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("documentId", specDocument.id)
        formData.append("caption", newImageCaption || `图${newImagePosition}`)
        formData.append("position", String(newImagePosition))
        formData.append("section", uploadSection)

        const response = await fetch("/api/m07/spec-draft-page/images", {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${localStorage.getItem("vast_token")}` },
        })
        const result = await response.json()

        if (result?.code !== 200 || !result?.data?.url) {
          throw new Error(result?.message || "图片上传失败")
        }

        setDocumentImages((prev) =>
          [...prev, result.data].sort((a, b) => a.position - b.position)
        )
        setNewImagePosition((prev) => prev + 1)
      }
      setNewImageCaption("")
    } catch (err: any) {
      setUploadError(err?.message || "图片上传失败")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const res = await fetch(
        `/api/m07/spec-draft-page/images?imageId=${encodeURIComponent(imageId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("vast_token")}` } }
      )
      const result = await res.json()
      if (result?.code === 200) {
        setDocumentImages((prev) => prev.filter((img) => img.id !== imageId))
      }
    } catch (err) {
      console.error("删除图片失败", err)
    }
  }

  const handleStartEdit = (image: DocumentImage) => {
    setEditingImageId(image.id)
    setEditCaptionValue(image.caption)
    setEditSectionValue(image.section || "drawings")
  }

  const handleCancelEdit = () => {
    setEditingImageId(null)
    setEditCaptionValue("")
  }

  const handleSaveEdit = async (imageId: string) => {
    try {
      const res = await fetch(
        `/api/m07/spec-draft-page/images?imageId=${encodeURIComponent(imageId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("vast_token")}` },
          body: JSON.stringify({ caption: editCaptionValue, section: editSectionValue }),
        }
      )
      const result = await res.json()
      if (result?.code === 200) {
        setDocumentImages((prev) =>
          prev.map((img) =>
            img.id === imageId
              ? { ...img, caption: editCaptionValue, section: editSectionValue }
              : img
          )
        )
      }
    } catch (err) {
      console.error("更新图片失败", err)
    }
    setEditingImageId(null)
  }

  const handleStartEditSpec = () => {
    if (!specDocument) return
    setDraftChapters({
      "tech-field": specDocument.tech_field || "",
      "background": specDocument.background || "",
      "summary": specDocument.summary || "",
      "drawings": specDocument.drawings_desc || "",
      "embodiment": specDocument.embodiment || "",
      "effects": specDocument.effects || "",
    })
    setEditingSpec(true)
  }

  const handleSaveSpec = async () => {
    if (!activeCaseId) return
    setSavingSpec(true)
    try {
      const payload = {
        caseId: activeCaseId,
        tech_field: draftChapters["tech-field"] || specDocument?.tech_field || "",
        background: draftChapters["background"] || specDocument?.background || "",
        summary: draftChapters["summary"] || specDocument?.summary || "",
        drawings_desc: draftChapters["drawings"] || specDocument?.drawings_desc || "",
        embodiment: draftChapters["embodiment"] || specDocument?.embodiment || "",
        effects: draftChapters["effects"] || specDocument?.effects || "",
      }
      console.log("保存说明书 payload:", payload)
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/spec-draft-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      console.log("保存说明书 response:", data)
      if (data?.code === 200) {
        setSpecDocument(data.data)
        setEditingSpec(false)
      } else {
        setAiError(data?.message || "保存失败")
      }
    } catch (err: any) {
      setAiError(err?.message || "保存说明书失败")
    } finally {
      setSavingSpec(false)
    }
  }

  const handleSaveAndBack = async () => {
    await handleSaveSpec()
    setGenerated(false)  // 保存后跳回生成初稿页面
  }

  const handleSelectImages = () => {
    uploadInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    uploadImages(event.target.files)
    event.target.value = ""
  }

  const [aiError, setAiError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!activeCaseId) return
    setIsGenerating(true)
    setAiError(null)

    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/spec-draft-page/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caseId: activeCaseId,
          selectedChapters,
        }),
      })
      const data = await res.json()
      if (data?.code === 200) {
        // 刷新说明书内容
        const specRes = await fetch(`/api/m07/spec-draft-page?caseId=${encodeURIComponent(activeCaseId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const specData = await specRes.json()
        if (specData?.code === 200 && specData?.data) {
          setSpecDocument(specData.data)
        }
        setGenerated(true)
      } else {
        setAiError(data?.message || "AI 生成失败")
      }
    } catch (err: any) {
      setAiError(err?.message || "AI 生成失败")
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }
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
          <h1 className="text-sm font-semibold text-[#111827]">选择说明书案件</h1>
          <p className="text-xs text-[#9CA3AF]">选择一个案件进入说明书创作</p>
        </div>
        <div className="px-4 py-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded border border-border text-sm"
              placeholder="搜索案件标题或编号..."
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
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-[#9CA3AF]">暂无可用案件</div>
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

  // ========== 确认提交 ==========
  const handleConfirmSpec = async () => {
    if (!activeCaseId) return
    setConfirmingSpec(true)
    try {
      const token = localStorage.getItem("vast_token")
      const res = await fetch("/api/m07/spec-draft-page/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseId: activeCaseId }),
      })
      const data = await res.json()
      if (data?.code === 200) {
        setSpecLocked(true)
        setSpecLockedMessage("说明书已确认提交，转为 docx 格式，请在双文档工作台中使用 OnlyOffice 编辑")
      }
    } finally {
      setConfirmingSpec(false)
    }
  }

  // ========== 说明书锁定视图 ==========
  if (specLocked) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F5F7FA]">
        <Card className="w-[480px]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-2">
              {specLockedStatus === 'ai_checking' ? '案件已提交审核' : '说明书已确认提交'}
            </h2>
            <p className="text-sm text-[#6B7280] mb-6">
              {specLockedStatus === 'ai_checking' ? '文档已锁定，审核员正在审核中' : specLockedMessage}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleBackToCasePicker}>
                返回案例选择
              </Button>
              {specLockedStatus !== 'ai_checking' && (
                <Button onClick={() => onEdit(activeCaseId!)}>
                  前往双文档工作台
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ========== 说明书创作视图 ==========
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
            <h1 className="text-sm font-semibold text-[#111827]">说明书 AI 初稿</h1>
            <p className="text-xs text-[#9CA3AF]">{activeCaseTitle || "未命名案件"}</p>
          </div>
          {aiError && (
            <div className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded">{aiError}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 已有说明书时显示"查看章节" */}
          {!generated && specDocument && (
            <Button variant="outline" size="sm" onClick={() => { setGenerated(true); setAccepted(false) }}>
              <FileText className="h-4 w-4 mr-2" />
              查看章节
            </Button>
          )}
          {!generated ? (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成初稿
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新生成
              </Button>
              {!editingSpec && (
                <Button variant="outline" onClick={handleStartEditSpec}>
                  <Pencil className="h-4 w-4 mr-2" />
                  编辑章节
                </Button>
              )}
              {editingSpec && (
                <Button variant="outline" onClick={handleSaveSpec} disabled={savingSpec}>
                  <Save className="h-4 w-4 mr-2" />
                  {savingSpec ? "保存中..." : "保存修改"}
                </Button>
              )}
              <Button variant="outline" onClick={handleSaveAndBack} disabled={savingSpec || editingSpec}>
                <Save className="h-4 w-4 mr-2" />
                {savingSpec ? "保存中..." : "保存"}
              </Button>
              <div className="flex-1" />
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={confirmingSpec}
                onClick={() => {
                  if (!window.confirm("确认提交后说明书将转为 docx 格式并锁定，不再可在本页面编辑。\n\n确定要提交吗？")) return
                  handleConfirmSpec()
                }}
              >
                {confirmingSpec ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />提交中...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />确认提交</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：生成配置 */}
        <Card className="w-72 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">初稿生成配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">专利类型</Label>
              <Select value={patentType} onValueChange={setPatentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invention">发明专利</SelectItem>
                  <SelectItem value="utility">实用新型</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">发明申请方式</Label>
              <Select value={applyMethod} onValueChange={setApplyMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preliminary">预先审查</SelectItem>
                  <SelectItem value="priority">优先审查</SelectItem>
                  <SelectItem value="normal">普通申请</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">模板选择</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">系统默认模板</SelectItem>
                  <SelectItem value="electronics">电子信息模板</SelectItem>
                  <SelectItem value="mechanical">机械工程模板</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">附图管理</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setImageDialogOpen(true)}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {documentImages.length > 0
                  ? `管理附图（${documentImages.length} 张）`
                  : "管理附图"}
              </Button>
              {documentImages.length > 0 && (
                <div className="text-xs text-[#6B7280]">
                  已上传 {documentImages.length} 张图片，点击按钮管理
                </div>
              )}
              {documentImages.length === 0 && (
                <div className="text-xs text-[#6B7280]">点击管理按钮上传和编辑说明书附图。</div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm">生成范围</Label>
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center gap-2">
                    <Checkbox
                      id={chapter.id}
                      checked={selectedChapters.includes(chapter.id)}
                      onCheckedChange={() => toggleChapter(chapter.id)}
                    />
                    <Label htmlFor={chapter.id} className="text-sm text-[#374151] cursor-pointer">
                      {chapter.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 中部：章节初稿预览 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base">章节初稿预览</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {!generated ? (
              <div className="h-full flex flex-col items-center justify-center text-[#9CA3AF]">
                {specDocument?.content ? (
                  /* 后端已有说明书内容 */
                  <ScrollArea className="w-full flex-1 min-h-0 p-4">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-[#374151] leading-relaxed">
                        {specDocument.content}
                      </div>
                    </div>
                    {documentImages.length > 0 && (
                      <div className="mt-6">
                        <div className="mb-3 text-sm font-medium text-[#111827]">全部附图</div>
                        <div className="grid grid-cols-2 gap-3">
                          {documentImages.map((image) => (
                            <div key={image.id} className="rounded border border-border overflow-hidden bg-white">
                              <img src={image.url} alt={image.caption} className="h-32 w-full object-cover" />
                              <div className="p-2 text-xs text-[#374151]">图{image.position}：{image.caption}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                ) : (
                  /* 无内容，提示生成 */
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                    <p>配置参数后点击"生成初稿"</p>
                    <p className="text-sm mt-1">AI 将基于 M06 完整交底书生成说明书初稿</p>
                  </div>
                )}
              </div>
            ) : (
              <Tabs value={activeChapter} onValueChange={setActiveChapter} className="h-full flex flex-col">
                <div className="border-b border-border px-4">
                  <TabsList className="h-10">
                    <TabsTrigger value="tech-field" className="text-xs">技术领域</TabsTrigger>
                    <TabsTrigger value="background" className="text-xs">背景技术</TabsTrigger>
                    <TabsTrigger value="summary" className="text-xs">发明内容</TabsTrigger>
                    <TabsTrigger value="drawings" className="text-xs">附图说明</TabsTrigger>
                    <TabsTrigger value="embodiment" className="text-xs">具体实施方式</TabsTrigger>
                    <TabsTrigger value="effects" className="text-xs">有益效果</TabsTrigger>
                  </TabsList>
                </div>
                <ScrollArea className="flex-1 min-h-0 p-4">
                  <div className="h-full">
                  {(() => {
                    const chapterContent: Record<string, string> = specDocument
                      ? {
                          "tech-field": specDocument.tech_field || generatedContent["tech-field"].content,
                          "background": specDocument.background || generatedContent["background"].content,
                          "summary": specDocument.summary || generatedContent["summary"].content,
                          "drawings": specDocument.drawings_desc || generatedContent["drawings"].content,
                          "embodiment": specDocument.embodiment || generatedContent["embodiment"].content,
                          "effects": specDocument.effects || generatedContent["effects"].content,
                        }
                      : Object.fromEntries(
                          Object.entries(generatedContent).map(([k, v]) => [k, v.content])
                        )
                    return Object.entries(chapterContent).map(([key, content]) => (
                      <TabsContent key={key} value={key} className="m-0">
                        <div className="prose prose-sm max-w-none">
                          {editingSpec ? (
                            <textarea
                              className="w-full min-h-40 rounded border border-[#2F80ED] bg-background p-3 text-sm text-[#374151] leading-relaxed resize-y"
                              value={draftChapters[key] ?? content ?? ""}
                              onChange={(e) => setDraftChapters((prev) => ({ ...prev, [key]: e.target.value }))}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap text-[#374151] leading-relaxed">
                              {content}
                            </div>
                          )}
                        </div>
                        {documentImages.filter((img) => (img.section || "drawings") === key).length > 0 && (
                          <div className="mt-6">
                            <div className="mb-3 text-sm font-medium text-[#111827]">
                              {sectionLabels[key] || key} 附图
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {documentImages.filter((img) => (img.section || "drawings") === key).map((image) => (
                                <div key={image.id} className="rounded border border-border overflow-hidden bg-white">
                                  <img src={image.url} alt={image.caption} className="h-36 w-full object-cover" />
                                  <div className="p-2 text-xs text-[#374151]">图{image.position}：{image.caption}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    ))
                  })()}
                  </div>
                </ScrollArea>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* 右侧：来源映射与风险提示 */}
        {generated && (
          <Card className="w-72 flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">来源与风险</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-[#6B7280]">来源段落</Label>
                <div className="mt-2 space-y-2">
                  {generatedContent[activeChapter as keyof typeof generatedContent]?.sources.map(
                    (source, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded bg-[#EAF4FF] text-xs text-[#2F80ED] cursor-pointer hover:bg-[#D4E8FF]"
                      >
                        <Link2 className="h-3 w-3" />
                        {source}
                      </div>
                    )
                  )}
                </div>
              </div>

              {generatedContent[activeChapter as keyof typeof generatedContent]?.risks.length > 0 && (
                <div>
                  <Label className="text-sm text-[#6B7280]">风险提示</Label>
                  <div className="mt-2 space-y-2">
                    {generatedContent[activeChapter as keyof typeof generatedContent]?.risks.map(
                      (risk, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 rounded bg-orange-50 text-xs text-orange-700"
                        >
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {risk}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 隐藏的文件上传输入框 */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 附图管理弹窗 */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              附图管理
            </DialogTitle>
            <DialogDescription>
              上传、编辑和删除说明书附图，可指定每张图所属的章节
            </DialogDescription>
          </DialogHeader>

          {/* 上传区域 */}
          <div className="border rounded-lg p-4 space-y-3 bg-[#F9FAFB]">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium whitespace-nowrap">上传新图</Label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">所属章节</Label>
                <Select value={uploadSection} onValueChange={setUploadSection}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">图名</Label>
                <input
                  value={newImageCaption}
                  onChange={(event) => setNewImageCaption(event.target.value)}
                  placeholder={`图${newImagePosition}`}
                  className="mt-1 block w-full rounded border border-border bg-background px-2 py-1 text-sm h-9"
                />
              </div>
              <div>
                <Label className="text-xs">顺序</Label>
                <input
                  value={newImagePosition}
                  type="number"
                  min={1}
                  onChange={(event) => setNewImagePosition(Number(event.target.value))}
                  className="mt-1 block w-full rounded border border-border bg-background px-2 py-1 text-sm h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectImages} disabled={uploadingImage}>
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    选择图片上传
                  </>
                )}
              </Button>
              <span className="text-xs text-[#9CA3AF]">支持 PNG/JPG/WebP，单文件 ≤50MB</span>
            </div>
            {uploadError && (
              <div className="text-xs text-red-600">{uploadError}</div>
            )}
          </div>

          {/* 图片列表 */}
          <ScrollArea className="flex-1 min-h-0 -mx-1">
            {documentImages.length === 0 ? (
              <div className="py-12 text-center text-[#9CA3AF]">
                <ImageIcon className="h-10 w-10 mx-auto mb-3 text-[#D1D5DB]" />
                <p className="text-sm">暂无附图</p>
                <p className="text-xs mt-1">请通过上方区域上传说明书附图</p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {documentImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white hover:border-[#2F80ED]/30 transition-colors"
                  >
                    {/* 缩略图 */}
                    <div className="w-24 h-16 flex-shrink-0 rounded overflow-hidden border border-border bg-[#F3F4F6]">
                      <img
                        src={image.url}
                        alt={image.caption}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 信息区 */}
                    <div className="flex-1 min-w-0">
                      {editingImageId === image.id ? (
                        /* 编辑模式 */
                        <div className="space-y-2">
                          <input
                            value={editCaptionValue}
                            onChange={(e) => setEditCaptionValue(e.target.value)}
                            className="block w-full rounded border border-[#2F80ED] bg-background px-2 py-1 text-sm"
                            autoFocus
                            placeholder="图名描述"
                          />
                          <div className="flex items-center gap-2">
                            <Select value={editSectionValue} onValueChange={setEditSectionValue}>
                              <SelectTrigger className="h-8 text-xs w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {chapters.map((ch) => (
                                  <SelectItem key={ch.id} value={ch.id}>{ch.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleSaveEdit(image.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              保存
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3 mr-1" />
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* 展示模式 */
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#111827] truncate">
                              图{image.position}：{image.caption || "未命名"}
                            </span>
                            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-[#EAF4FF] text-[#2F80ED]">
                              {sectionLabels[image.section] || "附图说明"}
                            </span>
                          </div>
                          <div className="text-xs text-[#9CA3AF] mt-0.5">
                            {image.original_name} · {image.mime_type}
                          </div>
                        </>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    {editingImageId !== image.id && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#9CA3AF] hover:text-[#2F80ED]"
                          onClick={() => handleStartEdit(image)}
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#9CA3AF] hover:text-red-600"
                          onClick={() => handleDeleteImage(image.id)}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
