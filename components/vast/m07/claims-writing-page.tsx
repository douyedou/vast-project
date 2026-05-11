"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Plus,
  Save,
  CheckCircle,
  AlertCircle,
  Link2,
  ChevronRight,
  ChevronDown,
  GitBranch,
  FileText,
  Lightbulb,
} from "lucide-react"

interface ClaimsWritingPageProps {
  onBack: () => void
}

interface Claim {
  id: string
  number: number
  type: "independent" | "dependent"
  text: string
  refClaim?: number
  supportStatus: "supported" | "weak" | "unsupported" | "unchecked"
  supportParagraphs: string[]
}

const initialClaims: Claim[] = [
  {
    id: "c1",
    number: 1,
    type: "independent",
    text: "一种智能温控系统，其特征在于，包括：\n传感器模块，用于采集环境温度、湿度、光照强度等多维环境参数；\nAI处理单元，接收所述传感器模块采集的数据，并基于深度学习模型进行分析处理，预测温度变化趋势，生成控制指令；\n执行机构，根据所述AI处理单元的控制指令，执行相应的温度调节操作；\n反馈回路，用于将执行结果反馈至所述AI处理单元，实现闭环控制。",
    supportStatus: "supported",
    supportParagraphs: ["说明书-发明内容-段落1", "说明书-具体实施方式-段落2"],
  },
  {
    id: "c2",
    number: 2,
    type: "dependent",
    text: "根据权利要求1所述的智能温控系统，其特征在于，所述AI处理单元采用LSTM神经网络模型，所述LSTM神经网络模型包括输入层、隐藏层和输出层。",
    refClaim: 1,
    supportStatus: "supported",
    supportParagraphs: ["说明书-具体实施方式-段落5"],
  },
  {
    id: "c3",
    number: 3,
    type: "dependent",
    text: "根据权利要求2所述的智能温控系统，其特征在于，所述隐藏层包含多个LSTM单元，用于处理时序数据。",
    refClaim: 2,
    supportStatus: "weak",
    supportParagraphs: ["说明书-具体实施方式-段落6"],
  },
  {
    id: "c4",
    number: 4,
    type: "dependent",
    text: "根据权利要求1所述的智能温控系统，其特征在于，所述传感器模块还包括人体红外传感器，用于检测人员存在状态。",
    refClaim: 1,
    supportStatus: "unsupported",
    supportParagraphs: [],
  },
  {
    id: "c5",
    number: 5,
    type: "independent",
    text: "一种智能温控方法，应用于权利要求1-4任一项所述的智能温控系统，其特征在于，包括以下步骤：\nS1、通过传感器模块采集多维环境参数；\nS2、将采集的环境参数输入AI处理单元进行分析；\nS3、基于深度学习模型预测温度变化趋势；\nS4、根据预测结果生成控制指令并发送至执行机构；\nS5、接收执行反馈并更新模型参数。",
    supportStatus: "supported",
    supportParagraphs: ["说明书-具体实施方式-段落10-15"],
  },
]

const alternatives = [
  {
    id: "alt1",
    title: "强化学习算法替代方案",
    content: "作为替代方案，所述AI处理单元还可以采用强化学习算法，通过与环境交互不断优化控制策略。",
    source: "交底书-发明内容-替代方案",
  },
  {
    id: "alt2",
    title: "边缘计算替代方案",
    content: "所述AI处理单元可部署于边缘计算节点，减少数据传输延迟。",
    source: "交底书-具体实施方式-替代方案",
  },
]

const getSupportBadge = (status: string) => {
  switch (status) {
    case "supported":
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
          <CheckCircle className="h-3 w-3" />
          有支持
        </span>
      )
    case "weak":
      return (
        <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
          <AlertCircle className="h-3 w-3" />
          弱支持
        </span>
      )
    case "unsupported":
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
          <AlertCircle className="h-3 w-3" />
          无支持
        </span>
      )
    default:
      return (
        <span className="text-xs text-[#9CA3AF] bg-[#F0F3F8] px-2 py-0.5 rounded">
          未检查
        </span>
      )
  }
}

