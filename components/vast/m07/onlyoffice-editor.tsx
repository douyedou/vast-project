"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  Link2,
  Image,
  Table,
  Highlighter,
  ChevronDown,
  Search,
  FileText,
  Save,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MoreHorizontal,
  MessageSquare,
  Users,
  History,
  PaintBucket,
  Type,
  Subscript,
  Superscript,
  Eraser,
  Copy,
  Scissors,
  Clipboard,
  Sparkles,
  Check,
  X,
} from "lucide-react"

interface OnlyOfficeEditorProps {
  documentTitle?: string
  documentType?: "spec" | "claims" | "abstract" | "drawings"
  content?: string
  onSave?: () => void
  onContentChange?: (content: string) => void
  showAiAssist?: boolean
}

export function OnlyOfficeEditor({
  documentTitle = "未命名文档",
  documentType = "spec",
  content: initialContent,
  onSave,
  onContentChange,
  showAiAssist = true,
}: OnlyOfficeEditorProps) {
  const [zoom, setZoom] = useState(100)
  const [fontFamily, setFontFamily] = useState("宋体")
  const [fontSize, setFontSize] = useState("12")
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left")
  const [showComments, setShowComments] = useState(true)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  const defaultContent = `【技术领域】

本发明涉及智能控制技术领域，尤其涉及一种基于人工智能的温度控制系统及方法。

【背景技术】

现有的温度控制系统通常采用简单的阈值控制方式，当温度超过或低于设定阈值时，系统才会启动制冷或制热设备。这种控制方式存在以下技术问题：

1、响应滞后：由于是被动式控制，系统只有在温度已经偏离舒适范围后才会采取措施，导致用户体验不佳；

2、能源浪费：无法根据环境变化和用户习惯进行自适应调节，造成不必要的能源消耗；

3、缺乏预测能力：传统系统无法预测温度变化趋势，无法提前进行调控准备。

【发明内容】

为解决上述技术问题，本发明提供一种智能温控系统，包括：传感器模块、AI处理单元、执行机构和反馈回路。

所述传感器模块用于采集环境温度、湿度、光照强度等多维环境参数；

所述AI处理单元接收所述传感器模块采集的数据，并基于深度学习模型进行分析处理，预测温度变化趋势，生成控制指令；

所述执行机构根据所述AI处理单元的控制指令，执行相应的温度调节操作；

所述反馈回路用于将执行结果反馈至所述AI处理单元，实现闭环控制。`

  const [content, setContent] = useState(initialContent || defaultContent)

  const handleAiAssist = () => {
    setShowAiPanel(true)
    setIsAiGenerating(true)
    setTimeout(() => {
      setAiSuggestion("建议：在「发明内容」部分可以补充关于强化学习算法的替代方案描述，以增强专利保护范围。\n\n推荐补充内容：\n「作为替代方案，所述AI处理单元还可以采用强化学习算法，通过与环境交互不断优化控制策略，具体包括：状态空间定义、动作空间设计、奖励函数构建等。」")
      setIsAiGenerating(false)
    }, 1500)
  }

  const ToolbarButton = ({ 
    icon: Icon, 
    tooltip, 
    active = false, 
    onClick 
  }: { 
    icon: React.ElementType
    tooltip: string
    active?: boolean
    onClick?: () => void 
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={`p-1.5 rounded hover:bg-[#E5E7EB] transition-colors ${
              active ? "bg-[#DBEAFE] text-[#2563EB]" : "text-[#374151]"
            }`}
            onClick={onClick}
          >
            <Icon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-[#E5E7EB] mx-1" />
  )

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
      {/* OnlyOffice 风格顶部标签栏 */}
      <div className="h-9 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center px-2 gap-1">
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-[#FF6B35] to-[#F7931E] flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-[#374151] ml-2">{documentTitle}</span>
          <span className="text-xs text-[#9CA3AF] ml-2">- 已保存</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Users className="h-3.5 w-3.5" />
            协作
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            评论
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <History className="h-3.5 w-3.5" />
            版本
          </Button>
        </div>
      </div>

      {/* OnlyOffice 风格菜单栏 */}
      <div className="h-8 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center px-2">
        {["文件", "编辑", "视图", "插入", "格式", "工具", "帮助"].map((menu) => (
          <DropdownMenu key={menu}>
            <DropdownMenuTrigger asChild>
              <button className="px-3 py-1 text-sm text-[#374151] hover:bg-[#E5E7EB] rounded transition-colors">
                {menu}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              {menu === "文件" && (
                <>
                  <DropdownMenuItem className="gap-2">
                    <Save className="h-4 w-4" />
                    保存 <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+S</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Printer className="h-4 w-4" />
                    打印 <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+P</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <FileText className="h-4 w-4" />
                    导出为 PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <FileText className="h-4 w-4" />
                    导出为 Word
                  </DropdownMenuItem>
                </>
              )}
              {menu === "编辑" && (
                <>
                  <DropdownMenuItem className="gap-2">
                    <Undo2 className="h-4 w-4" />
                    撤销 <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+Z</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Redo2 className="h-4 w-4" />
                    重做 <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+Y</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <Scissors className="h-4 w-4" />
                    剪切 <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+X</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Copy className="h-4 w-4" />
                    复制 <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+C</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Clipboard className="h-4 w-4" />
                    粘贴 <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+V</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <Search className="h-4 w-4" />
                    查找和替换 <span className="ml-auto text-xs text-[#9CA3AF]">Ctrl+H</span>
                  </DropdownMenuItem>
                </>
              )}
              {menu === "插入" && (
                <>
                  <DropdownMenuItem className="gap-2">
                    <Table className="h-4 w-4" />
                    表格
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Image className="h-4 w-4" />
                    图片
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Link2 className="h-4 w-4" />
                    超链接
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    批注
                  </DropdownMenuItem>
                </>
              )}
              {menu !== "文件" && menu !== "编辑" && menu !== "插入" && (
                <DropdownMenuItem>功能开发中...</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
        {showAiAssist && (
          <button
            className="ml-2 px-3 py-1 text-sm text-white bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED] rounded transition-colors flex items-center gap-1"
            onClick={handleAiAssist}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 辅助
          </button>
        )}
      </div>

      {/* OnlyOffice 风格工具栏 */}
      <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] p-1.5">
        <div className="flex items-center gap-0.5 flex-wrap">
          {/* 撤销/重做 */}
          <ToolbarButton icon={Undo2} tooltip="撤销 (Ctrl+Z)" />
          <ToolbarButton icon={Redo2} tooltip="重做 (Ctrl+Y)" />
          
          <ToolbarDivider />
          
          {/* 剪贴板 */}
          <ToolbarButton icon={Copy} tooltip="复制 (Ctrl+C)" />
          <ToolbarButton icon={Scissors} tooltip="剪切 (Ctrl+X)" />
          <ToolbarButton icon={Clipboard} tooltip="粘贴 (Ctrl+V)" />
          
          <ToolbarDivider />

          {/* 字体选择 */}
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger className="w-24 h-7 text-xs border-[#E5E7EB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="宋体">宋体</SelectItem>
              <SelectItem value="黑体">黑体</SelectItem>
              <SelectItem value="楷体">楷体</SelectItem>
              <SelectItem value="仿宋">仿宋</SelectItem>
              <SelectItem value="微软雅黑">微软雅黑</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            </SelectContent>
          </Select>

          {/* 字号选择 */}
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="w-16 h-7 text-xs border-[#E5E7EB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["9", "10", "11", "12", "14", "16", "18", "20", "22", "24", "28", "36", "48", "72"].map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToolbarDivider />

          {/* 文字格式 */}
          <ToolbarButton icon={Bold} tooltip="加粗 (Ctrl+B)" active={isBold} onClick={() => setIsBold(!isBold)} />
          <ToolbarButton icon={Italic} tooltip="斜体 (Ctrl+I)" active={isItalic} onClick={() => setIsItalic(!isItalic)} />
          <ToolbarButton icon={Underline} tooltip="下划线 (Ctrl+U)" active={isUnderline} onClick={() => setIsUnderline(!isUnderline)} />
          <ToolbarButton icon={Strikethrough} tooltip="删除线" />
          <ToolbarButton icon={Subscript} tooltip="下标" />
          <ToolbarButton icon={Superscript} tooltip="上标" />

          <ToolbarDivider />

          {/* 颜色 */}
          <div className="relative">
            <ToolbarButton icon={Type} tooltip="字体颜色" />
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[#000000]" />
          </div>
          <div className="relative">
            <ToolbarButton icon={Highlighter} tooltip="突出显示颜色" />
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-[#FFFF00]" />
          </div>

          <ToolbarDivider />

          {/* 对齐 */}
          <ToolbarButton icon={AlignLeft} tooltip="左对齐" active={textAlign === "left"} onClick={() => setTextAlign("left")} />
          <ToolbarButton icon={AlignCenter} tooltip="居中对齐" active={textAlign === "center"} onClick={() => setTextAlign("center")} />
          <ToolbarButton icon={AlignRight} tooltip="右对齐" active={textAlign === "right"} onClick={() => setTextAlign("right")} />
          <ToolbarButton icon={AlignJustify} tooltip="两端对齐" active={textAlign === "justify"} onClick={() => setTextAlign("justify")} />

          <ToolbarDivider />

          {/* 列表 */}
          <ToolbarButton icon={List} tooltip="项目符号" />
          <ToolbarButton icon={ListOrdered} tooltip="编号" />
          <ToolbarButton icon={IndentDecrease} tooltip="减少缩进" />
          <ToolbarButton icon={IndentIncrease} tooltip="增加缩进" />

          <ToolbarDivider />

          {/* 插入 */}
          <ToolbarButton icon={Table} tooltip="插入表格" />
          <ToolbarButton icon={Image} tooltip="插入图片" />
          <ToolbarButton icon={Link2} tooltip="插入链接" />

          <ToolbarDivider />

          {/* 清除格式 */}
          <ToolbarButton icon={Eraser} tooltip="清除格式" />

          <div className="flex-1" />

          {/* 缩放控制 */}
          <div className="flex items-center gap-1">
            <ToolbarButton icon={ZoomOut} tooltip="缩小" onClick={() => setZoom(Math.max(50, zoom - 10))} />
            <span className="text-xs text-[#6B7280] w-12 text-center">{zoom}%</span>
            <ToolbarButton icon={ZoomIn} tooltip="放大" onClick={() => setZoom(Math.min(200, zoom + 10))} />
            <ToolbarButton icon={Maximize2} tooltip="适应页面" />
          </div>
        </div>
      </div>

      {/* 编辑器主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 文档编辑区 */}
        <div className="flex-1 overflow-auto bg-[#E8EAED] p-6">
          {/* A4 页面模拟 */}
          <div 
            className="mx-auto bg-white shadow-lg"
            style={{
              width: `${595 * (zoom / 100)}px`,
              minHeight: `${842 * (zoom / 100)}px`,
              padding: `${56 * (zoom / 100)}px`,
              transformOrigin: "top center",
            }}
          >
            <div
              className="outline-none"
              contentEditable
              suppressContentEditableWarning
              style={{
                fontFamily: fontFamily,
                fontSize: `${parseInt(fontSize) * (zoom / 100)}px`,
                lineHeight: 1.75,
                textAlign: textAlign,
                fontWeight: isBold ? "bold" : "normal",
                fontStyle: isItalic ? "italic" : "normal",
                textDecoration: isUnderline ? "underline" : "none",
              }}
              onInput={(e) => {
                const newContent = e.currentTarget.innerText
                setContent(newContent)
                onContentChange?.(newContent)
              }}
              dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }}
            />
          </div>
        </div>

        {/* AI 辅助面板 */}
        {showAiPanel && (
          <div className="w-80 border-l border-[#E5E7EB] bg-white flex flex-col">
            <div className="h-10 px-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#6366F1]" />
                <span className="text-sm font-medium">AI 写作助手</span>
              </div>
              <button
                className="p-1 rounded hover:bg-[#F3F4F6]"
                onClick={() => setShowAiPanel(false)}
              >
                <X className="h-4 w-4 text-[#9CA3AF]" />
              </button>
            </div>
            <div className="flex-1 p-3 overflow-auto">
              {isAiGenerating ? (
                <div className="flex flex-col items-center justify-center h-full text-[#9CA3AF]">
                  <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm">AI 正在分析文档...</p>
                </div>
              ) : aiSuggestion ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] border border-[#C7D2FE]">
                    <p className="text-sm text-[#374151] whitespace-pre-wrap">{aiSuggestion}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1 bg-[#6366F1] hover:bg-[#4F46E5]">
                      <Check className="h-3.5 w-3.5" />
                      采纳建议
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      重新生成
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-[#9CA3AF] text-sm py-8">
                  点击「AI 辅助」按钮获取写作建议
                </div>
              )}
            </div>
            <div className="p-3 border-t border-[#E5E7EB]">
              <Input
                placeholder="输入您的问题或需求..."
                className="text-sm"
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs">润色文字</Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs">扩写内容</Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs">缩减篇幅</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="h-6 bg-[#F9FAFB] border-t border-[#E5E7EB] px-3 flex items-center justify-between text-xs text-[#6B7280]">
        <div className="flex items-center gap-4">
          <span>页 1 / 3</span>
          <span>字数：{content.length}</span>
          <span>中文</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            已保存
          </span>
          <span>缩放 {zoom}%</span>
        </div>
      </div>
    </div>
  )
}
