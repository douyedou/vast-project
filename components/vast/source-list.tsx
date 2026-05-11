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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge, type DisclosureStatus } from "./status-badge"
import { Search, Filter, Download, Eye, Users, FileCheck, XCircle, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SourceItem {
  id: string
  code: string
  clientName: string
  patentTitle: string
  sourceType: string
  patentType: string
  applicationMethod: string
  status: DisclosureStatus
  isSigned: boolean
  manager: string
  engineer: string
  plannedDate: string
}

const mockData: SourceItem[] = [
  {
    id: "1",
    code: "DS-2024-001",
    clientName: "华为技术有限公司",
    patentTitle: "一种无线通信设备及方法",
    sourceType: "售前咨询",
    patentType: "发明专利",
    applicationMethod: "预先审查",
    status: "presale",
    isSigned: false,
    manager: "李四",
    engineer: "-",
    plannedDate: "2024-03-15",
  },
  {
    id: "2",
    code: "DS-2024-002",
    clientName: "小米科技有限公司",
    patentTitle: "智能家居控制系统",
    sourceType: "客服立案",
    patentType: "发明专利",
    applicationMethod: "普通申请",
    status: "checking",
    isSigned: true,
    manager: "李四",
    engineer: "王五",
    plannedDate: "2024-03-20",
  },
  {
    id: "3",
    code: "DS-2024-003",
    clientName: "腾讯科技有限公司",
    patentTitle: "视频编解码方法及装置",
    sourceType: "售前咨询",
    patentType: "发明专利",
    applicationMethod: "优先审查",
    status: "waiting-order",
    isSigned: false,
    manager: "李四",
    engineer: "赵六",
    plannedDate: "2024-03-25",
  },
  {
    id: "4",
    code: "DS-2024-004",
    clientName: "阿里巴巴集团",
    patentTitle: "分布式存储系统",
    sourceType: "客服立案",
    patentType: "发明专利",
    applicationMethod: "预先审查",
    status: "waiting-filing",
    isSigned: true,
    manager: "李四",
    engineer: "王五",
    plannedDate: "2024-03-28",
  },
  {
    id: "5",
    code: "DS-2024-005",
    clientName: "字节跳动有限公司",
    patentTitle: "推荐算法优化方法",
    sourceType: "售前咨询",
    patentType: "发明专利",
    applicationMethod: "普通申请",
    status: "filed",
    isSigned: true,
    manager: "李四",
    engineer: "赵六",
    plannedDate: "2024-02-15",
  },
  {
    id: "6",
    code: "DS-2024-006",
    clientName: "京东集团",
    patentTitle: "物流路径规划方法",
    sourceType: "客服立案",
    patentType: "实用新型",
    applicationMethod: "-",
    status: "not-filed",
    isSigned: false,
    manager: "李四",
    engineer: "-",
    plannedDate: "-",
  },
  {
    id: "7",
    code: "DS-2024-007",
    clientName: "网易公司",
    patentTitle: "游戏角色生成方法",
    sourceType: "售前咨询",
    patentType: "发明专利",
    applicationMethod: "普通申请",
    status: "supplement",
    isSigned: false,
    manager: "李四",
    engineer: "王五",
    plannedDate: "2024-04-01",
  },
]

interface SourceListProps {
  onViewDetail: (id: string) => void
}

export function SourceList({ onViewDetail }: SourceListProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [searchText, setSearchText] = useState("")

  const filteredData = mockData.filter((item) => {
    if (activeTab === "all") return true
    if (activeTab === "presale") return item.status === "presale"
    if (activeTab === "waiting") return item.status === "waiting-filing"
    if (activeTab === "filed") return item.status === "filed"
    if (activeTab === "not-filed") return item.status === "not-filed"
    return true
  })

  return (
    <div className="p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">交底书来源列表</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理所有售前咨询、客服立案、待立案、不立案来源</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          导出
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#F5F7FA]">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">全部来源</TabsTrigger>
          <TabsTrigger value="presale" className="data-[state=active]:bg-white">售前咨询</TabsTrigger>
          <TabsTrigger value="waiting" className="data-[state=active]:bg-white">待立案</TabsTrigger>
          <TabsTrigger value="filed" className="data-[state=active]:bg-white">已立案</TabsTrigger>
          <TabsTrigger value="not-filed" className="data-[state=active]:bg-white">不立案</TabsTrigger>
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
                <SelectValue placeholder="来源类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="presale">售前咨询</SelectItem>
                <SelectItem value="filing">客服立案</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectValue placeholder="是否签单" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="yes">已签单</SelectItem>
                <SelectItem value="no">未签单</SelectItem>
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
                <TableHead className="font-medium text-[#6B7280]">来源编号</TableHead>
                <TableHead className="font-medium text-[#6B7280]">客户名称</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利名称/技术主题</TableHead>
                <TableHead className="font-medium text-[#6B7280]">来源类型</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利类型</TableHead>
                <TableHead className="font-medium text-[#6B7280]">状态</TableHead>
                <TableHead className="font-medium text-[#6B7280]">是否签单</TableHead>
                <TableHead className="font-medium text-[#6B7280]">专利经理</TableHead>
                <TableHead className="font-medium text-[#6B7280]">计划受理时间</TableHead>
                <TableHead className="font-medium text-[#6B7280]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-[#F5F7FA]/50">
                  <TableCell className="font-mono text-sm text-[#2F80ED]">{item.code}</TableCell>
                  <TableCell className="text-[#1F2937]">{item.clientName}</TableCell>
                  <TableCell className="text-[#1F2937] max-w-48 truncate">{item.patentTitle}</TableCell>
                  <TableCell className="text-[#6B7280]">{item.sourceType}</TableCell>
                  <TableCell className="text-[#6B7280]">{item.patentType}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <span className={item.isSigned ? "text-[#52C41A]" : "text-[#9CA3AF]"}>
                      {item.isSigned ? "已签单" : "未签单"}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#6B7280]">{item.manager}</TableCell>
                  <TableCell className="text-[#6B7280] font-mono text-sm">{item.plannedDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-[#2F80ED] hover:text-[#2F80ED] hover:bg-[#EAF4FF]"
                        onClick={() => onViewDetail(item.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Users className="h-4 w-4" />
                            分配
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <FileCheck className="h-4 w-4" />
                            正式立案
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-[#F5222D]">
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
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            上一页
          </Button>
          <Button variant="outline" size="sm" className="bg-[#2F80ED] text-white hover:bg-[#2F80ED]/90">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
