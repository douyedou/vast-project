"use client"

import { useEffect, useState } from "react"
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
import { useM06Document } from "@/hooks/use-m06-document"
import type { M06Content, M06SectionKey, M06SourceMaterial } from "@/lib/m06"
import { M06_SECTION_DEFS, evaluateM06Completeness } from "@/lib/m06"
import { SECTION_ID_TO_KEY, joinLines } from "@/components/vast/m06/m06-page-utils"

interface ModelDetailProps {
  caseId?: string | null
  onBack?: () => void
  onNavigate?: (page: string) => void
}

type SectionModule = {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  required: boolean
  sectionKey?: M06SectionKey
}

const sectionModules: SectionModule[] = [
  { key: "technicalProblem", label: "技术问题", icon: Target, required: true, sectionKey: "technicalProblem" },
  { key: "backgroundTechnology", label: "背景技术", icon: BookOpen, required: true, sectionKey: "backgroundTechnology" },
  { key: "technicalSolution", label: "技术方案", icon: Wrench, required: true, sectionKey: "technicalSolution" },
  { key: "embodiments", label: "实施方式", icon: GitBranch, required: true, sectionKey: "embodiments" },
  { key: "beneficialEffects", label: "有益效果", icon: Star, required: true, sectionKey: "beneficialEffects" },
  { key: "drawings", label: "附图说明", icon: Image, required: false, sectionKey: "drawings" },
  { key: "protectionPoints", label: "保护点", icon: Shield, required: false },
  { key: "alternatives", label: "替代方案", icon: Lightbulb, required: false },
]

function buildModuleStates(content: M06Content | null) {
  return Object.fromEntries(
    sectionModules.map((mod) => {
      let value = ""
      if (mod.sectionKey) {
        value = content?.sections[mod.sectionKey] || ""
      }
      if (mod.key === "protectionPoints") {
        value = joinLines(content?.structure.protectionPoints || content?.structure.technicalFeatures || [])
      }
      if (mod.key === "alternatives") {
        value = joinLines(content?.structure.alternatives || [])
      }
      return [
        mod.key,
        {
          confirmed: Boolean(value) && Boolean(content?.workflow.completedSteps?.length),
          needSupplement: mod.required && !value,
          content: value,
        },
      ]
    })
  )
}

function moduleStatesToContent(content: M06Content, states: Record<string, { content: string; confirmed: boolean; needSupplement: boolean }>): M06Content {
  return {
    ...content,
    meta: { ...content.meta, currentStage: "DECOMPOSITION" },
    sections: {
      technicalProblem: states.technicalProblem?.content || content.sections.technicalProblem,
      backgroundTechnology: states.backgroundTechnology?.content || content.sections.backgroundTechnology,
      technicalSolution: states.technicalSolution?.content || content.sections.technicalSolution,
      embodiments: states.embodiments?.content || content.sections.embodiments,
      beneficialEffects: states.beneficialEffects?.content || content.sections.beneficialEffects,
      drawings: states.drawings?.content || content.sections.drawings,
    },
    structure: {
      ...content.structure,
      protectionPoints: (states.protectionPoints?.content || "")
        .split(/\n|；|;|。/)
        .map((item) => item.replace(/^\s*[-*•\d.、)）]+/, "").trim())
        .filter(Boolean),
      alternatives: (states.alternatives?.content || "")
        .split(/\n|；|;|。/)
        .map((item) => item.replace(/^\s*[-*•\d.、)）]+/, "").trim())
        .filter(Boolean),
    },
    workflow: { ...content.workflow, completedSteps: Array.from(new Set([...(content.workflow.completedSteps || []), "DECOMPOSITION"])) },
  }
}

function renderSourceMaterial(material: M06SourceMaterial) {
  return (
    <div key={material.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F9FAFB] transition">
      <FileText className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
      <span className="text-xs text-[#111827] truncate flex-1">{material.name}</span>
      <Badge variant="outline" className="text-[9px] py-0 px-1">{material.type === "image" ? "图片" : material.type === "file" ? "文件" : material.type === "url" ? "链接" : "文本"}</Badge>
    </div>
  )
}

