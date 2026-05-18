"use client"

import { useState, useEffect } from "react"
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
  Send,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface CreationTaskListProps {
  onViewDetail: (id: string) => void
}

interface CaseItem {
  id: string
  case_id: string
  title: string
  type: string
  status: string
  engineer_name: string | null
  created_at: string
  updated_at: string
}

const typeMap: Record<string, string> = {
  invention: "发明",
  utility: "实用新型",
  design: "外观设计",
}

const statusVariantMap: Record<string, string> = {
  draft: "presale",
  assigning: "presale",
  searching: "processing",
  confirming: "processing",
  filing: "waiting-order",
  disclosure_pending: "waiting-order",
  writing: "processing",
  reviewing: "initial-review",
  completed: "filed",
  rejected: "returned",
}

const statusLabelMap: Record<string, string> = {
  draft: "草稿",
  assigning: "待分配",
  searching: "检索中",
  confirming: "待确认",
  filing: "立案中",
  disclosure_pending: "待交底",
  writing: "撰写中",
  reviewing: "审核中",
  completed: "已完成",
  rejected: "已退回",
}

export function CreationTaskList({ onViewDetail }: CreationTaskListProps) {
  const [tasks, setTasks] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [patentType, setPatentType] = useState("all")
  const [docStatus, setDocStatus] = useState("all")

  useEffect(() => {
    const token = localStorage.getItem("vast_token")
    fetch("/api/cases?page=1&pageSize=50", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) {
          setTasks(data.data.list || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchKeyword ||
      task.case_id?.includes(searchKeyword) ||
      task.title?.includes(searchKeyword)
    const matchesType = patentType === "all" || task.type === patentType
    const matchesStatus = docStatus === "all" || task.status === docStatus
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">创作任务列表</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有专利创作任务</p>
        </div>
      </div>

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
                <SelectValue placeholder="案件状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="writing">撰写中</SelectItem>
                <SelectItem value="reviewing">审核中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="rejected">已退回</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB]">
                  <TableHead className="w-32">案件编号</TableHead>
                  <TableHead>专利名称</TableHead>
                  <TableHead className="w-20">类型</TableHead>
                  <TableHead className="w-28">案件状态</TableHead>
                  <TableHead className="w-16">负责人</TableHead>
                  <TableHead className="w-32">更新时间</TableHead>
                  <TableHead className="w-28 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-[#F9FAFB]">
                    <TableCell className="font-mono text-xs text-[#6B7280]">{task.case_id}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-[#111827]">{task.title}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded bg-[#F0F3F8] text-[#374151]">
                        {typeMap[task.type] || task.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={statusVariantMap[task.status] || "presale"}
                        label={statusLabelMap[task.status] || task.status}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-[#374151]">{task.engineer_name || "-"}</TableCell>
                    <TableCell className="text-xs text-[#9CA3AF]">
                      {new Date(task.updated_at).toLocaleString("zh-CN")}
                    </TableCell>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-[#6B7280]">共 {filteredTasks.length} 条记录</div>
      </div>
    </div>
  )
}
