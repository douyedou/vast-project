"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  FileText,
  Image,
  Mic,
  Check,
  AlertCircle,
  Zap,
  Settings,
  Brain,
} from "lucide-react"

interface CreateModelProps {
  onBack: () => void
  onSubmit: () => void
}

const mockSourceInfo = {
  sourceId: "SRC-2024-0125",
  caseId: "CASE-2024-0089",
  clientName: "科技有限公司",
  contactName: "张三",
  title: "基于深度学习的图像识别方法",
  modelType: "已立案",
  submittedAt: "2024-01-10 14:30",
}

const mockMaterials = [
  { id: "1", name: "技术交底书.docx", type: "document", size: "2.5MB", status: "valid" },
  { id: "2", name: "系统架构图.png", type: "image", size: "1.2MB", status: "valid" },
  { id: "3", name: "流程图.pdf", type: "document", size: "890KB", status: "valid" },
  { id: "4", name: "沟通录音.mp3", type: "audio", size: "15.6MB", status: "valid" },
  { id: "5", name: "现有技术对比.xlsx", type: "document", size: "456KB", status: "warning" },
]

const steps = [
  { id: 1, label: "来源信息确认" },
  { id: 2, label: "专利类型确认" },
  { id: 3, label: "材料确认" },
  { id: 4, label: "建模模式选择" },
  { id: 5, label: "创建确认" },
]

