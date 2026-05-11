"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  FileCheck,
  BookOpen,
  Image,
  Send,
  Download,
  Eye,
} from "lucide-react"

interface SubmitM08PageProps {
  onBack: () => void
  onNavigate?: (page: string) => void
}

interface CheckItem {
  id: string
  label: string
  required: boolean
  passed: boolean
  description?: string
}

const checkItems: CheckItem[] = [
  { id: "disclosure", label: "完整交底书可查看", required: true, passed: true },
  { id: "spec", label: "说明书已生成并编辑完成", required: true, passed: true },
  { id: "coverage", label: "说明书覆盖交底", required: true, passed: true, description: "覆盖率 85%" },
  { id: "claims", label: "权利要求书已完成", required: true, passed: true },
  { id: "support", label: "权利要求有说明书支持", required: true, passed: false, description: "权利要求4无支持" },
  { id: "abstract", label: "摘要已完成", required: true, passed: true },
  { id: "drawings", label: "附图说明已完成", required: false, passed: true },
  { id: "similarity", label: "AI相似性低于阈值", required: true, passed: true, description: "12% < 30%" },
  { id: "five-books", label: "五书文件已生成", required: true, passed: true },
  { id: "locked", label: "审核锁定版本已生成", required: true, passed: true, description: "v2.0-locked" },
]

const fileList = [
  { id: "spec", name: "说明书.docx", icon: BookOpen, size: "128KB" },
  { id: "claims", name: "权利要求书.docx", icon: FileCheck, size: "45KB" },
  { id: "abstract", name: "摘要.docx", icon: FileText, size: "8KB" },
  { id: "drawings", name: "附图说明.docx", icon: FileText, size: "12KB" },
  { id: "abstract-drawing", name: "摘要附图.png", icon: Image, size: "256KB" },
]

export function SubmitM08Page({ onBack, onNavigate }: SubmitM08PageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const allPassed = checkItems.filter((i) => i.required).every((i) => i.passed)
  const blockedItems = checkItems.filter((i) => i.required && !i.passed)

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1500)
  }

  if (submitted) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F5F7FA]">
        <Card className="w-[480px]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-2">提交成功</h2>
            <p className="text-sm text-[#6B7280] mb-6">
              已成功创建 M08 审核任务，文档状态已变更为"待审核"
            </p>
            <div className="p-4 rounded-lg bg-[#F9FAFB] mb-6">
              <div className="text-sm text-[#6B7280]">审核任务编号</div>
              <div className="text-lg font-mono font-medium text-[#2F80ED] mt-1">M08-2024-00156</div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack} className="flex-1">
                返回创作工作台
              </Button>
              <Button onClick={() => onNavigate?.("m08-task-list")} className="flex-1 bg-[#2F80ED]">
                前往M08审核
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      {/* 顶部操作栏 */}
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">提交 M08 确认</h1>
            <p className="text-xs text-[#9CA3AF]">智能温控系统发明专利</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            返回修改
          </Button>
          <Button onClick={handleSubmit} disabled={!allPassed || isSubmitting}>
            {isSubmitting ? (
              "提交中..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                确认提交
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* 提交条件检查清单 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">提交条件检查</CardTitle>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600">
                    通过 {checkItems.filter((i) => i.passed).length}
                  </span>
                  <span className="text-[#9CA3AF]">/</span>
                  <span className="text-[#6B7280]">共 {checkItems.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checkItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      item.passed ? "bg-[#F9FAFB]" : "bg-red-50"
                    }`}
                  >
                    {item.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${item.passed ? "text-[#374151]" : "text-red-700"}`}
                        >
                          {item.label}
                        </span>
                        {item.required && (
                          <span className="text-xs text-red-500">*必须</span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-xs text-[#9CA3AF] mt-0.5">{item.description}</div>
                      )}
                    </div>
                    {!item.passed && item.required && (
                      <Button variant="outline" size="sm" className="text-xs">
                        去处理
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 五书文件确认 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">五书文件确认</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {fileList.map((file) => {
                  const Icon = file.icon
                  return (
                    <div
                      key={file.id}
                      className="p-3 rounded-lg border border-border hover:border-[#2F80ED] cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center mb-2">
                        <Icon className="h-5 w-5 text-[#6B7280]" />
                      </div>
                      <div className="text-sm font-medium text-[#111827] truncate">{file.name}</div>
                      <div className="text-xs text-[#9CA3AF] mt-0.5">{file.size}</div>
                      <div className="flex gap-1 mt-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 阻断提示 */}
          {!allPassed && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-red-800">
                      存在 {blockedItems.length} 项未通过的必须条件
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {blockedItems.map((i) => i.label).join("、")}
                    </div>
                    <div className="text-xs text-red-600 mt-2">请处理后才能提交 M08 审核</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 复核结果确认 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">复核结果确认</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-[#F9FAFB]">
                  <div className="text-2xl font-bold text-[#2F80ED]">85%</div>
                  <div className="text-xs text-[#6B7280] mt-1">交底覆盖率</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#F9FAFB]">
                  <div className="text-2xl font-bold text-orange-600">75%</div>
                  <div className="text-xs text-[#6B7280] mt-1">权利要求支持率</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#F9FAFB]">
                  <div className="text-2xl font-bold text-green-600">8%</div>
                  <div className="text-xs text-[#6B7280] mt-1">查重率</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#F9FAFB]">
                  <div className="text-2xl font-bold text-green-600">12%</div>
                  <div className="text-xs text-[#6B7280] mt-1">AI相似性</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 审核锁定版本确认 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">审核锁定版本确认</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-[#F9FAFB]">
                <div className="w-12 h-12 rounded-lg bg-[#2F80ED] flex items-center justify-center">
                  <FileCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#111827]">v2.0-locked</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">
                    锁定时间：2024-01-15 14:30:00 · 锁定人：张工
                  </div>
                </div>
                <div className="ml-auto">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    预览版本
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
