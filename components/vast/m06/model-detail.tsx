"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  FileText,
  Brain,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Loader2,
  Star,
  Layers,
  Lightbulb,
  BookOpen,
  Target,
  Wrench,
  Shield,
  Image,
  GitBranch,
  Save,
} from "lucide-react"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"

interface ModelDetailProps {
  onBack?: () => void
  onNavigate?: (page: string) => void
}

const materials = [
  { 
    id: 1, 
    name: "技术交底书_v1.docx", 
    type: "交底书", 
    size: "2.4MB", 
    isCore: true, 
    parseStatus: "completed",
    sourceContent: "本发明涉及一种基于大模型的专利质量自动审核方法，通过深度学习技术对专利申请文件进行智能分析，能够自动识别技术交底书中的创新点和缺陷，提高审核效率，降低审核成本。该方法包括交底信息提取、技术方案分析、现有技术对比等多个关键环节。"
  },
  { 
    id: 2, 
    name: "系统架构图.pdf",      
    type: "图纸",   
    size: "1.2MB", 
    isCore: true, 
    parseStatus: "completed",
    sourceContent: "系统架构采用分层设计理念，由三层组成：数据层负责交底信息的采集和存储；业务层包含质量评估、风险识别等核心模块；展示层提供可视化分析界面。各层之间通过标准接口进行通信，确保系统的高效运行。"
  },
  { 
    id: 3, 
    name: "功能模块图.png",      
    type: "图片",   
    size: "856KB", 
    isCore: false, 
    parseStatus: "completed",
    sourceContent: "功能模块包括以下几部分：(1)信息提取模块 - 自动识别和提取交底书中的关键信息；(2)分析引擎 - 进行技术创新性分析和风险评估；(3)对标库 - 存储行业技术信息供对比分析。"
  },
]

// 模块与来源的映射关系
const moduleSourceMap: Record<string, Array<{ materialId: number; page: string; paragraph: string; excerpt: string }>> = {
  problem: [
    { materialId: 1, page: "第2页", paragraph: "第1-2段", excerpt: "现有智能家居控制系统存在以下问题：各设备间缺乏统一的AI决策层，无法实现协同联动，导致用户需要手动控制每个设备，操作繁琐，自动化程度低。" }
  ],
  background: [
    { materialId: 1, page: "第1页", paragraph: "第1段", excerpt: "随着物联网技术的快速发展，智能家居产品日益普及，越来越多的家庭开始使用智能设备。" },
    { materialId: 1, page: "第1页", paragraph: "第2段", excerpt: "现有智能家居方案主要依赖规则引擎进行设备控制，无法适应复杂多变的用户习惯。" }
  ],
  defects: [
    { materialId: 1, page: "第2页", paragraph: "第3-4段", excerpt: "现有技术的主要缺点包括：1. 缺乏自学习能力，系统无法根据用户行为自动优化；2. 各品牌设备协议不统一，互联互通困难；3. 云端处理导致响应延迟高。" }
  ],
  purpose: [
    { materialId: 1, page: "第3页", paragraph: "第1段", excerpt: "本发明的目的是提供一种基于深度学习的智能家居控制系统，能够实现多设备协同联动，大幅提升自动化程度和用户体验。" }
  ],
  solution: [],
  keypoints: [
    { materialId: 1, page: "第4页", paragraph: "第2段", excerpt: "本发明的核心创新点包括：多模态感知融合模块、实时场景识别引擎、设备协同控制协议。" },
    { materialId: 2, page: "架构图", paragraph: "模块说明", excerpt: "系统架构图展示了各核心模块的连接关系和数据流向。" }
  ],
  effect: [],
  drawings: [
    { materialId: 2, page: "全文", paragraph: "-", excerpt: "系统架构图展示了三层架构设计：数据层、业务层、展示层。" },
    { materialId: 3, page: "全图", paragraph: "-", excerpt: "功能模块图详细展示了信息提取模块、分析引擎、对标库的组成结构。" }
  ],
  alternatives: []
}

