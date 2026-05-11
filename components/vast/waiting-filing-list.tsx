"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  Download,
  Eye,
  FileCheck,
  XCircle,
  MoreHorizontal,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Edit,
  CalendarClock,
  RefreshCw,
} from "lucide-react"

interface WaitingFilingItem {
  id: string
  code: string
  clientName: string
  patentTitle: string
  patentType: string
  applicationMethod: string
  plannedDate: string
  daysWaiting: number
  isOverdue: boolean
  manager: string
  engineer: string
  signedDate: string
  missingInfo: string[]
  priority: "high" | "medium" | "low"
}

const mockData: WaitingFilingItem[] = [
  {
    id: "1",
    code: "DS-2024-001",
    clientName: "华为技术有限公司",
    patentTitle: "一种无线通信设备及方法",
    patentType: "发明专利",
    applicationMethod: "预先审查",
    plannedDate: "2024-03-15",
    daysWaiting: 3,
    isOverdue: false,
    manager: "李四",
    engineer: "王五",
    signedDate: "2024-03-10",
    missingInfo: [],
    priority: "high",
  },
  {
    id: "2",
    code: "DS-2024-004",
    clientName: "阿里巴巴集团",
    patentTitle: "分布式存储系统",
    patentType: "发明专利",
    applicationMethod: "优先审查",
    plannedDate: "2024-03-12",
    daysWaiting: 5,
    isOverdue: true,
    manager: "李四",
    engineer: "王五",
    signedDate: "2024-03-05",
    missingInfo: ["技术领域", "发明人信息"],
    priority: "high",
  },
  {
    id: "3",
    code: "DS-2024-008",
    clientName: "小米科技有限公司",
    patentTitle: "智能家居控制系统及方法",
    patentType: "发明专利",
    applicationMethod: "普通申请",
    plannedDate: "2024-03-20",
    daysWaiting: 2,
    isOverdue: false,
    manager: "张三",
    engineer: "赵六",
    signedDate: "2024-03-12",
    missingInfo: ["申请人地址"],
    priority: "medium",
  },
  {
    id: "4",
    code: "DS-2024-009",
    clientName: "腾讯科技有限公司",
    patentTitle: "视频编解码方法及装置",
    patentType: "实用新型",
    applicationMethod: "-",
    plannedDate: "2024-03-18",
    daysWaiting: 1,
    isOverdue: false,
    manager: "李四",
    engineer: "王五",
    signedDate: "2024-03-14",
    missingInfo: [],
    priority: "low",
  },
  {
    id: "5",
    code: "DS-2024-010",
    clientName: "字节跳动有限公司",
    patentTitle: "推荐算法优化方法",
    patentType: "发明专利",
    applicationMethod: "预先审查",
    plannedDate: "2024-03-10",
    daysWaiting: 7,
    isOverdue: true,
    manager: "张三",
    engineer: "赵六",
    signedDate: "2024-03-01",
    missingInfo: [],
    priority: "high",
  },
  {
    id: "6",
    code: "DS-2024-011",
    clientName: "京东集团",
    patentTitle: "物流路径规划方法",
    patentType: "发明专利",
    applicationMethod: "普通申请",
    plannedDate: "2024-03-25",
    daysWaiting: 0,
    isOverdue: false,
    manager: "李四",
    engineer: "-",
    signedDate: "2024-03-15",
    missingInfo: ["专利工程师"],
    priority: "medium",
  },
]

interface WaitingFilingListProps {
  onNavigate: (page: string) => void
  onViewDetail?: (id: string) => void
}

