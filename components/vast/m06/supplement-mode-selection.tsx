"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import {
  ArrowLeft,
  Zap,
  FileText,
  Crown,
  Brain,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"

interface SupplementModeSelectionProps {
  onBack?: () => void
  onSelectMode?: (mode: "fast" | "normal" | "expert") => void
  aiInspectionComplete?: boolean
}

const modes = [
  {
    id: "fast" as const,
    label: "极速模式",
    icon: Zap,
    color: "bg-purple-100 text-purple-600",
    borderColor: "border-purple-200 hover:border-purple-400",
    description: "AI按模块提供补充建议，一键采纳",
    features: [
      "AI自动生成各模块建议内容",
      "一键采纳或修改AI建议",
      "快速完成交底书补充",
    ],
    aiLevel: "高",
    timeEstimate: "约15分钟",
    suitableFor: "标准案件、时间紧急",
  },
  {
    id: "normal" as const,
    label: "正常模式",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
    borderColor: "border-blue-200 hover:border-blue-400",
    description: "人工手动填写，提供填写规范指引",
    features: [
      "手动逐项填写交底内容",
      "提供填写规范和示例",
      "完整掌控交底书内容",
    ],
    aiLevel: "低",
    timeEstimate: "约30分钟",
    suitableFor: "需要精细控制的案件",
  },
  {
    id: "expert" as const,
    label: "专家模式",
    icon: Crown,
    color: "bg-orange-100 text-orange-600",
    borderColor: "border-orange-200 hover:border-orange-400",
    description: "AI建议 + 现有技术对比 + 保护点提示",
    features: [
      "AI补充建议 + 实时对比分析",
      "现有技术风险实时提示",
      "区别特征和保护点建议",
      "完整性实时校验",
    ],
    aiLevel: "高",
    timeEstimate: "约20分钟",
    suitableFor: "复杂案件、高质量要求",
  },
]

export function SupplementModeSelection({
  onBack,
  onSelectMode,
  aiInspectionComplete = true,
}: SupplementModeSelectionProps) {
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
            <h1 className="text-lg font-semibold">选择交底书补充模式</h1>
            <p className="text-sm text-muted-foreground">根据案件情况选择合适的补充模式</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* AI初检提示 */}
        {!aiInspectionComplete && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              建议先完成专利初检，以便AI更好地提供补充建议和风险提示。
              <Button variant="link" className="px-1 h-auto text-yellow-800 underline">
                前往初检
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {aiInspectionComplete && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              专利初检已完成，AI将基于初检结果提供更精准的补充建议。
            </AlertDescription>
          </Alert>
        )}

        {/* Mode Cards */}
        <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
          {modes.map((mode) => {
            const Icon = mode.icon
            return (
              <Card
                key={mode.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${mode.borderColor} border-2`}
                onClick={() => onSelectMode?.(mode.id)}
              >
                <CardHeader className="text-center pb-2">
                  <div className={`w-16 h-16 rounded-full ${mode.color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-lg">{mode.label}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-2">
                    {mode.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI参与度</span>
                      <Badge variant="outline">{mode.aiLevel}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">预计时间</span>
                      <span>{mode.timeEstimate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">适用场景</span>
                      <span className="text-right text-xs">{mode.suitableFor}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button className="w-full mt-4" variant={mode.id === "expert" ? "default" : "outline"}>
                    选择{mode.label}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recommendation */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm">
            <Brain className="h-4 w-4 text-purple-500" />
            <span>推荐：</span>
            <span className="font-medium">专家模式</span>
            <span className="text-muted-foreground">- 综合AI建议与专业辅助，平衡效率与质量</span>
          </div>
        </div>
      </div>
    </div>
  )
}