const modules = [
  {
    key: "problem",
    label: "技术问题",
    icon: Target,
    required: true,
    content: "现有智能家居控制系统缺乏统一的AI决策层，各设备间无法实现协同联动，导致用户操作繁琐，自动化程度低。",
    confirmed: true,
    needSupplement: false,
  },
  {
    key: "background",
    label: "技术背景",
    icon: BookOpen,
    required: false,
    content: "随着物联网技术的发展，智能家居产品日益普及。现有方案主要依赖规则引擎，无法适应复杂的用户习惯变化。",
    confirmed: true,
    needSupplement: false,
  },
  {
    key: "defects",
    label: "现有技术缺点",
    icon: XCircle,
    required: false,
    content: "1. 缺乏自学习能力，无法适应用户习惯变化；2. 各品牌设备协议不统一，互联互通困难；3. 响应延迟高，用户体验差。",
    confirmed: true,
    needSupplement: false,
  },
  {
    key: "purpose",
    label: "发明目的",
    icon: Lightbulb,
    required: false,
    content: "提供一种基于深度学习的智能家居控制系统，实现多设备协同联动，提升自动化程度和用户体验。",
    confirmed: false,
    needSupplement: false,
  },
  {
    key: "solution",
    label: "技术方案",
    icon: Wrench,
    required: true,
    content: "",
    confirmed: false,
    needSupplement: true,
  },
  {
    key: "keypoints",
    label: "关键保护点",
    icon: Shield,
    required: false,
    content: "1. 多模态感知融合模块；2. 实时场景识别引擎；3. 设备协同控制协议。",
    confirmed: false,
    needSupplement: false,
  },
  {
    key: "effect",
    label: "有益效果",
    icon: Star,
    required: true,
    content: "",
    confirmed: false,
    needSupplement: true,
  },
  {
    key: "drawings",
    label: "图纸材料",
    icon: Image,
    required: false,
    content: "已上传系统架构图（图1）、功能模块图（图2），缺少数据流图。",
    confirmed: true,
    needSupplement: false,
  },
  {
    key: "alternatives",
    label: "替代方案",
    icon: GitBranch,
    required: false,
    content: "",
    confirmed: false,
    needSupplement: false,
  },
]

const completenessResult = {
  score: 68,
  status: "incomplete" as "complete" | "incomplete" | "blocked",
  items: [
    { label: "技术问题", status: "ok" },
    { label: "技术方案", status: "missing" },
    { label: "技术效果", status: "missing" },
    { label: "关键保护点", status: "warning" },
    { label: "图纸材料", status: "warning" },
  ],
}

const innovationResult = {
  hasInnovation: true,
  confidence: 72,
  summary: "存在一定创新点，核心创新在于多模态感知融合与场景识别引擎的结合，但技术方案描述不完整，建议补充后再进行检索。",
  suggestion: "supplement" as "go-inspection" | "supplement" | "return-m05",
}

