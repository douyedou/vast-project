"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import {
  ArrowLeft,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileJson,
  Database,
  ChevronRight,
  Copy,
  Eye
} from "lucide-react"

interface DisclosurePackageProps {
  onNavigate?: (page: string) => void
  onBack?: () => void
  onNext?: () => void
}

const mockPackageData = {
  disclosure_doc_id: "DOC-2024-001-v3",
  disclosure_doc_version: "3.0",
  generated_at: "2024-01-15 14:30:00",
  
  // 核心内容
  technical_problem: "现有智能家居系统存在设备间通信延迟、跨协议兼容性问题、能效不最优等问题",
  technical_background: "智能家居市场快速增长，但设备互联互通标准不统一...",
  technical_solution: "基于统一协议栈的多模态设备控制引擎，采用...",
  
  // 技术特征
  technical_features: [
    {
      id: "F001",
      name: "统一协议转换模块",
      description: "支持Zigbee/Z-Wave/WiFi多协议",
      status: "confirmed",
      distinguishing: true
    },
    {
      id: "F002",
      name: "智能调度算法",
      description: "基于设备状态的动态优先级调度",
      status: "confirmed",
      distinguishing: true
    },
    {
      id: "F003",
      name: "能效优化引擎",
      description: "云端+边缘联动的功耗预测",
      status: "confirmed",
      distinguishing: false
    }
  ],
  
  // 作用关系
  action_relationships: [
    {
      id: "R001",
      from: "F001",
      to: "F002",
      relation: "为...提供数据输入",
      result: "统一设备指令集"
    },
    {
      id: "R002",
      from: "F002",
      to: "F003",
      relation: "触发...",
      result: "最优能效方案"
    }
  ],
  
  // 技术效果
  technical_effects: [
    "协议间延迟降低95%",
    "兼容性提升至99.5%",
    "能效提升40%"
  ],
  
  // 关键保护点
  key_protection_points: [
    "多模态设备自动配对机制",
    "智能调度算法的优先级确定方式",
    "云边联动的能效预测模型"
  ],
  
  // 替代方案
  alternative_solutions: [
    {
      name: "替代方案A：消息队列中间件",
      equivalence: "效果相同，但性能降低30%",
      risk: "被现有技术覆盖（US Patent 2023-001"
    },
    {
      name: "替代方案B：设备端直连",
      equivalence: "效果相同，但可扩展性差",
      risk: "被CN Patent 2022-005覆盖"
    }
  ],
  
  // 术语映射
  terminology_mapping: [
    {
      original: "协议栈",
      standard: "Protocol Stack",
      writing: "多协议统一处理架构",
      confirmed: true
    },
    {
      original: "边缘计算",
      standard: "Edge Computing",
      writing: "设备端本地计算",
      confirmed: true
    }
  ],
  
  // 附图标号
  figures: [
    {
      id: "FIG1",
      title: "系统架构图",
      labels: ["10-协议转换模块", "11-调度引擎", "12-能效模块"]
    },
    {
      id: "FIG2",
      title: "通信流程图",
      labels: ["20-接收指令", "21-协议转换", "22-执行控制"]
    }
  ],

  // 报告
  ai_inspection_report: {
    novelty_score: 85,
    creativity_score: 78,
    risk_level: "medium",
    issues: 3
  },

  second_search_report: {
    search_count: 24,
    high_risk_count: 2,
    medium_risk_count: 5,
    issues: [
      "US2023-001相似度88%",
      "CN2022-005相似度72%"
    ]
  },

  quality_score: {
    completeness: 95,
    solution_sufficiency: 88,
    search_risk: 72,
    distinguishing_clarity: 85,
    protection_clarity: 82,
    support_evidence: 90,
    terminology_complete: 92,
    overall: 86
  }
}

