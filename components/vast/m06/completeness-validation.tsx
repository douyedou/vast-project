"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import {
  ArrowLeft,
  Play,
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
  onBack?: () => void
  onNext?: () => void
  onNavigate?: (page: string) => void
}

export function CompletenessValidation({ onBack, onNext, onNavigate }: CompletenessValidationProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validated, setValidated] = useState(true)
  const [activeTab, setActiveTab] = useState("blocking")

  const validationScore = 85

  const blockingItems = [
    // 没有阻断项
  ]

  const warningItems = [
    {
      id: "w1",
      type: "术语一致性",
      description: "说明书中使用「AI控制模块」，结构化数据中使用「智能控制模块」，术语不一致",
      location: "技术方案节点 ts-1",
      source: "术语检查"
    },
    {
      id: "w2",
      type: "效果支撑不足",
      description: "技术效果「操作步骤减少60%」缺少具体数据支撑",
      location: "技术效果节点 te-3",
      source: "效果核对"
    },
    {
      id: "w3",
      type: "附图引用缺失",
      description: "技术特征「实时状态同步协议」未关联任何附图标号",
      location: "技术特征 f6",
      source: "附图核对"
    }
  ]

  const suggestionItems = [
    {
      id: "s1",
      type: "补充建议",
      description: "建议补充更多量化效果数据，增强说服力",
      location: "有益效果章节",
      source: "内容建议"
    },
    {
      id: "s2",
      type: "完善建议",
      description: "建议增加流程图说明算法执行步骤",
      location: "图纸材料",
      source: "附图建议"
    },
    {
      id: "s3",
      type: "优化建议",
      description: "关键保护点可以更精炼，突出核心创新",
      location: "关键保护点章节",
      source: "撰写建议"
    },
    {
      id: "s4",
      type: "术语建议",
      description: "建议统一使用「深度学习」而非「AI」作为技术术语",
      location: "全文",
      source: "术语建议"
    }
  ]

  const handleValidate = () => {
    setIsValidating(true)
    setValidated(false)
    setTimeout(() => {
      setIsValidating(false)
      setValidated(true)
    }, 2500)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "blocking":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "suggestion":
        return <Lightbulb className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* M06 Progress Bar */}
      <M06ProgressBar currentStep={9} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">交底完整性校验</h1>
            <p className="text-sm text-muted-foreground">判断交底书是否具备进入 M07 的基础条件</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleValidate} disabled={isValidating}>
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                校验中...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新校验
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onNext} disabled={blockingItems.length > 0}>
            下一步：新创性校验
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            className="bg-[#13A38B] hover:bg-[#13A38B]/90"
            onClick={() => onNavigate?.("m07-dashboard")}
            disabled={blockingItems.length > 0}
          >
            提交到M07创作
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Score Cards */}
          <div className="p-4 border-b">
            <div className="grid grid-cols-4 gap-4">
              <Card className={`${blockingItems.length === 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                <CardContent className="p-4 text-center">
                  <div className={`text-3xl font-bold ${blockingItems.length === 0 ? "text-green-600" : "text-red-600"}`}>
                    {blockingItems.length}
                  </div>
                  <div className="text-sm text-muted-foreground">阻断项</div>
                  {blockingItems.length === 0 && (
                    <Badge className="mt-2 bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      通过
                    </Badge>
                  )}
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600">{warningItems.length}</div>
                  <div className="text-sm text-muted-foreground">警告项</div>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{suggestionItems.length}</div>
                  <div className="text-sm text-muted-foreground">建议项</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{validationScore}</div>
                  <div className="text-sm text-muted-foreground">���整性评分</div>
                  <Progress value={validationScore} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Problem List */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-4 pt-2">
                <TabsList>
                  <TabsTrigger value="blocking" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    阻断项
                    <Badge variant="destructive" className="ml-1">{blockingItems.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="warning" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    警告项
                    <Badge className="ml-1 bg-yellow-100 text-yellow-700">{warningItems.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="suggestion" className="gap-2">
                    <Lightbulb className="h-4 w-4" />
                    建议项
                    <Badge variant="outline" className="ml-1">{suggestionItems.length}</Badge>
                  </TabsTrigger>
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
                          <p className="text-sm text-muted-foreground">
                            交底书已满足基本完整性要求，可以继续进行新创性校验
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {blockingItems.map((item: any) => (
                          <Card key={item.id} className="border-red-200">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="destructive">{item.type}</Badge>
                                    <span className="text-xs text-muted-foreground">来源：{item.source}</span>
                                  </div>
                                  <p className="text-sm mb-2">{item.description}</p>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{item.location}</span>
                                    <Button variant="link" size="sm" className="h-auto p-0 ml-auto">
                                      定位修改
                                    </Button>
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
                    <div className="space-y-3">
                      {warningItems.map((item) => (
                        <Card key={item.id} className="border-yellow-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-yellow-100 text-yellow-700">{item.type}</Badge>
                                  <span className="text-xs text-muted-foreground">来源：{item.source}</span>
                                </div>
                                <p className="text-sm mb-2">{item.description}</p>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{item.location}</span>
                                  <Button variant="link" size="sm" className="h-auto p-0 ml-auto">
                                    定位修改
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="suggestion" className="mt-0">
                    <div className="space-y-3">
                      {suggestionItems.map((item) => (
                        <Card key={item.id} className="border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className="bg-blue-100 text-blue-700">{item.type}</Badge>
                                  <span className="text-xs text-muted-foreground">来源：{item.source}</span>
                                </div>
                                <p className="text-sm mb-2">{item.description}</p>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{item.location}</span>
                                  <Button variant="link" size="sm" className="h-auto p-0 ml-auto">
                                    查看详情
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Quick Fix */}
        <div className="w-80 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-medium text-sm">快速修复</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Validation Progress */}
              {isValidating && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="font-medium">正在校验...</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "技术方案完整性", done: true },
                        { label: "技术效果支撑", done: true },
                        { label: "术语一致性", done: false },
                        { label: "附图标号核对", done: false },
                        { label: "格式规范检查", done: false }
                      ].map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {step.done ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className={step.done ? "text-muted-foreground" : ""}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Typical Blocking Items */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">典型阻断项说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <div className="font-medium text-red-700">无技术方案</div>
                    <p className="text-xs text-muted-foreground">交底书必须包含完整的技术方案描述</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <div className="font-medium text-red-700">无技术问题</div>
                    <p className="text-xs text-muted-foreground">必须明确要解决的技术问题</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <div className="font-medium text-red-700">无核心技术特征</div>
                    <p className="text-xs text-muted-foreground">必须识别至少一个核心技术特征</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <div className="font-medium text-red-700">技术效果无支撑</div>
                    <p className="text-xs text-muted-foreground">技术效果必须有对应的技术特征支撑</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">快捷操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    返回补充交底
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    返回关系建模
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    查看AI修复建议
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
