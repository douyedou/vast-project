"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { downloadText } from "@/components/vast/m06/m06-page-utils"
import {
  ArrowLeft,
  Brain,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  ChevronRight,
  Loader2,
  Eye,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react"

interface SecondSearchProps {
  caseId?: string | null
  onBack: () => void
  onNext: () => void
}

export function SecondSearch({ caseId, onBack, onNext }: SecondSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [conclusion, setConclusion] = useState("continue")
  const [selectedResult, setSelectedResult] = useState<string | null>(null)
  const [expandedKeywords, setExpandedKeywords] = useState(false)
  const { content, runAction } = useM06Document(caseId, "SECOND_SEARCH")

  const initialKeywords = content?.aiResults.initialInspection?.keywords || []
  const distinguishingFeatures = content?.structure.distinguishingFeatures || []

  const searchRows = content?.aiResults.secondSearch?.sources?.length
    ? content.aiResults.secondSearch.sources.map((source, i) => ({
        id: source.source || source.title || `RAG-${i + 1}`,
        title: source.title || source.source || "未知",
        applicant: "知识库",
        relevance: source.similarity || 0,
        riskLevel: ((source.similarity || 0) >= 75 ? "high" : (source.similarity || 0) >= 50 ? "medium" : "low") as "high" | "medium" | "low",
        content: source.content || "",
      }))
    : []

  const handleSearch = async () => {
    setIsSearching(true)
    try { await runAction("secondSearch") } finally { setIsSearching(false) }
  }

  const handleExportResults = () => {
    const lines = [
      "# M06二次检索结果", "",
      content?.aiResults.secondSearch?.answer || "暂无检索总结", "",
      "## 来源",
      ...searchRows.map((row, i) => `${i + 1}. ${row.id} ${row.title}，相关度 ${row.relevance}%`),
    ]
    downloadText("M06-二次检索结果.md", lines.join("\n"), "text/markdown;charset=utf-8")
  }

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={5} />

      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h1 className="text-xl font-semibold text-[#111827]">二次检索</h1><p className="text-sm text-[#6B7280] mt-1">完整交底书生成后进行二次AI检索，确认新颖性和创造性风险</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportResults}><Download className="h-4 w-4 mr-1" />导出</Button>
          <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isSearching ? "检索中..." : "重新检索"}
          </Button>
          <Button onClick={onNext}>下一步：现有技术对比<ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <Alert className="border-blue-200 bg-blue-50 mb-4">
          <Brain className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">二次检索基于完整交底书内容，相比初检能发现更多相关现有技术。</AlertDescription>
        </Alert>

        {/* 关键词对比 - 可展开/收起 */}
        <Card className="mb-4">
          <CardHeader className="py-2 px-4 cursor-pointer" onClick={() => setExpandedKeywords(!expandedKeywords)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-sm">关键词对比</CardTitle>
                <div className="flex gap-3 text-xs">
                  <span className="text-muted-foreground">初检: <strong>{initialKeywords.length}</strong></span>
                  <span className="text-green-600">区别特征: <strong>{distinguishingFeatures.length}</strong></span>
                  <span className="text-[#2F80ED]">共计: <strong>{initialKeywords.length + distinguishingFeatures.length}</strong></span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {expandedKeywords ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </CardHeader>
          {expandedKeywords && (
            <CardContent className="pt-0 pb-3 px-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-[#374151] mb-2">初检关键词</div>
                  <div className="flex flex-wrap gap-1">
                    {initialKeywords.length === 0 ? <span className="text-xs text-muted-foreground">暂无</span>
                      : initialKeywords.map((kw) => <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>)}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-green-600 mb-2">区别特征（新增）</div>
                  <div className="flex flex-wrap gap-1">
                    {distinguishingFeatures.length === 0 ? <span className="text-xs text-muted-foreground">暂无</span>
                      : distinguishingFeatures.map((kw) => <Badge key={kw} className="text-xs bg-green-100 text-green-700 border-green-200">+ {kw}</Badge>)}
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 检索结果 - 占据主要空间 */}
        <Card className="flex flex-col" style={{ height: expandedKeywords ? "calc(100% - 200px)" : "calc(100% - 140px)" }}>
          <CardHeader className="py-2 px-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">检索结果</CardTitle>
                <Badge variant="outline" className="text-xs">{searchRows.length} 条</Badge>
              </div>
              {selectedResult && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedResult(null)}>
                  <X className="h-3 w-3 mr-1" />关闭详情
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 flex">
            {/* 结果列表 */}
            <div className={`${selectedResult ? "w-1/2" : "w-full"} border-r last:border-r-0 overflow-y-auto p-3 transition-all`}>
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] mb-3" />
                  <p className="text-sm text-muted-foreground">正在检索...</p>
                </div>
              ) : searchRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Search className="h-8 w-8 text-[#D1D5DB] mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {content?.aiResults.secondSearch ? "未发现新的相关文献。" : "点击「重新检索」发起二次 RAG 检索。"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchRows.map((result) => (
                    <div key={result.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                        selectedResult === result.id ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "bg-white hover:bg-blue-50 border-[#E5E7EB]"
                      }`}
                      onClick={() => setSelectedResult(selectedResult === result.id ? null : result.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[#2F80ED] text-xs">{result.id}</span>
                          <Badge variant={result.riskLevel === "high" ? "destructive" : result.riskLevel === "medium" ? "secondary" : "outline"} className="text-[10px]">
                            {result.riskLevel === "high" ? "高" : result.riskLevel === "medium" ? "中" : "低"}
                          </Badge>
                        </div>
                        <div className="text-sm text-[#374151] line-clamp-2">{result.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">相关度 {result.relevance}%</div>
                      </div>
                      <Eye className="h-4 w-4 text-[#9CA3AF] shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 详情面板 */}
            {selectedResult && (() => {
              const detail = searchRows.find((r) => r.id === selectedResult)
              if (!detail) return null
              return (
                <div className="w-1/2 overflow-y-auto p-4 bg-[#F8FAFC]">
                  <h3 className="font-semibold text-sm mb-3">{detail.title}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-muted-foreground">来源</span><span className="font-mono text-xs">{detail.id}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-muted-foreground">相关度</span><Badge>{detail.relevance}%</Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-muted-foreground">风险等级</span>
                      <Badge variant={detail.riskLevel === "high" ? "destructive" : detail.riskLevel === "medium" ? "secondary" : "outline"}>
                        {detail.riskLevel === "high" ? "高风险" : detail.riskLevel === "medium" ? "中风险" : "低风险"}
                      </Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-muted-foreground">来源类型</span><span>{detail.applicant}</span>
                    </div>
                  </div>
                  {detail.content && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">内容摘要</h4>
                      <div className="p-3 bg-white border rounded-lg text-sm whitespace-pre-wrap break-words leading-relaxed">{detail.content}</div>
                    </div>
                  )}
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* 工程师结论 */}
        <Card className="mt-4 shrink-0">
          <CardHeader className="py-2 px-4"><CardTitle className="text-sm">工程师结论</CardTitle></CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "continue", label: "继续推进", desc: "风险可控", icon: CheckCircle, color: "text-green-500" },
                { value: "adjust", label: "需要调整", desc: "返回交底补充", icon: AlertTriangle, color: "text-yellow-500" },
                { value: "warn", label: "高风险警告", desc: "建议客户确认", icon: AlertTriangle, color: "text-red-500" },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-[#F9FAFB] ${conclusion === opt.value ? "border-blue-400 bg-blue-50" : ""}`}>
                  <input type="radio" name="conclusion" checked={conclusion === opt.value} onChange={() => setConclusion(opt.value)} />
                  <div><div className="text-sm font-medium flex items-center gap-1.5"><opt.icon className={`h-4 w-4 ${opt.color}`} />{opt.label}</div><div className="text-[11px] text-muted-foreground">{opt.desc}</div></div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 内联 Search 图标（避免新增 import）
function Search({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  )
}
