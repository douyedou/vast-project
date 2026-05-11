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
  AlertCircle,
  CheckCircle,
  Eye,
  Upload,
  Plus,
  Lightbulb
} from "lucide-react"

interface DisclosureSupplementProps {
  onBack?: () => void
  onNext?: () => void
}

export function DisclosureSupplement({ onBack, onNext }: DisclosureSupplementProps) {
  const [activeSection, setActiveSection] = useState("technical-problem")
  const [saving, setSaving] = useState(false)

  const sections = [
    { id: "technical-problem", label: "技术问题", status: "completed", required: true },
    { id: "technical-background", label: "技术背景", status: "completed", required: true },
    { id: "existing-defects", label: "现有技术缺点", status: "completed", required: true },
    { id: "invention-purpose", label: "发明目的", status: "in-progress", required: true },
    { id: "technical-solution", label: "技术方案", status: "empty", required: true },
    { id: "key-points", label: "关键点和欲保护点", status: "empty", required: true },
    { id: "beneficial-effects", label: "有益效果", status: "empty", required: true },
    { id: "actual-product", label: "实际产品", status: "empty", required: false },
    { id: "drawings", label: "图纸材料", status: "empty", required: false }
  ]

  const sectionContents: Record<string, { content: string; aiSuggestion?: string; missingTips?: string[] }> = {
    "technical-problem": {
      content: "在现有的智能家居控制系统中，存在以下技术问题：\n\n1. 设备响应延迟高，用户体验差\n2. 多设备联动控制复杂，配置繁琐\n3. 语音识别准确率低，误触发频繁\n4. 缺乏用户行为学习能力，无法提供个性化服务",
      aiSuggestion: "建议补充：具体的延迟数据（如现有系统响应时间>2秒）和误触发率数据，以增强技术问题的说服力。"
    },
    "technical-background": {
      content: "智能家居作为物联网技术的重要应用场景，近年来发展迅速。传统的智能家居控制方式包括：\n\n1. 手机APP控制\n2. 物理按键控制\n3. 红外遥控器控制\n4. 简单语音指令控制\n\n这些控制方式各有局限性，无法满足用户对便捷性和智能化的需求。",
      aiSuggestion: "建议补充：相关现有技术的专利号或文献引用，增强背景技术的完整性。"
    },
    "existing-defects": {
      content: "现有技术存在以下缺点：\n\n1. 手机APP控制需要解锁手机、打开APP，操作步骤多\n2. 物理按键控制无法实现远程操作\n3. 红外遥控器存在方向性限制\n4. 简单语音控制无法理解复杂指令，且识别率受环境噪音影响大",
      aiSuggestion: "建议量化现有技术的具体缺陷指标，如操作步骤数、识别率百分比等。"
    },
    "invention-purpose": {
      content: "本发明的目的在于提供一种基于深度学习的智能家居控制系统，以解决现有技术中存在的响应延迟高、联动控制复杂、语音识别准确率低等问题。",
      aiSuggestion: "发明目的与技术问题对应良好，建议保持简洁明了。"
    },
    "technical-solution": {
      content: "",
      missingTips: ["请详细描述技术方案的具体实现方式", "需要包含系统架构、模块组成、工作流程等内容", "建议结合附图进行说明"]
    },
    "key-points": {
      content: "",
      missingTips: ["请列出本发明的核心创新点", "区分必要技术特征和可选技术特征", "建议按重要性排序"]
    },
    "beneficial-effects": {
      content: "",
      missingTips: ["请描述本发明的技术效果", "建议提供量化数据支撑", "需要与发明目的对应"]
    },
    "actual-product": {
      content: "",
      missingTips: ["如有实际产品或应用场景，请在此描述", "可以提供产品照片或演示视频"]
    },
    "drawings": {
      content: "",
      missingTips: ["请上传系统架构图、流程图等技术附图", "每张附图需要有对应的附图说明"]
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const completedCount = sections.filter(s => s.status === "completed").length
  const totalRequired = sections.filter(s => s.required).length
  const completedRequired = sections.filter(s => s.required && s.status === "completed").length

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }

  const currentSection = sectionContents[activeSection]

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <M06ProgressBar currentStep={3} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">交底书补充</h1>
            <p className="text-sm text-muted-foreground">手动填写交底书内容，提供填写规范指引</p>
          </div>
        </div>
          <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <FileText className="h-3 w-3 mr-1" />
            正常模式
          </Badge>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button variant="outline">
            完整性预检查
          </Button>
          <Button onClick={onNext}>
            生成完整交底书
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">完成进度</span>
          <span className="text-sm text-muted-foreground">
            必填项 {completedRequired}/{totalRequired}，总计 {completedCount}/{sections.length}
          </span>
        </div>
        <Progress value={(completedRequired / totalRequired) * 100} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Section Nav */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">章节目录</h2>
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
                  {getStatusIcon(section.status)}
                  <span className="flex-1">{section.label}</span>
                  {section.required && (
                    <span className={`text-xs ${activeSection === section.id ? "text-primary-foreground/70" : "text-red-500"}`}>*</span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">
              {sections.find(s => s.id === activeSection)?.label}
              {sections.find(s => s.id === activeSection)?.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Sparkles className="h-4 w-4 mr-1" />
                AI生成建议
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {currentSection?.content ? (
              <Textarea
                value={currentSection.content}
                className="min-h-[400px] font-mono text-sm"
                placeholder="请输入内容..."
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">该章节尚未填写内容</p>
                {currentSection?.missingTips && (
                  <div className="max-w-md space-y-2">
                    {currentSection.missingTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-6">
                  <Button variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI自动生成
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    手动填写
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "drawings" && (
              <div className="mt-4">
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">��拽文件到此处或点击上传</p>
                    <p className="text-xs text-muted-foreground">支持 PDF、PNG、JPG、DWG 格式</p>
                    <Button variant="outline" className="mt-4">
                      选择文件
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - AI Suggestions & Materials */}
        <div className="w-80 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">辅助面板</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* AI Suggestion */}
              {currentSection?.aiSuggestion && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      AI建议
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{currentSection.aiSuggestion}</p>
                    <Button variant="link" size="sm" className="px-0 mt-2">
                      应用建议
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Missing Tips */}
              {currentSection?.missingTips && currentSection.missingTips.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      缺失提示
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentSection.missingTips.map((tip, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Original Materials */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    原始材料
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { name: "技术交底书_v1.docx", type: "交底书" },
                      { name: "系统架构图.pdf", type: "图纸" },
                      { name: "功能模块图.png", type: "图片" }
                    ].map((material, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{material.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* M10 Resource Suggestions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    M10资源建议
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-2 border rounded-lg">
                      <div className="text-sm font-medium">智能家居技术术语库</div>
                      <div className="text-xs text-muted-foreground">包含 256 个标准术语</div>
                      <Badge variant="outline" className="mt-1 text-xs">术语规范</Badge>
                    </div>
                    <div className="p-2 border rounded-lg">
                      <div className="text-sm font-medium">IoT设备控制模板</div>
                      <div className="text-xs text-muted-foreground">技术方案撰写参考</div>
                      <Badge variant="outline" className="mt-1 text-xs">写作模板</Badge>
                    </div>
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
