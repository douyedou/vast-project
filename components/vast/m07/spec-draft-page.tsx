"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Check,
  Edit3,
  AlertTriangle,
  Link2,
  Loader2,
  FileText,
} from "lucide-react"

interface SpecDraftPageProps {
  onBack: () => void
  onEdit: () => void
}

const chapters = [
  { id: "tech-field", label: "技术领域", checked: true },
  { id: "background", label: "背景技术", checked: true },
  { id: "summary", label: "发明内容", checked: true },
  { id: "drawings", label: "附图说明", checked: true },
  { id: "embodiment", label: "具体实施方式", checked: true },
  { id: "effects", label: "有益效果", checked: true },
]

const generatedContent = {
  "tech-field": {
    content: "本发明涉及智能控制技术领域，尤其涉及一种基于人工智能的温度控制系统及方法。",
    sources: ["交底书-技术领域-段落1"],
    risks: [],
  },
  "background": {
    content: `现有的温度控制系统通常采用简单的阈值控制方式，当温度超过或低于设定阈值时，系统才会启动制冷或制热设备。

这种控制方式存在以下技术问题：

1、响应滞后：由于是被动式控制，系统只有在温度已经偏离舒适范围后才会采取措施，导致用户体验不佳。

2、能源浪费：无法根据环境变化和用户习惯进行自适应调节，造成不必要的能源消耗。

3、缺乏预测能力：传统系统无法预测温度变化趋势，无法提前进行调控准备。`,
    sources: ["交底书-背景技术-段落1", "交底书-背景技术-段落2"],
    risks: [],
  },
  "summary": {
    content: `为解决上述技术问题，本发明提供一种智能温控系统，包括：传感器模块、AI处理单元、执行机构和反馈回路。

所述传感器模块用于采集环境温度、湿度、光照强度等多维环境参数。

所述AI处理单元接收所述传感器模块采集的数据，并基于深度学习模型进行分析处理，预测温度变化趋势。

所述执行机构根据所述AI处理单元的控制指令，执行相应的温度调节操作。

所述反馈回路用于将执行结果反馈至所述AI处理单元，实现闭环控制。`,
    sources: ["交底书-发明内容-核心方案", "交底书-发明内容-保护点1"],
    risks: ["建议补充：替代方案中的强化学习算法尚未覆盖"],
  },
  "drawings": {
    content: `图1是本发明实施例提供的智能温控系统的结构框图；
图2是本发明实施例提供的AI处理单元的内部结构示意图；
图3是本发明实施例提供的控制方法的流程图；
图4是本发明实施例提供的深度学习模型的网络结构图。`,
    sources: ["交底书-附图说明"],
    risks: [],
  },
  "embodiment": {
    content: `下面将结合本发明实施例中的附图，对本发明实施例中的技术方案进行清楚、完整地描述。

实施例一

如图1所示，本实施例提供一种智能温控系统，包括：传感器模块100、AI处理单元200、执行机构300和反馈回路400。

所述传感器模块100包括温度传感器101、湿度传感器102和光照传感器103，分别用于采集环境温度、湿度和光照强度数据。

所述AI处理单元200采用深度神经网络模型，包括输入层、隐藏层和输出层。输入层接收多维环境参数，隐藏层包含LSTM单元用于处理时序数据，输出层生成控制指令。`,
    sources: ["交底书-具体实施方式-实施例1"],
    risks: [],
  },
  "effects": {
    content: `本发明提供的智能温控系统具有以下有益效果：

1、通过AI处理单元的深度学习模型，能够预测温度变化趋势，实现提前调控，显著提升用户舒适度。

2、基于多维环境参数的综合分析，系统能够进行自适应调节，相比传统方案节能约20%-30%。

3、闭环反馈机制确保系统持续优化，控制精度可达±0.5℃。`,
    sources: ["交底书-有益效果"],
    risks: [],
  },
}

