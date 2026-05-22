"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Search,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  Loader2,
  RefreshCw,
  Plus,
  Download,
  Sparkles,
  Send,
  ExternalLink,
  Target
} from "lucide-react"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { downloadText } from "@/components/vast/m06/m06-page-utils"
import type { M06Source } from "@/lib/m06"

interface AIInspectionProps {
  caseId?: string | null
  onBack?: () => void
  onContinue?: () => void
  onNavigateToTech?: (techId: number, riskFeature?: string) => void
}

export function AIInspection({ caseId, onBack, onContinue, onNavigateToTech }: AIInspectionProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [judgment, setJudgment] = useState<string>("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["domestic", "foreign", "paper", "standard"])
  const [keywords, setKeywords] = useState<string[]>([])
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const { content, runAction, runningAction } = useM06Document(caseId, "AI_PRE_CHECK")

  useEffect(() => {
    const aiKeywords = content?.aiResults.initialInspection?.keywords
    if (aiKeywords?.length) {
      setKeywords(aiKeywords)
    } else if (content?.structure.technicalFeatures?.length) {
      setKeywords(content.structure.technicalFeatures.flatMap((item) => item.split(/[、,;\s]+/)).filter((item) => item.length >= 2 && item.length <= 16).slice(0, 8))
    }
  }, [content?.aiResults.initialInspection?.keywords, content?.structure.technicalFeatures])

  const inspection = content?.aiResults.initialInspection
  const sourceRows: M06Source[] = inspection?.sources || []

  const relatedTech = sourceRows.length > 0 ? sourceRows.map((source, index) => ({
    id: index + 1,
    title: source.source || source.title || `来源-${index + 1}`,
    name: source.title || "未知标题",
    applicant: "知识库",
    date: "",
    similarity: source.similarity || 0,
    riskLevel: ((source.similarity || 0) >= 75 ? "high" : (source.similarity || 0) >= 50 ? "medium" : "low") as "high" | "medium" | "low",
    riskFeature: content?.structure.technicalFeatures[index] || null,
    riskPosition: source.content || "",
  })) : []

  const noveltyRisks = sourceRows.length > 0 ? sourceRows.slice(0, 5).map((source, index) => ({
    id: index + 1,
    feature: content?.structure.technicalFeatures[index] || source.title || `特征-${index + 1}`,
    risk: ((source.similarity || 0) >= 75 ? "high" : (source.similarity || 0) >= 50 ? "medium" : "low") as "high" | "medium" | "low",
    relatedTechId: index + 1,
    relatedTechTitle: source.title || "",
    reason: `${source.title || "相关文献"} 与本案相关度 ${source.similarity || 0}%，需要确认区别特征。`,
    suggestion: "建议补充与该现有技术不同的结构、步骤或参数。",
  })) : []

  const handleStartSearch = async () => {
    setIsSearching(true)
    try {
      await runAction("initialInspection", { keywords })
    } finally {
      setIsSearching(false)
    }
  }

  const handleRemoveKeyword = (e: React.MouseEvent, kw: string) => {
    e.stopPropagation()
    setKeywords(keywords.filter((k) => k !== kw))
  }

  const handleKeywordClick = (kw: string) => {
    const newKeywords = keywords.filter((k) => k !== kw)
    setKeywords(newKeywords.length ? newKeywords : keywords)
  }

  const handleAddKeyword = (kw: string) => {
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw])
  }

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return
    setIsAiThinking(true)
    try {
      const token = localStorage.getItem("vast_token")
      const response = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ question: `请围绕以下交底书检索主题给出 5 个专利检索关键词，只返回短词：${aiQuestion}`, topK: 4 }),
      })
      const payload = await response.json()
      const answer = payload?.data?.answer || ""
      const fromAnswer = answer.split(/\n|,|，|、|；|;/).map((item: string) => item.replace(/^\s*[-*\d.、)]+/, "").trim()).filter((item: string) => item.length >= 2 && item.length <= 16)
      setAiSuggestions(Array.from(new Set([...fromAnswer, ...aiQuestion.split(/\s+/)])).slice(0, 8))
    } catch {
      setAiSuggestions(Array.from(new Set([...aiQuestion.split(/\s+/)])).slice(0, 5))
    } finally {
      setIsAiThinking(false)
    }
  }

  const handleExportReport = async () => {
    const report = await runAction("exportReport", { title: "M06 AI初检报告" })
    downloadText(report.record?.filename || "M06-AI初检报告.md", report.markdown || inspection?.answer || "暂无报告", "text/markdown;charset=utf-8")
  }

  const handleFeedbackM05 = async () => {
    await runAction("feedbackM05", { result: judgment || "supplement", notes: `AI初检工程师判断：${judgment || "需补充"}` })
  }

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = { high: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]", medium: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]", low: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]" }
    const labels: Record<string, string> = { high: "高风险", medium: "中风险", low: "低风险" }
    return <Badge variant="outline" className={`text-xs px-1.5 py-0 ${colors[risk]}`}>{labels[risk]}</Badge>
  }

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      <M06ProgressBar currentStep={2} />

      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-lg font-semibold">AI初检</h1><p className="text-xs text-muted-foreground">技术要点提取 → AI关键词生成 → 专利检索 → 初检报告</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportReport} disabled={Boolean(runningAction)}><Download className="h-3.5 w-3.5 mr-1.5" />导出报告</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleFeedbackM05} disabled={Boolean(runningAction)}>反馈M05</Button>
          <Button size="sm" className="h-8 text-xs" onClick={onContinue}>进入交底补充<ChevronRight className="h-3.5 w-3.5 ml-1" /></Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-56 border-r flex flex-col bg-white">
          <div className="p-3 border-b">
            <div className="text-xs font-semibold text-[#374151] mb-2">检索关键词</div>
            <div className="flex flex-wrap gap-1">
              {keywords.length === 0 ? (
                <span className="text-[10px] text-[#9CA3AF]">从解构中自动提取</span>
              ) : keywords.map((kw, i) => (
                <button key={i} type="button" className="group inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[#D1D5DB] text-[#374151] cursor-pointer hover:border-[#DC2626] hover:bg-[#FEF2F2] bg-white"
                  onClick={() => handleKeywordClick(kw)} title="点击移除">
                  {kw}
                  <XCircle className="h-3 w-3 text-[#9CA3AF] group-hover:text-[#DC2626] pointer-events-none" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-b bg-gradient-to-b from-[#EFF6FF] to-white">
            <div className="flex items-center gap-1.5 mb-2"><Sparkles className="h-3.5 w-3.5 text-[#2563EB]" /><span className="text-xs font-semibold text-[#2563EB]">AI关键词助手</span></div>
            <div className="flex gap-1 mb-2">
              <Input placeholder="描述你想检索的技术..." className="h-7 text-xs flex-1" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAskAI()} />
              <Button size="sm" className="h-7 w-7 p-0 shrink-0" onClick={handleAskAI} disabled={isAiThinking}>
                {isAiThinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] text-[#6B7280]">AI建议关键词：</div>
                <div className="flex flex-wrap gap-1">
                  {aiSuggestions.map((s, i) => (
                    <button key={i} type="button" className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB] cursor-pointer hover:bg-[#DBEAFE]"
                      onClick={() => { handleAddKeyword(s); setAiSuggestions(aiSuggestions.filter((x) => x !== s)) }}>
                      <Plus className="h-2.5 w-2.5" />{s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-b">
            <div className="text-xs font-semibold text-[#374151] mb-2">检索范围</div>
            <div className="space-y-1.5">
              {[{ id: "domestic", label: "国内专利" }, { id: "foreign", label: "国外专利" }, { id: "paper", label: "学术论文" }, { id: "standard", label: "技术标准" }].map((scope) => (
                <div key={scope.id} className="flex items-center gap-1.5">
                  <Checkbox id={scope.id} className="h-3 w-3" checked={selectedScopes.includes(scope.id)}
                    onCheckedChange={(checked) => checked ? setSelectedScopes([...selectedScopes, scope.id]) : setSelectedScopes(selectedScopes.filter((s) => s !== scope.id))} />
                  <Label htmlFor={scope.id} className="text-[11px] text-[#374151]">{scope.label}</Label>
                </div>
              ))}
            </div>
            <Button className="w-full mt-2.5 h-7 text-xs" onClick={handleStartSearch} disabled={isSearching}>
              {isSearching ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />检索中...</> : <><Search className="h-3 w-3 mr-1" />执行检索</>}
            </Button>
          </div>
        </div>

        {/* Center Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-white flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-[#2563EB]" />AI检索结果</h2>
            <div className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-1 rounded font-mono">{keywords.slice(0, 5).join(" OR ") || "等待检索"}</div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {isSearching ? (
                <Card className="p-8 border-[#E5E7EB]">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#2563EB] mb-4" />
                    <div className="text-base font-medium mb-2 text-[#111827]">AI正在检索中...</div>
                    <Progress value={65} className="w-64 h-2 mb-2" />
                    <div className="text-xs text-[#9CA3AF]">正在进行知识库检索...</div>
                  </div>
                </Card>
              ) : !inspection && sourceRows.length === 0 ? (
                <Card className="p-8 border-[#E5E7EB]">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Search className="h-10 w-10 text-[#D1D5DB] mb-4" />
                    <div className="text-base font-medium mb-2 text-[#111827]">尚未执行检索</div>
                    <p className="text-xs text-[#9CA3AF] mb-3">点击左侧「执行检索」发起 AI 初检，获取相关现有技术分析。</p>
                  </div>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-2">
                    <Card className="p-2.5 text-center border-[#E5E7EB]"><div className="text-xl font-bold text-[#2563EB]">{sourceRows.length || "-"}</div><div className="text-[10px] text-[#9CA3AF]">检索文献</div></Card>
                    <Card className="p-2.5 text-center border-[#E5E7EB]"><div className="text-xl font-bold text-[#2563EB]">{relatedTech.length || "-"}</div><div className="text-[10px] text-[#9CA3AF]">相关专利</div></Card>
                    <Card className="p-2.5 text-center border-[#E5E7EB]"><div className="text-xl font-bold text-[#F59E0B]">{sourceRows.filter((s) => (s.similarity || 0) >= 70).length || "-"}</div><div className="text-[10px] text-[#9CA3AF]">高相关度</div></Card>
                    <Card className="p-2.5 text-center border-[#E5E7EB]"><div className="mb-0.5">{getRiskBadge(inspection?.riskLevel || "medium")}</div><div className="text-[10px] text-[#9CA3AF]">综合风险</div></Card>
                    <Card className="p-2.5 text-center border-[#E5E7EB]"><div className="text-sm font-semibold text-[#374151]">RAG检索</div><div className="text-[10px] text-[#9CA3AF]">检索方式</div></Card>
                  </div>

                  {noveltyRisks.length > 0 && (
                    <Card className="border-[#FDE68A] bg-[#FFFBEB]/30">
                      <CardHeader className="py-2.5 px-4 border-b border-[#FDE68A]/50">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#D97706]"><AlertTriangle className="h-4 w-4" />新创性风险分析</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-[#FDE68A]/30 max-h-[240px] overflow-y-auto">
                          {noveltyRisks.map((risk) => (
                            <div key={risk.id} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[#6B7280]" /><span className="text-sm font-medium text-[#111827]">{risk.feature}</span>{getRiskBadge(risk.risk)}</div>
                                {risk.relatedTechId && (
                                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 border-[#D97706] text-[#D97706] hover:bg-[#FFFBEB] shrink-0"
                                    onClick={() => { const tech = relatedTech.find((t) => t.id === risk.relatedTechId); if (tech) document.getElementById(`tech-row-${tech.id}`)?.scrollIntoView({ behavior: "smooth" }) }}>
                                    <ExternalLink className="h-3 w-3 mr-1" />查看对比文件
                                  </Button>
                                )}
                              </div>
                              <div className="text-xs text-[#6B7280] mb-2 pl-6 whitespace-pre-wrap break-words">{risk.reason}</div>
                              <div className="text-xs bg-[#EFF6FF] text-[#2563EB] px-3 py-2 rounded-lg ml-6 border border-[#BFDBFE] whitespace-pre-wrap break-words"><span className="font-medium">建议：</span>{risk.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-[#E5E7EB]">
                    <CardHeader className="py-2.5 px-4 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">相关现有技术 ({relatedTech.length})</CardTitle>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={handleStartSearch} disabled={isSearching}><RefreshCw className="h-3 w-3 mr-1" />重新检索</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {relatedTech.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg m-3">
                          {inspection ? "检索完成，未发现高度相关的现有技术。" : "点击「执行检索」发起 AI 初检。"}
                        </div>
                      ) : (
                        <div className="max-h-[200px] overflow-y-auto">
                          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#F9FAFB] text-[10px] font-medium text-[#6B7280] border-b sticky top-0 bg-[#F9FAFB]">
                            <div className="col-span-2">来源</div><div className="col-span-4">名称</div><div className="col-span-2">来源类型</div><div className="col-span-1 text-center">相似度</div><div className="col-span-1 text-center">风险</div><div className="col-span-2 text-center">操作</div>
                          </div>
                          <div className="divide-y divide-[#F3F4F6]">
                            {relatedTech.map((tech) => (
                              <div key={tech.id} id={`tech-row-${tech.id}`} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[#F9FAFB] transition text-xs">
                                <div className="col-span-2 font-mono text-[10px] text-[#6B7280] truncate">{tech.title}</div>
                                <div className="col-span-4"><div className="text-[#111827] truncate">{tech.name}</div></div>
                                <div className="col-span-2 text-[#6B7280] truncate">{tech.applicant}</div>
                                <div className="col-span-1 text-center"><span className={`font-semibold ${tech.similarity >= 40 ? 'text-[#DC2626]' : tech.similarity >= 30 ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>{tech.similarity}%</span></div>
                                <div className="col-span-1 text-center">{getRiskBadge(tech.riskLevel)}</div>
                                <div className="col-span-2 text-center">
                                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => { const target = document.getElementById(`tech-row-${tech.id}`); target?.scrollIntoView({ behavior: "smooth" }) }}>
                                    <Eye className="h-3 w-3 mr-1" />详情
                                    {tech.riskFeature && <Badge className="ml-1 text-[8px] px-1 py-0 bg-[#DC2626] text-white">风险</Badge>}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel */}
        <div className="w-72 border-l flex flex-col bg-white">
          <div className="px-4 py-2.5 border-b"><h2 className="text-sm font-semibold text-[#111827]">工程师判断</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              <Card className="border-[#E5E7EB]">
                <CardHeader className="py-2.5 px-4 border-b"><CardTitle className="text-xs font-semibold">初步判断</CardTitle></CardHeader>
                <CardContent className="p-3">
                  <RadioGroup value={judgment} onValueChange={setJudgment}>
                    <div className="space-y-2">
                      {[
                        { value: "applicable", label: "可申报", desc: "技术方案具有新创性", icon: CheckCircle, color: "text-[#16A34A]", borderColor: "border-[#16A34A]", bgColor: "bg-[#F0FDF4]" },
                        { value: "supplement", label: "需补充", desc: "需补充材料或技术区别", icon: AlertTriangle, color: "text-[#D97706]", borderColor: "border-[#D97706]", bgColor: "bg-[#FFFBEB]" },
                        { value: "not-recommended", label: "不建议", desc: "新创性风险过高", icon: XCircle, color: "text-[#DC2626]", borderColor: "border-[#DC2626]", bgColor: "bg-[#FEF2F2]" },
                      ].map((opt) => (
                        <div key={opt.value} className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition ${judgment === opt.value ? `${opt.borderColor} ${opt.bgColor}` : 'hover:bg-[#F9FAFB]'}`}>
                          <RadioGroupItem value={opt.value} id={opt.value} />
                          <Label htmlFor={opt.value} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-1.5"><opt.icon className={`h-4 w-4 ${opt.color}`} /><span className="text-sm font-medium">{opt.label}</span></div>
                            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{opt.desc}</p>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {(judgment === "supplement" || judgment === "not-recommended") && (
                <Card className="border-[#E5E7EB]">
                  <CardHeader className="py-2 px-4 border-b"><CardTitle className="text-xs font-semibold">{judgment === "supplement" ? "补充说明" : "不建议原因"}</CardTitle></CardHeader>
                  <CardContent className="p-3"><Textarea placeholder={judgment === "supplement" ? "请说明需要补充的内容..." : "请说明不建议申报的原因..."} className="text-xs min-h-[80px] resize-none" /></CardContent>
                </Card>
              )}

              {judgment === "applicable" && (
                <Card className="border-[#BBF7D0] bg-[#F0FDF4]"><CardContent className="p-3"><div className="flex items-center gap-2 text-[#16A34A]"><CheckCircle className="h-4 w-4" /><span className="text-xs font-medium">判断完成，可进入下一步</span></div></CardContent></Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
