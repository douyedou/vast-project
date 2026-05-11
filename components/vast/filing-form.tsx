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
import { ArrowLeft, Upload, Calculator, FileCheck } from "lucide-react"

interface FilingFormProps {
  onBack: () => void
}

export function FilingForm({ onBack }: FilingFormProps) {
  const [formData, setFormData] = useState({
    patentName: "",
    clientName: "",
    applicantName: "",
    patentType: "",
    applicationMethod: "",
    techField: "",
    plannedDate: "",
  })

  // 模拟周期计算
  const calculateCycle = () => {
    if (!formData.plannedDate || !formData.patentType) return null

    const baseDate = new Date(formData.plannedDate)
    const cycles: { stage: string; date: string; days: number }[] = []

    if (formData.patentType === "invention") {
      cycles.push(
        { stage: "交底完成", date: formatDate(addDays(baseDate, -30)), days: 30 },
        { stage: "初稿完成", date: formatDate(addDays(baseDate, -20)), days: 10 },
        { stage: "定稿确认", date: formatDate(addDays(baseDate, -10)), days: 10 },
        { stage: "提交受理", date: formatDate(baseDate), days: 10 }
      )
      if (formData.applicationMethod === "pre-exam") {
        cycles.push({ stage: "预先审查", date: formatDate(addDays(baseDate, 90)), days: 90 })
      } else if (formData.applicationMethod === "priority") {
        cycles.push({ stage: "优先审查", date: formatDate(addDays(baseDate, 180)), days: 180 })
      } else {
        cycles.push({ stage: "实质审查", date: formatDate(addDays(baseDate, 365)), days: 365 })
      }
    } else {
      cycles.push(
        { stage: "交底完成", date: formatDate(addDays(baseDate, -20)), days: 20 },
        { stage: "初稿完成", date: formatDate(addDays(baseDate, -10)), days: 10 },
        { stage: "定稿确认", date: formatDate(addDays(baseDate, -5)), days: 5 },
        { stage: "提交受理", date: formatDate(baseDate), days: 5 }
      )
    }

    return cycles
  }

  const addDays = (date: Date, days: number) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const cycles = calculateCycle()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">客服立案提交</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            直接提交正式立案，生成案件进入 M06 交底书引擎模型
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">
                案件基础信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">
                    专利名称 <span className="text-[#F5222D]">*</span>
                  </Label>
                  <Input
                    placeholder="请输入专利名称"
                    value={formData.patentName}
                    onChange={(e) =>
                      setFormData({ ...formData, patentName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">
                    客户名称 <span className="text-[#F5222D]">*</span>
                  </Label>
                  <Input
                    placeholder="请输入客户名称"
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData({ ...formData, clientName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">申请人名称</Label>
                  <Input
                    placeholder="请输入申请人名称（可选）"
                    value={formData.applicantName}
                    onChange={(e) =>
                      setFormData({ ...formData, applicantName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">
                    技术领域 <span className="text-[#F5222D]">*</span>
                  </Label>
                  <Select
                    value={formData.techField}
                    onValueChange={(value) =>
                      setFormData({ ...formData, techField: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择技术领域" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">电子信息</SelectItem>
                      <SelectItem value="mechanical">机械工程</SelectItem>
                      <SelectItem value="chemical">化学化工</SelectItem>
                      <SelectItem value="biotech">生物技术</SelectItem>
                      <SelectItem value="software">软件与计算机</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patent Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">
                专利类型与申请方式
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">
                  专利类型 <span className="text-[#F5222D]">*</span>
                </Label>
                <RadioGroup
                  value={formData.patentType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, patentType: value, applicationMethod: "" })
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="invention" id="invention" />
                    <Label htmlFor="invention" className="font-normal cursor-pointer">
                      发明专利
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="utility" id="utility" />
                    <Label htmlFor="utility" className="font-normal cursor-pointer">
                      实用新型
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {formData.patentType === "invention" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1F2937]">
                    发明申请方式 <span className="text-[#F5222D]">*</span>
                  </Label>
                  <Select
                    value={formData.applicationMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, applicationMethod: value })
                    }
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="请选择申请方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre-exam">预先审查</SelectItem>
                      <SelectItem value="priority">优先审查</SelectItem>
                      <SelectItem value="normal">普通申请</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time & Cycle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">
                计划受理时间与周期计算
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">
                  计划受理时间 <span className="text-[#F5222D]">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.plannedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, plannedDate: e.target.value })
                  }
                  className="w-64"
                />
              </div>
              {cycles && (
                <div className="p-4 bg-[#F5F7FA] rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-[#2F80ED]" />
                    <span className="text-sm font-medium text-[#111827]">周期节点计算</span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {cycles.map((cycle, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white rounded-lg border border-[#E5EAF2] text-center"
                      >
                        <p className="text-xs text-[#9CA3AF]">{cycle.stage}</p>
                        <p className="text-sm font-mono text-[#1F2937] mt-1">{cycle.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">
                交底材料上传
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-[#E5EAF2] rounded-lg p-8 text-center hover:border-[#2F80ED] transition-colors cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-[#9CA3AF]" />
                <p className="text-sm text-[#6B7280] mt-3">点击或拖拽文件到此处上传</p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  支持 PDF、Word、图片、语音、视频等多种格式
                </p>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-2">
                * 允许提交但如材料为空则标记「材料不足」
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary & Submit */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">
                立案信息确认
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">专利名称</span>
                <span className="text-[#1F2937] truncate max-w-32">
                  {formData.patentName || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">客户名称</span>
                <span className="text-[#1F2937] truncate max-w-32">
                  {formData.clientName || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">专利类型</span>
                <span className="text-[#1F2937]">
                  {formData.patentType === "invention"
                    ? "发明专利"
                    : formData.patentType === "utility"
                    ? "实用新型"
                    : "-"}
                </span>
              </div>
              {formData.patentType === "invention" && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">申请方式</span>
                  <span className="text-[#1F2937]">
                    {formData.applicationMethod === "pre-exam"
                      ? "预先审查"
                      : formData.applicationMethod === "priority"
                      ? "优先审查"
                      : formData.applicationMethod === "normal"
                      ? "普通申请"
                      : "-"}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">技术领域</span>
                <span className="text-[#1F2937]">
                  {formData.techField === "electronics"
                    ? "电子信息"
                    : formData.techField === "mechanical"
                    ? "机械工程"
                    : formData.techField === "chemical"
                    ? "化学化工"
                    : formData.techField === "biotech"
                    ? "生物技术"
                    : formData.techField === "software"
                    ? "软件与计算机"
                    : formData.techField === "other"
                    ? "其他"
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">计划受理时间</span>
                <span className="text-[#1F2937] font-mono">
                  {formData.plannedDate || "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">已上传材料</span>
                <span className="text-[#1F2937]">0 个文件</span>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-[#EAF4FF] rounded-lg">
            <div className="flex items-start gap-2">
              <FileCheck className="h-5 w-5 text-[#2F80ED] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#2F80ED]">
                <p className="font-medium">立案成功后将：</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• 生成唯一 case_id</li>
                  <li>• 状态变为「已立案」</li>
                  <li>• 自动进入 M06 待建模队列</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white"
              disabled={
                !formData.patentName ||
                !formData.clientName ||
                !formData.patentType ||
                !formData.techField ||
                !formData.plannedDate ||
                (formData.patentType === "invention" && !formData.applicationMethod)
              }
            >
              <FileCheck className="h-4 w-4 mr-2" />
              提交立案
            </Button>
            <Button variant="outline" className="w-full" onClick={onBack}>
              取消
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
