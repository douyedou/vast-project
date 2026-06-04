"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OnlyOfficeEditor } from "./onlyoffice-editor"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Save,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  Link2,
  Eye,
  EyeOff,
  Send,
  Maximize2,
  Minus,
  PanelLeftClose,
  PanelLeft,
  Upload,
  Loader2,
  Pencil,
  Image,
} from "lucide-react"

interface DualDocWorkspaceProps {
  onBack: () => void
  caseId?: string | null
}

// 交底书目录结构
const disclosureTree = [
  {
    id: "1",
    title: "技术领域",
    covered: true,
    children: [],
  },
  {
    id: "2",
    title: "背景技术",
    covered: true,
    children: [
      { id: "2-1", title: "现有技术问题", covered: true },
      { id: "2-2", title: "技术难点", covered: false },
    ],
  },
  {
    id: "3",
    title: "发明内容",
    covered: "weak",
    children: [
      { id: "3-1", title: "核心技术方案", covered: true },
      { id: "3-2", title: "保护点1", covered: true },
      { id: "3-3", title: "保护点2", covered: "weak" },
      { id: "3-4", title: "替代方案", covered: false },
    ],
  },
  {
    id: "4",
    title: "具体实施方式",
    covered: true,
    children: [
      { id: "4-1", title: "实施例1", covered: true },
      { id: "4-2", title: "实施例2", covered: true },
    ],
  },
  {
    id: "5",
    title: "有益效果",
    covered: true,
    children: [],
  },
]

