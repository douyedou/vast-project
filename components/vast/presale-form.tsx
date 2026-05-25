"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, FileText, X, Paperclip, CheckCircle2, Clock, User, Building2, Lightbulb, FolderUp } from "lucide-react"

interface PresaleFormProps {
  onBack: () => void
}

type UploadedFile = { name: string; size: string; type: string; actualFile?: File }

export function PresaleForm({ onBack }: PresaleFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    // 页面加载时自动恢复本地草稿
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem("presale_draft")
      if (draft) {
        try {
          const parsed = JSON.parse(draft)
          return { ...defaultFormData(), ...parsed }
        } catch {
          // ignore parse error
        }
      }
    }
    return defaultFormData()
  })

  function defaultFormData() {
    return {
      clientName: "",
      applicantName: "",
      mainBusiness: "",
      contactPerson: "",
      techField: "",
      consultPurpose: "",
      patentType: "",
      applicationMethod: "",
      hasTimeRequirement: "no",
      expectedDate: "",
      isSigned: "no",
      materialNote: "",
    }
  }

  const [submitting, setSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({
    disclosure: [],
    image: [],
    audio: [],
    video: [],
  })

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleFileSelect = (category: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const newFiles: UploadedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)}MB` : `${(f.size / 1024).toFixed(0)}KB`,
      type: category,
      actualFile: f,
    }))
    setUploadedFiles((prev) => ({
      ...prev,
      [category]: [...prev[category], ...newFiles],
    }))
  }

  const openFilePicker = (category: string, accept: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = true
    input.onchange = (e) => {
      handleFileSelect(category, (e.target as HTMLInputElement).files)
    }
    input.click()
  }

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }))

  // 文件上传逻辑已改为真实文件选择（见 handleFileSelect / openFilePicker）

  const handleSaveDraft = () => {
    localStorage.setItem('presale_draft', JSON.stringify(formData))
    alert('草稿已保存到浏览器本地存储（localStorage），刷新页面或下次访问时会自动恢复）')
  }

  const handleSubmit = async () => {
    // 校验必填字段
    if (!formData.clientName.trim()) {
      alert('请填写客户名称')
      return
    }
    if (!formData.consultPurpose) {
      alert('请选择咨询目的')
      return
    }
    if (!formData.patentType) {
      alert('请选择专利类型')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('vast_token')
      const title = formData.clientName + ' - ' + (formData.consultPurpose === 'product' ? '产品保护' : formData.consultPurpose === 'project' ? '项目申报' : formData.consultPurpose === 'title' ? '职称评定' : '其他咨询')

      // 1. 创建案件
      const caseRes = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          type: formData.patentType,
          description: formData.mainBusiness || formData.materialNote || '',
          priority: 'normal',
        }),
      })
      const caseData = await caseRes.json()
      if (caseData.code !== 200) {
        alert(caseData.message || '创建案件失败')
        setSubmitting(false)
        return
      }

      const caseId = caseData.data.id

      // 2. 上传附件
      const allFiles = [...uploadedFiles.disclosure, ...uploadedFiles.image, ...uploadedFiles.audio, ...uploadedFiles.video]
      for (const file of allFiles) {
        if (file.actualFile) {
          const formDataUpload = new FormData()
          formDataUpload.append('file', file.actualFile)
          await fetch(`/api/cases/${caseId}/files`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formDataUpload,
          })
        }
      }

      alert('咨询提交成功！案件编号：' + caseData.data.case_id)
      localStorage.removeItem('presale_draft')
      onBack()
    } catch (err: any) {
      alert('提交失败：' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const removeFile = (category: string, index: number) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }))
  }

  const totalFiles = Object.values(uploadedFiles).reduce((sum, arr) => sum + arr.length, 0)

  // 计算表单完成度
  const requiredFields = ["clientName", "consultPurpose", "patentType"]
  const filledRequired = requiredFields.filter(f => formData[f as keyof typeof formData]).length
  const progress = Math.round((filledRequired / requiredFields.length) * 100)

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      {/* 顶栏 - 简洁现代 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#E2E8F0] shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[#64748B]" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[#0F172A]">发起咨询</h1>
            <p className="text-sm text-[#64748B]">填写客户信息和技术资料，提交售前咨询申请</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 进度指示 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F1F5F9] rounded-full">
            <div className="w-24 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[#64748B]">{progress}%</span>
          </div>
          <Button variant="outline" size="sm" className="h-9 px-4 border-[#E2E8F0]" onClick={onBack}>
            取消
          </Button>
          <Button variant="outline" size="sm" className="h-9 px-4 border-[#E2E8F0]" onClick={handleSaveDraft} disabled={submitting}>
            保存草稿
          </Button>
          <Button size="sm" className="h-9 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '提交咨询'}
          </Button>
        </div>
      </div>

      {/* 主体内容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="grid grid-cols-3 gap-6">
            
            {/* 左侧两列：表单区域 */}
            <div className="col-span-2 space-y-6">
              
              {/* 第一节：客户信息 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#F8FAFC] to-white border-b border-[#E2E8F0]">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#EFF6FF]">
                    <Building2 className="h-4 w-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#0F172A]">客户与申请人信息</h2>
                    <p className="text-xs text-[#94A3B8]">填写客户基本信息和联系方式</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">
                        客户名称 <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Input
                        placeholder="请输入客户名称"
                        value={formData.clientName}
                        onChange={(e) => update("clientName", e.target.value)}
                        className="h-10 border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">申请人名称</Label>
                      <Input
                        placeholder="可选，默认同客户名称"
                        value={formData.applicantName}
                        onChange={(e) => update("applicantName", e.target.value)}
                        className="h-10 border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">专利初稿确认人</Label>
                      <Input
                        placeholder="请输入确认人姓名"
                        value={formData.contactPerson}
                        onChange={(e) => update("contactPerson", e.target.value)}
                        className="h-10 border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">技术领域</Label>
                      <Select value={formData.techField} onValueChange={(v) => update("techField", v)}>
                        <SelectTrigger className="h-10 border-[#E2E8F0]">
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
                    <div className="space-y-2 col-span-2">
                      <Label className="text-sm font-medium text-[#334155]">主营业务</Label>
                      <Textarea
                        placeholder="简要描述客户主营业务，便于工程师理解技术背景"
                        value={formData.mainBusiness}
                        onChange={(e) => update("mainBusiness", e.target.value)}
                        rows={2}
                        className="resize-none border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 第二节：咨询信息 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#F8FAFC] to-white border-b border-[#E2E8F0]">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#F0FDF4]">
                    <Lightbulb className="h-4 w-4 text-[#16A34A]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#0F172A]">咨询信息</h2>
                    <p className="text-xs text-[#94A3B8]">选择专利类型和申请方式</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">
                        咨询目的 <span className="text-[#EF4444]">*</span>
                      </Label>
                      <Select value={formData.consultPurpose} onValueChange={(v) => update("consultPurpose", v)}>
                        <SelectTrigger className="h-10 border-[#E2E8F0]">
                          <SelectValue placeholder="请选择咨询目的" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">产品保护</SelectItem>
                          <SelectItem value="project">项目申报</SelectItem>
                          <SelectItem value="title">职称评定</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">
                        专利类型 <span className="text-[#EF4444]">*</span>
                      </Label>
                      <RadioGroup
                        value={formData.patentType}
                        onValueChange={(v) => update("patentType", v)}
                        className="flex gap-4 pt-2"
                      >
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                          formData.patentType === "invention" 
                            ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" 
                            : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                        }`}>
                          <RadioGroupItem value="invention" id="invention" className="sr-only" />
                          <span className="text-sm font-medium">发明专利</span>
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                          formData.patentType === "utility" 
                            ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" 
                            : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                        }`}>
                          <RadioGroupItem value="utility" id="utility" className="sr-only" />
                          <span className="text-sm font-medium">实用新型</span>
                        </label>
                      </RadioGroup>
                    </div>

                    {formData.patentType === "invention" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#334155]">申请方式</Label>
                        <Select value={formData.applicationMethod} onValueChange={(v) => update("applicationMethod", v)}>
                          <SelectTrigger className="h-10 border-[#E2E8F0]">
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

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">是否有时间要求</Label>
                      <RadioGroup
                        value={formData.hasTimeRequirement}
                        onValueChange={(v) => update("hasTimeRequirement", v)}
                        className="flex gap-4 pt-2"
                      >
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                          formData.hasTimeRequirement === "yes" 
                            ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" 
                            : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                        }`}>
                          <RadioGroupItem value="yes" className="sr-only" />
                          <span className="text-sm font-medium">是</span>
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                          formData.hasTimeRequirement === "no" 
                            ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" 
                            : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                        }`}>
                          <RadioGroupItem value="no" className="sr-only" />
                          <span className="text-sm font-medium">否</span>
                        </label>
                      </RadioGroup>
                    </div>

                    {formData.hasTimeRequirement === "yes" && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#334155]">期望完成日期</Label>
                        <Input
                          type="date"
                          value={formData.expectedDate}
                          onChange={(e) => update("expectedDate", e.target.value)}
                          className="h-10 border-[#E2E8F0]"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">是否已签单</Label>
                      <RadioGroup
                        value={formData.isSigned}
                        onValueChange={(v) => update("isSigned", v)}
                        className="flex gap-4 pt-2"
                      >
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                          formData.isSigned === "yes" 
                            ? "border-[#16A34A] bg-[#F0FDF4] text-[#16A34A]" 
                            : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                        }`}>
                          <RadioGroupItem value="yes" className="sr-only" />
                          <span className="text-sm font-medium">已签单</span>
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                          formData.isSigned === "no" 
                            ? "border-[#F59E0B] bg-[#FFFBEB] text-[#D97706]" 
                            : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                        }`}>
                          <RadioGroupItem value="no" className="sr-only" />
                          <span className="text-sm font-medium">未签单</span>
                        </label>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>

              {/* 第三节：材料上传 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#F8FAFC] to-white border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FEF3C7]">
                      <FolderUp className="h-4 w-4 text-[#D97706]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#0F172A]">交底材料上传</h2>
                      <p className="text-xs text-[#94A3B8]">上传技术交底书和相关附件</p>
                    </div>
                  </div>
                  {totalFiles > 0 && (
                    <Badge className="bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]">
                      已上传 {totalFiles} 个文件
                    </Badge>
                  )}
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* 交底书 - 必填 */}
                    <div
                      className="group border-2 border-dashed border-[#E2E8F0] rounded-xl p-4 cursor-pointer hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all"
                      onClick={() => openFilePicker("disclosure", ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#F1F5F9] group-hover:bg-[#EFF6FF] transition-colors">
                          <FileText className="h-5 w-5 text-[#64748B] group-hover:text-[#2563EB]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#334155]">
                            交底书 <span className="text-[#EF4444]">*</span>
                          </p>
                          <p className="text-xs text-[#94A3B8]">PDF、Word 格式</p>
                        </div>
                      </div>
                      {uploadedFiles.disclosure.length > 0 ? (
                        <div className="space-y-2">
                          {uploadedFiles.disclosure.map((f, i) => (
                            <div key={i} className="flex items-center justify-between bg-[#F1F5F9] rounded-lg px-3 py-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2 min-w-0">
                                <Paperclip className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                                <span className="text-sm text-[#334155] truncate">{f.name}</span>
                                <span className="text-xs text-[#94A3B8] shrink-0">{f.size}</span>
                              </div>
                              <button className="text-[#94A3B8] hover:text-[#EF4444] transition-colors" onClick={() => removeFile("disclosure", i)}>
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-2 text-sm text-[#94A3B8]">
                          <Upload className="h-4 w-4 mr-2" />
                          点击或拖拽上传
                        </div>
                      )}
                    </div>

                    {/* 图纸/图片 */}
                    <div
                      className="group border-2 border-dashed border-[#E2E8F0] rounded-xl p-4 cursor-pointer hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all"
                      onClick={() => openFilePicker("image", "image/*")}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#F1F5F9] group-hover:bg-[#EFF6FF] transition-colors">
                          <FileText className="h-5 w-5 text-[#64748B] group-hover:text-[#2563EB]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#334155]">图纸 / 图片</p>
                          <p className="text-xs text-[#94A3B8]">JPG、PNG、SVG 格式</p>
                        </div>
                      </div>
                      {uploadedFiles.image.length > 0 ? (
                        <div className="space-y-2">
                          {uploadedFiles.image.map((f, i) => (
                            <div key={i} className="flex items-center justify-between bg-[#F1F5F9] rounded-lg px-3 py-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2 min-w-0">
                                <Paperclip className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                                <span className="text-sm text-[#334155] truncate">{f.name}</span>
                              </div>
                              <button className="text-[#94A3B8] hover:text-[#EF4444]" onClick={() => removeFile("image", i)}>
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-2 text-sm text-[#94A3B8]">
                          <Upload className="h-4 w-4 mr-2" />
                          点击或拖拽上传
                        </div>
                      )}
                    </div>

                    {/* 材料说明 */}
                    <div className="col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-[#334155]">材料说明</Label>
                      <Textarea
                        placeholder="补充说明材料来源或其他注意事项（可选）"
                        value={formData.materialNote}
                        onChange={(e) => update("materialNote", e.target.value)}
                        rows={2}
                        className="resize-none border-[#E2E8F0]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧一列：提示信息 */}
            <div className="space-y-4">
              {/* 提交流程说明 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-4">提交流程</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-bold shrink-0">1</div>
                    <div>
                      <p className="text-sm font-medium text-[#334155]">填写信息</p>
                      <p className="text-xs text-[#94A3B8]">完善客户和咨询信息</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F1F5F9] text-[#64748B] text-xs font-bold shrink-0">2</div>
                    <div>
                      <p className="text-sm font-medium text-[#334155]">上传材料</p>
                      <p className="text-xs text-[#94A3B8]">提交交底书及附件</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F1F5F9] text-[#64748B] text-xs font-bold shrink-0">3</div>
                    <div>
                      <p className="text-sm font-medium text-[#334155]">等待分配</p>
                      <p className="text-xs text-[#94A3B8]">专利经理分配工程师</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F1F5F9] text-[#64748B] text-xs font-bold shrink-0">4</div>
                    <div>
                      <p className="text-sm font-medium text-[#334155]">AI初检</p>
                      <p className="text-xs text-[#94A3B8]">工程师进行初步检索</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 注意事项 */}
              <div className="bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] rounded-2xl border border-[#BFDBFE] p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#2563EB] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-[#1E40AF] mb-1">提交须知</h4>
                    <p className="text-xs text-[#3B82F6] leading-relaxed">
                      提交后该咨询将进入「待分配」状态，等待专利经理分配工程师进行AI初检。初检完成后结果将同步返回。
                    </p>
                  </div>
                </div>
              </div>

              {/* 预计时间 */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-[#64748B]" />
                  <span className="text-sm font-medium text-[#334155]">预计处理时间</span>
                </div>
                <p className="text-2xl font-bold text-[#0F172A]">1-2 <span className="text-base font-normal text-[#64748B]">工作日</span></p>
                <p className="text-xs text-[#94A3B8] mt-1">完成初检并返回结果</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
