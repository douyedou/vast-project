"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OnlyOfficeEditor } from "./onlyoffice-editor"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Save,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  Link2,
  Eye,
  EyeOff,
  Send,
  Maximize2,
  Minus,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"

interface DualDocWorkspaceProps {
  onBack: () => void
}

// 交底书目录结构
const disclosureTree = [
  {
    id: "1",
    title: "技术领域",
    covered: true,
    children: [],
  },
  {
    id: "2",
    title: "背景技术",
    covered: true,
    children: [
      { id: "2-1", title: "现有技术问题", covered: true },
      { id: "2-2", title: "技术难点", covered: false },
    ],
  },
  {
    id: "3",
    title: "发明内容",
    covered: "weak",
    children: [
      { id: "3-1", title: "核心技术方案", covered: true },
      { id: "3-2", title: "保护点1", covered: true },
      { id: "3-3", title: "保护点2", covered: "weak" },
      { id: "3-4", title: "替代方案", covered: false },
    ],
  },
  {
    id: "4",
    title: "具体实施方式",
    covered: true,
    children: [
      { id: "4-1", title: "实施例1", covered: true },
      { id: "4-2", title: "实施例2", covered: true },
    ],
  },
  {
    id: "5",
    title: "有益效果",
    covered: true,
    children: [],
  },
]

// 交底书段落内容
const disclosureParagraphs = [
  {
    id: "p1",
    section: "技术领域",
    content: "本发明涉及智能控制技术领域，尤其涉及一种基于人工智能的温度控制系统及方法。",
    status: "covered",
    mappedTo: "说明书-技术领域-段落1",
  },
  {
    id: "p2",
    section: "背景技术",
    content: "现有的温度控制系统通常采用简单的阈值控制方式，无法根据环境变化进行自适应调节，导致能源浪费和用户体验不佳。",
    status: "covered",
    mappedTo: "说明书-背景技术-段落1",
  },
  {
    id: "p3",
    section: "发明内容",
    content: "为解决上述技术问题，本发明提供一种智能温控系统，包括：传感器模块、AI处理单元、执行机构和反馈回路。",
    status: "covered",
    mappedTo: "说明书-发明内容-段落1",
  },
  {
    id: "p4",
    section: "保护点2",
    content: "所述AI处理单元采用深度学习算法，能够根据历史数据预测温度变化趋势，实现提前调控。",
    status: "weak",
    mappedTo: "说明书-发明内容-段落3",
  },
  {
    id: "p5",
    section: "替代方案",
    content: "作为替代方案，所述AI处理单元还可以采用强化学习算法，通过与环境交互不断优化控制策略。",
    status: "uncovered",
    mappedTo: null,
  },
]

const getStatusBadge = (status: string | boolean) => {
  if (status === true || status === "covered") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
        <CheckCircle className="h-3 w-3" />
        已覆盖
      </span>
    )
  }
  if (status === "weak") {
    return (
      <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
        <AlertCircle className="h-3 w-3" />
        弱覆盖
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
      <AlertCircle className="h-3 w-3" />
      未覆盖
    </span>
  )
}

