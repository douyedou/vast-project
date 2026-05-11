"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function ConsultationFilingList({ onNavigate, filterStatus }: ConsultationFilingListProps) {
  const [statusFilter, setStatusFilter] = useState(filterStatus || "all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const cases = [
    {
      id: "M05-2024-0128",
      client: "华为技术有限公司",
      contact: "张经理",
      type: "发明专利",
      subject: "AI图像识别技术",
      status: "assigning",
      priority: "high",
      salesperson: "刘销售",
      serviceRep: "陈客服",
      engineer: "待分配",
      createTime: "2024-01-28 10:30",
      updateTime: "2024-01-28 10:30",
    },
    {
      id: "M05-2024-0127",
      client: "腾讯科技",
      contact: "李总监",
      type: "专利布局",
      subject: "游戏引擎专利布局",
      status: "searching",
      priority: "high",
      salesperson: "王销售",
      serviceRep: "李客服",
      engineer: "张工",
      createTime: "2024-01-28 09:15",
      updateTime: "2024-01-28 11:20",
    },
    {
      id: "M05-2024-0126",
      client: "阿里巴巴",
      contact: "王主管",
      type: "实用新型",
      subject: "物流仓储设备专利",
      status: "confirming",
      priority: "normal",
      salesperson: "张销售",
      serviceRep: "赵客服",
      engineer: "李工",
      createTime: "2024-01-28 08:45",
      updateTime: "2024-01-28 10:30",
    },
    {
      id: "M05-2024-0125",
      client: "字节跳动",
      contact: "赵经理",
      type: "发明专利",
      subject: "推荐算法专利",
      status: "filing",
      priority: "normal",
      salesperson: "陈销售",
      serviceRep: "刘客服",
      engineer: "王工",
      createTime: "2024-01-27 16:20",
      updateTime: "2024-01-28 09:00",
    },
    {
      id: "M05-2024-0124",
      client: "小米科技",
      contact: "陈总",
      type: "外观设计",
      subject: "智能家居产品外观",
      status: "completed",
      priority: "high",
      salesperson: "李销售",
      serviceRep: "陈客服",
      engineer: "赵工",
      createTime: "2024-01-27 14:30",
      updateTime: "2024-01-28 08:30",
    },
    {
      id: "M05-2024-0123",
      client: "京东集团",
      contact: "刘经理",
      type: "发明专利",
      subject: "无人配送技术",
      status: "rejected",
      priority: "low",
      salesperson: "赵销售",
      serviceRep: "王客服",
      engineer: "刘工",
      createTime: "2024-01-26 11:00",
      updateTime: "2024-01-27 15:00",
    },
  ]

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      assigning:  { label: "待分配", className: "bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]" },
      searching:  { label: "待检索",   className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      confirming: { label: "待确认",   className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
      filing:     { label: "待立案",   className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
      completed:  { label: "已立案",  className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
      rejected:   { label: "不立案归档",   className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[status] || configs.assigning
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      high:   { label: "紧急", className: "bg-[#FFF1F0] text-[#CF1322] border-[#FFA39E]" },
      normal: { label: "普通", className: "bg-[#F5F5F5] text-[#595959] border-[#D9D9D9]" },
      low:    { label: "低",   className: "bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]" },
    }
    const config = configs[priority] || configs.normal
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const filteredCases = statusFilter === "all" ? cases : cases.filter(c => c.status === statusFilter)

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredCases.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredCases.map(c => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">
            {filterStatus ? getStatusBadge(filterStatus).props.children : "全部案件"}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">共 {filteredCases.length} 条记录</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button onClick={() => onNavigate("m05-new")} className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            发起咨询
          </Button>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input placeholder="搜索案件编号、客户名称、主题..." className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="案件状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="assigning">待分配</SelectItem>
                <SelectItem value="searching">待检索</SelectItem>
                <SelectItem value="confirming">待确认</SelectItem>
                <SelectItem value="filing">正式���案中</SelectItem>
                <SelectItem value="completed">已立案</SelectItem>
                <SelectItem value="rejected">不立案归档</SelectItem>
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
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              更多筛选
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作栏 */}
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

      {/* 案件列表 */}
      <Card>
        <CardContent className="p-0">
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
                <TableHead>客户信息</TableHead>
                <TableHead>咨询主题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>所属销售</TableHead>
                <TableHead>所属客服</TableHead>
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
                      {item.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{item.client}</div>
                      <div className="text-xs text-[#6B7280]">{item.contact}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.subject}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#FEF9C3] flex items-center justify-center text-[10px] font-bold text-[#CA8A04]">
                        {item.salesperson.charAt(0)}
                      </div>
                      <span className="text-sm">{item.salesperson}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[10px] font-bold text-[#0369A1]">
                        {item.serviceRep.charAt(0)}
                      </div>
                      <span className="text-sm">{item.serviceRep}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.engineer === "待分配" ? (
                      <Badge variant="outline" className="bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]">待分配</Badge>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[10px] font-bold text-[#7C3AED]">
                          {item.engineer.charAt(0)}
                        </div>
                        <span className="text-sm">{item.engineer}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-[#6B7280]">{item.updateTime}</div>
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
        </CardContent>
      </Card>
    </div>
  )
}
