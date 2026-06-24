"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, Download, Eye, MoreHorizontal, ArrowRightLeft, ChevronLeft, ChevronRight } from "lucide-react"

interface AllCasesListProps {
  onNavigate: (page: string) => void
  onViewDetail?: (id: string) => void
}

interface CaseItem {
  id: string
  case_id: string
  title: string
  type: string
  status: string
  engineer_name: string | null
  created_at: string
  priority: string
}

const typeMap: Record<string, string> = {
  invention: "发明",
  utility: "实用新型",
  design: "外观设计",
}

const statusMap: Record<string, string> = {
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

const priorityProgress: Record<string, number> = {
  high: 80,
  normal: 50,
  low: 20,
}

const getStatusBadge = (status: string) => {
  const config: Record<string, { className: string }> = {
    writing: { className: "bg-blue-100 text-blue-700" },
    reviewing: { className: "bg-purple-100 text-purple-700" },
    completed: { className: "bg-green-100 text-green-700" },
    draft: { className: "bg-gray-100 text-gray-500" },
    assigning: { className: "bg-orange-100 text-orange-700" },
    searching: { className: "bg-cyan-100 text-cyan-700" },
    confirming: { className: "bg-yellow-100 text-yellow-700" },
    filing: { className: "bg-indigo-100 text-indigo-700" },
    disclosure_pending: { className: "bg-pink-100 text-pink-700" },
    rejected: { className: "bg-red-100 text-red-700" },
  }
  return <Badge className={config[status]?.className || "bg-gray-100 text-gray-500"}>{statusMap[status] || status}</Badge>
}

export function AllCasesList({ onNavigate, onViewDetail }: AllCasesListProps) {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [transitionMap, setTransitionMap] = useState<Record<string, string[]>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  const loadCases = (p: number, ps: number = pageSize) => {
    setLoading(true)
    const token = localStorage.getItem("vast_token")
    const params = new URLSearchParams()
    params.set("page", String(p))
    params.set("pageSize", String(ps))
    if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim())
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (typeFilter !== "all") params.set("type", typeFilter)
    fetch(`/api/cases?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) {
          setCases(data.data.list || [])
          setTotal(data.data.total || 0)
          setPage(data.data.page || 1)
          setPageSize(data.data.pageSize || ps)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCases(1)
  }, [searchKeyword, statusFilter, typeFilter])

  const loadTransitions = async (caseId: string) => {
    if (transitionMap[caseId]) return
    const token = localStorage.getItem("vast_token")
    try {
      const res = await fetch(`/api/cases/${caseId}/transition`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.code === 200) {
        setTransitionMap((prev) => ({ ...prev, [caseId]: data.data.nextStates || [] }))
      }
    } catch {
      // ignore
    }
  }

  const doTransition = async (caseId: string, toStatus: string) => {
    const token = localStorage.getItem("vast_token")
    try {
      const res = await fetch(`/api/cases/${caseId}/transition`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ to: toStatus }),
      })
      const data = await res.json()
      if (data.code === 200) {
        loadCases(page, pageSize)
        setTransitionMap((prev) => ({ ...prev, [caseId]: [] }))
      } else {
        alert(data.message || "状态流转失败")
      }
    } catch {
      alert("状态流转请求失败")
    }
  }

  // 搜索/筛选/分页已由后端处理
  const filteredCases = cases

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">全部案件列表</h1>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          导出列表
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索案件号、专利名称..."
                className="pl-9"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="案件状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="assigning">待分配</SelectItem>
                <SelectItem value="searching">检索中</SelectItem>
                <SelectItem value="confirming">待确认</SelectItem>
                <SelectItem value="filing">立案中</SelectItem>
                <SelectItem value="disclosure_pending">待交底</SelectItem>
                <SelectItem value="writing">撰写中</SelectItem>
                <SelectItem value="reviewing">审核中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="rejected">已退回</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="专利类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="invention">发明</SelectItem>
                <SelectItem value="utility">实用新型</SelectItem>
                <SelectItem value="design">外观设计</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">加载中...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">案件号</TableHead>
                    <TableHead>专利名称</TableHead>
                    <TableHead className="w-[80px]">类型</TableHead>
                    <TableHead className="w-[80px]">状态</TableHead>
                    <TableHead className="w-[80px]">工程师</TableHead>
                    <TableHead className="w-[100px]">创建日期</TableHead>
                    <TableHead className="w-[100px]">进度</TableHead>
                    <TableHead className="w-[100px] text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium text-primary">{item.case_id}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.title}>{item.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeMap[item.type] || item.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.engineer_name || "-"}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString("zh-CN")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${priorityProgress[item.priority] || 50}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{priorityProgress[item.priority] || 50}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onViewDetail?.(item.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => loadTransitions(item.id)}
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(transitionMap[item.id] || []).length === 0 ? (
                                <DropdownMenuItem disabled>暂无可流转状态</DropdownMenuItem>
                              ) : (
                                (transitionMap[item.id] || []).map((ns) => (
                                  <DropdownMenuItem key={ns} onClick={() => doTransition(item.id, ns)}>
                                    流转到: {statusMap[ns] || ns}
                                  </DropdownMenuItem>
                                ))
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => loadCases(page - 1, pageSize)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / pageSize)}
                    onClick={() => loadCases(page + 1, pageSize)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
