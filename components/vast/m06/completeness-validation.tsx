"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { evaluateM06Completeness, M06ValidationIssue } from "@/lib/m06"
import {
  ArrowLeft,
  RefreshCw,
  ChevronRight,
  XCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  MapPin,
  Loader2
} from "lucide-react"

interface CompletenessValidationProps {
  caseId?: string | null
  onBack?: () => void
  onNext?: () => void
  onNavigate?: (page: string) => void
}

export function CompletenessValidation({ caseId, onBack, onNext, onNavigate }: CompletenessValidationProps) {
  const [activeTab, setActiveTab] = useState("blocking")
  const { content, runAction, runningAction } = useM06Document(caseId, "VALIDATE")

  const localValidation = content ? evaluateM06Completeness(content) : null
  const validation = content?.aiResults.completeness || localValidation
  const isValidating = runningAction === "validate"

  const mapIssue = (issue: M06ValidationIssue, index: number) => ({
    id: issue.id || `issue-${index}`,
    type: issue.title,
    description: issue.description,
    location: issue.target || "交底书",
    source: issue.severity === "blocking" ? "完整性校验" : issue.severity === "warning" ? "质量警告" : "优化建议",
  })

  const blockingItems = validation?.issues.filter((i) => i.severity === "blocking").map(mapIssue) || []
  const warningItems = validation?.issues.filter((i) => i.severity === "warning").map(mapIssue) || []
  const suggestionItems = validation?.issues.filter((i) => i.severity === "info").map(mapIssue) || []
  const validationScore = validation?.score ?? 0

  const handleValidate = async () => {
    await runAction("validate")
  }

  const getNavTarget = (issue: any): string => {
    const target = issue.location || ""
    if (target.includes("技术问题") || target.includes("technicalProblem")) return "m06-p02-decomposition"
    if (target.includes("技术方案") || target.includes("technicalSolution")) return "m06-p02-decomposition"
    if (target.includes("有益效果") || target.includes("beneficialEffects")) return "m06-p02-decomposition"
    if (target.includes("背景") || target.includes("backgroundTechnology")) return "m06-p02-decomposition"
    if (target.includes("附图") || target.includes("drawings")) return "m06-p02-decomposition"
    if (target.includes("实施") || target.includes("embodiments")) return "m06-p02-decomposition"
    if (target.includes("特征") || target.includes("technicalFeatures")) return "m06-p08-relation-mapping"
    if (target.includes("保护点") || target.includes("protectionPoints")) return "m06-p08-relation-mapping"
    if (target.includes("二次检索") || target.includes("secondSearch")) return "m06-p06-second-search"
    return "m06-p04-supplement"
  }

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={9} />

      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-lg font-semibold">交底完整性校验</h1>
            <p className="text-sm text-muted-foreground">判断交底书是否具备进入 M07 的基础条件</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />校验中...</> : <><RefreshCw className="h-4 w-4 mr-2" />重新校验</>}
          </Button>
          <Button variant="outline" onClick={onNext} disabled={blockingItems.length > 0} title={blockingItems.length > 0 ? "存在阻断项，请先回到对应页面补齐内容" : "进入数据包生成页"}>
            下一步：数据包<ChevronRight className="h-4 w-4 ml-2" />
          </Button>
          <Button className="bg-[#13A38B] hover:bg-[#13A38B]/90" onClick={() => onNavigate?.("m06-p12-submit")} disabled={blockingItems.length > 0}
            title={blockingItems.length > 0 ? "存在阻断项，暂不能提交 M07" : "进入提交 M07 确认页"}>
            提交到M07创作<ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <div className="grid grid-cols-4 gap-4">
              <Card className={`${blockingItems.length === 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-3xl font-bold ${blockingItems.length === 0 ? "text-green-600" : "text-red-600"}`}>{blockingItems.length}</div>
                  <div className="text-sm text-muted-foreground">阻断项</div>
                  {blockingItems.length === 0 && <Badge className="mt-2 bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />通过</Badge>}
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-4 text-center"><div className="text-3xl font-bold text-yellow-600">{warningItems.length}</div><div className="text-sm text-muted-foreground">警告项</div></CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4 text-center"><div className="text-3xl font-bold text-blue-600">{suggestionItems.length}</div><div className="text-sm text-muted-foreground">建议项</div></CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{validationScore}</div>
                  <div className="text-sm text-muted-foreground">完整性评分</div>
                  <Progress value={validationScore} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-4 pt-2">
                <TabsList>
                  <TabsTrigger value="blocking" className="gap-2"><XCircle className="h-4 w-4" />阻断项<Badge variant="destructive" className="ml-1">{blockingItems.length}</Badge></TabsTrigger>
                  <TabsTrigger value="warning" className="gap-2"><AlertTriangle className="h-4 w-4" />警告项<Badge className="ml-1 bg-yellow-100 text-yellow-700">{warningItems.length}</Badge></TabsTrigger>
                  <TabsTrigger value="suggestion" className="gap-2"><Lightbulb className="h-4 w-4" />建议项<Badge variant="outline" className="ml-1">{suggestionItems.length}</Badge></TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  <TabsContent value="blocking" className="mt-0">
                    {blockingItems.length === 0 ? (
                      <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="p-8 text-center">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                          <div className="text-lg font-medium text-green-700 mb-2">无阻断项</div>
                          <p className="text-sm text-muted-foreground">交底书已满足基本完整性要求，可以继续后续流程</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {blockingItems.map((item) => (
                          <Card key={item.id} className="border-red-200">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1"><Badge variant="destructive">{item.type}</Badge><span className="text-xs text-muted-foreground">来源：{item.source}</span></div>
                                  <p className="text-sm mb-2 break-words">{item.description}</p>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{item.location}</span>
                                    <Button variant="link" size="sm" className="h-auto p-0 ml-auto" onClick={() => onNavigate?.(getNavTarget(item))}>定位修改</Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="warning" className="mt-0">
                    {warningItems.length === 0 ? (
                      <Card className="border-green-200 bg-green-50/50"><CardContent className="p-6 text-center text-sm text-muted-foreground">无警告项</CardContent></Card>
                    ) : (
                      <div className="space-y-3">
                        {warningItems.map((item) => (
                          <Card key={item.id} className="border-yellow-200">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1"><Badge className="bg-yellow-100 text-yellow-700">{item.type}</Badge></div>
                                  <p className="text-sm mb-2 break-words">{item.description}</p>
                                  <Button variant="link" size="sm" className="h-auto p-0 ml-auto" onClick={() => onNavigate?.(getNavTarget(item))}>定位修改</Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="suggestion" className="mt-0">
                    {suggestionItems.length === 0 ? (
                      <Card className="border-green-200 bg-green-50/50"><CardContent className="p-6 text-center text-sm text-muted-foreground">无建议项</CardContent></Card>
                    ) : (
                      <div className="space-y-3">
                        {suggestionItems.map((item) => (
                          <Card key={item.id} className="border-blue-200">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1"><Badge className="bg-blue-100 text-blue-700">{item.type}</Badge></div>
                                  <p className="text-sm mb-2 break-words">{item.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        <div className="w-80 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">快捷操作</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {isValidating && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3"><Loader2 className="h-5 w-5 animate-spin text-primary" /><span className="font-medium">正在校验...</span></div>
                    <div className="space-y-2">
                      {["检查必填章节", "评估内容长度", "验证特征完整性", "检查保护点", "评估检索覆盖"].map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {i < 2 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">快速导航</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => onNavigate?.("m06-p04-supplement")}><MapPin className="h-4 w-4 mr-2" />返回交底补全</Button>
                  <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => onNavigate?.("m06-p08-relation-mapping")}><RefreshCw className="h-4 w-4 mr-2" />返回关系建模</Button>
                  <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => onNavigate?.("m06-p02-decomposition")}><RefreshCw className="h-4 w-4 mr-2" />返回交底解构</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">典型阻断项</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {["交底书必须包含完整的技术方案描述", "必须明确要解决的技术问题", "必须识别至少一个核心技术特征", "技术效果必须有对应的技术特征支撑"].map((item, i) => (
                    <div key={i} className="p-2 bg-red-50 rounded-lg"><p className="text-xs text-muted-foreground">{item}</p></div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
