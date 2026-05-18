"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  UserPlus,
  Send,
  Archive,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react"

interface ConsultationFilingListProps {
  onNavigate: (page: string) => void
  filterStatus?: string
}

interface CaseItem {
  id: string
  case_id: string
  title: string
  type: string
  status: string
  description: string | null
  priority: string
  engineer_name: string | null
  created_at: string
  updated_at: string
}

const typeMap: Record<string, string> = {
  invention: "发明专利",
  utility: "实用新型",
  design: "外观设计",
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft:          { label: "草稿",       className: "bg-gray-100 text-gray-600 border-gray-300" },
  assigning:      { label: "待分配",     className: "bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]" },
  searching:      { label: "待检索",     className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
  confirming:     { label: "待确认",     className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
  filing:         { label: "待立案",     className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
  disclosure_pending: { label: "待交底", className: "bg-pink-50 text-pink-600 border-pink-200" },
  writing:        { label: "撰写中",     className: "bg-blue-50 text-blue-600 border-blue-200" },
  reviewing:      { label: "审核中",     className: "bg-purple-50 text-purple-600 border-purple-200" },
  completed:      { label: "已立案",     className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
  rejected:       { label: "不立案归档", className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  high:   { label: "紧急", className: "bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]" },
  normal: { label: "普通", className: "bg-[#F5F5F5] text-[#595959] border-[#D9D9D9]" },
  low:    { label: "低",   className: "bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]" },
}

export function ConsultationFilingList({ onNavigate, filterStatus }: ConsultationFilingListProps) {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(filterStatus || "all")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    setLoading(true)
    const token = localStorage.getItem("vast_token")
    try {
      const res = await fetch("/api/cases?page=1&pageSize=100", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.code === 200) {
        setCases(data.data.list || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const filtered = filteredCases
    const headers = ["案件编号", "专利名称", "类型", "状态", "优先级", "工程师", "创建时间"]
    const rows = filtered.map((c) => [
      c.case_id,
      c.title,
      typeMap[c.type] || c.type,
      statusConfig[c.status]?.label || c.status,
      priorityConfig[c.priority]?.label || c.priority,
      c.engineer_name || "待分配",
      new Date(c.created_at).toLocaleDateString("zh-CN"),
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `案件列表_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    const matchesSearch =
      !searchKeyword ||
      c.case_id?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredCases.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredCases.map((c) => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority] || priorityConfig.normal
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">
            {filterStatus ? (statusConfig[filterStatus]?.label || filterStatus) : "全部案件"}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">共 {filteredCases.length} 条记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button onClick={() => onNavigate("m05-new")} className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            发起咨询
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="搜索案件编号、专利名称..."
                className="pl-10"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="案件状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="assigning">待分配</SelectItem>
                <SelectItem value="searching">待检索</SelectItem>
                <SelectItem value="confirming">待确认</SelectItem>
                <SelectItem value="filing">待立案</SelectItem>
                <SelectItem value="completed">已立案</SelectItem>
                <SelectItem value="rejected">不立案归档</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadCases}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedItems.length > 0 && (
        <Card className="bg-[#EAF4FF] border-[#2F80ED]">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm text-[#2F80ED]">已选择 {selectedItems.length} 项</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-[#2F80ED] text-[#2F80ED]">
                <UserPlus className="h-4 w-4 mr-1" /> 批量分配
              </Button>
              <Button size="sm" variant="outline" className="border-[#10B981] text-[#10B981]">
                <Send className="h-4 w-4 mr-1" /> 批量提交M06
              </Button>
              <Button size="sm" variant="outline" className="border-[#EF4444] text-[#EF4444]">
                <Archive className="h-4 w-4 mr-1" /> 批量归档
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB]">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === filteredCases.length && filteredCases.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>案件编号</TableHead>
                  <TableHead>专利名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>工程师</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F9FAFB]">
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-[#2F80ED] cursor-pointer hover:underline" onClick={() => onNavigate("m05-detail")}>
                        {item.case_id}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate" title={item.title}>{item.title}</TableCell>
                    <TableCell>{typeMap[item.type] || item.type}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                    <TableCell>
                      {item.engineer_name ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[10px] font-bold text-[#7C3AED]">
                            {item.engineer_name.charAt(0)}
                          </div>
                          <span className="text-sm">{item.engineer_name}</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]">待分配</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-[#6B7280]">{new Date(item.updated_at).toLocaleString("zh-CN")}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => onNavigate("m05-detail")}>
                            <Eye className="h-4 w-4" /> 查看详情
                          </DropdownMenuItem>
                          {item.status === "assigning" && (
                            <DropdownMenuItem className="gap-2">
                              <UserPlus className="h-4 w-4" /> 分配工程师
                            </DropdownMenuItem>
                          )}
                          {item.status === "completed" && (
                            <DropdownMenuItem className="gap-2" onClick={() => onNavigate("m06-create-model")}>
                              <Send className="h-4 w-4" /> 提交M06
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-[#EF4444]" onClick={() => onNavigate("m09-scrap-cases")}>
                            <Archive className="h-4 w-4" /> 不立案归档
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
