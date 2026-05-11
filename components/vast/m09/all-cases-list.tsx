"use client"

import { useState } from "react"
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
import { Search, Filter, Download, Eye, MoreHorizontal } from "lucide-react"

interface AllCasesListProps {
  onNavigate: (page: string) => void
}

const mockCases = [
  { id: "CASE-2024-001256", client: "腾讯科技", title: "一种基于深度学习的图像识别方法", type: "发明", status: "撰写中", engineer: "张工", deadline: "2024-02-15", progress: 65 },
  { id: "CASE-2024-001255", client: "阿里巴巴", title: "分布式数据处理系统及方法", type: "发明", status: "待审核", engineer: "李工", deadline: "2024-02-12", progress: 100 },
  { id: "CASE-2024-001254", client: "华为技术", title: "一种5G通信基站天线结构", type: "实用新型", status: "已交案", engineer: "王工", deadline: "2024-02-10", progress: 100 },
  { id: "CASE-2024-001253", client: "字节跳动", title: "短视频推荐算法优化方法", type: "发明", status: "待交案", engineer: "赵工", deadline: "2024-02-08", progress: 95 },
  { id: "CASE-2024-001252", client: "小米科技", title: "智能家居控制装置", type: "实用新型", status: "授权", engineer: "孙工", deadline: "2024-01-20", progress: 100 },
  { id: "CASE-2024-001251", client: "百度在线", title: "自动驾驶路径规划方法", type: "发明", status: "撰写中", engineer: "周工", deadline: "2024-02-18", progress: 40 },
  { id: "CASE-2024-001250", client: "网易科技", title: "游戏场景渲染优化系统", type: "发明", status: "废案", engineer: "吴工", deadline: "2024-01-15", progress: 30 },
  { id: "CASE-2024-001249", client: "京东集团", title: "智能仓储机器人导航方法", type: "发明", status: "待审核", engineer: "郑工", deadline: "2024-02-14", progress: 100 },
]

const getStatusBadge = (status: string) => {
  const config: Record<string, { className: string }> = {
    "撰写中": { className: "bg-blue-100 text-blue-700" },
    "待审核": { className: "bg-purple-100 text-purple-700" },
    "已交案": { className: "bg-cyan-100 text-cyan-700" },
    "待交案": { className: "bg-orange-100 text-orange-700" },
    "授权": { className: "bg-green-100 text-green-700" },
    "废案": { className: "bg-gray-100 text-gray-500" },
  }
  return <Badge className={config[status]?.className || "bg-gray-100 text-gray-500"}>{status}</Badge>
}

export function AllCasesList({ onNavigate }: AllCasesListProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

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
                placeholder="搜索案件号、客户名称、专利名称..."
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
                <SelectItem value="writing">撰写中</SelectItem>
                <SelectItem value="pending-review">待审核</SelectItem>
                <SelectItem value="pending-submit">待交案</SelectItem>
                <SelectItem value="submitted">已交案</SelectItem>
                <SelectItem value="authorized">授权</SelectItem>
                <SelectItem value="scrap">废案</SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">案件号</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">类型</TableHead>
                <TableHead className="w-[80px]">状态</TableHead>
                <TableHead className="w-[80px]">工程师</TableHead>
                <TableHead className="w-[100px]">截止日期</TableHead>
                <TableHead className="w-[100px]">进度</TableHead>
                <TableHead className="w-[100px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCases.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-primary">{item.id}</TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.title}>{item.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.engineer}</TableCell>
                  <TableCell>{item.deadline}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => onNavigate("m09-case-detail")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">共 356 条记录</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>上一页</Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <span className="text-muted-foreground">...</span>
              <Button variant="outline" size="sm">36</Button>
              <Button variant="outline" size="sm">下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