export function WaitingFilingList({ onNavigate, onViewDetail }: WaitingFilingListProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchText, setSearchText] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showFilingDialog, setShowFilingDialog] = useState(false)
  const [showDelayDialog, setShowDelayDialog] = useState(false)
  const [showNotFilingDialog, setShowNotFilingDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState<WaitingFilingItem | null>(null)

  // 统计数据
  const stats = {
    all: mockData.length,
    today: mockData.filter(item => item.daysWaiting === 0).length,
    overdue: mockData.filter(item => item.isOverdue).length,
    mine: mockData.filter(item => item.manager === "李四").length,
    needInfo: mockData.filter(item => item.missingInfo.length > 0).length,
  }

  const filteredData = mockData.filter((item) => {
    // 搜索过滤
    if (searchText && !item.clientName.includes(searchText) && !item.code.includes(searchText) && !item.patentTitle.includes(searchText)) {
      return false
    }
    // Tab 过滤
    if (activeTab === "today") return item.daysWaiting === 0
    if (activeTab === "overdue") return item.isOverdue
    if (activeTab === "mine") return item.manager === "李四"
    if (activeTab === "needInfo") return item.missingInfo.length > 0
    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredData.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id])
    } else {
      setSelectedItems(selectedItems.filter(i => i !== id))
    }
  }

  const handleFiling = (item: WaitingFilingItem) => {
    setCurrentItem(item)
    setShowFilingDialog(true)
  }

  const handleDelay = (item: WaitingFilingItem) => {
    setCurrentItem(item)
    setShowDelayDialog(true)
  }

  const handleNotFiling = (item: WaitingFilingItem) => {
    setCurrentItem(item)
    setShowNotFilingDialog(true)
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-[#FFF1F0] text-[#F5222D] border-[#FFCCC7]">紧急</Badge>
      case "medium":
        return <Badge className="bg-[#FFF7E6] text-[#FA8C16] border-[#FFD591]">普通</Badge>
      default:
        return <Badge className="bg-[#F5F7FA] text-[#6B7280] border-[#D1D5DB]">低</Badge>
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">等待立案</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理已签单但尚未正式立案的交底书来源</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出
          </Button>
          {selectedItems.length > 0 && (
            <Button className="gap-2 bg-[#2F80ED] hover:bg-[#2F80ED]/90">
              <FileCheck className="h-4 w-4" />
              批量立案 ({selectedItems.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className={`cursor-pointer transition-all ${activeTab === "all" ? "ring-2 ring-[#2F80ED]" : ""}`} onClick={() => setActiveTab("all")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">全部待立案</p>
                <p className="text-2xl font-semibold text-[#111827] mt-1">{stats.all}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#2F80ED]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === "today" ? "ring-2 ring-[#52C41A]" : ""}`} onClick={() => setActiveTab("today")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">今日待立案</p>
                <p className="text-2xl font-semibold text-[#52C41A] mt-1">{stats.today}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#F6FFED] flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[#52C41A]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === "overdue" ? "ring-2 ring-[#F5222D]" : ""}`} onClick={() => setActiveTab("overdue")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">已超期</p>
                <p className="text-2xl font-semibold text-[#F5222D] mt-1">{stats.overdue}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#FFF1F0] flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-[#F5222D]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === "needInfo" ? "ring-2 ring-[#FA8C16]" : ""}`} onClick={() => setActiveTab("needInfo")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">待补全信息</p>
                <p className="text-2xl font-semibold text-[#FA8C16] mt-1">{stats.needInfo}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#FFF7E6] flex items-center justify-center">
                <Edit className="h-5 w-5 text-[#FA8C16]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === "mine" ? "ring-2 ring-[#722ED1]" : ""}`} onClick={() => setActiveTab("mine")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7280]">我负责的</p>
                <p className="text-2xl font-semibold text-[#722ED1] mt-1">{stats.mine}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#F9F0FF] flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-[#722ED1]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#F5F7FA]">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            全部 <Badge variant="secondary" className="ml-2">{stats.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="today" className="data-[state=active]:bg-white">
            今日待立案 <Badge variant="secondary" className="ml-2 bg-[#52C41A] text-white">{stats.today}</Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="data-[state=active]:bg-white">
            已超期 <Badge variant="secondary" className="ml-2 bg-[#F5222D] text-white">{stats.overdue}</Badge>
          </TabsTrigger>
          <TabsTrigger value="needInfo" className="data-[state=active]:bg-white">
            待补全 <Badge variant="secondary" className="ml-2 bg-[#FA8C16] text-white">{stats.needInfo}</Badge>
          </TabsTrigger>
          <TabsTrigger value="mine" className="data-[state=active]:bg-white">
            我负责的 <Badge variant="secondary" className="ml-2">{stats.mine}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="搜索客户名称、来源编号、专利名称"
                className="pl-9"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="专利类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="invention">发明专利</SelectItem>
                <SelectItem value="utility">实用新型</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="申请方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pre">预先审查</SelectItem>
                <SelectItem value="priority">优先审查</SelectItem>
                <SelectItem value="normal">普通申请</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="专利经理" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="lisi">李四</SelectItem>
                <SelectItem value="zhangsan">张三</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              更多筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F7FA]">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === filteredData.length && filteredData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-medium text-[#6B7280]">来源编号</TableHead>
                <TableHead className="font-medium text-[#6B7280]">客户名称</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利名称</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利类型</TableHead>
                <TableHead className="font-medium text-[#6B7280]">申请方式</TableHead>
                <TableHead className="font-medium text-[#6B7280]">计划受理</TableHead>
                <TableHead className="font-medium text-[#6B7280]">等待天数</TableHead>
                <TableHead className="font-medium text-[#6B7280]">优先级</TableHead>
                <TableHead className="font-medium text-[#6B7280]">信息状态</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利经理</TableHead>
                <TableHead className="font-medium text-[#6B7280]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className={`hover:bg-[#F5F7FA]/50 ${item.isOverdue ? "bg-[#FFF1F0]/30" : ""}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-[#2F80ED]">{item.code}</TableCell>
                  <TableCell className="text-[#1F2937]">{item.clientName}</TableCell>
                  <TableCell className="text-[#1F2937] max-w-40 truncate">{item.patentTitle}</TableCell>
                  <TableCell className="text-[#6B7280]">{item.patentType}</TableCell>
                  <TableCell className="text-[#6B7280]">{item.applicationMethod}</TableCell>
                  <TableCell className="text-[#6B7280] font-mono text-sm">{item.plannedDate}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${item.isOverdue ? "text-[#F5222D]" : item.daysWaiting > 3 ? "text-[#FA8C16]" : "text-[#52C41A]"}`}>
                      {item.daysWaiting}天
                      {item.isOverdue && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                    </span>
                  </TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell>
                    {item.missingInfo.length > 0 ? (
                      <Badge className="bg-[#FFF7E6] text-[#FA8C16] border-[#FFD591]">
                        待补全 ({item.missingInfo.length})
                      </Badge>
                    ) : (
                      <Badge className="bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]">
                        信息完整
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-[#6B7280]">{item.manager}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-[#52C41A] hover:text-[#52C41A] hover:bg-[#F6FFED]"
                        onClick={() => handleFiling(item)}
                        disabled={item.missingInfo.length > 0}
                      >
                        <FileCheck className="h-4 w-4 mr-1" />
                        立案
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => onViewDetail?.(item.id)}>
                            <Eye className="h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          {item.missingInfo.length > 0 && (
                            <DropdownMenuItem className="gap-2">
                              <Edit className="h-4 w-4" />
                              补全信息
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2" onClick={() => handleDelay(item)}>
                            <CalendarClock className="h-4 w-4" />
                            延期
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-[#F5222D]" onClick={() => handleNotFiling(item)}>
                            <XCircle className="h-4 w-4" />
                            不立案
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          共 <span className="font-medium text-[#1F2937]">{filteredData.length}</span> 条记录
          {selectedItems.length > 0 && (
            <span className="ml-2">
              已选择 <span className="font-medium text-[#2F80ED]">{selectedItems.length}</span> 条
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            上一页
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2F80ED] text-white hover:bg-[#2F80ED]/90">
            1
          </Button>
          <Button variant="outline" size="sm">
            下一页
          </Button>
        </div>
      </div>

      {/* Filing Confirmation Dialog */}
      <Dialog open={showFilingDialog} onOpenChange={setShowFilingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认立案</DialogTitle>
            <DialogDescription>
              确认将 {currentItem?.code} 正式立案，生成案件编号并进入 M06 交底书引擎。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-[#6B7280]">客户名称</Label>
                <p className="font-medium">{currentItem?.clientName}</p>
              </div>
              <div>
                <Label className="text-[#6B7280]">专利类型</Label>
                <p className="font-medium">{currentItem?.patentType}</p>
              </div>
              <div>
                <Label className="text-[#6B7280]">申请方式</Label>
                <p className="font-medium">{currentItem?.applicationMethod}</p>
              </div>
              <div>
                <Label className="text-[#6B7280]">计划受理时间</Label>
                <p className="font-medium">{currentItem?.plannedDate}</p>
              </div>
            </div>
            <div>
              <Label className="text-[#6B7280]">专利名称</Label>
              <p className="font-medium">{currentItem?.patentTitle}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilingDialog(false)}>取消</Button>
            <Button className="bg-[#52C41A] hover:bg-[#52C41A]/90" onClick={() => {
              setShowFilingDialog(false)
              // 跳转到立案确认页
            }}>
              <FileCheck className="h-4 w-4 mr-2" />
              确认立案
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delay Dialog */}
      <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>延期处理</DialogTitle>
            <DialogDescription>
              填写延期原因并设置新的计划受理时间。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>当前计划受理时间</Label>
              <p className="font-medium text-[#6B7280]">{currentItem?.plannedDate}</p>
            </div>
            <div>
              <Label>新计划受理时间</Label>
              <Input type="date" className="mt-1" />
            </div>
            <div>
              <Label>延期原因</Label>
              <Textarea placeholder="请填写延期原因..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelayDialog(false)}>取消</Button>
            <Button className="bg-[#FA8C16] hover:bg-[#FA8C16]/90" onClick={() => setShowDelayDialog(false)}>
              <CalendarClock className="h-4 w-4 mr-2" />
              确认延期
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Not Filing Dialog */}
      <Dialog open={showNotFilingDialog} onOpenChange={setShowNotFilingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>不立案确认</DialogTitle>
            <DialogDescription>
              确认将 {currentItem?.code} 标记为不立案，材料将归档至 M09 案件管理库。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>不立案原因</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="请选择原因" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client-cancel">客户终止</SelectItem>
                  <SelectItem value="tech-issue">技术方案不足</SelectItem>
                  <SelectItem value="not-recommend">不建议申报</SelectItem>
                  <SelectItem value="no-material">长期未补充材料</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>原因说明</Label>
              <Textarea placeholder="请填写详细说明..." className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="keep-asset" />
              <Label htmlFor="keep-asset" className="text-sm">保留为知识资产</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotFilingDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={() => {
              setShowNotFilingDialog(false)
              onNavigate("m09-scrap-cases") // 跳转到M09废案管理
            }}>
              <XCircle className="h-4 w-4 mr-2" />
              确认不立案
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
