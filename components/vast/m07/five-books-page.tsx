"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  FileText,
  FileCheck,
  Image,
  BookOpen,
  Download,
  Eye,
  RefreshCw,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface FiveBooksPageProps {
  onBack: () => void
  onSubmit: () => void
}

interface BookFile {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  status: "pending" | "generating" | "success" | "error"
  pages?: number
  size?: string
}

const initialFiles: BookFile[] = [
  { id: "spec", name: "说明书", icon: BookOpen, status: "pending" },
  { id: "claims", name: "权利要求书", icon: FileCheck, status: "pending" },
  { id: "abstract", name: "摘要", icon: FileText, status: "pending" },
  { id: "drawings", name: "附图说明", icon: FileText, status: "pending" },
  { id: "abstract-drawing", name: "摘要附图", icon: Image, status: "pending" },
]

export function FiveBooksPage({ onBack, onSubmit }: FiveBooksPageProps) {
  const [files, setFiles] = useState<BookFile[]>(initialFiles)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const handleGenerate = () => {
    setIsGenerating(true)
    setFiles(files.map((f) => ({ ...f, status: "generating" as const })))

    // 模拟逐个生成
    const fileIds = ["spec", "claims", "abstract", "drawings", "abstract-drawing"]
    const fileSizes = ["128KB", "45KB", "8KB", "12KB", "256KB"]
    const filePages = [15, 3, 1, 2, 1]

    fileIds.forEach((id, index) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: "success" as const, pages: filePages[index], size: fileSizes[index] }
              : f
          )
        )
        if (index === fileIds.length - 1) {
          setIsGenerating(false)
          setGenerated(true)
          setSelectedFile("spec")
        }
      }, (index + 1) * 800)
    })
  }

  const allSuccess = files.every((f) => f.status === "success")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "generating":
        return <Loader2 className="h-4 w-4 text-[#2F80ED] animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-[#D1D5DB]" />
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
            <h1 className="text-sm font-semibold text-[#111827]">五书生成</h1>
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
                  <FileText className="h-4 w-4 mr-2" />
                  生成五书
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
                <Download className="h-4 w-4 mr-2" />
                全部导出
              </Button>
              <Button onClick={onSubmit} disabled={!allSuccess}>
                <Send className="h-4 w-4 mr-2" />
                提交审核
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：文件生成清单 */}
        <Card className="w-80 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">文件生成清单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => {
                const Icon = file.icon
                return (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFile === file.id
                        ? "bg-[#EAF4FF] border border-[#2F80ED]"
                        : "bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-transparent"
                    }`}
                    onClick={() => file.status === "success" && setSelectedFile(file.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-border">
                      <Icon className="h-5 w-5 text-[#6B7280]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#111827]">{file.name}</div>
                      {file.status === "success" && (
                        <div className="text-xs text-[#9CA3AF] mt-0.5">
                          {file.pages} 页 · {file.size}
                        </div>
                      )}
                      {file.status === "generating" && (
                        <div className="text-xs text-[#2F80ED] mt-0.5">正在生成...</div>
                      )}
                    </div>
                    {getStatusIcon(file.status)}
                  </div>
                )
              })}
            </div>

            {generated && allSuccess && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">五书文件生成完成</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧：文件预览 */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedFile
                  ? files.find((f) => f.id === selectedFile)?.name + " 预览"
                  : "文件预览"}
              </CardTitle>
              {selectedFile && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    全屏预览
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    下载
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {!generated ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p>点击"生成五书"开始生成专利申请文件</p>
                </div>
              </div>
            ) : !selectedFile ? (
              <div className="h-full flex items-center justify-center text-[#9CA3AF]">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-3 text-[#D1D5DB]" />
                  <p>选择左侧文件进行预览</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6">
                  {selectedFile === "spec" && (
                    <div className="prose prose-sm max-w-none">
                      <h1 className="text-xl font-bold text-center mb-6">说 明 书</h1>
                      <h2 className="text-lg font-semibold">智能温控系统</h2>

                      <h3 className="text-base font-medium mt-6">技术领域</h3>
                      <p className="text-[#374151]">
                        [0001]
                        本发明涉及智能控制技术领域，尤其涉及一种基于人工智能的温度控制系统及方法。
                      </p>

                      <h3 className="text-base font-medium mt-6">背景技术</h3>
                      <p className="text-[#374151]">
                        [0002]
                        现有的温度控制系统通常采用简单的阈值控制方式，当温度超过或低于设定阈值时，系统才会启动制冷或制热设备。
                      </p>
                      <p className="text-[#374151]">
                        [0003] 这种控制方式存在以下技术问题：1、响应滞后；2、能源浪费；3、缺乏预测能力。
                      </p>

                      <h3 className="text-base font-medium mt-6">发明内容</h3>
                      <p className="text-[#374151]">
                        [0004]
                        为解决上述技术问题，本发明提供一种智能温控系统，包括：传感器模块、AI处理单元、执行机构和反馈回路。
                      </p>

                      <h3 className="text-base font-medium mt-6">附图说明</h3>
                      <p className="text-[#374151]">[0005] 图1是本发明实施例提供的智能温控系统的结构框图；</p>
                      <p className="text-[#374151]">[0006] 图2是本发明实施例提供的AI处理单元的内部结构示意图；</p>

                      <h3 className="text-base font-medium mt-6">具体实施方式</h3>
                      <p className="text-[#374151]">
                        [0007]
                        下面将结合本发明实施例中的附图，对本发明实施例中的技术方案进行清楚、完整地描述。
                      </p>
                    </div>
                  )}

                  {selectedFile === "claims" && (
                    <div className="prose prose-sm max-w-none">
                      <h1 className="text-xl font-bold text-center mb-6">权 利 要 求 书</h1>

                      <p className="text-[#374151] mb-4">
                        1. 一种智能温控系统，其特征在于，包括：
                      </p>
                      <p className="text-[#374151] ml-4 mb-2">
                        传感器模块，用于采集环境温度、湿度、光照强度等多维环境参数；
                      </p>
                      <p className="text-[#374151] ml-4 mb-2">
                        AI处理单元，接收所述传感器模块采集的数据，并基于深度学习模型进行分析处理，预测温度变化趋势，生成控制指令；
                      </p>
                      <p className="text-[#374151] ml-4 mb-2">
                        执行机构，根据所述AI处理单元的控制指令，执行相应的温度调节操作；
                      </p>
                      <p className="text-[#374151] ml-4 mb-4">
                        反馈回路，用于将执行结果反馈至所述AI处理单元，实现闭环控制。
                      </p>

                      <p className="text-[#374151] mb-4">
                        2.
                        根据权利要求1所述的智能温控系统，其特征在于，所述AI处理单元采用LSTM神经网络模型。
                      </p>

                      <p className="text-[#374151] mb-4">
                        3.
                        根据权利要求2所述的智能温控系统，其特征在于，所述隐藏层包含多个LSTM单元，用于处理时序数据。
                      </p>
                    </div>
                  )}

                  {selectedFile === "abstract" && (
                    <div className="prose prose-sm max-w-none">
                      <h1 className="text-xl font-bold text-center mb-6">摘 要</h1>

                      <p className="text-[#374151]">
                        本发明公开了一种智能温控系统，包括传感器模块、AI处理单元、执行机构和反馈回路。传感器模块用于采集环境温度、湿度、光照强度等多维环境参数；AI处理单元接收传感器模块采集的数据，并基于深度学习模型进行分析处理，预测温度变化趋势；执行机构根据AI处理单元的控制指令执行温度调节操作；反馈回路用于将执行结果反馈至AI处理单元。本发明通过AI处理单元的深度学习模型预测温度变化趋势，实现提前调控，显著提升用户舒适度，相比传统方案节能约20%-30%。
                      </p>
                    </div>
                  )}

                  {selectedFile === "drawings" && (
                    <div className="prose prose-sm max-w-none">
                      <h1 className="text-xl font-bold text-center mb-6">附 图 说 明</h1>

                      <p className="text-[#374151] mb-4">图1是本发明实施例提供的智能温控系统的结构框图；</p>
                      <p className="text-[#374151] mb-4">
                        图2是本发明实施例提供的AI处理单元的内部结构示意图；
                      </p>
                      <p className="text-[#374151] mb-4">图3是本发明实施例提供的控制方法的流程图；</p>
                      <p className="text-[#374151] mb-4">
                        图4是本发明实施例提供的深度学习模型的网络结构图。
                      </p>

                      <h3 className="text-base font-medium mt-6">附图标记说明：</h3>
                      <p className="text-[#374151]">100-传感器模块；101-温度传感器；102-湿度传感器；103-光照传感器；</p>
                      <p className="text-[#374151]">200-AI处理单元；201-输入层；202-隐藏层；203-输出层；</p>
                      <p className="text-[#374151]">300-执行机构；400-反馈回路。</p>
                    </div>
                  )}

                  {selectedFile === "abstract-drawing" && (
                    <div className="prose prose-sm max-w-none">
                      <h1 className="text-xl font-bold text-center mb-6">摘 要 附 图</h1>
                      <div className="flex items-center justify-center p-8 bg-[#F9FAFB] rounded-lg border border-border">
                        <div className="text-center">
                          <Image className="h-16 w-16 mx-auto mb-4 text-[#D1D5DB]" />
                          <p className="text-sm text-[#6B7280]">图1：智能温控系统结构框图</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
