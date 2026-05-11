"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Save,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Link,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface FactStructuringProps {
  onBack?: () => void
  onNext?: () => void
}

interface StructureNode {
  id: string
  type: string
  content: string
  sourceParaId: string
  isCore: boolean
  status: "draft" | "confirmed"
}

export function FactStructuring({ onBack, onNext }: FactStructuringProps) {
  const [activeType, setActiveType] = useState("technical-problem")
  const [saving, setSaving] = useState(false)

  const nodeTypes = [
    { id: "technical-problem", label: "技术问题节点", count: 3, color: "bg-red-100 text-red-700" },
    { id: "technical-background", label: "技术背景节点", count: 4, color: "bg-gray-100 text-gray-700" },
    { id: "technical-solution", label: "技术方案节点", count: 8, color: "bg-blue-100 text-blue-700" },
    { id: "technical-effect", label: "技术效果节点", count: 5, color: "bg-green-100 text-green-700" },
    { id: "key-protection", label: "关键保护点节点", count: 6, color: "bg-purple-100 text-purple-700" },
    { id: "alternative", label: "替代方案节点", count: 3, color: "bg-orange-100 text-orange-700" }
  ]

  const nodesData: Record<string, StructureNode[]> = {
    "technical-problem": [
      { id: "tp-1", type: "technical-problem", content: "设备响应延迟高，用户体验差", sourceParaId: "P1-S2", isCore: true, status: "confirmed" },
      { id: "tp-2", type: "technical-problem", content: "多设备联动控制复杂，配置繁琐", sourceParaId: "P1-S3", isCore: true, status: "confirmed" },
      { id: "tp-3", type: "technical-problem", content: "语音识别准确率低，误触发频繁", sourceParaId: "P1-S4", isCore: false, status: "draft" }
    ],
    "technical-background": [
      { id: "tb-1", type: "technical-background", content: "智能家居作为物联网技术的重要应用场景", sourceParaId: "P2-S1", isCore: false, status: "confirmed" },
      { id: "tb-2", type: "technical-background", content: "传统控制方式包括手机APP、物理按键、红外遥控、简单语音", sourceParaId: "P2-S2", isCore: false, status: "confirmed" },
      { id: "tb-3", type: "technical-background", content: "现有控制方式无法满足便捷性和智能化需求", sourceParaId: "P2-S3", isCore: false, status: "draft" },
      { id: "tb-4", type: "technical-background", content: "深度学习技术在语音识别领域取得突破", sourceParaId: "P2-S4", isCore: false, status: "draft" }
    ],
    "technical-solution": [
      { id: "ts-1", type: "technical-solution", content: "基于深度学习的语音识别模块", sourceParaId: "P5-S1", isCore: true, status: "confirmed" },
      { id: "ts-2", type: "technical-solution", content: "多设备联动控制引擎", sourceParaId: "P5-S2", isCore: true, status: "confirmed" },
      { id: "ts-3", type: "technical-solution", content: "用户行为预测算法", sourceParaId: "P5-S3", isCore: true, status: "draft" },
      { id: "ts-4", type: "technical-solution", content: "场景自动化配置模块", sourceParaId: "P5-S4", isCore: false, status: "draft" },
      { id: "ts-5", type: "technical-solution", content: "设备状态实时同步机制", sourceParaId: "P5-S5", isCore: false, status: "draft" },
      { id: "ts-6", type: "technical-solution", content: "语音指令解析器", sourceParaId: "P5-S6", isCore: false, status: "draft" },
      { id: "ts-7", type: "technical-solution", content: "智能推荐引擎", sourceParaId: "P5-S7", isCore: false, status: "draft" },
      { id: "ts-8", type: "technical-solution", content: "异常检测与告警模块", sourceParaId: "P5-S8", isCore: false, status: "draft" }
    ],
    "technical-effect": [
      { id: "te-1", type: "technical-effect", content: "响应延迟降低至200ms以内", sourceParaId: "P7-S1", isCore: true, status: "confirmed" },
      { id: "te-2", type: "technical-effect", content: "语音识别准确率提升至98%", sourceParaId: "P7-S2", isCore: true, status: "confirmed" },
      { id: "te-3", type: "technical-effect", content: "设备联动配置时间减少80%", sourceParaId: "P7-S3", isCore: false, status: "draft" },
      { id: "te-4", type: "technical-effect", content: "用户操作步骤减少60%", sourceParaId: "P7-S4", isCore: false, status: "draft" },
      { id: "te-5", type: "technical-effect", content: "误触发率降低至0.5%以下", sourceParaId: "P7-S5", isCore: false, status: "draft" }
    ],
    "key-protection": [
      { id: "kp-1", type: "key-protection", content: "深度学习语音识别模型结构", sourceParaId: "P6-S1", isCore: true, status: "confirmed" },
      { id: "kp-2", type: "key-protection", content: "多设备联动控制策略", sourceParaId: "P6-S2", isCore: true, status: "confirmed" },
      { id: "kp-3", type: "key-protection", content: "用户行为预测算法", sourceParaId: "P6-S3", isCore: true, status: "draft" },
      { id: "kp-4", type: "key-protection", content: "场景自动化配置方法", sourceParaId: "P6-S4", isCore: false, status: "draft" },
      { id: "kp-5", type: "key-protection", content: "语音指令解析逻辑", sourceParaId: "P6-S5", isCore: false, status: "draft" },
      { id: "kp-6", type: "key-protection", content: "设备状态同步协议", sourceParaId: "P6-S6", isCore: false, status: "draft" }
    ],
    "alternative": [
      { id: "alt-1", type: "alternative", content: "LSTM替代Transformer的语音识别方案", sourceParaId: "P8-S1", isCore: false, status: "draft" },
      { id: "alt-2", type: "alternative", content: "规则引擎替代机器学习的联动方案", sourceParaId: "P8-S2", isCore: false, status: "draft" },
      { id: "alt-3", type: "alternative", content: "云端处理替代边缘计算方案", sourceParaId: "P8-S3", isCore: false, status: "draft" }
    ]
  }

  const currentNodes = nodesData[activeType] || []

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1500)
  }

  const totalNodes = Object.values(nodesData).flat().length
  const confirmedNodes = Object.values(nodesData).flat().filter(n => n.status === "confirmed").length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">交底事实结构化</h1>
            <p className="text-sm text-muted-foreground">将完整交底书内容拆分为可计算、可校验的结构化数据</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            AI结构化
          </Button>
          <Button onClick={onNext}>
            结构化确认
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
        <span className="text-sm">结构化进度</span>
        <span className="text-sm text-muted-foreground">
          已确认 {confirmedNodes}/{totalNodes} 个节点
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Node Type Nav */}
        <div className="w-56 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">节点类型</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {nodeTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors ${
                    activeType === type.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span>{type.label}</span>
                  <Badge variant={activeType === type.id ? "secondary" : "outline"} className="text-xs">
                    {type.count}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Structure Cards */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">
              {nodeTypes.find(t => t.id === activeType)?.label}
            </h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              新增节点
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {currentNodes.map((node) => (
                <Card key={node.id} className={node.status === "confirmed" ? "border-green-200" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="cursor-move text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Textarea
                              defaultValue={node.content}
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Link className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">来源段落:</span>
                              <Badge variant="outline" className="text-xs">{node.sourceParaId}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox id={`core-${node.id}`} checked={node.isCore} />
                              <label htmlFor={`core-${node.id}`} className="text-xs text-muted-foreground">
                                核心节点
                              </label>
                            </div>
                          </div>
                          <Badge className={node.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                            {node.status === "confirmed" ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />已确认</>
                            ) : (
                              <><AlertCircle className="h-3 w-3 mr-1" />待确认</>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right - Source & AI Suggestions */}
        <div className="w-80 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">原文定位 / AI建议</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Source Paragraph */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">原文段落</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    <Badge variant="outline" className="mb-2">P1-S2</Badge>
                    <p className="text-muted-foreground">
                      在现有的智能家居控制系统中，设备响应延迟高是一个普遍存在的问题。
                      用户发出控制指令后，往往需要等待1-3秒才能看到设备响应，这严重影响了用户体验。
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Suggestions */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    AI结构化建议
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-2 border rounded-lg bg-background">
                    <p className="text-sm mb-2">建议将此技术问题拆分为：</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 网络传输延迟问题</li>
                      <li>• 设备处理延迟问题</li>
                      <li>• 协议转换延迟问题</li>
                    </ul>
                    <Button variant="link" size="sm" className="px-0 mt-2">
                      应用建议
                    </Button>
                  </div>
                  <div className="p-2 border rounded-lg bg-background">
                    <p className="text-sm mb-2">检测到可能遗漏的节点：</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 安全性相关技术问题</li>
                      <li>• 兼容性相关技术问题</li>
                    </ul>
                    <Button variant="link" size="sm" className="px-0 mt-2">
                      添加节点
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Node Statistics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">节点统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {nodeTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{type.label}</span>
                        <Badge className={type.color}>{type.count}</Badge>
                      </div>
                    ))}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>总计</span>
                        <span>{totalNodes} 个节点</span>
                      </div>
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
