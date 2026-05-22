"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { applySectionValue, getSectionValue } from "@/components/vast/m06/m06-page-utils"
import { M06_SECTION_DEFS, M06SectionKey } from "@/lib/m06"
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
  caseId?: string | null
  onBack?: () => void
  onNext?: () => void
}

const sections = [
  { id: "technicalProblem", label: "技术问题", required: true },
  { id: "backgroundTechnology", label: "技术背景", required: true },
  { id: "technicalSolution", label: "技术方案", required: true },
  { id: "embodiments", label: "实施方式", required: true },
  { id: "beneficialEffects", label: "有益效果", required: true },
  { id: "drawings", label: "附图说明", required: false },
]

export function DisclosureSupplement({ caseId, onBack, onNext }: DisclosureSupplementProps) {
  const [activeSection, setActiveSection] = useState("technicalProblem")
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<{ name: string; type: string; text: string } | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const { activeCaseId, content, saveContent, runAction, reload, saving, runningAction } = useM06Document(caseId, "FINAL_DISCLOSURE")

  const sourceMaterials = content?.sourceMaterials?.length
    ? content.sourceMaterials.map((m) => ({ name: m.name, type: m.type === "image" ? "图片" : m.type === "file" ? "文件" : "文本", text: m.summary || m.text || "暂无解析内容" }))
    : []

  useEffect(() => {
    if (!content) return
    setEditedContent((prev) => {
      const next = { ...prev }
      for (const section of sections) {
        if (next[section.id] === undefined) {
          next[section.id] = getSectionValue(content, section.id)
        }
      }
      return next
    })
  }, [content])

  const getSectionStatus = (section: typeof sections[number]) => {
    const val = editedContent[section.id] ?? content?.sections[section.id as M06SectionKey] ?? ""
    return val.trim() ? "completed" : "empty"
  }

  const completedCount = sections.filter((s) => getSectionStatus(s) === "completed").length
  const completedRequired = sections.filter((s) => s.required && getSectionStatus(s) === "completed").length
  const totalRequired = sections.filter((s) => s.required).length

  const handleSave = async () => {
    if (!content) return
    let next = content
    for (const [sectionId, value] of Object.entries(editedContent)) {
      next = applySectionValue(next, sectionId, value)
    }
    await saveContent(next)
  }

  const handleGenerateSection = async () => {
    const section = sections.find((s) => s.id === activeSection)
    if (!section) return
    const result = await runAction("supplement", { section: section.id })
    if (result?.suggestion) {
      setEditedContent((prev) => ({ ...prev, [activeSection]: result.suggestion }))
    }
  }

  const handleUploadFile = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("vast_token") : null
      const form = new FormData()
      form.append("file", file)
      form.append("materialType", file.type.startsWith("image/") ? "image" : "file")
      if (activeCaseId || caseId) form.append("caseId", activeCaseId || caseId || "")
      form.append("targetSection", activeSection)

      const response = await fetch("/api/m06/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      })
      const payload = await response.json()
      if (payload.code !== 200) throw new Error(payload.message || "上传资料失败")

      const parsedText = payload.data?.material?.text || payload.data?.text || ""
      if (parsedText) {
        setEditedContent((prev) => ({ ...prev, [activeSection]: [prev[activeSection], parsedText].filter(Boolean).join("\n\n") }))
      }
      await reload()
    } finally {
      setUploading(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ""
    }
  }

  const currentContent = editedContent[activeSection] ?? content?.sections[activeSection as M06SectionKey] ?? ""
  const currentAiSuggestion = content?.aiResults.supplement?.section === activeSection
    ? content.aiResults.supplement.suggestion
    : undefined
  const sectionDef = M06_SECTION_DEFS.find((s) => s.key === activeSection)
  const currentActiveSection = sections.find((s) => s.id === activeSection)!

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={3} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-lg font-semibold">完整交底书生成</h1>
            <p className="text-sm text-muted-foreground">填写各章节内容，或使用AI进行补充</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <FileText className="h-3 w-3 mr-1" />正常模式
          </Badge>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? "保存中..." : "保存"}
          </Button>
          <input ref={uploadInputRef} type="file" className="hidden" accept=".txt,.md,.doc,.docx,.pdf,.png,.jpg,.jpeg,.webp"
            onChange={(event) => handleUploadFile(event.target.files?.[0])} />
          <Button variant="outline" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />{uploading ? "上传中..." : "上传资料"}
          </Button>
          <Button variant="outline" onClick={() => runAction("validate")} disabled={Boolean(runningAction)}>完整性预检查</Button>
          <Button onClick={onNext}>进入二次检索<ChevronRight className="h-4 w-4 ml-2" /></Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">完成进度</span>
          <span className="text-sm text-muted-foreground">必填项 {completedRequired}/{totalRequired}，总计 {completedCount}/{sections.length}</span>
        </div>
        <Progress value={totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">章节目录</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sections.map((section) => (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${activeSection === section.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {getSectionStatus(section) === "completed" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                  <span className="flex-1">{section.label}</span>
                  {section.required && <span className={`text-xs ${activeSection === section.id ? "text-primary-foreground/70" : "text-red-500"}`}>*</span>}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">
              {currentActiveSection.label}
              {currentActiveSection.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleGenerateSection} disabled={Boolean(runningAction)}>
                <Sparkles className="h-4 w-4 mr-1" />{runningAction === "supplement" ? "生成中..." : "AI生成建议"}
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {currentContent ? (
              <Textarea value={currentContent} onChange={(e) => setEditedContent((prev) => ({ ...prev, [activeSection]: e.target.value }))}
                className="min-h-[400px] font-mono text-sm" placeholder={sectionDef?.placeholder || "请输入内容..."} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">该章节尚未填写内容</p>
                <div className="max-w-md space-y-2">
                  {sectionDef && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{sectionDef.placeholder}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={handleGenerateSection} disabled={Boolean(runningAction)}>
                    <Sparkles className="h-4 w-4 mr-2" />{runningAction === "supplement" ? "生成中..." : "AI自动生成"}
                  </Button>
                  <Button onClick={() => setEditedContent((prev) => ({ ...prev, [activeSection]: "\n" }))}>
                    <Plus className="h-4 w-4 mr-2" />手动填写
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "drawings" && (
              <div className="mt-4">
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleUploadFile(e.dataTransfer.files?.[0]) }}>
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">拖拽文件到此处或点击上传</p>
                    <p className="text-xs text-muted-foreground">支持 PDF、PNG、JPG、DWG 格式</p>
                    <Button variant="outline" className="mt-4" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
                      {uploading ? "上传中..." : "选择文件"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">辅助面板</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* AI Suggestion */}
              {currentAiSuggestion && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-blue-500" />AI建议</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{currentAiSuggestion}</p>
                    <Button variant="link" size="sm" className="px-0 mt-2"
                      onClick={() => setEditedContent((prev) => ({ ...prev, [activeSection]: currentAiSuggestion || "" }))}>
                      应用建议
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Section Hint */}
              {sectionDef && !currentContent && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 text-yellow-500" />填写提示</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{sectionDef.placeholder}</p>
                    {sectionDef.minLength > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">建议至少 {sectionDef.minLength} 字</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Source Materials */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />来源材料</CardTitle>
                </CardHeader>
                <CardContent>
                  {sourceMaterials.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无来源材料，请上传文件</p>
                  ) : (
                    <div className="space-y-2">
                      {sourceMaterials.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{m.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setSelectedMaterial(m)} title="查看内容">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {selectedMaterial && (
                        <div className="rounded-lg border bg-background p-3 text-sm">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{selectedMaterial.name}</div>
                              <div className="text-xs text-muted-foreground">{selectedMaterial.type}</div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedMaterial(null)}>关闭</Button>
                          </div>
                          <div className="max-h-40 overflow-auto whitespace-pre-wrap break-words leading-6 text-muted-foreground">{selectedMaterial.text}</div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
