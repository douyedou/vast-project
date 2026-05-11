"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "./status-badge"
import {
  ArrowLeft,
  Users,
  Search,
  FileCheck,
  XCircle,
  Clock,
  FileText,
  Image,
  Music,
  Video,
  Download,
  Eye,
  ChevronRight,
  Send,
} from "lucide-react"

interface SourceDetailProps {
  sourceId: string
  onBack: () => void
  onAssign: () => void
  onNavigate?: (page: string) => void
}

const mockDetail = {
  id: "1",
  code: "DS-2024-001",
  clientName: "华为技术有限公司",
  applicantName: "华为技术有限公司",
  patentTitle: "一种无线通信设备及方法",
  sourceType: "售前咨询",
  patentType: "发明专利",
  applicationMethod: "预先审查",
  status: "checking" as const,
  isSigned: false,
  manager: "李四",
  engineer: "王五",
  techField: "电子信息",
  consultPurpose: "产品保护",
  plannedDate: "2024-03-15",
  createdAt: "2024-03-01 10:30:00",
  materials: [
    { id: 1, name: "技术交底书.docx", type: "document", size: "2.3 MB" },
    { id: 2, name: "产品示意图.png", type: "image", size: "1.2 MB" },
    { id: 3, name: "技术讲解录音.mp3", type: "audio", size: "5.6 MB" },
    { id: 4, name: "产品演示视频.mp4", type: "video", size: "45.2 MB" },
  ],
  aiResult: {
    status: "completed",
    completedAt: "2024-03-02 14:30:00",
    suggestion: "建议申报",
    noveltyScore: 85,
    summary:
      "该技术方案涉及无线通信领域的创新设计，通过改进信号处理算法实现更高的传输效率。初步检索显示，该方案具有较好的新颖性，建议进行专利申报。",
    relatedPatents: [
      { id: 1, title: "CN202310123456A - 无线通信信号处理方法", similarity: "32%" },
      { id: 2, title: "CN202310234567A - 通信设备及其控制系统", similarity: "28%" },
    ],
  },
  assignRecords: [
    {
      id: 1,
      manager: "李四",
      engineer: "王五",
      taskType: "售前初检",
      assignedAt: "2024-03-01 14:00:00",
      deadline: "2024-03-05",
    },
  ],
  statusHistory: [
    { id: 1, status: "售前咨询", time: "2024-03-01 10:30:00", operator: "张销售" },
    { id: 2, status: "待分配", time: "2024-03-01 10:30:00", operator: "系统" },
    { id: 3, status: "初检中", time: "2024-03-01 14:00:00", operator: "李四" },
  ],
  operationLogs: [
    { id: 1, action: "创建来源", operator: "张销售", time: "2024-03-01 10:30:00" },
    { id: 2, action: "分配工程师", operator: "李四", time: "2024-03-01 14:00:00", detail: "分配给王五进行售前初检" },
    { id: 3, action: "AI初检完成", operator: "系统", time: "2024-03-02 14:30:00" },
  ],
}

const getFileIcon = (type: string) => {
  switch (type) {
    case "document":
      return FileText
    case "image":
      return Image
    case "audio":
      return Music
    case "video":
      return Video
    default:
      return FileText
  }
}