export function ModelDetail({ caseId, onBack, onNavigate }: ModelDetailProps) {
  const [activeModule, setActiveModule] = useState("technicalProblem")
  const [isDestructuring, setIsDestructuring] = useState(false)
  const [isCheckingCompleteness, setIsCheckingCompleteness] = useState(false)
  const [isCheckingInnovation, setIsCheckingInnovation] = useState(false)
  const [moduleStates, setModuleStates] = useState<Record<string, { confirmed: boolean; needSupplement: boolean; content: string }>>({})
  const [selectedMaterial, setSelectedMaterial] = useState<M06SourceMaterial | null>(null)

  const { caseData, content, loading, saving, runningAction, saveContent, runAction } = useM06Document(caseId, "DECOMPOSITION")

  useEffect(() => {
    if (content) {
      const states = buildModuleStates(content)
      setModuleStates(states)
      if (!states[activeModule]?.content) {
        const firstEmpty = sectionModules.find((m) => !states[m.key]?.content)
        if (firstEmpty) setActiveModule(firstEmpty.key)
      }
    }
  }, [content])

  const active = sectionModules.find((m) => m.key === activeModule)!
  const sourceMaterials = content?.sourceMaterials || []

  const handleSaveAll = async () => {
    if (!content) return
    await saveContent(moduleStatesToContent(content, moduleStates as any))
  }

  const handleAIDestructure = async () => {
    if (!content) return
    setIsDestructuring(true)
    try {
      await saveContent(moduleStatesToContent(content, moduleStates as any))
      await runAction("decompose")
    } finally {
      setIsDestructuring(false)
    }
  }

  const handleCompletenessCheck = async () => {
    setIsCheckingCompleteness(true)
    try {
      await handleSaveAll()
      await runAction("validate")
    } finally {
      setIsCheckingCompleteness(false)
    }
  }

  const handleInnovationCheck = async () => {
    setIsCheckingInnovation(true)
    try {
      await handleSaveAll()
      await runAction("initialInspection")
    } finally {
      setIsCheckingInnovation(false)
    }
  }

  const handleGenerateActiveModule = async () => {
    if (!content) return
    const section = sectionModules.find((m) => m.key === activeModule)?.sectionKey
    if (!section) return
    const result = await runAction("supplement", { section })
    if (result?.suggestion) {
      setModuleStates((s) => ({ ...s, [activeModule]: { ...s[activeModule], content: result.suggestion, needSupplement: false } }))
    }
  }

  const getModuleStatus = (key: string) => {
    const s = moduleStates[key]
    if (!s?.content) return "missing"
    if (s.confirmed) return "confirmed"
    return "draft"
  }

  const validation = content ? (content.aiResults.completeness || evaluateM06Completeness(moduleStatesToContent(content, moduleStates as any))) : null
  const completenessItems = validation
    ? [
        { label: "技术问题", status: (content?.sections.technicalProblem ? "ok" : "missing") as "ok" | "missing" | "warning" },
        { label: "技术方案", status: (content?.sections.technicalSolution ? "ok" : "missing") as "ok" | "missing" | "warning" },
        { label: "有益效果", status: (content?.sections.beneficialEffects ? "ok" : "missing") as "ok" | "missing" | "warning" },
        { label: "保护点", status: ((content?.structure.protectionPoints.length || content?.structure.technicalFeatures.length) ? "ok" : "warning") as "ok" | "missing" | "warning" },
        { label: "附图说明", status: (content?.sections.drawings ? "ok" : "warning") as "ok" | "missing" | "warning" },
      ]
    : []
  const innovation = content?.aiResults.initialInspection
  const missingRequired = sectionModules.filter((m) => m.required && !moduleStates[m.key]?.content).length

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#F5F7FA]">
        <M06ProgressBar currentStep={1} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] mx-auto mb-3" />
            <p className="text-sm text-[#6B7280]">正在加载交底书数据...</p>
          </div>
        </div>
      </div>
    )
  }

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
            <span className="ml-2 text-xs text-[#6B7280]">
              {caseData?.case_id || content?.meta.caseNo || "M06"} · {caseData?.title || content?.meta.caseTitle || "交底书"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" onClick={handleSaveAll} disabled={saving}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "保存中..." : "保存草稿"}
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
            disabled={loading || missingRequired > 0}
            onClick={() => onNavigate?.("m06-ai-inspection")}
          >
            下一步
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 三列主体 */}
      <div className="flex flex-1 overflow-hidden p-4 gap-3">

        {/* 左侧材料区 */}
        <aside className="w-[320px] shrink-0 flex flex-col gap-2 overflow-y-auto">
          {/* 来源信息 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-3">
            <h3 className="text-xs font-semibold text-[#111827] mb-2">来源信息</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">案件编号</span>
                <span className="text-[#111827] font-medium font-mono">{caseData?.case_id || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">专利类型</span>
                <span className="text-[#111827] font-medium">{content?.meta.patentType || "发明"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">工程师</span>
                <span className="text-[#111827] font-medium">{caseData?.engineer_name || "未分配"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">申请人</span>
                <span className="text-[#111827] font-medium">{caseData?.applicant_name || "未分配"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">文档版本</span>
                <span className="text-[#111827] font-medium">v{content?.workflow.completedSteps?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">来源状态</span>
                <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[10px]">已审核</Badge>
              </div>
            </div>
          </div>

          {/* 来源材料列表 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-[#E5E7EB]">
              <h3 className="text-xs font-semibold text-[#111827]">来源材料 ({sourceMaterials.length})</h3>
            </div>
            <div className="p-2 space-y-1">
              {sourceMaterials.length === 0 ? (
                <div className="py-3 text-center text-xs text-[#9CA3AF]">
                  暂无来源材料，可在完整交底页上传
                </div>
              ) : (
                sourceMaterials.map((m) => {
                  const isSelected = selectedMaterial?.id === m.id
                  return (
                    <div key={m.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition ${isSelected ? "bg-[#EFF6FF]" : "hover:bg-[#F9FAFB]"}`}>
                      <FileText className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                      <span className="text-xs text-[#111827] truncate flex-1">{m.name}</span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1">{m.type}</Badge>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setSelectedMaterial(isSelected ? null : m)} title="查看材料内容">
                        <Eye className="h-3 w-3 text-[#9CA3AF]" />
                      </Button>
                    </div>
                  )
                })
              )}
              {selectedMaterial && (
                <div className="mt-2 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] p-2 text-xs text-[#1E3A8A]">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{selectedMaterial.name}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => setSelectedMaterial(null)}>关闭</Button>
                  </div>
                  <p className="whitespace-pre-wrap break-words leading-5">{selectedMaterial.summary || selectedMaterial.text || "暂无解析内容"}</p>
                </div>
              )}
            </div>
          </div>

          {/* 模块导航 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex-1">
            <div className="px-3 py-2 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">交底模块</h3>
            </div>
            <div className="p-2 space-y-1">
              {sectionModules.map((mod) => {
                const Icon = mod.icon
                const status = getModuleStatus(mod.key)
                return (
                  <button
                    key={mod.key}
                    onClick={() => setActiveModule(mod.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                      activeModule === mod.key ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#374151] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium flex-1">
                      {M06_SECTION_DEFS.find((s) => s.key === mod.sectionKey)?.label || mod.label}
                    </span>
                    {mod.required && status === "missing" && <div className="w-2 h-2 rounded-full bg-[#DC2626]" />}
                    {status === "confirmed" && <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />}
                    {mod.required && <span className="text-[#DC2626] text-sm font-semibold">*</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* 中央编辑区 */}
        <main className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="bg-white border border-[#E5E7EB] rounded-xl flex flex-col overflow-hidden flex-1">
            <div className="h-10 flex items-center justify-between px-4 border-b border-[#E5E7EB] shrink-0">
              <div className="flex items-center gap-2">
                {(() => { const Icon = active.icon; return <Icon className="h-4 w-4 text-[#2563EB]" /> })()}
                <span className="text-sm font-semibold text-[#111827]">
                  {M06_SECTION_DEFS.find((s) => s.key === active.sectionKey)?.label || active.label}
                </span>
                {active.required && <span className="text-[#DC2626] text-xs">必填</span>}
                {moduleStates[active.key]?.confirmed && <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[10px]">已确认</Badge>}
                {moduleStates[active.key]?.needSupplement && <Badge className="bg-[#FEF3C7] text-[#D97706] text-[10px]">待补充</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <span>待补充</span>
                  <Switch checked={moduleStates[active.key]?.needSupplement || false} onCheckedChange={(v) => setModuleStates((s) => ({ ...s, [active.key]: { ...s[active.key], needSupplement: v } }))} className="scale-75" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <span>已确认</span>
                  <Switch checked={moduleStates[active.key]?.confirmed || false} onCheckedChange={(v) => setModuleStates((s) => ({ ...s, [active.key]: { ...s[active.key], confirmed: v } }))} className="scale-75" />
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={handleGenerateActiveModule} disabled={Boolean(runningAction)}>
                  <Brain className="h-3 w-3" />
                  {runningAction === "supplement" ? "生成中" : "AI生成"}
                </Button>
                <Button size="sm" className="text-xs h-7 bg-[#2563EB] hover:bg-[#1D4ED8] gap-1" onClick={handleSaveAll} disabled={saving}>
                  <Save className="h-3 w-3" />
                  保存模块
                </Button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex flex-col gap-3 min-h-full">
                {moduleStates[active.key]?.content ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    <Textarea
                      className="flex-1 min-h-[200px] text-sm resize-none border-[#E5E7EB] focus-visible:ring-[#2563EB]"
                      value={moduleStates[active.key].content}
                      onChange={(e) => setModuleStates((s) => ({ ...s, [active.key]: { ...s[active.key], content: e.target.value } }))}
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-[#E5E7EB] rounded-xl text-center p-4">
                    <Layers className="h-6 w-6 text-[#D1D5DB] mb-2" />
                    <p className="text-sm text-[#6B7280] mb-1">此模块内容为空</p>
                    <p className="text-xs text-[#9CA3AF] mb-3">{active.required ? "必填模块，请填写或AI生成" : "可手动填写或AI生成"}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setModuleStates((s) => ({ ...s, [active.key]: { ...s[active.key], content: "请在此填写内容..." } }))}>手动填写</Button>
                      <Button size="sm" className="text-xs h-7 bg-[#2563EB] hover:bg-[#1D4ED8] gap-1" onClick={handleGenerateActiveModule} disabled={Boolean(runningAction)}>
                        <Brain className="h-3 w-3" />AI生成
                      </Button>
                    </div>
                  </div>
                )}

                {/* 相关来源材料 */}
                <div className="shrink-0 border border-[#E5E7EB] rounded-lg overflow-hidden bg-[#F9FAFB]">
                  <div className="px-3 py-2 border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#2563EB]" />
                      <span className="text-sm font-semibold text-[#374151]">关联来源材料</span>
                    </div>
                    <span className="text-xs text-[#9CA3AF]">{sourceMaterials.length} 份材料</span>
                  </div>
                  <div className="px-3 py-2.5 space-y-2 max-h-[180px] overflow-y-auto">
                    {sourceMaterials.length > 0 ? (
                      sourceMaterials.filter((m) => !m.targetSection || m.targetSection === active.sectionKey).slice(0, 5).map((m) => (
                        <div key={m.id} className="bg-white border border-[#E5E7EB] rounded-lg p-2.5" onClick={() => setSelectedMaterial(m)}>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-3 w-3 text-[#6B7280]" />
                            <span className="text-xs font-medium text-[#374151]">{m.name}</span>
                            <Badge variant="outline" className="text-[9px] py-0 px-1 text-[#6B7280]">{m.type}</Badge>
                          </div>
                          <p className="text-xs text-[#6B7280] leading-relaxed bg-[#F9FAFB] border border-[#E5E7EB] rounded px-2 py-1.5 line-clamp-2">
                            {m.summary || m.text || "暂无摘要"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <FileText className="h-5 w-5 text-[#D1D5DB] mx-auto mb-1.5" />
                        <p className="text-xs text-[#9CA3AF]">暂无来源材料</p>
                        <p className="text-[10px] text-[#D1D5DB] mt-0.5">可在完整交底页面中上传材料</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <Textarea placeholder="备注（可选，最多500字符）" className="text-xs h-12 resize-none border-[#E5E7EB]" maxLength={500} />
                </div>
              </div>
            </div>
          </div>

          {/* 模块完成度总览 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#111827]">模块完成概览</span>
              <span className="text-xs text-[#6B7280]">{sectionModules.filter((m) => moduleStates[m.key]?.content).length} / {sectionModules.length} 已填写</span>
            </div>
            <div className="flex gap-1.5">
              {sectionModules.map((mod) => {
                const status = getModuleStatus(mod.key)
                return (
                  <button key={mod.key} onClick={() => setActiveModule(mod.key)} title={M06_SECTION_DEFS.find((s) => s.key === mod.sectionKey)?.label || mod.label}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      status === "confirmed" ? "bg-[#16A34A]" : status === "draft" ? "bg-[#2563EB]" : mod.required ? "bg-[#DC2626]" : "bg-[#E5E7EB]"
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

        {/* 右侧判断区 */}
        <aside className="w-[320px] shrink-0 flex flex-col gap-3 overflow-y-auto">
          {/* 完整性判断 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#2563EB]" />完整性判断</h3>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleCompletenessCheck} disabled={isCheckingCompleteness}>
                {isCheckingCompleteness ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
            {validation ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">完整性得分</span>
                  <span className={`text-lg font-bold ${validation.score >= 80 ? "text-[#16A34A]" : validation.score >= 60 ? "text-[#F59E0B]" : "text-[#DC2626]"}`}>{validation.score}</span>
                </div>
                <div className="space-y-1.5">
                  {completenessItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-[#374151]">{item.label}</span>
                      {item.status === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />}
                      {item.status === "missing" && <XCircle className="h-3.5 w-3.5 text-[#DC2626]" />}
                      {item.status === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" />}
                    </div>
                  ))}
                </div>
                {missingRequired > 0 && (
                  <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">{missingRequired} 个必填模块尚未填写</div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#9CA3AF]">点击刷新图标执行完整性检查</div>
            )}
          </div>

          {/* 创新点判断 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#2563EB]" />创新点判断</h3>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleInnovationCheck} disabled={isCheckingInnovation}>
                {isCheckingInnovation ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              </Button>
            </div>
            {innovation ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${innovation.riskLevel === "low" ? "bg-[#DCFCE7]" : innovation.riskLevel === "high" ? "bg-[#FEF2F2]" : "bg-[#FFFBEB]"}`}>
                    {innovation.riskLevel === "low" ? <CheckCircle2 className="h-4 w-4 text-[#16A34A]" /> : innovation.riskLevel === "high" ? <XCircle className="h-4 w-4 text-[#DC2626]" /> : <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#111827]">风险等级：{innovation.riskLevel === "low" ? "低" : innovation.riskLevel === "high" ? "高" : "中"}</div>
                    <div className="text-xs text-[#6B7280]">{innovation.keywords?.length || 0} 个关键词 · {innovation.sources?.length || 0} 个来源</div>
                  </div>
                </div>
                <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap break-words">{innovation.answer || "暂无分析结果"}</p>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#9CA3AF]">点击刷新图标执行创新点分析</div>
            )}
          </div>

          {/* 缺失项 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]"><h3 className="text-sm font-semibold text-[#111827]">缺失项</h3></div>
            <div className="p-3 space-y-1.5">
              {sectionModules.filter((m) => !moduleStates[m.key]?.content).length === 0 ? (
                <div className="text-xs text-[#16A34A] flex items-center gap-1.5 py-1"><CheckCircle2 className="h-3.5 w-3.5" />全部模块已填写</div>
              ) : (
                sectionModules.filter((m) => !moduleStates[m.key]?.content).map((m) => (
                  <div key={m.key} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[#F9FAFB]" onClick={() => setActiveModule(m.key)}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.required ? "bg-[#DC2626]" : "bg-[#F59E0B]"}`} />
                    <span className="text-xs text-[#374151]">{M06_SECTION_DEFS.find((s) => s.key === m.sectionKey)?.label || m.label}</span>
                    {m.required && <Badge className="bg-[#FEF2F2] text-[#DC2626] text-[10px] ml-auto">必填</Badge>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 建议动作 */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]"><h3 className="text-sm font-semibold text-[#111827]">建议动作</h3></div>
            <div className="p-3 space-y-2">
              {[
                { label: "进入AI初检", desc: "交底完整，存在创新点", color: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]", active: innovation?.riskLevel === "low", action: () => onNavigate?.("m06-ai-inspection") },
                { label: "进入交底补全", desc: "创新点不足，建议补充", color: "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]", active: !innovation || innovation.riskLevel !== "low", action: () => onNavigate?.("m06-supplement") },
                { label: "返回M05", desc: "材料严重缺失，需补充原始资料", color: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]", active: false, action: () => onNavigate?.("m05-dashboard") },
              ].map((item) => (
                <button key={item.label} onClick={item.action}
                  className={`w-full flex items-center justify-between p-3 border rounded-lg text-left transition-all hover:opacity-90 ${item.color} ${item.active ? "ring-2 ring-offset-1 ring-current" : "opacity-60 hover:opacity-80"}`}
                >
                  <div><div className="text-xs font-semibold">{item.label}</div><div className="text-[10px] opacity-80 mt-0.5">{item.desc}</div></div>
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
