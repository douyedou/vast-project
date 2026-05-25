"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge, type DisclosureStatus } from "@/components/vast/status-badge"
import {
  Search,
  Filter,
  Eye,
  Brain,
  FileText,
  Layers,
  ShieldCheck,
  Package,
  Send,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ModelListProps {
  onViewDetail: (id: string) => void
  onNavigate: (page: string) => void
}

// M06 阶段状态定义（对应11个核心阶段）
// 1-材料解析 2-专利初检 3-交底补充 4-完整交底 5-二次检索 
// 6-技术对比 7-结构化 8-关系建模 9-校验评分 10-数据包 11-提交M07

const mockModels = [
  {
    id: "M06-2024-001",
    sourceId: "SRC-2024-0125",
    caseId: "CASE-2024-0089",
    title: "基于深度学习的图像识别方法",
    modelType: "已立案",
    patentType: "发明",
    applicationMode: "普通申请",
    status: "supplement",
    stage: 3,
    completenessScore: 72,
    noveltyScore: 85,
    qualityScore: 78,
    owner: "张工程师",
    updateTime: "2024-01-15 14:30",
  },
  {
    id: "M06-2024-002",
    sourceId: "SRC-2024-0126",
    caseId: null,
    title: "智能家居控制系统及其控制方法",
    modelType: "售前咨询",
    patentType: "发明",
    applicationMode: "优先审查",
    status: "inspection",
    stage: 2,
    completenessScore: null,
    noveltyScore: null,
    qualityScore: null,
    owner: "李工程师",
    updateTime: "2024-01-15 11:20",
  },
  {
    id: "M06-2024-003",
    sourceId: "SRC-2024-0127",
    caseId: "CASE-2024-0090",
    title: "一种新型电池管理系统",
    modelType: "已立案",
    patentType: "实用新型",
    applicationMode: null,
    status: "validation-blocked",
    stage: 9,
    completenessScore: 45,
    noveltyScore: 60,
    qualityScore: 52,
    owner: "王工程师",
    updateTime: "2024-01-14 16:45",
  },
  {
    id: "M06-2024-004",
    sourceId: "SRC-2024-0128",
    caseId: "CASE-2024-0091",
    title: "区块链数据存储方法",
    modelType: "已立案",
    patentType: "发明",
    applicationMode: "普通申请",
    status: "package",
    stage: 10,
    completenessScore: 92,
    noveltyScore: 88,
    qualityScore: 90,
    owner: "赵工程师",
    updateTime: "2024-01-14 10:15",
  },
  {
    id: "M06-2024-005",
    sourceId: "SRC-2024-0129",
    caseId: "CASE-2024-0092",
    title: "自动驾驶决策系统",
    modelType: "已立案",
    patentType: "发明",
    applicationMode: "预先审查",
    status: "submitted",
    stage: 11,
    completenessScore: 95,
    noveltyScore: 92,
    qualityScore: 94,
    owner: "张工程师",
    updateTime: "2024-01-13 09:30",
  },
  {
    id: "M06-2024-006",
    sourceId: "SRC-2024-0130",
    caseId: null,
    title: "智能语音识别系统",
    modelType: "售前咨询",
    patentType: "发明",
    applicationMode: null,
    status: "structuring",
    stage: 7,
    completenessScore: 65,
    noveltyScore: null,
    qualityScore: null,
    owner: "李工程师",
    updateTime: "2024-01-12 15:20",
  },
]

// 状态标签对应M06的11个阶段
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    "parsing": "材料解析",
    "inspection": "专利初检",
    "supplement": "交底补充",
    "full-disclosure": "完整交底",
    "second-search": "二次检索",
    "prior-art": "技术对比",
    "structuring": "结构化",
    "relation": "关系建模",
    "validation": "校验评分",
    "validation-blocked": "校验阻断",
    "package": "数据包",
    "submitted": "已提交M07",
  }
  return labels[status] || status
}

const getStatusVariant = (status: string): DisclosureStatus => {
  const map: Record<string, DisclosureStatus> = {
    "parsing": "waiting-order",
    "inspection": "initial-review",
    "supplement": "processing",
    "full-disclosure": "processing",
    "second-search": "initial-review",
    "prior-art": "processing",
    "structuring": "processing",
    "relation": "processing",
    "validation": "processing",
    "validation-blocked": "returned",
    "package": "filed",
    "submitted": "presale",
  }
  return map[status] || "waiting-order"
}