export function DualDocWorkspace({ onBack }: DualDocWorkspaceProps) {
  const [showUncoveredOnly, setShowUncoveredOnly] = useState(false)
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const [selectedParagraph, setSelectedParagraph] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState("spec")
  const [expandedSections, setExpandedSections] = useState<string[]>(["2", "3", "4"])
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredParagraphs = disclosureParagraphs.filter((p) => {
    if (showUncoveredOnly && p.status === "covered") return false
    return true
  })

  const getDocumentTitle = () => {
    switch (currentTab) {
      case "spec": return "说明书"
      case "claims": return "权利要求书"
      case "abstract": return "摘要"
      case "drawings": return "附图说明"
      default: return "说明书"
    }
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
            <h1 className="text-sm font-semibold text-[#111827]">智能温控系统发明专利</h1>
            <p className="text-xs text-[#9CA3AF]">当前版本：v1.2 · 自动保存</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            保存版本
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            交底书
          </Button>
          <Button variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            覆盖检查
          </Button>
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            支持检查
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            提交审核
          </Button>
        </div>
      </div>

      {/* 主内容区 - 双栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：完整交底书预览 */}
        <div className={`border-r border-border bg-white flex flex-col transition-all duration-300 ${
          leftPanelCollapsed ? "w-0 overflow-hidden" : "w-[35%]"
        }`}>
          <div className="p-3 border-b border-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input placeholder="搜索交底内容" className="pl-8 h-8 text-sm" />
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Switch
                  id="uncovered"
                  checked={showUncoveredOnly}
                  onCheckedChange={setShowUncoveredOnly}
                />
                <Label htmlFor="uncovered" className="text-[#6B7280]">只看未覆盖</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="keypoints"
                  checked={showKeyPoints}
                  onCheckedChange={setShowKeyPoints}
                />
                <Label htmlFor="keypoints" className="text-[#6B7280]">只看保护点</Label>
              </div>
            </div>
          </div>

          {/* 目录树 */}
          <div className="p-3 border-b border-border">
            <div className="text-xs font-medium text-[#6B7280] mb-2">交底书目录</div>
            <div className="space-y-1">
              {disclosureTree.map((item) => (
                <div key={item.id}>
                  <div
                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#F5F7FA] cursor-pointer"
                    onClick={() => item.children.length > 0 && toggleSection(item.id)}
                  >
                    {item.children.length > 0 ? (
                      expandedSections.includes(item.id) ? (
                        <ChevronDown className="h-3 w-3 text-[#9CA3AF]" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-[#9CA3AF]" />
                      )
                    ) : (
                      <Minus className="h-3 w-3 text-[#D1D5DB]" />
                    )}
                    <span className="text-sm text-[#374151] flex-1">{item.title}</span>
                    {getStatusBadge(item.covered)}
                  </div>
                  {item.children.length > 0 && expandedSections.includes(item.id) && (
                    <div className="ml-5 space-y-1">
                      {item.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-[#F5F7FA] cursor-pointer"
                        >
                          <Minus className="h-3 w-3 text-[#D1D5DB]" />
                          <span className="text-sm text-[#6B7280] flex-1">{child.title}</span>
                          {getStatusBadge(child.covered)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 段落卡片列表 */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {filteredParagraphs.map((para) => (
                <Card
                  key={para.id}
                  className={`cursor-pointer transition-all ${
                    selectedParagraph === para.id
                      ? "ring-2 ring-[#2F80ED] bg-[#EAF4FF]"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedParagraph(para.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[#2F80ED]">{para.section}</span>
                      {getStatusBadge(para.status)}
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed line-clamp-3">
                      {para.content}
                    </p>
                    {para.mappedTo && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="text-xs text-[#9CA3AF] flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          映射至：{para.mappedTo}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        定位正文
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1">
                        <Link2 className="h-3 w-3 mr-1" />
                        建立映射
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <EyeOff className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 左侧面板折叠按钮 */}
        <button
          className="w-5 bg-[#F5F7FA] border-r border-border flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
        >
          {leftPanelCollapsed ? (
            <PanelLeft className="h-4 w-4 text-[#9CA3AF]" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-[#9CA3AF]" />
          )}
        </button>

        {/* 右侧：OnlyOffice 编辑器 */}
        <div className="flex-1 flex flex-col bg-white">
          {/* 文档 Tab */}
          <div className="px-4 pt-3 border-b border-border">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList>
                <TabsTrigger value="spec">说明书</TabsTrigger>
                <TabsTrigger value="claims">权利要求书</TabsTrigger>
                <TabsTrigger value="abstract">摘要</TabsTrigger>
                <TabsTrigger value="drawings">附图说明</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* OnlyOffice 编辑器区域 */}
          <div className="flex-1 p-4">
            <OnlyOfficeEditor
              documentTitle={`智能温控系统-${getDocumentTitle()}`}
              documentType={currentTab as "spec" | "claims" | "abstract" | "drawings"}
              showAiAssist={true}
            />
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="h-10 px-4 bg-white border-t border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">覆盖率：</span>
            <span className="font-medium text-green-600">85%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">支持率：</span>
            <span className="font-medium text-[#2F80ED]">90%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">查重率：</span>
            <span className="font-medium text-green-600">8%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">AI相似性：</span>
            <span className="font-medium text-green-600">12%</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">当前版本：</span>
            <span className="font-medium text-[#374151]">v1.2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[#6B7280]">已保存</span>
          </div>
        </div>
      </div>
    </div>
  )
}
