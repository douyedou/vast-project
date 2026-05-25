"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { applySectionValue, getSectionValue } from "@/components/vast/m06/m06-page-utils"
import { M06_SECTION_DEFS, M06SectionKey } from "@/lib/m06"
import {
  ArrowLeft,
  Save,
  Sparkles,
  ChevronRight,
  FileText,
  CheckCircle,
  RefreshCw,
  Copy,
  AlertTriangle,
  Zap,
  Loader2,
} from "lucide-react"

interface SupplementFastModeProps {
  caseId?: string | null
  onBack?: () => void
  onNext?: () => void
}

const sections = [
  { id: "technicalProblem", label: "技术问题", required: true },
  { id: "backgroundTechnology", label: "技术背景", required: true },
  { id: "technicalSolution", label: "技术方案", required: true },
  { id: "embodiments", label: "实施方式", required: true },
  { id: "beneficialEffects", label: "有益效果", required: true },
  { id: "drawings", label: "附图说明", required: false },
]

export function SupplementFastMode({ caseId, onBack, onNext }: SupplementFastModeProps) {
  const [activeSection, setActiveSection] = useState("technicalProblem")
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const { content, saveContent, runAction, saving, runningAction } = useM06Document(caseId, "SUPPLEMENT")

  useEffect(() => {
    if (!content) return
    setEditedContent((prev) => {
      const next = { ...prev }
      for (const section of sections) {
        if (next[section.id] === undefined) next[section.id] = getSectionValue(content, section.id)
      }
      return next
    })
  }, [content])

  const completedCount = sections.filter((s) => editedContent[s.id]).length
  const currentSuggestion = content?.aiResults.supplement?.section === activeSection
    ? { suggestion: content.aiResults.supplement.suggestion, source: "AI 实时生成" }
    : undefined
  const currentContent = editedContent[activeSection] || ""
  const sectionDef = M06_SECTION_DEFS.find((s) => s.key === activeSection)

  const handleAdopt = () => {
    if (currentSuggestion?.suggestion) {
      setEditedContent((prev) => ({ ...prev, [activeSection]: currentSuggestion.suggestion }))
    }
  }

  const handleRegenerate = async () => {
    setGenerating(true)
    try {
      const result = await runAction("supplement", { section: activeSection })
      if (result?.suggestion) {
        setEditedContent((prev) => ({ ...prev, [activeSection]: result.suggestion }))
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!content) return
    let next = content
    for (const [sectionId, value] of Object.entries(editedContent)) {
      next = applySectionValue(next, sectionId, value)
    }
    await saveContent(next)
  }

  const activeSec = sections.find((s) => s.id === activeSection)!

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={3} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-700"><Zap className="h-3 w-3 mr-1" />极速模式</Badge>
            <h1 className="text-lg font-semibold">交底书补充</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />保存</Button>
          <Button variant="outline" onClick={handleRegenerate} disabled={generating || Boolean(runningAction)}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {generating ? "生成中..." : "生成AI建议"}
          </Button>
          <Button onClick={onNext}>生成完整交底书<ChevronRight className="h-4 w-4 ml-2" /></Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">完成进度</span>
          <span className="text-sm text-muted-foreground">{completedCount}/{sections.length}</span>
        </div>
        <Progress value={(completedCount / sections.length) * 100} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav */}
        <div className="w-56 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">交底模块目录</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sections.map((section) => (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${activeSection === section.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {editedContent[section.id] ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                  <span className="flex-1 truncate">{section.label}</span>
                  {section.required && <span className={`text-xs ${activeSection === section.id ? "text-primary-foreground/70" : "text-red-500"}`}>*</span>}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">{activeSec.label}{activeSec.required && <span className="text-red-500 ml-1">*</span>}</h2>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {currentSuggestion && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-500" />AI建议内容</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={generating}><RefreshCw className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />重新生成</Button>
                      <Button variant="ghost" size="sm" onClick={handleAdopt}><Copy className="h-4 w-4 mr-1" />采纳建议</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent><div className="bg-white rounded-lg p-3 text-sm whitespace-pre-wrap border">{currentSuggestion.suggestion}</div></CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">最终内容（可编辑）</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={currentContent} onChange={(e) => setEditedContent((prev) => ({ ...prev, [activeSection]: e.target.value }))}
                  className="min-h-[200px] font-mono text-sm" placeholder={sectionDef?.placeholder || "点击「采纳建议」或手动输入内容..."} />
                <div className="flex justify-end mt-3">
                  <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" />保存模块</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right */}
        <div className="w-72 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">依据与风险</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {currentSuggestion && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />来源依据</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">{currentSuggestion.source}</p></CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">初检关键词</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {content?.aiResults.initialInspection?.keywords?.length ? (
                      content.aiResults.initialInspection.keywords.map((kw) => <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>)
                    ) : (
                      <span className="text-sm text-muted-foreground">尚未执行AI初检</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {sectionDef && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />填写要求</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{sectionDef.placeholder}</p>
                    <p className="text-xs text-muted-foreground mt-2">建议最少 {sectionDef.minLength} 字</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
