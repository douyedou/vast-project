"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  XCircle,
  Clock,
  CheckCircle,
  FileText,
  Plus,
  Filter,
} from "lucide-react"

interface PresaleTicketListProps {
  onNavigate: (page: string) => void
  filterStatus?: string
}

export function PresaleTicketList({ onNavigate, filterStatus }: PresaleTicketListProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState(filterStatus || "all")

  const tickets = [
    {
      id: "PQ-2024-0128",
      client: "华为技术有限公司",
      contact: "张经理",
      phone: "138****5678",
      type: "发明专利",
      subject: "AI图像识别技术专利咨询",
      status: "assigning",
      priority: "high",
      salesperson: "刘销售",
      serviceRep: "陈客服",
      assignee: "待分配",
      createTime: "2024-01-28 10:30",
      updateTime: "2024-01-28 10:30",
    },
    {
      id: "PQ-2024-0127",
      client: "腾讯科技",
      contact: "李总监",
      phone: "139****1234",
      type: "专利布局",
      subject: "游戏引擎专利布局规划咨询",
      status: "searching",
      priority: "high",
      salesperson: "王销售",
      serviceRep: "李客服",
      assignee: "李工",
      createTime: "2024-01-28 09:15",
      updateTime: "2024-01-28 11:20",
    },
    {
      id: "PQ-2024-0126",
      client: "阿里巴巴",
      contact: "王主管",
      phone: "137****9876",
      type: "实用新型",
      subject: "物流仓储设备专利咨询",
      status: "confirming",
      priority: "normal",
      salesperson: "张销售",
      serviceRep: "赵客服",
      assignee: "王工",
      createTime: "2024-01-28 08:45",
      updateTime: "2024-01-28 10:30",
    },
    {
      id: "PQ-2024-0125",
      client: "字节跳动",
      contact: "赵经理",
      phone: "136****5432",
      type: "发明专利",
      subject: "推荐算法专利技术咨询",
      status: "to-filing",
      priority: "normal",
      salesperson: "陈销售",
      serviceRep: "刘客服",
      assignee: "赵工",
      createTime: "2024-01-27 16:20",
      updateTime: "2024-01-28 09:00",
    },
    {
      id: "PQ-2024-0124",
      client: "小米科技",
      contact: "陈总",
      phone: "135****8765",
      type: "外观设计",
      subject: "智能家居产品外观设计咨询",
      status: "filing-pending",
      priority: "high",
      salesperson: "李销售",
      serviceRep: "陈客服",
      assignee: "陈工",
      createTime: "2024-01-27 14:30",
      updateTime: "2024-01-28 08:30",
    },
    {
      id: "PQ-2024-0123",
      client: "京东集团",
      contact: "刘经理",
      phone: "134****2345",
      type: "发明专利",
      subject: "无人配送技术专利咨询",
      status: "closed",
      priority: "low",
      salesperson: "赵销售",
      serviceRep: "王客服",
      assignee: "刘工",
      createTime: "2024-01-26 11:00",
      updateTime: "2024-01-27 15:00",
    },
  ]

  const filteredTickets = statusFilter === "all" 
    ? tickets 
    : tickets.filter(t => t.status === statusFilter)

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      assigning:        { label: "待分配", className: "bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]" },
      searching:        { label: "待检索",   className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      confirming:       { label: "待确认",   className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
      "to-filing":      { label: "客户同意立案", className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
      "no-filing":      { label: "客户不立案",   className: "bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]" },
      "filing-pending": { label: "等待立案",     className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
      closed:           { label: "已关闭",       className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[status] || configs.assigning
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      high: { label: "紧急", className: "bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]" },
      normal: { label: "普通", className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      low: { label: "低", className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[priority] || configs.normal
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(filteredTickets.map(t => t.id))
    } else {
      setSelectedTickets([])
    }
  }

  const handleSelectTicket = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, id])
    } else {
      setSelectedTickets(selectedTickets.filter(t => t !== id))
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">咨询工单列表</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有售前咨询工单</p>
        </div>
        <Button className="bg-[#2F80ED] gap-2" onClick={() => onNavigate("presale-new")}>
          <Plus className="h-4 w-4" />
          新建工单
        </Button>
      </div>

      {/* 筛选区 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input placeholder="搜索工单号、客户名称、咨询主题..." className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="工单状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="assigning">待分配工程师</SelectItem>
                <SelectItem value="searching">待检索</SelectItem>
                <SelectItem value="confirming">待确认</SelectItem>
                <SelectItem value="to-filing">客户同意立案</SelectItem>
                <SelectItem value="no-filing">客户不立案</SelectItem>
                <SelectItem value="filing-pending">等待立案</SelectItem>
                <SelectItem value="closed">已关闭</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="咨询类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="invention">发明专利</SelectItem>
                <SelectItem value="utility">实用新型</SelectItem>
                <SelectItem value="design">外观设计</SelectItem>
                <SelectItem value="layout">专利布局</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="所属销售" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部销售</SelectItem>
                <SelectItem value="liu">刘销售</SelectItem>
                <SelectItem value="wang">王销售</SelectItem>
                <SelectItem value="zhang">张销售</SelectItem>
                <SelectItem value="chen">陈销售</SelectItem>
                <SelectItem value="li">李销售</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="所属客服" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部客服</SelectItem>
                <SelectItem value="chen">陈客服</SelectItem>
                <SelectItem value="li">李客服</SelectItem>
                <SelectItem value="zhao">赵客服</SelectItem>
                <SelectItem value="liu">刘客服</SelectItem>
                <SelectItem value="wang">王客服</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              更多筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作 */}
      {selectedTickets.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-[#EAF4FF] rounded-lg">
          <span className="text-sm text-[#2F80ED]">已选择 {selectedTickets.length} 项</span>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowTransferDialog(true)}>
            <Send className="h-4 w-4" />
            批量转立案
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-[#EF4444]" onClick={() => setShowCloseDialog(true)}>
            <XCircle className="h-4 w-4" />
            批量关闭
          </Button>
        </div>
      )}

      {/* 工单表格 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F9FAFB]">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>工单号</TableHead>
              <TableHead>客户信息</TableHead>
              <TableHead>咨询主题</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead>所属销售</TableHead>
              <TableHead>所属客服</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-[#F9FAFB]">
                <TableCell>
                  <Checkbox
                    checked={selectedTickets.includes(ticket.id)}
                    onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <span className="font-medium text-[#2F80ED]">{ticket.id}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{ticket.client}</div>
                    <div className="text-xs text-[#6B7280]">{ticket.contact} · {ticket.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate text-sm">{ticket.subject}</div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{ticket.type}</span>
                </TableCell>
                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#FEF9C3] flex items-center justify-center text-[10px] font-bold text-[#CA8A04]">
                      {ticket.salesperson.charAt(0)}
                    </div>
                    <span className="text-sm text-[#374151]">{ticket.salesperson}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[10px] font-bold text-[#0369A1]">
                      {ticket.serviceRep.charAt(0)}
                    </div>
                    <span className="text-sm text-[#374151]">{ticket.serviceRep}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-[#6B7280]">{ticket.updateTime}</span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => onNavigate("presale-detail")}>
                        <Eye className="h-4 w-4" />
                        查看详情
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />
                        编辑工单
                      </DropdownMenuItem>
                      {ticket.status === "completed" && (
                        <DropdownMenuItem className="gap-2" onClick={() => onNavigate("filing-new")}>
                          <Send className="h-4 w-4" />
                          转入立案
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2 text-[#EF4444]">
                        <XCircle className="h-4 w-4" />
                        关闭工单
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 转立案弹窗 */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转入立案</DialogTitle>
            <DialogDescription>
              将选中的 {selectedTickets.length} 个咨询工单转入��案流程
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-[#6B7280]">
              转入立案后，工单将进入 M05 立案管理模块��行后续处理。
            </div>
            <Textarea placeholder="备注说明（选填）" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>取消</Button>
            <Button className="bg-[#2F80ED]" onClick={() => {
              setShowTransferDialog(false)
              onNavigate("filing-list")
            }}>
              确认转入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 关闭工单弹窗 */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>关闭工单</DialogTitle>
            <DialogDescription>
              确定要关闭选中的 {selectedTickets.length} 个咨询工单吗？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="请选择关闭原因" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">咨询已完成</SelectItem>
                <SelectItem value="no-response">客户无响应</SelectItem>
                <SelectItem value="cancelled">客户取消</SelectItem>
                <SelectItem value="duplicate">重复工单</SelectItem>
                <SelectItem value="other">其他原因</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="关闭说明（选填）" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={() => setShowCloseDialog(false)}>
              确认关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
