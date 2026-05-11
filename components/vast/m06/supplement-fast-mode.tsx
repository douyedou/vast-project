"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
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
} from "lucide-react"

interface SupplementFastModeProps {
  onBack?: () => void
  onNext?: () => void
}

const sections = [
  { id: "technical-problem", label: "技术问题", status: "completed", required: true },
  { id: "technical-background", label: "技术背景", status: "completed", required: true },
  { id: "existing-defects", label: "现有技术缺点", status: "completed", required: true },
  { id: "invention-purpose", label: "发明目的", status: "ai-ready", required: true },
  { id: "technical-solution", label: "技术方案", status: "ai-ready", required: true },
  { id: "key-points", label: "关键点和欲保护点", status: "empty", required: true },
  { id: "beneficial-effects", label: "有益效果", status: "empty", required: true },
  { id: "actual-product", label: "实际产品", status: "empty", required: false },
  { id: "drawings", label: "图纸材料", status: "empty", required: false },
  { id: "alternatives", label: "替代方案", status: "empty", required: false },
]

const aiSuggestions: Record<string, { suggestion: string; source: string; risks?: string[] }> = {
  "technical-problem": {
    suggestion: "在现有的智能家居控制系统中，存在以下技术问题：\n\n1. 设备响应延迟高（平均>2秒），用户体验差\n2. 多设备联动控制复杂，配置繁琐，需要多次操作\n3. 语音识别准确率低（<85%），误触发频繁\n4. 缺乏用户行为学习能力，无法提供个性化服务",
    source: "基于原始交底书第2章提取，结合初检关键词扩展",
    risks: ["建议补充具体延迟数据来源"],
  },
  "invention-purpose": {
    suggestion: "本发明的目的在于提供一种基于深度学习的智能家居控制系统及方法，以解决现有技术中存在的响应延迟高、联动控制复杂、语音识别准确率低等问题，实现快速响应、简化操作、高准确率识别和个性化服务。",
    source: "基于技术问题自动生成，与现有技术缺点对应",
  },
  "technical-solution": {
    suggestion: "本发明提供一种基于深度学习的智能家居控制系统，包括：\n\n1. 语音采集模块：用于采集用户语音指令\n2. 深度学习处理模块：采用LSTM神经网络进行语音识别和意图理解\n3. 设备控制模块：根据识别结果生成控制指令\n4. 用户行为学习模块：记录并分析用户习惯，提供个性化服务\n\n所述系统的控制方法包括以下步骤：...",
    source: "基于原始交底书技术方案章节提取，结合附图说明扩展",
    risks: ["CN101234567B 存在相似的LSTM语音识别方案，建议强调区别特征"],
  },
  "key-points": {
    suggestion: "本发明的关键点和欲保护点包括：\n\n【核心保护点】\n1. 基于LSTM的多模态语音识别算法\n2. 自适应用户行为学习机制\n\n【次要保护点】\n3. 设备联动优化调度方法\n4. 低延迟指令传输协议",
    source: "基于技术方案分析生成，结合初检区别特征",
  },
  "beneficial-effects": {
    suggestion: "采用本发明的技术方案，具有以下有益效果：\n\n1. 响应速度提升：设备响应时间从2秒降低至0.5秒以内\n2. 识别准确率提高：语音识别准确率从85%提升至98%\n3. 操作简化：联动控制步骤从5步减少至1步语音指令\n4. 个性化服务：基于用户行为学习，准确率达95%",
    source: "基于发明目的和技术方案自动生成，建议补充实测数据",
  },
}

export function SupplementFastMode({ onBack, onNext }: SupplementFastModeProps) {
  const [activeSection, setActiveSection] = useState("technical-problem")
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "ai-ready":
        return <Sparkles className="h-4 w-4 text-purple-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const completedCount = sections.filter(s => s.status === "completed" || editedContent[s.id]).length
  const totalRequired = sections.filter(s => s.required).length

  const handleAdopt = (sectionId: string) => {
    const suggestion = aiSuggestions[sectionId]?.suggestion
    if (suggestion) {
      setEditedContent(prev => ({ ...prev, [sectionId]: suggestion }))
    }
  }

  const handleRegenerate = () => {
    setGenerating(true)
    setTimeout(() => setGenerating(false), 1500)
  }

  const currentSuggestion = aiSuggestions[activeSection]
  const currentContent = editedContent[activeSection] || ""

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={3} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-700">
              <Zap className="h-3 w-3 mr-1" />
              极速模式
            </Badge>
            <h1 className="text-lg font-semibold">交底书补充</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSaving(true)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            生成全部AI建议
          </Button>
          <Button onClick={onNext}>
            生成完整交底书
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
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
        {/* Left - Section Nav */}
        <div className="w-56 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">交底模块目录</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {editedContent[section.id] ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    getStatusIcon(section.status)
                  )}
                  <span className="flex-1 truncate">{section.label}</span>
                  {section.required && (
                    <span className={`text-xs ${activeSection === section.id ? "text-primary-foreground/70" : "text-red-500"}`}>*</span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - AI Suggestion + Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">
              {sections.find(s => s.id === activeSection)?.label}
              {sections.find(s => s.id === activeSection)?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* AI Suggestion Card */}
            {currentSuggestion && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      AI建议内容
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={generating}>
                        <RefreshCw className={`h-4 w-4 mr-1 ${generating ? "animate-spin" : ""}`} />
                        重新生成
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAdopt(activeSection)}>
                        <Copy className="h-4 w-4 mr-1" />
                        采纳建议
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-3 text-sm whitespace-pre-wrap border">
                    {currentSuggestion.suggestion}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Final Content Editor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">最终内容（可编辑）</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={currentContent}
                  onChange={(e) => setEditedContent(prev => ({ ...prev, [activeSection]: e.target.value }))}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="点击「采纳建议」或手动输入内容..."
                />
                <div className="flex justify-end mt-3">
                  <Button size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    保存模块
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right - Source & Risks */}
        <div className="w-72 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">依据与风险</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Source */}
              {currentSuggestion && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      来源依据
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{currentSuggestion.source}</p>
                  </CardContent>
                </Card>
              )}

              {/* Risks */}
              {currentSuggestion?.risks && currentSuggestion.risks.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      风险提示
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentSuggestion.risks.map((risk, index) => (
                        <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                          <span>•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Keywords from inspection */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">初检关键词</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {["深度学习", "智能家居", "语音识别", "LSTM", "设备控制"].map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
