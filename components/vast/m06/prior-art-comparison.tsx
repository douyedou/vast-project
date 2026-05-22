"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { downloadText } from "@/components/vast/m06/m06-page-utils"
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react"

interface PriorArtComparisonProps {
  caseId?: string | null
  onBack: () => void
  onNext: () => void
}

export function PriorArtComparison({ caseId, onBack, onNext }: PriorArtComparisonProps) {
  const { content, runAction, runningAction } = useM06Document(caseId, "COMPARE")
  const [selectedArtId, setSelectedArtId] = useState<string | null>(null)
  const hasMounted = useRef(false)

  const priorArts = useMemo(() => {
    const sources = content?.aiResults.secondSearch?.sources?.length
      ? content.aiResults.secondSearch.sources
      : content?.aiResults.initialInspection?.sources || []
    return sources.map((source, index) => ({
      id: source.source || `RAG-${index + 1}`,
      title: source.title || "未知",
      applicant: "知识库",
      relevance: source.similarity || 0,
      riskLevel: ((source.similarity || 0) >= 75 ? "high" : (source.similarity || 0) >= 50 ? "medium" : "low") as "high" | "medium" | "low",
    }))
  }, [content?.aiResults.secondSearch?.generatedAt, content?.aiResults.initialInspection?.generatedAt])

  useEffect(() => {
    if (!hasMounted.current && priorArts.length > 0) {
      setSelectedArtId(priorArts[0].id)
      hasMounted.current = true
    }
  }, [priorArts])

  const selectedArt = priorArts.find((a) => a.id === selectedArtId)
  const distinguishingFeatures = content?.structure.distinguishingFeatures || []
  const technicalFeatures = content?.structure.technicalFeatures || []

  const featureComparison = useMemo(() => technicalFeatures.map((feature, index) => ({
    feature,
    ourTech: feature,
    priorArt1: (selectedArt ? selectedArt.title : priorArts[0]?.title) || "待补充",
    isDistinct: distinguishingFeatures.includes(feature) || index < 2,
  })), [technicalFeatures, distinguishingFeatures, selectedArt, priorArts])

  const distinctFeatures = featureComparison.filter((f) => f.isDistinct)
  const commonFeatures = featureComparison.filter((f) => !f.isDistinct)

  const handleCompare = async () => { await runAction("compare") }

  const handleExportComparison = () => {
    const lines = [
      "# M06现有技术对比报告", "",
      content?.aiResults.priorArtComparison?.summary || "暂无 AI 对比结论", "",
      "## 选中来源", `${selectedArt?.id || ""} ${selectedArt?.title || ""}`, "",
      "## 区别特征", ...distinctFeatures.map((item, i) => `${i + 1}. ${item.feature}`), "",
      "## 共性特征", ...commonFeatures.map((item, i) => `${i + 1}. ${item.feature}`),
    ]
    downloadText("M06-现有技术对比报告.md", lines.join("\n"), "text/markdown;charset=utf-8")
  }

  const handleSelectArt = (id: string) => {
    setSelectedArtId(id)
  }

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={6} />

      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div><h1 className="text-xl font-semibold text-[#111827]">现有技术对比</h1><p className="text-sm text-[#6B7280] mt-1">对比分析现有技术，确认区别技术特征</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportComparison}><Download className="h-4 w-4 mr-2" />导出</Button>
          <Button variant="outline" onClick={handleCompare} disabled={runningAction === "compare"}>
            {runningAction === "compare" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}AI对比
          </Button>
          <Button onClick={onNext}>下一步：关系建模<ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* 左侧列表 */}
        <div className="w-80 border-r bg-[#F9FAFB] flex flex-col">
          <div className="p-3 border-b shrink-0"><h3 className="font-medium text-sm">现有技术 ({priorArts.length})</h3></div>
          <div className="flex-1 overflow-y-auto p-3">
            {priorArts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg bg-white">暂无对比文件，请先在二次检索页生成来源。</div>
            ) : (
              <div className="space-y-2">
                {priorArts.map((art) => {
                  const isSelected = selectedArtId === art.id
                  return (
                    <button key={art.id} type="button" onClick={() => handleSelectArt(art.id)}
                      className={`w-full text-left p-3 rounded-lg transition border ${
                        isSelected ? "bg-white border-[#2F80ED] border-2 shadow-sm" : "bg-white border-[#E5E7EB] hover:border-[#2F80ED]/50"
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-[#2F80ED] truncate">{art.id}</span>
                        <Badge variant={art.riskLevel === "high" ? "destructive" : art.riskLevel === "medium" ? "secondary" : "outline"} className="text-[10px] shrink-0 ml-1">
                          {art.riskLevel === "high" ? "高" : art.riskLevel === "medium" ? "中" : "低"}
                        </Badge>
                      </div>
                      <div className="text-sm text-[#374151] line-clamp-2">{art.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">相关度 {art.relevance}%</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 右侧对比详情 */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue="features">
            <TabsList className="mb-4">
              <TabsTrigger value="features">特征对比</TabsTrigger>
              <TabsTrigger value="summary">对比总结</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="space-y-4">
              {!selectedArt ? (
                <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">请从左侧选择一个现有技术文件进行对比</CardContent></Card>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><CardTitle className="text-base">区别技术特征 ({distinctFeatures.length})</CardTitle></div>
                    </CardHeader>
                    <CardContent>
                      {distinctFeatures.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">点击"AI对比"自动识别区别特征</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b bg-[#F9FAFB]"><th className="text-left py-2 px-3 font-medium">技术特征</th><th className="text-left py-2 px-3 font-medium bg-blue-50">本申请</th><th className="text-left py-2 px-3 font-medium">对比文件</th></tr></thead>
                            <tbody>
                              {distinctFeatures.map((item, i) => (
                                <tr key={i} className="border-b hover:bg-[#F9FAFB]"><td className="py-2 px-3 font-medium">{item.feature}</td><td className="py-2 px-3 bg-blue-50 text-blue-700">{item.ourTech}</td><td className="py-2 px-3 text-muted-foreground">{item.priorArt1}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /><CardTitle className="text-base">共有技术特征 ({commonFeatures.length})</CardTitle></div></CardHeader>
                    <CardContent>
                      {commonFeatures.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">所有特征均为区别特征，创新性强</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b bg-[#F9FAFB]"><th className="text-left py-2 px-3 font-medium">技术特征</th><th className="text-left py-2 px-3 font-medium">本申请</th><th className="text-left py-2 px-3 font-medium">对比文件</th></tr></thead>
                            <tbody>
                              {commonFeatures.map((item, i) => (
                                <tr key={i} className="border-b hover:bg-[#F9FAFB]"><td className="py-2 px-3 font-medium">{item.feature}</td><td className="py-2 px-3">{item.ourTech}</td><td className="py-2 px-3">{item.priorArt1}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">对比总结</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-600">{distinctFeatures.length}</div><div className="text-sm text-green-700">区别特征</div></div>
                    <div className="p-4 bg-yellow-50 rounded-lg text-center"><div className="text-2xl font-bold text-yellow-600">{commonFeatures.length}</div><div className="text-sm text-yellow-700">共有特征</div></div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center"><div className="text-2xl font-bold text-blue-600">{priorArts.length}</div><div className="text-sm text-blue-700">对比文件</div></div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">AI分析结论</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {content?.aiResults.priorArtComparison?.summary || (distinctFeatures.length > 0
                        ? `本申请相对于现有技术具有 ${distinctFeatures.length} 个区别技术特征。`
                        : "点击「AI对比」获取 AI 分析的对比结论")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