export function SpecDraftPage({ onBack, onEdit }: SpecDraftPageProps) {
  const [patentType, setPatentType] = useState("invention")
  const [applyMethod, setApplyMethod] = useState("preliminary")
  const [template, setTemplate] = useState("system")
  const [selectedChapters, setSelectedChapters] = useState(chapters.map((c) => c.id))
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [activeChapter, setActiveChapter] = useState("tech-field")

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setGenerated(true)
    }, 2000)
  }

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
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
            <h1 className="text-sm font-semibold text-[#111827]">说明书 AI 初稿</h1>
            <p className="text-xs text-[#9CA3AF]">智能温控系统发明专利</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!generated ? (
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成初稿
                </>
              )}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新生成
              </Button>
              <Button variant="outline">
                <Check className="h-4 w-4 mr-2" />
                接受初稿
              </Button>
              <Button onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                进入编辑
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：生成配置 */}
        <Card className="w-72 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">初稿生成配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">专利类型</Label>
              <Select value={patentType} onValueChange={setPatentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invention">发明专利</SelectItem>
                  <SelectItem value="utility">实用新型</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">发明申请方式</Label>
              <Select value={applyMethod} onValueChange={setApplyMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preliminary">预先审查</SelectItem>
                  <SelectItem value="priority">优先审查</SelectItem>
                  <SelectItem value="normal">普通申请</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">模板选择</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">系统默认模板</SelectItem>
                  <SelectItem value="electronics">电子信息模板</SelectItem>
                  <SelectItem value="mechanical">机械工程模板</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm">生成范围</Label>
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center gap-2">
                    <Checkbox
                      id={chapter.id}
                      checked={selectedChapters.includes(chapter.id)}
                      onCheckedChange={() => toggleChapter(chapter.id)}
                    />
                    <Label htmlFor={chapter.id} className="text-sm text-[#374151] cursor-pointer">
                      {chapter.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 中部：章节初稿预览 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base">章节初稿预览</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {!generated ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p>配置参数后点击"生成初稿"</p>
                  <p className="text-sm mt-1">AI 将基于 M06 完整交底书生成说明书初稿</p>
                </div>
              </div>
            ) : (
              <Tabs value={activeChapter} onValueChange={setActiveChapter} className="h-full flex flex-col">
                <div className="border-b border-border px-4">
                  <TabsList className="h-10">
                    <TabsTrigger value="tech-field" className="text-xs">技术领域</TabsTrigger>
                    <TabsTrigger value="background" className="text-xs">背景技术</TabsTrigger>
                    <TabsTrigger value="summary" className="text-xs">发明内容</TabsTrigger>
                    <TabsTrigger value="drawings" className="text-xs">附图说明</TabsTrigger>
                    <TabsTrigger value="embodiment" className="text-xs">具体实施方式</TabsTrigger>
                    <TabsTrigger value="effects" className="text-xs">有益效果</TabsTrigger>
                  </TabsList>
                </div>
                <ScrollArea className="flex-1 p-4">
                  {Object.entries(generatedContent).map(([key, value]) => (
                    <TabsContent key={key} value={key} className="m-0">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-[#374151] leading-relaxed">
                          {value.content}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </ScrollArea>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* 右侧：来源映射与风险提示 */}
        {generated && (
          <Card className="w-72 flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">来源与风险</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-[#6B7280]">来源段落</Label>
                <div className="mt-2 space-y-2">
                  {generatedContent[activeChapter as keyof typeof generatedContent]?.sources.map(
                    (source, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded bg-[#EAF4FF] text-xs text-[#2F80ED] cursor-pointer hover:bg-[#D4E8FF]"
                      >
                        <Link2 className="h-3 w-3" />
                        {source}
                      </div>
                    )
                  )}
                </div>
              </div>

              {generatedContent[activeChapter as keyof typeof generatedContent]?.risks.length > 0 && (
                <div>
                  <Label className="text-sm text-[#6B7280]">风险提示</Label>
                  <div className="mt-2 space-y-2">
                    {generatedContent[activeChapter as keyof typeof generatedContent]?.risks.map(
                      (risk, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 rounded bg-orange-50 text-xs text-orange-700"
                        >
                          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {risk}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