export function ClaimsWritingPage({ onBack }: ClaimsWritingPageProps) {
  const [claims, setClaims] = useState<Claim[]>(initialClaims)
  const [selectedClaim, setSelectedClaim] = useState<string>("c1")
  const [showHierarchy, setShowHierarchy] = useState(false)
  const [refClaimId, setRefClaimId] = useState<string>("")

  const currentClaim = claims.find((c) => c.id === selectedClaim)
  const independentClaims = claims.filter((c) => c.type === "independent")

  const handleAddIndependent = () => {
    const newNumber = Math.max(...claims.map((c) => c.number)) + 1
    const newClaim: Claim = {
      id: `c${newNumber}`,
      number: newNumber,
      type: "independent",
      text: "",
      supportStatus: "unchecked",
      supportParagraphs: [],
    }
    setClaims([...claims, newClaim])
    setSelectedClaim(newClaim.id)
  }

  const handleAddDependent = () => {
    if (!currentClaim) return
    const newNumber = Math.max(...claims.map((c) => c.number)) + 1
    const newClaim: Claim = {
      id: `c${newNumber}`,
      number: newNumber,
      type: "dependent",
      text: `根据权利要求${currentClaim.number}所述的智能温控系统，其特征在于，`,
      refClaim: currentClaim.number,
      supportStatus: "unchecked",
      supportParagraphs: [],
    }
    setClaims([...claims, newClaim])
    setSelectedClaim(newClaim.id)
  }

  const updateClaimText = (text: string) => {
    setClaims(
      claims.map((c) => (c.id === selectedClaim ? { ...c, text } : c))
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
            <h1 className="text-sm font-semibold text-[#111827]">权利要求书撰写</h1>
            <p className="text-xs text-[#9CA3AF]">智能温控系统发明专利</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAddIndependent}>
            <Plus className="h-4 w-4 mr-2" />
            新增独权
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddDependent} disabled={!currentClaim}>
            <Plus className="h-4 w-4 mr-2" />
            新增从权
          </Button>
          <Button variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            支持检查
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHierarchy(!showHierarchy)}>
            <GitBranch className="h-4 w-4 mr-2" />
            层级图
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：权利要求树 */}
        <Card className="w-72 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">权利要求树</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-3 space-y-1">
                {independentClaims.map((indClaim) => {
                  const dependentClaims = claims.filter(
                    (c) => c.type === "dependent" && c.refClaim === indClaim.number
                  )
                  return (
                    <div key={indClaim.id}>
                      <div
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          selectedClaim === indClaim.id
                            ? "bg-[#EAF4FF] text-[#2F80ED]"
                            : "hover:bg-[#F5F7FA]"
                        }`}
                        onClick={() => setSelectedClaim(indClaim.id)}
                      >
                        {dependentClaims.length > 0 ? (
                          <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">权利要求 {indClaim.number}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[#2F80ED] text-white">
                              独权
                            </span>
                          </div>
                        </div>
                        {getSupportBadge(indClaim.supportStatus)}
                      </div>
                      {dependentClaims.length > 0 && (
                        <div className="ml-6 space-y-1 mt-1">
                          {dependentClaims.map((depClaim) => (
                            <div
                              key={depClaim.id}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                selectedClaim === depClaim.id
                                  ? "bg-[#EAF4FF] text-[#2F80ED]"
                                  : "hover:bg-[#F5F7FA]"
                              }`}
                              onClick={() => setSelectedClaim(depClaim.id)}
                            >
                              <ChevronRight className="h-4 w-4 text-[#D1D5DB]" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">权利要求 {depClaim.number}</span>
                                  <span className="text-xs text-[#9CA3AF]">
                                    引用{depClaim.refClaim}
                                  </span>
                                </div>
                              </div>
                              {getSupportBadge(depClaim.supportStatus)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 中部：权利要求正文编辑区 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                权利要求 {currentClaim?.number}
                <span className="ml-2 text-xs font-normal text-[#6B7280]">
                  {currentClaim?.type === "independent" ? "独立权利要求" : "从属权利要求"}
                </span>
              </CardTitle>
              {currentClaim && getSupportBadge(currentClaim.supportStatus)}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 flex flex-col">
            {currentClaim?.type === "dependent" && (
              <div className="mb-4">
                <label className="text-sm text-[#6B7280] mb-2 block">引用关系</label>
                <Select
                  value={String(currentClaim.refClaim)}
                  onValueChange={(v) => {
                    setClaims(
                      claims.map((c) =>
                        c.id === selectedClaim ? { ...c, refClaim: parseInt(v) } : c
                      )
                    )
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {claims
                      .filter((c) => c.number < (currentClaim?.number || 0))
                      .map((c) => (
                        <SelectItem key={c.id} value={String(c.number)}>
                          权利要求 {c.number}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
              className="flex-1 min-h-[300px] text-sm leading-relaxed resize-none"
              value={currentClaim?.text || ""}
              onChange={(e) => updateClaimText(e.target.value)}
              placeholder="请输入权利要求内容..."
            />
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm">
                <Link2 className="h-4 w-4 mr-2" />
                选择支持段落
              </Button>
              <div className="text-xs text-[#9CA3AF]">
                字数：{currentClaim?.text.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：说明书支持关系 / 替代方案素材 */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* 支持段落 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2F80ED]" />
                说明书支持
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentClaim?.supportParagraphs.length ? (
                <div className="space-y-2">
                  {currentClaim.supportParagraphs.map((para, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-[#F5F7FA] text-xs text-[#374151] cursor-pointer hover:bg-[#EAF4FF]"
                    >
                      <Link2 className="h-3 w-3 text-[#2F80ED]" />
                      {para}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-[#9CA3AF]">
                  {currentClaim?.supportStatus === "unsupported" ? (
                    <div className="text-red-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      无说明书支持，请补充说明书内容
                    </div>
                  ) : (
                    "暂无支持段落"
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 替代方案素材 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-orange-500" />
                替代方案素材
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-3">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-3 rounded border border-border hover:border-[#2F80ED] cursor-pointer transition-colors"
                    >
                      <div className="text-sm font-medium text-[#111827] mb-1">{alt.title}</div>
                      <p className="text-xs text-[#6B7280] line-clamp-2">{alt.content}</p>
                      <div className="text-xs text-[#9CA3AF] mt-2 flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        {alt.source}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