export function CreateModel({ onBack, onSubmit }: CreateModelProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [patentType, setPatentType] = useState("invention")
  const [applicationMode, setApplicationMode] = useState("normal")
  const [modelMode, setModelMode] = useState("standard")

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-4 w-4 text-[#8B5CF6]" />
      case "audio":
        return <Mic className="h-4 w-4 text-[#F59E0B]" />
      default:
        return <FileText className="h-4 w-4 text-[#2F80ED]" />
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">来源信息确认</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#6B7280]">来源编号</Label>
                    <Input value={mockSourceInfo.sourceId} disabled className="mt-1 bg-[#F9FAFB]" />
                  </div>
                  <div>
                    <Label className="text-[#6B7280]">案件编号</Label>
                    <Input value={mockSourceInfo.caseId || "-"} disabled className="mt-1 bg-[#F9FAFB]" />
                  </div>
                  <div>
                    <Label className="text-[#6B7280]">客户名称</Label>
                    <Input value={mockSourceInfo.clientName} disabled className="mt-1 bg-[#F9FAFB]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#6B7280]">联系人</Label>
                    <Input value={mockSourceInfo.contactName} disabled className="mt-1 bg-[#F9FAFB]" />
                  </div>
                  <div>
                    <Label className="text-[#6B7280]">技术主题</Label>
                    <Input value={mockSourceInfo.title} disabled className="mt-1 bg-[#F9FAFB]" />
                  </div>
                  <div>
                    <Label className="text-[#6B7280]">模型类型</Label>
                    <div className="mt-1">
                      <span
                        className={`text-sm px-3 py-1 rounded ${
                          mockSourceInfo.modelType === "已立案"
                            ? "bg-[#DCFCE7] text-[#166534]"
                            : "bg-[#DBEAFE] text-[#1E40AF]"
                        }`}
                      >
                        {mockSourceInfo.modelType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">专利类型确认</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-[#374151] font-medium">专利类型</Label>
                <RadioGroup
                  value={patentType}
                  onValueChange={setPatentType}
                  className="mt-3 flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="invention" id="invention" />
                    <Label htmlFor="invention" className="cursor-pointer">发明专利</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="utility" id="utility" />
                    <Label htmlFor="utility" className="cursor-pointer">实用新型</Label>
                  </div>
                </RadioGroup>
              </div>

              {patentType === "invention" && (
                <div>
                  <Label className="text-[#374151] font-medium">发明申请方式</Label>
                  <Select value={applicationMode} onValueChange={setApplicationMode}>
                    <SelectTrigger className="mt-2 w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">普通申请</SelectItem>
                      <SelectItem value="priority">优先审查</SelectItem>
                      <SelectItem value="preliminary">预先审查</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-[#16A34A] mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-[#166534]">专利类型已从来源继承</div>
                    <div className="text-xs text-[#15803D] mt-1">
                      系统已自动识别来源材料中的专利类型，您可以根据需要进行调整
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">材料确认</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(material.type)}
                      <div>
                        <div className="text-sm font-medium text-[#111827]">{material.name}</div>
                        <div className="text-xs text-[#6B7280]">{material.size}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {material.status === "valid" ? (
                        <span className="flex items-center gap-1 text-xs text-[#16A34A]">
                          <Check className="h-3 w-3" />
                          已验证
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[#F59E0B]">
                          <AlertCircle className="h-3 w-3" />
                          格式待确认
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-[#D97706] mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-[#92400E]">材料提示</div>
                    <div className="text-xs text-[#A16207] mt-1">
                      发现 1 份材料格式需要确认，建模过程中可能需要手动处理
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">建模模式选择</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={modelMode}
                onValueChange={setModelMode}
                className="space-y-4"
              >
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    modelMode === "fast"
                      ? "border-[#2F80ED] bg-[#EAF4FF]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB]"
                  }`}
                  onClick={() => setModelMode("fast")}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="fast" id="fast" />
                    <Zap className="h-5 w-5 text-[#F59E0B]" />
                    <div className="flex-1">
                      <Label htmlFor="fast" className="text-sm font-medium cursor-pointer">
                        极速模式
                      </Label>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        AI 自动完成大部分建模工作，适合材料完整、结构清晰的交底书
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    modelMode === "standard"
                      ? "border-[#2F80ED] bg-[#EAF4FF]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB]"
                  }`}
                  onClick={() => setModelMode("standard")}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="standard" id="standard" />
                    <Settings className="h-5 w-5 text-[#2F80ED]" />
                    <div className="flex-1">
                      <Label htmlFor="standard" className="text-sm font-medium cursor-pointer">
                        标准模式（推荐）
                      </Label>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        AI 辅助 + 人工审核确认，平衡效率与质量
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    modelMode === "expert"
                      ? "border-[#2F80ED] bg-[#EAF4FF]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB]"
                  }`}
                  onClick={() => setModelMode("expert")}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="expert" id="expert" />
                    <Brain className="h-5 w-5 text-[#8B5CF6]" />
                    <div className="flex-1">
                      <Label htmlFor="expert" className="text-sm font-medium cursor-pointer">
                        专家模式
                      </Label>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        完全人工控制，适合复杂技术方案或特殊要求的交底书
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )
      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">创建确认</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F9FAFB] rounded-lg">
                    <div className="text-xs text-[#6B7280]">来源编号</div>
                    <div className="text-sm font-medium text-[#111827] mt-1">{mockSourceInfo.sourceId}</div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-lg">
                    <div className="text-xs text-[#6B7280]">案件编号</div>
                    <div className="text-sm font-medium text-[#111827] mt-1">{mockSourceInfo.caseId}</div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-lg">
                    <div className="text-xs text-[#6B7280]">专利类型</div>
                    <div className="text-sm font-medium text-[#111827] mt-1">
                      {patentType === "invention" ? "发明专利" : "实用新型"}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-lg">
                    <div className="text-xs text-[#6B7280]">申请方式</div>
                    <div className="text-sm font-medium text-[#111827] mt-1">
                      {applicationMode === "normal" ? "普通申请" : applicationMode === "priority" ? "优先审查" : "预先审查"}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-lg">
                    <div className="text-xs text-[#6B7280]">建模模式</div>
                    <div className="text-sm font-medium text-[#111827] mt-1">
                      {modelMode === "fast" ? "极速模式" : modelMode === "standard" ? "标准模式" : "专家模式"}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-lg">
                    <div className="text-xs text-[#6B7280]">材料数量</div>
                    <div className="text-sm font-medium text-[#111827] mt-1">{mockMaterials.length} 份</div>
                  </div>
                </div>

                <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-[#16A34A] mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-[#166534]">准备就绪</div>
                      <div className="text-xs text-[#15803D] mt-1">
                        所有必填项已确认，点击「创建模型」开始建模流程
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 顶部 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">新建交底模型</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">基于 M05 来源创建 M06 交底模型</p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-between px-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > step.id
                    ? "bg-[#10B981] text-white"
                    : currentStep === step.id
                    ? "bg-[#2F80ED] text-white"
                    : "bg-[#E5E7EB] text-[#6B7280]"
                }`}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <div
                className={`text-xs mt-2 ${
                  currentStep >= step.id ? "text-[#374151]" : "text-[#9CA3AF]"
                }`}
              >
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-24 h-0.5 mx-2 ${
                  currentStep > step.id ? "bg-[#10B981]" : "bg-[#E5E7EB]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 步骤内容 */}
      {renderStepContent()}

      {/* 底部按钮 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          上一步
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            取消
          </Button>
          {currentStep < 5 ? (
            <Button
              className="bg-[#2F80ED] hover:bg-[#1E5EFF]"
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            >
              下一步
            </Button>
          ) : (
            <Button className="bg-[#10B981] hover:bg-[#059669]" onClick={onSubmit}>
              创建模型
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