export function ModelDetail({ onBack, onNavigate }: ModelDetailProps) {
  const [activeModule, setActiveModule] = useState("problem")
  const [isDestructuring, setIsDestructuring] = useState(false)
  const [isCheckingCompleteness, setIsCheckingCompleteness] = useState(false)
  const [isCheckingInnovation, setIsCheckingInnovation] = useState(false)
  const [completenessChecked, setCompletenessChecked] = useState(true)
  const [innovationChecked, setInnovationChecked] = useState(true)
  const [moduleStates, setModuleStates] = useState(
    Object.fromEntries(modules.map(m => [m.key, { confirmed: m.confirmed, needSupplement: m.needSupplement, content: m.content }]))
  )

  const active = modules.find(m => m.key === activeModule)!

  const handleAIDestructure = () => {
    setIsDestructuring(true)
    setTimeout(() => setIsDestructuring(false), 2000)
  }

  const handleCompletenessCheck = () => {
    setIsCheckingCompleteness(true)
    setTimeout(() => { setIsCheckingCompleteness(false); setCompletenessChecked(true) }, 1500)
  }

  const handleInnovationCheck = () => {
    setIsCheckingInnovation(true)
    setTimeout(() => { setIsCheckingInnovation(false); setInnovationChecked(true) }, 2000)
  }

  const getParseStatusBadge = (status: string) => {
    if (status === "completed") return <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[10px]">已解析</Badge>
    if (status === "processing") return <Badge className="bg-[#FEF9C3] text-[#CA8A04] text-[10px]">解析中</Badge>
    return <Badge className="bg-[#F3F4F6] text-[#6B7280] text-[10px]">待解析</Badge>
  }

  const getModuleStatus = (key: string) => {
    const s = moduleStates[key]
    if (!s.content) return "missing"
    if (s.confirmed) return "confirmed"
    return "draft"
  }

  const missingRequired = modules.filter(m => m.required && !moduleStates[m.key].content).length

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      <M06ProgressBar currentStep={1} />

      {/* 工具栏 */}
      <div className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-[#6B7280]" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="w-px h-5 bg-[#E5E7EB]" />
          <div>
            <span className="text-sm font-semibold text-[#111827]">交底书解构</span>
            <span className="ml-2 text-xs text-[#6B7280]">M06-2024-001 · 一种基于深度学习的智能家居控制系统</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
            <Save className="h-3.5 w-3.5" />
            保存草稿
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={handleAIDestructure} disabled={isDestructuring}>
            {isDestructuring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
            手动解构
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={handleAIDestructure} disabled={isDestructuring}>
            {isDestructuring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
            {isDestructuring ? "AI解构中..." : "AI解构"}
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={handleCompletenessCheck} disabled={isCheckingCompleteness}>
            {isCheckingCompleteness ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            完整性判断
          </Button>
          <Button size="sm" className="text-xs h-8 gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={handleInnovationCheck} disabled={isCheckingInnovation}>
            {isCheckingInnovation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            创新点判断
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 gap-1.5 bg-[#16A34A] hover:bg-[#15803D]"
            disabled={missingRequired > 0}
            onClick={() => onNavigate?.("m06-ai-inspection")}
          >
            下一步
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 三列主体 */}
      <div className="flex flex-1 overflow-hidden p-4 gap-3">

        {/* 左侧材料区 320px */}
        <aside className="w-[320px] shrink-0 flex flex-col gap-2 overflow-y-auto">
          {/* 来源信息 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3">
            <h3 className="text-xs font-semibold text-[#111827] mb-2">来源信息</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">来源类别</span>
                <Badge className="bg-[#EFF6FF] text-[#2563EB] text-[10px]">立案</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">案件编号</span>
                <span className="text-[#111827] font-medium font-mono">CASE-0025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">来源状态</span>
                <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[10px]">已审核</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">专利类型</span>
                <span className="text-[#111827] font-medium">发明</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">申请方式</span>
                <span className="text-[#111827] font-medium">普通</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">工程师</span>
                <span className="text-[#111827] font-medium">李明</span>
              </div>
            </div>
          </div>

          {/* 材料列表 - 紧凑排列 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-semibold text-[#111827]">材料列表 ({materials.length})</h3>
            </div>
            <div className="p-2 space-y-1">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F9FAFB] transition">
                  <FileText className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                  <span className="text-xs text-[#111827] truncate flex-1">{m.name}</span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1">{m.type}</Badge>
                  {m.isCore && <Badge className="bg-[#EFF6FF] text-[#2563EB] text-[9px] py-0 px-1">核心</Badge>}
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    <Eye className="h-3 w-3 text-[#9CA3AF]" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 模块导航 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex-1">
            <div className="px-3 py-2 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">模块导航</h3>
            </div>
            <div className="p-2 space-y-1">
              {modules.map((mod) => {
                const Icon = mod.icon
                const status = getModuleStatus(mod.key)
                return (
                  <button
                    key={mod.key}
                    onClick={() => setActiveModule(mod.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                      activeModule === mod.key
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : "text-[#374151] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium flex-1">{mod.label}</span>
                    {mod.required && status === "missing" && (
                      <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
                    )}
                    {status === "confirmed" && (
                      <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                    )}
                    {mod.required && <span className="text-[#DC2626] text-sm font-semibold">*</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* 中央交底模块解构区 */}
        <main className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* 当前模块编辑器 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col overflow-hidden flex-1">
            {/* 模块标题栏 40px */}
            <div className="h-10 flex items-center justify-between px-4 border-b border-[#E5E7EB] shrink-0">
              <div className="flex items-center gap-2">
                {(() => { const Icon = active.icon; return <Icon className="h-4 w-4 text-[#2563EB]" /> })()}
                <span className="text-sm font-semibold text-[#111827]">{active.label}</span>
                {active.required && <span className="text-[#DC2626] text-xs">必填</span>}
                {moduleStates[active.key].confirmed && (
                  <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[10px]">已确认</Badge>
                )}
                {moduleStates[active.key].needSupplement && (
                  <Badge className="bg-[#FEF3C7] text-[#D97706] text-[10px]">待补充</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <span>需补充</span>
                  <Switch
                    checked={moduleStates[active.key].needSupplement}
                    onCheckedChange={(v) => setModuleStates(s => ({ ...s, [active.key]: { ...s[active.key], needSupplement: v } }))}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <span>已确认</span>
                  <Switch
                    checked={moduleStates[active.key].confirmed}
                    onCheckedChange={(v) => setModuleStates(s => ({ ...s, [active.key]: { ...s[active.key], confirmed: v } }))}
                    className="scale-75"
                  />
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                  <Brain className="h-3 w-3" />
                  AI生成
                </Button>
                <Button size="sm" className="text-xs h-7 bg-[#2563EB] hover:bg-[#1D4ED8] gap-1">
                  <Save className="h-3 w-3" />
                  保存模块
                </Button>
              </div>
            </div>

            {/* 编辑区主体 - 自适应布局 */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex flex-col h-full gap-3">
                {/* 模块内容区 - 自适应高度 */}
                {moduleStates[active.key].content ? (
                  <div className="flex-1 min-h-0">
                    <Textarea
                      className="w-full h-full min-h-[120px] text-sm resize-none border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                      value={moduleStates[active.key].content}
                      onChange={(e) => setModuleStates(s => ({ ...s, [active.key]: { ...s[active.key], content: e.target.value } }))}
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-[#E5E7EB] rounded-xl text-center p-4">
                    <Layers className="h-6 w-6 text-[#D1D5DB] mb-2" />
                    <p className="text-sm text-[#6B7280] mb-1">此模块内容为空</p>
                    <p className="text-xs text-[#9CA3AF] mb-3">
                      {active.required ? "必填模块，请填写或AI生成" : "可手动填写或AI生成"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => setModuleStates(s => ({ ...s, [active.key]: { ...s[active.key], content: "请在此填写内容..." } }))}
                      >
                        手动填写
                      </Button>
                      <Button size="sm" className="text-xs h-7 bg-[#2563EB] hover:bg-[#1D4ED8] gap-1">
                        <Brain className="h-3 w-3" />
                        AI生成
                      </Button>
                    </div>
                  </div>
                )}

                {/* 内容来源 - 与当前模块联动 */}
                <div className="shrink-0 border border-[#E5E7EB] rounded-lg overflow-hidden bg-[#F9FAFB]">
                  <div className="px-3 py-2 border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#2563EB]" />
                      <span className="text-sm font-semibold text-[#374151]">内容来源</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#2563EB] text-[#2563EB]">
                        {active.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-[#9CA3AF]">
                      {moduleSourceMap[active.key]?.length || 0} 处引用
                    </span>
                  </div>
                  <div className="px-3 py-2.5 space-y-2 max-h-[180px] overflow-y-auto">
                    {moduleSourceMap[active.key]?.length > 0 ? (
                      moduleSourceMap[active.key].map((source, idx) => {
                        const material = materials.find(m => m.id === source.materialId)
                        return (
                          <div key={idx} className="bg-white border border-[#E5E7EB] rounded-lg p-2.5">
                            <div className="flex items-center gap-2 mb-1.5">
                              <FileText className="h-3 w-3 text-[#6B7280]" />
                              <span className="text-xs font-medium text-[#374151]">{material?.name}</span>
                              <Badge variant="outline" className="text-[9px] py-0 px-1 text-[#6B7280] border-[#D1D5DB]">
                                {source.page}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] py-0 px-1 text-[#6B7280] border-[#D1D5DB]">
                                {source.paragraph}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#6B7280] leading-relaxed bg-[#F9FAFB] border border-[#E5E7EB] rounded px-2 py-1.5">
                              "{source.excerpt}"
                            </p>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-4">
                        <FileText className="h-5 w-5 text-[#D1D5DB] mx-auto mb-1.5" />
                        <p className="text-xs text-[#9CA3AF]">此模块暂无来源引用</p>
                        <p className="text-[10px] text-[#D1D5DB] mt-0.5">请手动填写或使用AI生成内容</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 备注 - 紧凑 */}
                <div className="shrink-0">
                  <Textarea
                    placeholder="备注（可选，最多500字符）"
                    className="text-xs h-12 resize-none border-[#E5E7EB]"
                    maxLength={500}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 模块完成度总览 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#111827]">模块完成概览</span>
              <span className="text-xs text-[#6B7280]">
                {modules.filter(m => moduleStates[m.key].content).length} / {modules.length} 已填写
              </span>
            </div>
            <div className="flex gap-1.5">
              {modules.map((mod) => {
                const status = getModuleStatus(mod.key)
                return (
                  <button
                    key={mod.key}
                    onClick={() => setActiveModule(mod.key)}
                    title={mod.label}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      status === "confirmed" ? "bg-[#16A34A]" :
                      status === "draft" ? "bg-[#2563EB]" :
                      mod.required ? "bg-[#DC2626]" : "bg-[#E5E7EB]"
                    }`}
                  />
                )
              })}
            </div>
            <div className="flex gap-3 mt-2 text-[10px] text-[#9CA3AF]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#16A34A]" />已确认</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2563EB]" />草稿</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#DC2626]" />必填缺失</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#E5E7EB]" />未填写</span>
            </div>
          </div>
        </main>

        {/* 右侧判断区 320px */}
        <aside className="w-[320px] shrink-0 flex flex-col gap-3 overflow-y-auto">
          {/* 完整性判断 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                完整性判断
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={handleCompletenessCheck}
                disabled={isCheckingCompleteness}
              >
                {isCheckingCompleteness ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
            {completenessChecked ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">完整性得分</span>
                  <span className={`text-lg font-bold ${completenessResult.score >= 80 ? "text-[#16A34A]" : completenessResult.score >= 60 ? "text-[#F59E0B]" : "text-[#DC2626]"}`}>
                    {completenessResult.score}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {completenessResult.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-[#374151]">{item.label}</span>
                      {item.status === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />}
                      {item.status === "missing" && <XCircle className="h-3.5 w-3.5 text-[#DC2626]" />}
                      {item.status === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" />}
                    </div>
                  ))}
                </div>
                {missingRequired > 0 && (
                  <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">
                    {missingRequired} 个必填模块尚未填写，无法进入下一步
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#9CA3AF]">点击【完整性判断】执行检查</div>
            )}
          </div>

          {/* 创新点判断 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#2563EB]" />
                创新点判断
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={handleInnovationCheck}
                disabled={isCheckingInnovation}
              >
                {isCheckingInnovation ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
            {innovationChecked ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${innovationResult.hasInnovation ? "bg-[#DCFCE7]" : "bg-[#FEF2F2]"}`}>
                    {innovationResult.hasInnovation
                      ? <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                      : <XCircle className="h-4 w-4 text-[#DC2626]" />
                    }
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111827]">
                      {innovationResult.hasInnovation ? "存在创新点" : "暂未发现创新点"}
                    </div>
                    <div className="text-xs text-[#6B7280]">置信度 {innovationResult.confidence}%</div>
                  </div>
                </div>
                <p className="text-xs text-[#374151] leading-relaxed">{innovationResult.summary}</p>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#9CA3AF]">点击【创新点判断】执行分析</div>
            )}
          </div>

          {/* 缺失项 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">缺失项</h3>
            </div>
            <div className="p-3 space-y-1.5">
              {modules.filter(m => !moduleStates[m.key].content).length === 0 ? (
                <div className="text-xs text-[#16A34A] flex items-center gap-1.5 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  全部模块已填写
                </div>
              ) : modules.filter(m => !moduleStates[m.key].content).map((m) => (
                <div
                  key={m.key}
                  className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[#F9FAFB]"
                  onClick={() => setActiveModule(m.key)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.required ? "bg-[#DC2626]" : "bg-[#F59E0B]"}`} />
                  <span className="text-xs text-[#374151]">{m.label}</span>
                  {m.required && <Badge className="bg-[#FEF2F2] text-[#DC2626] text-[10px] ml-auto">必填</Badge>}
                </div>
              ))}
            </div>
          </div>

          {/* 建议动作与下一步流程 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">建议动作</h3>
            </div>
            <div className="p-3 space-y-2">
              {[
                {
                  label: "进入AI初检",
                  desc: "交底完整，存在创新点",
                  color: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]",
                  active: innovationResult.suggestion === "go-inspection",
                  action: () => onNavigate?.("m06-ai-inspection"),
                },
                {
                  label: "进入交底补全",
                  desc: "创新点不足，建议补充",
                  color: "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]",
                  active: innovationResult.suggestion === "supplement",
                  action: () => onNavigate?.("m06-supplement"),
                },
                {
                  label: "返回M05",
                  desc: "材料严重缺失，需补充原始资料",
                  color: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
                  active: innovationResult.suggestion === "return-m05",
                  action: () => onNavigate?.("m05-dashboard"),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between p-3 border rounded-lg text-left transition-all hover:opacity-90 ${item.color} ${item.active ? "ring-2 ring-offset-1 ring-current" : "opacity-60 hover:opacity-80"}`}
                >
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{item.desc}</div>
                  </div>
                  {item.active && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
