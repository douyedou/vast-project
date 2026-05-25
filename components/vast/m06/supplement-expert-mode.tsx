"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { applySectionValue, getSectionValue } from "@/components/vast/m06/m06-page-utils"
import { M06_SECTION_DEFS, M06SectionKey } from "@/lib/m06"
import {
  ArrowLeft,
  Save,
  Sparkles,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Crown,
  Shield,
  Target,
  RefreshCw,
  Copy,
  XCircle,
  Lightbulb,
} from "lucide-react"

interface SupplementExpertModeProps {
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

export function SupplementExpertMode({ caseId, onBack, onNext }: SupplementExpertModeProps) {
  const [activeSection, setActiveSection] = useState("technicalProblem")
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [rightTab, setRightTab] = useState("ai-suggestion")
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
  const validation = content?.aiResults.completeness
  const validationPassed = validation?.issues?.filter((i) => i.severity !== "blocking").length || 0
  const validationWarnings = validation?.issues?.filter((i) => i.severity === "warning").length || 0
  const validationBlocked = validation?.issues?.filter((i) => i.severity === "blocking").length || 0

  const priorArtSimilar = (content?.aiResults.secondSearch?.sources || [])
    .filter((s) => (s.similarity || 0) >= 50)
    .map((s) => ({ feature: s.title, priorArt: s.source || "知识库", similarity: (s.similarity || 0) >= 75 ? "高" : "中" }))
  const priorArtDifferent = content?.structure.distinguishingFeatures?.length
    ? content.structure.distinguishingFeatures.map((f) => ({ feature: f, description: "本发明的区别特征，现有技术未涉及" }))
    : []

  const protectionSuggestions = (content?.structure.technicalFeatures || [])
    .map((f, i) => ({ id: i + 1, point: f, priority: i < 3 ? "核心" : "次要", adopted: content?.structure.protectionPoints.includes(f) }))

  const alternativeSuggestions = (content?.structure.alternatives || [])
    .map((a, i) => ({ id: i + 1, original: content?.structure.technicalFeatures[i] || "技术特征", alternative: a, reason: "可扩展保护范围" }))

  const handleSave = async () => {
    if (!content) return
    let next = content
    for (const [sectionId, value] of Object.entries(editedContent)) {
      next = applySectionValue(next, sectionId, value)
    }
    await saveContent(next)
  }

  const handleGenerate = async () => {
    const result = await runAction("supplement", { section: activeSection })
    if (result?.suggestion) {
      setEditedContent((prev) => ({ ...prev, [activeSection]: result.suggestion }))
    }
  }

  const handleSearchCompare = async () => {
    setRightTab("prior-art")
    await runAction("secondSearch", { query: editedContent[activeSection] || content?.sections.technicalSolution || "" })
  }

  const handleRealtimeValidate = async () => {
    setRightTab("validation")
    await runAction("validate")
  }

  const handleAdoptProtection = async (point: string) => {
    if (!content) return
    const next = Array.from(new Set([...content.structure.protectionPoints, point]))
    await saveContent({ ...content, structure: { ...content.structure, protectionPoints: next } })
  }

  const handleAdoptAlternative = async (alternative: string) => {
    if (!content) return
    const next = Array.from(new Set([...content.structure.alternatives, alternative]))
    await saveContent({ ...content, structure: { ...content.structure, alternatives: next } })
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
            <Badge className="bg-orange-100 text-orange-700"><Crown className="h-3 w-3 mr-1" />专家模式</Badge>
            <h1 className="text-lg font-semibold">交底书补充</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={Boolean(runningAction)}>
            <Sparkles className="h-4 w-4 mr-2" />{runningAction === "supplement" ? "生成中..." : "AI建议"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSearchCompare} disabled={Boolean(runningAction)}>
            <Target className="h-4 w-4 mr-2" />检索对比
          </Button>
          <Button variant="outline" size="sm" onClick={handleRealtimeValidate} disabled={Boolean(runningAction)}>
            <Shield className="h-4 w-4 mr-2" />实时校验
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />保存</Button>
          <Button onClick={onNext}>生成完整交底书<ChevronRight className="h-4 w-4 ml-2" /></Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-4">
            <span className="text-sm">完成进度 {completedCount}/{sections.length}</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />{validationPassed} 通过</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-500" />{validationWarnings} 警告</span>
              <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" />{validationBlocked} 阻断</span>
            </div>
          </div>
        </div>
        <Progress value={(completedCount / sections.length) * 100} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left */}
        <div className="w-60 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">模块与特征</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              <div className="text-xs text-muted-foreground px-2 py-1">交底模块</div>
              {sections.map((section) => (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${activeSection === section.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {editedContent[section.id] ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                  <span className="flex-1 truncate">{section.label}</span>
                  {section.required && <span className={`text-xs ${activeSection === section.id ? "text-primary-foreground/70" : "text-red-500"}`}>*</span>}
                </button>
              ))}
              <div className="text-xs text-muted-foreground px-2 py-1 mt-4">区别技术特征</div>
              {priorArtDifferent.map((item, i) => (
                <div key={i} className="px-2 py-1.5 text-xs bg-blue-50 rounded mb-1 mx-1">
                  <div className="font-medium text-blue-700">{item.feature}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">{activeSec.label}{activeSec.required && <span className="text-red-500 ml-1">*</span>}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={Boolean(runningAction)}><Sparkles className="h-4 w-4 mr-1" />AI生成</Button>
              <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={Boolean(runningAction)}><RefreshCw className="h-4 w-4 mr-1" />重新生成</Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <Textarea value={editedContent[activeSection] || ""}
              onChange={(e) => setEditedContent((prev) => ({ ...prev, [activeSection]: e.target.value }))}
              className="min-h-[400px] font-mono text-sm" placeholder="请输入内容或使用AI生成..." />
            <div className="flex justify-end mt-3">
              <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1" />保存模块</Button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="w-80 border-l flex flex-col">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex flex-col h-full">
            <TabsList className="m-2 grid grid-cols-4">
              <TabsTrigger value="ai-suggestion" className="text-xs">AI建议</TabsTrigger>
              <TabsTrigger value="prior-art" className="text-xs">技术对比</TabsTrigger>
              <TabsTrigger value="protection" className="text-xs">保护点</TabsTrigger>
              <TabsTrigger value="validation" className="text-xs">校验</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="ai-suggestion" className="p-4 space-y-4 m-0">
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-500" />AI补充建议</CardTitle></CardHeader>
                  <CardContent className="text-sm">
                    <p className="text-muted-foreground mb-2">基于初检结果和当前交底内容，AI可生成针对「{activeSec.label}」的补充建议。</p>
                    <Button size="sm" variant="outline" onClick={handleGenerate} disabled={Boolean(runningAction)}>
                      {runningAction === "supplement" ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />生成中...</> : <><Copy className="h-3 w-3 mr-1" />生成建议</>}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prior-art" className="p-4 space-y-4 m-0">
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />相似点（风险）</CardTitle></CardHeader>
                  <CardContent>
                    {priorArtSimilar.length === 0 ? (
                      <p className="text-sm text-muted-foreground">未发现高相似度现有技术</p>
                    ) : priorArtSimilar.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                        <span className="truncate">{item.feature}</span>
                        <Badge variant="destructive" className="text-xs shrink-0">{item.similarity}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />差异点（优势）</CardTitle></CardHeader>
                  <CardContent>
                    {priorArtDifferent.length === 0 ? (
                      <p className="text-sm text-muted-foreground">请先执行二次检索获取对比数据</p>
                    ) : priorArtDifferent.map((item, i) => (
                      <div key={i} className="text-sm py-1 border-b last:border-0">
                        <div className="font-medium">{item.feature}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="protection" className="p-4 space-y-4 m-0">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" />保护点建议</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {protectionSuggestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">请先在解构阶段提炼技术特征</p>
                    ) : protectionSuggestions.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{item.point}</div>
                          <Badge variant="outline" className="text-xs mt-1">{item.priority}</Badge>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleAdoptProtection(item.point)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4" />替代方案建议</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {alternativeSuggestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无替代方案</p>
                    ) : alternativeSuggestions.map((item) => (
                      <button key={item.id} type="button"
                        className="w-full p-2 bg-muted/50 rounded text-sm text-left hover:bg-muted"
                        onClick={() => handleAdoptAlternative(item.alternative)}>
                        <div><span className="text-muted-foreground">原方案:</span> {item.original}</div>
                        <div><span className="text-muted-foreground">替代:</span> {item.alternative}</div>
                        <div className="text-xs text-blue-600 mt-1">{item.reason}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="validation" className="p-4 space-y-4 m-0">
                {validation ? (
                  <>
                    <Card className="border-green-200">
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />通过项</CardTitle></CardHeader>
                      <CardContent>
                        {validation.issues.filter((i) => i.severity !== "blocking" && i.severity !== "warning").map((item, i) => (
                          <div key={i} className="text-sm py-1 text-green-700">{item.title}</div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="border-yellow-200">
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />警告项 ({validationWarnings})</CardTitle></CardHeader>
                      <CardContent>
                        {validation.issues.filter((i) => i.severity === "warning").map((item, i) => (
                          <div key={i} className="text-sm py-1 text-yellow-700">{item.title}</div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" />阻断项 ({validationBlocked})</CardTitle></CardHeader>
                      <CardContent>
                        {validation.issues.filter((i) => i.severity === "blocking").map((item, i) => (
                          <div key={i} className="text-sm py-1 text-red-700">{item.title}</div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">点击「实时校验」按钮执行检查</CardContent></Card>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