const getScoreColor = (score: number | null) => {
  if (score === null) return "text-[#9CA3AF]"
  if (score >= 80) return "text-[#10B981]"
  if (score >= 60) return "text-[#F59E0B]"
  return "text-[#EF4444]"
}

export function ModelList({ onViewDetail, onNavigate }: ModelListProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [modelType, setModelType] = useState("all")
  const [patentType, setPatentType] = useState("all")
  const [status, setStatus] = useState("all")

  return (
    <div className="space-y-4">
      {/* M06 Progress Bar */}
      <M06ProgressBar currentStep={1} />

      <div className="px-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">模型列表</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有 M06 交底模型，点击进入模型详情</p>
        </div>
        <Button
          className="gap-2 bg-[#2F80ED] hover:bg-[#1E5EFF]"
          onClick={() => onNavigate("m06-create-model")}
        >
          新建模型
        </Button>
      </div>

      {/* 筛选区 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="搜索模型编号、专利名称..."
                className="pl-10"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Select value={modelType} onValueChange={setModelType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="模型类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="presale">售前咨询</SelectItem>
                <SelectItem value="filed">已立案</SelectItem>
              </SelectContent>
            </Select>
            <Select value={patentType} onValueChange={setPatentType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="专利类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部专利</SelectItem>
                <SelectItem value="invention">发明</SelectItem>
                <SelectItem value="utility">实用新型</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="模型阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                <SelectItem value="inspection">专利初检</SelectItem>
                <SelectItem value="supplement">交底补充</SelectItem>
                <SelectItem value="second-search">二次检索</SelectItem>
                <SelectItem value="prior-art">技术对比</SelectItem>
                <SelectItem value="structuring">结构化</SelectItem>
                <SelectItem value="relation">关系建模</SelectItem>
                <SelectItem value="validation">校验评分</SelectItem>
                <SelectItem value="validation-blocked">校验阻断</SelectItem>
                <SelectItem value="package">数据包</SelectItem>
                <SelectItem value="submitted">已提交M07</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              更多筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB]">
                <TableHead className="w-32">模型编号</TableHead>
                <TableHead className="w-28">来源/案件</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-20">模型类型</TableHead>
                <TableHead className="w-20">专利类型</TableHead>
                <TableHead className="w-28">当前阶段</TableHead>
                <TableHead className="w-20 text-center">完整性</TableHead>
                <TableHead className="w-20 text-center">新创性</TableHead>
                <TableHead className="w-20 text-center">综合分</TableHead>
                <TableHead className="w-20">负责人</TableHead>
                <TableHead className="w-36">更新时间</TableHead>
                <TableHead className="w-24 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockModels.map((model) => (
                <TableRow key={model.id} className="hover:bg-[#F9FAFB]">
                  <TableCell className="font-medium text-[#2F80ED]">{model.id}</TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div className="text-[#374151]">{model.sourceId}</div>
                      {model.caseId && (
                        <div className="text-[#9CA3AF]">{model.caseId}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate text-[#111827]" title={model.title}>
                      {model.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        model.modelType === "已立案"
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : "bg-[#DBEAFE] text-[#1E40AF]"
                      }`}
                    >
                      {model.modelType}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#374151]">{model.patentType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{model.stage}/11</span>
                      <StatusBadge status={getStatusVariant(model.status)} />
                    </div>
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getScoreColor(model.completenessScore)}`}>
                    {model.completenessScore ?? "-"}
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getScoreColor(model.noveltyScore)}`}>
                    {model.noveltyScore ?? "-"}
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getScoreColor(model.qualityScore)}`}>
                    {model.qualityScore ?? "-"}
                  </TableCell>
                  <TableCell className="text-[#374151]">{model.owner}</TableCell>
                  <TableCell className="text-[#6B7280] text-xs">{model.updateTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewDetail(model.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate("m06-ai-inspection")}>
                            <Brain className="h-4 w-4 mr-2" />
                            专利初检
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate("m06-supplement")}>
                            <FileText className="h-4 w-4 mr-2" />
                            交底补充
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate("m06-validation")}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            校验评分
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate("m06-package")}>
                            <Package className="h-4 w-4 mr-2" />
                            输出物管理
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate("m06-submit-m07")}>
                            <Send className="h-4 w-4 mr-2" />
                            提交M07
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-[#6B7280]">共 128 个模型，当前显示 1-6</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2F80ED] text-white hover:bg-[#1E5EFF]">
            1
          </Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <span className="text-[#6B7280]">...</span>
          <Button variant="outline" size="sm">22</Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}