// 交底书段落内容
const disclosureParagraphs = [
  {
    id: "p1",
    section: "技术领域",
    content: "本发明涉及智能控制技术领域，尤其涉及一种基于人工智能的温度控制系统及方法。",
    status: "covered",
    mappedTo: "说明书-技术领域-段落1",
  },
  {
    id: "p2",
    section: "背景技术",
    content: "现有的温度控制系统通常采用简单的阈值控制方式，无法根据环境变化进行自适应调节，导致能源浪费和用户体验不佳。",
    status: "covered",
    mappedTo: "说明书-背景技术-段落1",
  },
  {
    id: "p3",
    section: "发明内容",
    content: "为解决上述技术问题，本发明提供一种智能温控系统，包括：传感器模块、AI处理单元、执行机构和反馈回路。",
    status: "covered",
    mappedTo: "说明书-发明内容-段落1",
  },
  {
    id: "p4",
    section: "保护点2",
    content: "所述AI处理单元采用深度学习算法，能够根据历史数据预测温度变化趋势，实现提前调控。",
    status: "weak",
    mappedTo: "说明书-发明内容-段落3",
  },
  {
    id: "p5",
    section: "替代方案",
    content: "作为替代方案，所述AI处理单元还可以采用强化学习算法，通过与环境交互不断优化控制策略。",
    status: "uncovered",
    mappedTo: null,
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

export function DualDocWorkspace({ onBack, caseId: initialCaseId }: DualDocWorkspaceProps) {
  // 案例选择
  const [activeCaseId, setActiveCaseId] = useState<string | null>(initialCaseId ?? null)
  const [activeCaseTitle, setActiveCaseTitle] = useState("")
  const [casesList, setCasesList] = useState<{ id: string; case_id: string; title: string; type: string; status: string }[]>([])
  const [casesLoading, setCasesLoading] = useState(false)
  const [caseSearch, setCaseSearch] = useState("")

  // 加载案例列表
  useEffect(() => {
    if (activeCaseId) return
    setCasesLoading(true)
    const token = localStorage.getItem("vast_token")
    fetch("/api/cases?page=1&pageSize=100", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { if (data.code === 200) setCasesList(data.data.list || []) })
      .finally(() => setCasesLoading(false))
  }, [activeCaseId])
  const [showUncoveredOnly, setShowUncoveredOnly] = useState(false)
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const [selectedParagraph, setSelectedParagraph] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("spec")
  const [expandedSections, setExpandedSections] = useState<string[]>(["2", "3", "4"])
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
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

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredParagraphs = disclosureParagraphs.filter((p) => {
    if (showUncoveredOnly && p.status === "covered") return false
    return true
  })

  const getDocumentTitle = () => {
    switch (currentTab) {
      case "spec": return "说明书"
      case "claims": return "权利要求书"
      case "abstract": return "摘要"
      case "drawings": return "附图说明"
      default: return "说明书"
    }
  }

  // 上传图片到说明书
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
    setDocsMap({})
  }

  const handleBackToPicker = () => {
    setActiveCaseId(null)
    setActiveCaseTitle("")
    setDocsMap({})
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
      {/* 顶部操作栏 */}
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToPicker}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回案例选择
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">{activeCaseTitle || "双文档工作台"}</h1>
            <p className="text-xs text-[#9CA3AF]">说明书 ↔ 交底书对比</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            保存版本
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            交底书
          </Button>
          <Button variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            覆盖检查
          </Button>
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            支持检查
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            提交审核
          </Button>
        </div>
      </div>

      {/* 主内容区 - 双栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：完整交底书预览 */}
        <div className={`border-r border-border bg-white flex flex-col transition-all duration-300 ${
          leftPanelCollapsed ? "w-0 overflow-hidden" : "w-[35%]"
        }`}>
          <div className="p-3 border-b border-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input placeholder="搜索交底内容" className="pl-8 h-8 text-sm" />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Switch
                  id="uncovered"
                  checked={showUncoveredOnly}
                  onCheckedChange={setShowUncoveredOnly}
                />
                <Label htmlFor="uncovered" className="text-[#6B7280]">只看未覆盖</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="keypoints"
                  checked={showKeyPoints}
                  onCheckedChange={setShowKeyPoints}
                />
                <Label htmlFor="keypoints" className="text-[#6B7280]">只看保护点</Label>
              </div>
            </div>
          </div>

          {/* 目录树 */}
          <div className="p-3 border-b border-border">
            <div className="text-xs font-medium text-[#6B7280] mb-2">交底书目录</div>
            <div className="space-y-1">
              {disclosureTree.map((item) => (
                <div key={item.id}>
                  <div
                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#F5F7FA] cursor-pointer"
                    onClick={() => item.children.length > 0 && toggleSection(item.id)}
                  >
                    {item.children.length > 0 ? (
                      expandedSections.includes(item.id) ? (
                        <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />
                      )
                    ) : (
                      <Minus className="h-3 w-3 text-[#D1D5DB]" />
                    )}
                    <span className="text-sm text-[#374151] flex-1">{item.title}</span>
                    {getStatusBadge(item.covered)}
                  </div>
                  {item.children.length > 0 && expandedSections.includes(item.id) && (
                    <div className="ml-5 space-y-1">
                      {item.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-[#F5F7FA] cursor-pointer"
                        >
                          <Minus className="h-3 w-3 text-[#D1D5DB]" />
                          <span className="text-sm text-[#6B7280] flex-1">{child.title}</span>
                          {getStatusBadge(child.covered)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 段落卡片列表 */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {filteredParagraphs.map((para) => (
                <Card
                  key={para.id}
                  className={`cursor-pointer transition-all ${
                    selectedParagraph === para.id
                      ? "ring-2 ring-[#2F80ED] bg-[#EAF4FF]"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedParagraph(para.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#2F80ED]">{para.section}</span>
                      {getStatusBadge(para.status)}
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed line-clamp-3">
                      {para.content}
                    </p>
                    {para.mappedTo && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="text-xs text-[#9CA3AF] flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          映射至：{para.mappedTo}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        定位正文
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                        <Link2 className="h-3 w-3 mr-1" />
                        建立映射
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <EyeOff className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
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
              <OnlyOfficeEditor documentId={currentDocId} onSave={() => {}} />
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
            <span className="font-medium text-green-600">85%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">支持率：</span>
            <span className="font-medium text-[#2F80ED]">90%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">查重率：</span>
            <span className="font-medium text-green-600">8%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">AI相似性：</span>
            <span className="font-medium text-green-600">12%</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">当前版本：</span>
            <span className="font-medium text-[#374151]">v1.2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[#6B7280]">已保存</span>
          </div>
        </div>
      </div>
    </div>
  )
}