export function DisclosurePackage({
  onNavigate,
  onBack,
  onNext
}: DisclosurePackageProps) {
  const [packageReady, setPackageReady] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* M06 Progress Bar */}
      <M06ProgressBar currentStep={10} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">可撰写数据包预览</h1>
            <p className="text-sm text-muted-foreground">预览提交给M07的完整disclosure_package</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPackageReady(!packageReady)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重新生成
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出JSON
          </Button>
          {packageReady ? (
            <Button onClick={onNext} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              确认为ready
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              待生成
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex gap-4 px-6 py-4">
        {/* Left - Directory */}
        <Card className="w-64 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">数据包目录</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-1 text-sm">
              {[
                { icon: FileJson, label: "元数据", level: 0 },
                { icon: Database, label: "技术问题", level: 0 },
                { icon: Database, label: "技术背景", level: 0 },
                { icon: Database, label: "技术方案", level: 0 },
                { icon: Database, label: "技术特征 (3)", level: 0 },
                { icon: Database, label: "作用关系 (2)", level: 0 },
                { icon: Database, label: "技术效果", level: 0 },
                { icon: Database, label: "关键保护点", level: 0 },
                { icon: Database, label: "替代方案 (2)", level: 0 },
                { icon: Database, label: "术语映射 (2)", level: 0 },
                { icon: Database, label: "附图标号 (2)", level: 0 },
                { icon: Database, label: "AI初检报告", level: 0 },
                { icon: Database, label: "二次检索报告", level: 0 },
                { icon: Database, label: "质量评分", level: 0 },
              ].map((item, i) => (
                <div key={i} className="py-1.5 px-2 hover:bg-muted rounded cursor-pointer flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Middle - Content Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="overview" className="flex-1 flex flex-col">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="features">技术特征</TabsTrigger>
              <TabsTrigger value="relationships">作用关系</TabsTrigger>
              <TabsTrigger value="protection">保护点</TabsTrigger>
              <TabsTrigger value="alternatives">替代方案</TabsTrigger>
              <TabsTrigger value="json">JSON预览</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* 概览Tab */}
              <TabsContent value="overview" className="pr-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">核心内容</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">技术问题</div>
                        <div className="text-foreground">{mockPackageData.technical_problem}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">技术方案</div>
                        <div className="text-foreground">{mockPackageData.technical_solution}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">关键指标</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">技术特征数</span>
                        <Badge>{mockPackageData.technical_features.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">作用关系数</span>
                        <Badge>{mockPackageData.action_relationships.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">区别特征数</span>
                        <Badge>{mockPackageData.technical_features.filter(f => f.distinguishing).length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">替代方案数</span>
                        <Badge>{mockPackageData.alternative_solutions.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">质量评分</span>
                        <Badge className="bg-green-100 text-green-700">{mockPackageData.quality_score.overall}/100</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* 技术特征Tab */}
              <TabsContent value="features" className="pr-4">
                <div className="space-y-2">
                  {mockPackageData.technical_features.map((feature) => (
                    <Card key={feature.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            <div className="text-sm text-muted-foreground">{feature.description}</div>
                          </div>
                          <div className="flex gap-1">
                            {feature.distinguishing && <Badge className="bg-purple-100 text-purple-700">区别特征</Badge>}
                            <Badge variant="outline" className="text-xs">{feature.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* 作用关系Tab */}
              <TabsContent value="relationships" className="pr-4">
                <div className="space-y-2">
                  {mockPackageData.action_relationships.map((rel) => (
                    <Card key={rel.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-mono bg-muted px-2 py-1 rounded">{rel.from}</span>
                          <span className="text-muted-foreground">→ {rel.relation} →</span>
                          <span className="font-mono bg-muted px-2 py-1 rounded">{rel.to}</span>
                          <span className="ml-auto text-muted-foreground">结果：{rel.result}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* 保护点Tab */}
              <TabsContent value="protection" className="pr-4">
                <div className="space-y-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">关键保护点</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {mockPackageData.key_protection_points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">技术效果</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        {mockPackageData.technical_effects.map((effect, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            <span>{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* 替代方案Tab */}
              <TabsContent value="alternatives" className="pr-4">
                <div className="space-y-2">
                  {mockPackageData.alternative_solutions.map((alt, i) => (
                    <Card key={i}>
                      <CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="font-medium">{alt.name}</div>
                          <div className="text-muted-foreground">
                            <div>等同性：{alt.equivalence}</div>
                            <div className="flex items-start gap-2 mt-1">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-orange-600 flex-shrink-0" />
                              <span>{alt.risk}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* JSON预览Tab */}
              <TabsContent value="json" className="pr-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">JSON结构预览</CardTitle>
                      <Button size="sm" variant="ghost">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                      <pre>
{`{
  "disclosure_doc_id": "${mockPackageData.disclosure_doc_id}",
  "version": "${mockPackageData.disclosure_doc_version}",
  "technical_features": ${mockPackageData.technical_features.length},
  "action_relationships": ${mockPackageData.action_relationships.length},
  "distinguishing_features": ${mockPackageData.technical_features.filter(f => f.distinguishing).length},
  "alternative_solutions": ${mockPackageData.alternative_solutions.length},
  "figures": ${mockPackageData.figures.length},
  "quality_score": ${mockPackageData.quality_score.overall},
  "ready_for_m07": true
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Right - M07 Mapping */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">M07使用映射</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-3">
            {[
              { m06: "技术特征 (3)", m07: "权利要求撰写", status: "ready" },
              { m06: "区别特征 (2)", m07: "从权撰写", status: "ready" },
              { m06: "替代方案 (2)", m07: "从权撰写", status: "ready" },
              { m06: "关键保护点", m07: "独立权利要求", status: "ready" },
              { m06: "技术效果", m07: "效果描述", status: "ready" },
              { m06: "附图标号 (2)", m07: "说明书图纸", status: "ready" },
              { m06: "术语映射 (2)", m07: "撰写术语", status: "ready" },
              { m06: "二次检索", m07: "文献支撑", status: "review" },
              { m06: "质量评分", m07: "质量审核", status: "pending" }
            ].map((mapping, i) => (
              <div key={i} className="p-2 border rounded text-xs">
                <div className="font-medium text-foreground">{mapping.m06}</div>
                <div className="text-muted-foreground mt-0.5">→ {mapping.m07}</div>
                <Badge 
                  variant="outline" 
                  className={`mt-1 text-xs ${
                    mapping.status === "ready" ? "bg-green-50 text-green-700" :
                    mapping.status === "review" ? "bg-yellow-50 text-yellow-700" :
                    "bg-gray-50 text-gray-700"
                  }`}
                >
                  {mapping.status === "ready" ? "已就绪" : mapping.status === "review" ? "待审核" : "待处理"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer Alert */}
      {!packageReady && (
        <div className="px-6 py-3 bg-blue-50 border-t">
          <Alert className="bg-transparent border-0 p-0">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-700">
              数据包已完整生成，包含完整交底书、所有技术特征、作用关系、区别特征、替代方案、术语映射等。请确认后提交M07。
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
