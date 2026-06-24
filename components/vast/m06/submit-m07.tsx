"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { evaluateM06Completeness } from "@/lib/m06"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  FileText,
  Search,
  Package,
  Shield,
  ChevronRight,
  Loader2,
} from "lucide-react"

interface SubmitM07Props {
  caseId?: string | null
  onBack?: () => void
  onSubmit?: () => void
  onNavigate?: (page: string) => void
}

export function SubmitM07({ caseId, onBack, onSubmit, onNavigate }: SubmitM07Props) {
  const [confirmed, setConfirmed] = useState(false)
  const [remarks, setRemarks] = useState("")
  const { content, submitToM07, saving, error } = useM06Document(caseId, "SUBMIT")
  const validation = content?.aiResults.completeness || (content ? evaluateM06Completeness(content) : null)

  const hasSectionContent = content
    ? Boolean(content.sections.technicalProblem.trim() && content.sections.technicalSolution.trim() && content.sections.beneficialEffects.trim())
    : false
  const hasSecondSearch = content ? Boolean(content.aiResults.secondSearch?.sources.length) : false
  const hasPriorArt = content ? Boolean(content.aiResults.priorArtComparison?.summary || content.aiResults.secondSearch?.sources.length) : false
  const hasDistinction = content ? content.structure.distinguishingFeatures.length > 0 : false
  const hasPackage = content ? Boolean(content.aiResults.package?.summary || content.aiResults.package?.markdown) : false
  const hasNoBlocking = validation ? !validation.issues.some((i) => i.severity === "blocking") : false

  const checklistItems = [
    { id: "disclosure", label: "完整交底书已生成", status: hasSectionContent ? "pass" : "fail", required: true },
    { id: "package", label: "数据包已生成", status: hasPackage ? "pass" : "fail", required: true },
    { id: "second-search", label: "二次AI检索已完成", status: hasSecondSearch ? "pass" : "fail", required: true },
    { id: "prior-art", label: "现有技术对比已完成", status: hasPriorArt ? "pass" : "fail", required: true },
    { id: "distinction", label: "区别技术特征已确认", status: hasDistinction ? "pass" : "warning", required: true },
    { id: "completeness", label: "完整性校验无阻断", status: hasNoBlocking ? "pass" : "fail", required: true },
    { id: "novelty", label: "新创性校验完成", status: content?.aiResults.initialInspection ? "pass" : "warning", required: false },
    { id: "quality", label: "质量打分完成", status: validation ? "pass" : "warning", required: false },
    { id: "patent-type", label: "专利类型已同步", status: content?.meta.patentType ? "pass" : "fail", required: true },
  ]

  const riskItems = [
    ...(!hasDistinction ? [{ level: "warning", message: "区别技术特征尚未最终确认，建议返回现有技术对比页补齐。" }] : []),
    ...(content?.aiResults.initialInspection?.riskLevel === "high" ? [{ level: "warning", message: "AI初检存在高相似来源，M07撰写前建议优先规避。" }] : []),
    ...(!hasPackage ? [{ level: "info", message: "请先生成M07数据包，再执行最终提交。" }] : []),
  ]

  const passCount = checklistItems.filter((i) => i.status === "pass").length
  const warningCount = checklistItems.filter((i) => i.status === "warning").length
  const failCount = checklistItems.filter((i) => i.status === "fail").length
  const requiredFailCount = checklistItems.filter((i) => i.required && i.status === "fail").length
  const canSubmit = requiredFailCount === 0 && confirmed

  const handleSubmit = async () => {
    await submitToM07(remarks)
    onSubmit?.()
  }

  const getNavTarget = (id: string) => {
    if (id === "disclosure" || id === "preview") return "m06-p04-supplement"
    if (id === "second-search") return "m06-p06-second-search"
    if (id === "prior-art" || id === "distinction") return "m06-p07-prior-art"
    if (id === "completeness" || id === "novelty" || id === "quality") return "m06-p10-quality"
    if (id === "package") return "m06-p11-package"
    return "m06-p02-decomposition"
  }

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={11} />

      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-lg font-semibold">提交M07确认</h1>
            <p className="text-sm text-muted-foreground">完成前置条件检查，创建M07创作任务</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>返回修改</Button>
          <Button className="bg-[#2F80ED] hover:bg-[#1E5EFF]" disabled={!canSubmit || saving} onClick={handleSubmit}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {saving ? "提交中..." : "确认提交M07"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><div className="text-2xl font-bold text-green-700">{passCount}</div><div className="text-sm text-green-600">已通过</div></div></CardContent></Card>
            <Card className="border-yellow-200 bg-yellow-50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-yellow-600" /></div><div><div className="text-2xl font-bold text-yellow-700">{warningCount}</div><div className="text-sm text-yellow-600">警告项</div></div></CardContent></Card>
            <Card className="border-red-200 bg-red-50"><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><XCircle className="h-5 w-5 text-red-600" /></div><div><div className="text-2xl font-bold text-red-700">{failCount}</div><div className="text-sm text-red-600">阻断项</div></div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />前置条件检查清单</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.status === "pass" ? "bg-green-50 border-green-200" : item.status === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-center gap-3">
                      {item.status === "pass" ? <CheckCircle className="h-5 w-5 text-green-600" /> : item.status === "warning" ? <AlertTriangle className="h-5 w-5 text-yellow-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                      <span className="text-sm">{item.label}</span>
                      {item.required && <Badge variant="outline" className="text-xs">必需</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={item.status === "pass" ? "bg-green-100 text-green-700" : item.status === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                        {item.status === "pass" ? "已完成" : item.status === "warning" ? "警告" : "未完成"}
                      </Badge>
                      {item.status !== "pass" && (
                        <Button size="sm" variant="ghost" onClick={() => onNavigate?.(getNavTarget(item.id))}>去处理<ChevronRight className="h-4 w-4 ml-1" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
          )}

          {riskItems.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-600" />提交风险提示</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskItems.map((risk, i) => (
                    <Alert key={i}><AlertTriangle className={`h-4 w-4 ${risk.level === "warning" ? "text-yellow-600" : "text-blue-600"}`} /><AlertDescription>{risk.message}</AlertDescription></Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">提交备注（可选）</CardTitle></CardHeader>
            <CardContent><Textarea placeholder="填写提交备注，便于M07工程师了解特殊情况..." value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} /></CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox id="confirm" checked={confirmed} onCheckedChange={(c) => setConfirmed(c as boolean)} />
                <div>
                  <Label htmlFor="confirm" className="text-sm font-medium cursor-pointer">我已确认以上检查项，同意将本交底模型提交至M07创作平台</Label>
                  <p className="text-xs text-muted-foreground mt-1">提交后将创建M07创作任务，M07工程师可开始专利文件撰写工作</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">将提交至M07的输出物</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /><div><div className="text-sm font-medium">完整交底书</div><div className="text-xs text-muted-foreground">final_disclosure_doc</div></div></div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"><Package className="h-5 w-5 text-green-600" /><div><div className="text-sm font-medium">可撰写数据包</div><div className="text-xs text-muted-foreground">disclosure_package</div></div></div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"><Search className="h-5 w-5 text-purple-600" /><div><div className="text-sm font-medium">检索对比资产</div><div className="text-xs text-muted-foreground">ai_search_comparison</div></div></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