export function SourceDetail({ onBack, onAssign, onNavigate }: SourceDetailProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[#111827]">
                {mockDetail.patentTitle}
              </h1>
              <StatusBadge status={mockDetail.status} />
            </div>
            <p className="text-sm text-[#6B7280] mt-1">
              来源编号：
              <span className="font-mono text-[#2F80ED]">{mockDetail.code}</span>
              <span className="mx-2">·</span>
              {mockDetail.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={onAssign}
          >
            <Users className="h-4 w-4" />
            分配工程师
          </Button>
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            查看AI初检
          </Button>
          <Button variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            标记等待订单
          </Button>
          <Button className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white gap-2">
            <FileCheck className="h-4 w-4" />
            正式立案
          </Button>
          <Button 
            className="bg-[#13A38B] hover:bg-[#13A38B]/90 text-white gap-2"
            onClick={() => onNavigate?.("m06-create-model")}
          >
            <Send className="h-4 w-4" />
            进入M06建模
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-[#F5222D] hover:text-[#F5222D] hover:bg-[#FFF1F0]"
            onClick={() => onNavigate?.("m09-scrap-cases")}
          >
            <XCircle className="h-4 w-4" />
            不立案
          </Button>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="basic">
        <TabsList className="bg-[#F5F7FA]">
          <TabsTrigger value="basic" className="data-[state=active]:bg-white">
            基础信息
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-white">
            交底材料
          </TabsTrigger>
          <TabsTrigger value="ai-result" className="data-[state=active]:bg-white">
            AI初检结果
          </TabsTrigger>
          <TabsTrigger value="assign" className="data-[state=active]:bg-white">
            分配记录
          </TabsTrigger>
          <TabsTrigger value="status" className="data-[state=active]:bg-white">
            状态流转
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-white">
            操作日志
          </TabsTrigger>
        </TabsList>

        {/* 基础信息 */}
        <TabsContent value="basic" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#111827] border-b border-[#E5EAF2] pb-2">
                    客户信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">客户名称</span>
                      <span className="text-[#1F2937]">{mockDetail.clientName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">申请人名称</span>
                      <span className="text-[#1F2937]">{mockDetail.applicantName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">咨询目的</span>
                      <span className="text-[#1F2937]">{mockDetail.consultPurpose}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">技术领域</span>
                      <span className="text-[#1F2937]">{mockDetail.techField}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#111827] border-b border-[#E5EAF2] pb-2">
                    专利信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">专利类型</span>
                      <span className="text-[#1F2937]">{mockDetail.patentType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">申请方式</span>
                      <span className="text-[#1F2937]">{mockDetail.applicationMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">是否签单</span>
                      <span className={mockDetail.isSigned ? "text-[#52C41A]" : "text-[#9CA3AF]"}>
                        {mockDetail.isSigned ? "已签单" : "未签单"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">计划受理时间</span>
                      <span className="text-[#1F2937] font-mono">{mockDetail.plannedDate}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#111827] border-b border-[#E5EAF2] pb-2">
                    负责人信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">来源类型</span>
                      <span className="text-[#1F2937]">{mockDetail.sourceType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">专利经理</span>
                      <span className="text-[#1F2937]">{mockDetail.manager}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">专利工程师</span>
                      <span className="text-[#1F2937]">{mockDetail.engineer}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B7280]">创建时间</span>
                      <span className="text-[#1F2937] font-mono text-xs">{mockDetail.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 交底材料 */}
        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">
                已上传材料（{mockDetail.materials.length}）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {mockDetail.materials.map((material) => {
                  const Icon = getFileIcon(material.type)
                  return (
                    <div
                      key={material.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-[#E5EAF2] hover:border-[#2F80ED] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
                          <Icon className="h-5 w-5 text-[#6B7280]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1F2937]">{material.name}</p>
                          <p className="text-xs text-[#9CA3AF]">{material.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI初检结果 */}
        <TabsContent value="ai-result" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-[#111827]">
                    AI检索初稿
                  </CardTitle>
                  <span className="text-xs text-[#9CA3AF]">
                    完成时间：{mockDetail.aiResult.completedAt}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-[#F5F7FA] rounded-lg">
                  <p className="text-sm text-[#1F2937] leading-relaxed">
                    {mockDetail.aiResult.summary}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#111827] mb-3">相关专利</h4>
                  <div className="space-y-2">
                    {mockDetail.aiResult.relatedPatents.map((patent) => (
                      <div
                        key={patent.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-[#E5EAF2] hover:bg-[#F5F7FA] cursor-pointer"
                      >
                        <span className="text-sm text-[#2F80ED]">{patent.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#9CA3AF]">
                            相似度：{patent.similarity}
                          </span>
                          <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#111827]">
                  初检结论
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-[#E8F8F5] rounded-lg">
                  <div className="text-3xl font-bold text-[#13A38B]">
                    {mockDetail.aiResult.noveltyScore}
                  </div>
                  <div className="text-sm text-[#13A38B] mt-1">新颖性评分</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
                  <span className="text-sm text-[#6B7280]">申报建议</span>
                  <span className="px-2 py-1 bg-[#E8F8F5] text-[#13A38B] text-xs rounded">
                    {mockDetail.aiResult.suggestion}
                  </span>
                </div>
                <Button className="w-full bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white">
                  反馈销售/客服
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 分配记录 */}
        <TabsContent value="assign" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">分配记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDetail.assignRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-[#E5EAF2]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#2F80ED]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#1F2937]">
                          <span className="font-medium">{record.manager}</span>
                          <span className="mx-2 text-[#9CA3AF]">分配给</span>
                          <span className="font-medium">{record.engineer}</span>
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          任务类型：{record.taskType} · 截止时间：{record.deadline}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#9CA3AF] font-mono">{record.assignedAt}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 状态流转 */}
        <TabsContent value="status" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">状态流转</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-8">
                {mockDetail.statusHistory.map((item, index) => (
                  <div key={item.id} className="relative pb-6 last:pb-0">
                    {index < mockDetail.statusHistory.length - 1 && (
                      <div className="absolute left-[-20px] top-3 w-0.5 h-full bg-[#E5EAF2]" />
                    )}
                    <div className="absolute left-[-24px] top-1 w-2 h-2 rounded-full bg-[#2F80ED]" />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-[#EAF4FF] text-[#2F80ED]">
                          {item.status}
                        </span>
                        <span className="ml-3 text-sm text-[#6B7280]">
                          操作人：{item.operator}
                        </span>
                      </div>
                      <span className="text-xs text-[#9CA3AF] font-mono">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 操作日志 */}
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#111827]">操作日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDetail.operationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-[#F5F7FA]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#2F80ED] mt-2" />
                      <div>
                        <p className="text-sm text-[#1F2937]">
                          <span className="font-medium">{log.operator}</span>
                          <span className="mx-2 text-[#9CA3AF]">·</span>
                          <span>{log.action}</span>
                        </p>
                        {log.detail && (
                          <p className="text-xs text-[#9CA3AF] mt-1">{log.detail}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[#9CA3AF] font-mono whitespace-nowrap">
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
