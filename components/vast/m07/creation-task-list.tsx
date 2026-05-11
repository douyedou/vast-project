"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { StatusBadge } from "@/components/vast/status-badge"
import {
  Search,
  Filter,
  Eye,
  Edit3,
  FileCheck,
  Send,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface CreationTaskListProps {
  onViewDetail: (id: string) => void
}

const tasks = [
  {
    id: "M07-2024-001",
    name: "智能温控系统发明专利",
    type: "发明",
    method: "预先审查",
    status: "说明书生成中",
    coverageRate: 85,
    supportRate: 90,
    similarity: 12,
    version: "v1.2",
    owner: "张工",
    updatedAt: "2024-01-15 10:30",
  },
  {
    id: "M07-2024-002",
    name: "新型散热装置实用新型",
    type: "实用新型",
    method: "普通申请",
    status: "权利要求撰写中",
    coverageRate: 92,
    supportRate: 88,
    similarity: 8,
    version: "v2.0",
    owner: "李工",
    updatedAt: "2024-01-15 09:45",
  },
  {
    id: "M07-2024-003",
    name: "数据处理方法发明专利",
    type: "发明",
    method: "优先审查",
    status: "退回修改",
    coverageRate: 78,
    supportRate: 72,
    similarity: 35,
    version: "v1.5",
    owner: "张工",
    updatedAt: "2024-01-14 16:20",
  },
  {
    id: "M07-2024-004",
    name: "移动终端结构设计",
    type: "实用新型",
    method: "普通申请",
    status: "全文件复核中",
    coverageRate: 95,
    supportRate: 94,
    similarity: 15,
    version: "v3.0",
    owner: "王工",
    updatedAt: "2024-01-14 14:10",
  },
  {
    id: "M07-2024-005",
    name: "无线充电系统专利",
    type: "发明",
    method: "预先审查",
    status: "待提交审核",
    coverageRate: 98,
    supportRate: 96,
    similarity: 10,
    version: "v2.1",
    owner: "李工",
    updatedAt: "2024-01-14 11:30",
  },
  {
    id: "M07-2024-006",
    name: "智能家居控制方法",
    type: "发明",
    method: "普通申请",
    status: "待创作",
    coverageRate: 0,
    supportRate: 0,
    similarity: 0,
    version: "-",
    owner: "张工",
    updatedAt: "2024-01-13 17:00",
  },
]

const getStatusVariant = (status: string) => {
  switch (status) {
    case "待创作":
      return "presale"
    case "说明书生成中":
      return "processing"
    case "权利要求撰写中":
      return "initial-review"
    case "全文件复核中":
      return "waiting-order"
    case "退回修改":
      return "returned"
    case "待提交审核":
      return "filed"
    case "已提交审核":
      return "filed"
    default:
      return "presale"
  }
}

const getSimilarityColor = (value: number) => {
  if (value === 0) return "text-[#9CA3AF]"
  if (value > 30) return "text-red-600"
  if (value > 20) return "text-orange-500"
  return "text-green-600"
}

const getRateColor = (value: number) => {
  if (value === 0) return "text-[#9CA3AF]"
  if (value < 80) return "text-orange-500"
  if (value < 90) return "text-[#2F80ED]"
  return "text-green-600"
}

export function CreationTaskList({ onViewDetail }: CreationTaskListProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [patentType, setPatentType] = useState("all")
  const [docStatus, setDocStatus] = useState("all")

  return (
    <div className="p-6 space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">创作任务列表</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有专利创作任务</p>
        </div>
      </div>

      {/* 筛选区 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="搜索案件编号/专利名称"
                className="pl-9"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Select value={patentType} onValueChange={setPatentType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="专利类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="invention">发明</SelectItem>
                <SelectItem value="utility">实用新型</SelectItem>
              </SelectContent>
            </Select>
            <Select value={docStatus} onValueChange={setDocStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="文档状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待创作</SelectItem>
                <SelectItem value="spec">说明书处理中</SelectItem>
                <SelectItem value="claims">权利要求处理中</SelectItem>
                <SelectItem value="review">全文件复核中</SelectItem>
                <SelectItem value="return">退回修改</SelectItem>
                <SelectItem value="submit">待提交审核</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 任务表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F9FAFB]">
                <TableHead className="w-32">案件编号</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-20">类型</TableHead>
                <TableHead className="w-24">申请方式</TableHead>
                <TableHead className="w-32">文档状态</TableHead>
                <TableHead className="w-24 text-center">覆盖率</TableHead>
                <TableHead className="w-24 text-center">支持率</TableHead>
                <TableHead className="w-24 text-center">AI相似性</TableHead>
                <TableHead className="w-16">版本</TableHead>
                <TableHead className="w-16">负责人</TableHead>
                <TableHead className="w-40">更新时间</TableHead>
                <TableHead className="w-28 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-[#F9FAFB]">
                  <TableCell className="font-mono text-xs text-[#6B7280]">{task.id}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-[#111827]">{task.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-1 rounded bg-[#F0F3F8] text-[#374151]">
                      {task.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#6B7280]">{task.method}</TableCell>
                  <TableCell>
                    <StatusBadge status={getStatusVariant(task.status)} label={task.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${getRateColor(task.coverageRate)}`}>
                      {task.coverageRate > 0 ? `${task.coverageRate}%` : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${getRateColor(task.supportRate)}`}>
                      {task.supportRate > 0 ? `${task.supportRate}%` : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-sm font-medium ${getSimilarityColor(task.similarity)}`}>
                      {task.similarity > 0 ? `${task.similarity}%` : "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-[#6B7280]">{task.version}</TableCell>
                  <TableCell className="text-sm text-[#374151]">{task.owner}</TableCell>
                  <TableCell className="text-xs text-[#9CA3AF]">{task.updatedAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onViewDetail(task.id)}
                      >
                        <Eye className="h-4 w-4 text-[#6B7280]" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit3 className="h-4 w-4 text-[#2F80ED]" />
                      </Button>
                      {task.status === "退回修改" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <RotateCcw className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      {task.status === "待提交审核" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Send className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
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
        <div className="text-sm text-[#6B7280]">共 {tasks.length} 条记录</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 text-sm bg-[#2F80ED] text-white rounded">1</span>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
