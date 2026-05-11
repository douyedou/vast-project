"use client"

import { useState } from "react"
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
  FileText,
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

interface AIInspectionProps {
  onBack?: () => void
  onContinue?: () => void
  onNavigateToTech?: (techId: number, riskFeature?: string) => void
}

export function AIInspection({ onBack, onContinue, onNavigateToTech }: AIInspectionProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchComplete, setSearchComplete] = useState(true)
  const [judgment, setJudgment] = useState<string>("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["domestic", "foreign", "paper", "standard"])
  const [keywords, setKeywords] = useState<string[]>(["深度学习", "智能家居", "语音识别", "设备联动", "场景控制", "用户行为", "自动化"])
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isAiThinking, setIsAiThinking] = useState(false)

  const materials = [
    { id: 1, name: "技术交底书_v1.docx", type: "交底书", selected: true },
    { id: 2, name: "系统架构图.pdf", type: "图纸", selected: true },
    { id: 3, name: "功能模块图.png", type: "图片", selected: false },
    { id: 4, name: "技术说明补充.docx", type: "补充材料", selected: true }
  ]

  const searchResults = {
    totalSearched: 1568,
    relatedPatents: 23,
    highRelevance: 5,
    riskLevel: "medium",
    searchTime: "2分32秒"
  }

  const relatedTech = [
    {
      id: 1,
      title: "CN202310001234.5",
      name: "一种基于深度学习的智能家居控制方法",
      applicant: "XX科技有限公司",
      date: "2023-05-15",
      similarity: 45,
      riskLevel: "high",
      riskFeature: "深度学习语音识别控制",
      riskPosition: "权利要求1-3"
    },
    {
      id: 2,
      title: "CN202310005678.9",
      name: "基于人工智能的家电控制系统及方法",
      applicant: "YY电器集团",
      date: "2023-03-20",
      similarity: 38,
      riskLevel: "medium",
      riskFeature: "多设备联动控制",
      riskPosition: "说明书第[0025]-[0032]段"
    },
    {
      id: 3,
      title: "US2023/0123456",
      name: "Smart Home Control System Using Machine Learning",
      applicant: "Tech Corp Inc.",
      date: "2023-02-10",
      similarity: 32,
      riskLevel: "medium",
      riskFeature: "场景模式控制",
      riskPosition: "Claim 5-8"
    },
    {
      id: 4,
      title: "CN202210098765.4",
      name: "智能家居场景联动控制方法及系统",
      applicant: "ZZ智能科技",
      date: "2022-11-08",
      similarity: 28,
      riskLevel: "low",
      riskFeature: null,
      riskPosition: null
    },
    {
      id: 5,
      title: "EP3456789A1",
      name: "Intelligent Home Automation System",
      applicant: "European Tech GmbH",
      date: "2022-09-15",
      similarity: 25,
      riskLevel: "low",
      riskFeature: null,
      riskPosition: null
    }
  ]

  const noveltyRisks = [
    {
      id: 1,
      feature: "深度学习语音识别控制",
      risk: "high",
      relatedTechId: 1,
      relatedTechTitle: "CN202310001234.5",
      reason: "CN202310001234.5中已公开类似技术方案，权利要求1-3涉及相同技术特征",
      suggestion: "建议补充具体的模型架构和训练方法差异"
    },
    {
      id: 2,
      feature: "多设备联动控制",
      risk: "medium",
      relatedTechId: 2,
      relatedTechTitle: "CN202310005678.9",
      reason: "多篇现有技术涉及设备联动，需明确技术区别",
      suggestion: "建议强调联动策略的创新点"
    },
    {
      id: 3,
      feature: "用户行为预测算法",
      risk: "low",
      relatedTechId: null,
      relatedTechTitle: null,
      reason: "该特征在现有技术中较少涉及",
      suggestion: "可作为核心创新点重点保护"
    }
  ]

  const handleStartSearch = () => {
    setIsSearching(true)
    setSearchComplete(false)
    setTimeout(() => {
      setIsSearching(false)
      setSearchComplete(true)
    }, 3000)
  }

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw))
  }

  const handleAddKeyword = (kw: string) => {
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw])
    }
  }

  const handleAskAI = () => {
    if (!aiQuestion.trim()) return
    setIsAiThinking(true)
    // 模拟AI响应
    setTimeout(() => {
      setAiSuggestions(["神经网络", "卷积层", "特征提取", "模型训练", "推理优化"])
      setIsAiThinking(false)
    }, 1500)
  }

  const handleViewTechDetail = (tech: typeof relatedTech[0]) => {
    // 跳转到现有技术页面并定位到风险位置
    if (onNavigateToTech) {
      onNavigateToTech(tech.id, tech.riskFeature || undefined)
    }
  }

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      high: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
      medium: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
      low: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
    }
    const labels: Record<string, string> = {
      high: "高风险",
      medium: "中风险",
      low: "低风险"
    }
    return <Badge variant="outline" className={`text-xs px-1.5 py-0 ${colors[risk]}`}>{labels[risk]}</Badge>
  }

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB]">
      {/* M06 Progress Bar */}
      <M06ProgressBar currentStep={2} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">AI初检</h1>
            <p className="text-xs text-muted-foreground">
              材料解析 → 技术要点提取 → AI关键词生成 → 专利检索 → 初检报告
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            导出报告
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {}}>
            反馈M05
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={onContinue} disabled={!searchComplete || !judgment}>
            进入交底补充
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - 收窄的关键词和材料 */}
        <div className="w-56 border-r flex flex-col bg-white">
          {/* AI关键词 - 标签云形式 */}
          <div className="p-3 border-b">
            <div className="text-xs font-semibold text-[#374151] mb-2">检索关键词</div>
            <div className="flex flex-wrap gap-1">
              {keywords.map((kw, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0.5 bg-white border-[#D1D5DB] text-[#374151] cursor-pointer hover:border-[#DC2626] hover:bg-[#FEF2F2] group"
                >
                  {kw}
                  <XCircle 
                    className="h-3 w-3 ml-0.5 text-[#9CA3AF] group-hover:text-[#DC2626]" 
                    onClick={() => handleRemoveKeyword(kw)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* 问AI获取关键词建议 */}
          <div className="p-3 border-b bg-gradient-to-b from-[#EFF6FF] to-white">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
              <span className="text-xs font-semibold text-[#2563EB]">AI关键词助手</span>
            </div>
            <div className="flex gap-1 mb-2">
              <Input 
                placeholder="描述你想检索的技术..." 
                className="h-7 text-xs flex-1"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              />
              <Button 
                size="sm" 
                className="h-7 w-7 p-0 shrink-0"
                onClick={handleAskAI}
                disabled={isAiThinking}
              >
                {isAiThinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] text-[#6B7280]">AI建议关键词：</div>
                <div className="flex flex-wrap gap-1">
                  {aiSuggestions.map((s, i) => (
                    <Badge 
                      key={i}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0.5 bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] cursor-pointer hover:bg-[#DBEAFE]"
                      onClick={() => {
                        handleAddKeyword(s)
                        setAiSuggestions(aiSuggestions.filter(x => x !== s))
                      }}
                    >
                      <Plus className="h-2.5 w-2.5 mr-0.5" />
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 检索范围 */}
          <div className="p-3 border-b">
            <div className="text-xs font-semibold text-[#374151] mb-2">检索范围</div>
            <div className="space-y-1.5">
              {[
                { id: "domestic", label: "国内专利" },
                { id: "foreign", label: "国外专利" },
                { id: "paper", label: "学术论文" },
                { id: "standard", label: "技术标准" }
              ].map((scope) => (
                <div key={scope.id} className="flex items-center gap-1.5">
                  <Checkbox
                    id={scope.id}
                    className="h-3 w-3"
                    checked={selectedScopes.includes(scope.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedScopes([...selectedScopes, scope.id])
                      } else {
                        setSelectedScopes(selectedScopes.filter(s => s !== scope.id))
                      }
                    }}
                  />
                  <Label htmlFor={scope.id} className="text-[11px] text-[#374151]">{scope.label}</Label>
                </div>
              ))}
            </div>
            <Button 
              className="w-full mt-2.5 h-7 text-xs" 
              onClick={handleStartSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  检索中...
                </>
              ) : (
                <>
                  <Search className="h-3 w-3 mr-1" />
                  执行检索
                </>
              )}
            </Button>
          </div>

          {/* 材料列表 - 更紧凑 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-3 py-1.5 border-b bg-[#F3F4F6]">
              <span className="text-[10px] font-medium text-[#6B7280]">已选材料 ({materials.filter(m => m.selected).length}/{materials.length})</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {materials.map((material) => (
                  <div 
                    key={material.id} 
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] cursor-pointer transition ${
                      material.selected 
                        ? "bg-[#EFF6FF] text-[#2563EB]" 
                        : "text-[#6B7280] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <Checkbox checked={material.selected} className="h-3 w-3" />
                    <span className="truncate flex-1">{material.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Center Panel - Search Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-white flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#2563EB]" />
              AI检索结果
            </h2>
            <div className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-1 rounded font-mono">
              (深度学习 OR 机器学习) AND (智能家居 OR 设备控制)
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {searchComplete && (
                <>
                  {/* Search Stats - 更紧凑 */}
                  <div className="grid grid-cols-5 gap-2">
                    <Card className="p-2.5 text-center border-[#E5E7EB]">
                      <div className="text-xl font-bold text-[#2563EB]">{searchResults.totalSearched}</div>
                      <div className="text-[10px] text-[#9CA3AF]">检索文献</div>
                    </Card>
                    <Card className="p-2.5 text-center border-[#E5E7EB]">
                      <div className="text-xl font-bold text-[#2563EB]">{searchResults.relatedPatents}</div>
                      <div className="text-[10px] text-[#9CA3AF]">相关专利</div>
                    </Card>
                    <Card className="p-2.5 text-center border-[#E5E7EB]">
                      <div className="text-xl font-bold text-[#F59E0B]">{searchResults.highRelevance}</div>
                      <div className="text-[10px] text-[#9CA3AF]">高相关度</div>
                    </Card>
                    <Card className="p-2.5 text-center border-[#E5E7EB]">
                      <div className="mb-0.5">{getRiskBadge(searchResults.riskLevel)}</div>
                      <div className="text-[10px] text-[#9CA3AF]">综合风险</div>
                    </Card>
                    <Card className="p-2.5 text-center border-[#E5E7EB]">
                      <div className="text-sm font-semibold text-[#374151]">{searchResults.searchTime}</div>
                      <div className="text-[10px] text-[#9CA3AF]">检索耗时</div>
                    </Card>
                  </div>

                  {/* 新创性风险分析 - 完整显示 */}
                  <Card className="border-[#FDE68A] bg-[#FFFBEB]/30">
                    <CardHeader className="py-2.5 px-4 border-b border-[#FDE68A]/50">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#D97706]">
                        <AlertTriangle className="h-4 w-4" />
                        新创性风险分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-[#FDE68A]/30">
                        {noveltyRisks.map((risk) => (
                          <div key={risk.id} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-[#6B7280]" />
                                <span className="text-sm font-medium text-[#111827]">{risk.feature}</span>
                                {getRiskBadge(risk.risk)}
                              </div>
                              {risk.relatedTechId && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-6 text-[10px] px-2 border-[#D97706] text-[#D97706] hover:bg-[#FFFBEB]"
                                  onClick={() => {
                                    const tech = relatedTech.find(t => t.id === risk.relatedTechId)
                                    if (tech) handleViewTechDetail(tech)
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  查看对比文件
                                </Button>
                              )}
                            </div>
                            <div className="text-xs text-[#6B7280] mb-2 pl-6">{risk.reason}</div>
                            <div className="text-xs bg-[#EFF6FF] text-[#2563EB] px-3 py-2 rounded-lg ml-6 border border-[#BFDBFE]">
                              <span className="font-medium">建议：</span>{risk.suggestion}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Related Tech List - 紧凑表格形式 */}
                  <Card className="border-[#E5E7EB]">
                    <CardHeader className="py-2.5 px-4 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">相关现有技术 ({relatedTech.length})</CardTitle>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          重新检索
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* 表头 */}
                      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#F9FAFB] text-[10px] font-medium text-[#6B7280] border-b">
                        <div className="col-span-2">专利号</div>
                        <div className="col-span-4">名称</div>
                        <div className="col-span-2">申请人</div>
                        <div className="col-span-1 text-center">相似度</div>
                        <div className="col-span-1 text-center">风险</div>
                        <div className="col-span-2 text-center">操作</div>
                      </div>
                      {/* 数据行 */}
                      <div className="divide-y divide-[#F3F4F6]">
                        {relatedTech.map((tech) => (
                          <div 
                            key={tech.id} 
                            className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-[#F9FAFB] transition text-xs"
                          >
                            <div className="col-span-2 font-mono text-[10px] text-[#6B7280]">{tech.title}</div>
                            <div className="col-span-4">
                              <div className="text-[#111827] truncate">{tech.name}</div>
                              <div className="text-[10px] text-[#9CA3AF]">{tech.date}</div>
                            </div>
                            <div className="col-span-2 text-[#6B7280] truncate">{tech.applicant}</div>
                            <div className="col-span-1 text-center">
                              <span className={`font-semibold ${tech.similarity >= 40 ? 'text-[#DC2626]' : tech.similarity >= 30 ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
                                {tech.similarity}%
                              </span>
                            </div>
                            <div className="col-span-1 text-center">
                              {getRiskBadge(tech.riskLevel)}
                            </div>
                            <div className="col-span-2 text-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 text-[10px] px-2"
                                onClick={() => handleViewTechDetail(tech)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                详情
                                {tech.riskFeature && (
                                  <Badge className="ml-1 text-[8px] px-1 py-0 bg-[#DC2626] text-white">风险</Badge>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {isSearching && (
                <Card className="p-8 border-[#E5E7EB]">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#2563EB] mb-4" />
                    <div className="text-base font-medium mb-2 text-[#111827]">AI正在检索中...</div>
                    <Progress value={65} className="w-64 h-2 mb-2" />
                    <div className="text-xs text-[#9CA3AF]">已检索 1024 / 1568 篇文献</div>
                  </div>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Engineer Judgment */}
        <div className="w-72 border-l flex flex-col bg-white">
          <div className="px-4 py-2.5 border-b">
            <h2 className="text-sm font-semibold text-[#111827]">工程师判断</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              <Card className="border-[#E5E7EB]">
                <CardHeader className="py-2.5 px-4 border-b">
                  <CardTitle className="text-xs font-semibold">初步判断</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <RadioGroup value={judgment} onValueChange={setJudgment}>
                    <div className="space-y-2">
                      <div className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition ${judgment === 'applicable' ? 'border-[#16A34A] bg-[#F0FDF4]' : 'hover:bg-[#F9FAFB]'}`}>
                        <RadioGroupItem value="applicable" id="applicable" />
                        <Label htmlFor="applicable" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-[#16A34A]" />
                            <span className="text-sm font-medium">可申报</span>
                          </div>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5">技术方案具有新创性</p>
                        </Label>
                      </div>
                      <div className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition ${judgment === 'supplement' ? 'border-[#D97706] bg-[#FFFBEB]' : 'hover:bg-[#F9FAFB]'}`}>
                        <RadioGroupItem value="supplement" id="supplement" />
                        <Label htmlFor="supplement" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-[#D97706]" />
                            <span className="text-sm font-medium">需补充</span>
                          </div>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5">需补充材料或技术区别</p>
                        </Label>
                      </div>
                      <div className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition ${judgment === 'not-recommended' ? 'border-[#DC2626] bg-[#FEF2F2]' : 'hover:bg-[#F9FAFB]'}`}>
                        <RadioGroupItem value="not-recommended" id="not-recommended" />
                        <Label htmlFor="not-recommended" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-1.5">
                            <XCircle className="h-4 w-4 text-[#DC2626]" />
                            <span className="text-sm font-medium">不建议</span>
                          </div>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5">新创性风险过高</p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {(judgment === "supplement" || judgment === "not-recommended") && (
                <Card className="border-[#E5E7EB]">
                  <CardHeader className="py-2 px-4 border-b">
                    <CardTitle className="text-xs font-semibold">
                      {judgment === "supplement" ? "补充说明" : "不建议原因"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <Textarea 
                      placeholder={judgment === "supplement" ? "请说明需要补充的内容..." : "请说明不建议申报的原因..."}
                      className="text-xs min-h-[80px] resize-none"
                    />
                  </CardContent>
                </Card>
              )}

              {judgment === "applicable" && (
                <Card className="border-[#BBF7D0] bg-[#F0FDF4]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-[#16A34A]">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">判断完成，可进入下一步</span>
                    </div>
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
