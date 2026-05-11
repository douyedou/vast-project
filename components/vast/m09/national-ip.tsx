"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, RefreshCw, CheckCircle, Clock, AlertTriangle, FileText, Eye, ExternalLink } from "lucide-react"

interface NationalIPProps {
  onNavigate: (page: string) => void
}

const mockIPCases = [
  { id: "CASE-2024-001254", appNo: "2024101234567.8", client: "华为技术", title: "一种5G通信基站天线结构", type: "实用新型", status: "初审合格", submitDate: "2024-01-10", updateDate: "2024-02-05" },
  { id: "CASE-2024-001252", appNo: "2024102345678.1", client: "小米科技", title: "智能家居控制装置", type: "实用新型", status: "授权公告", submitDate: "2024-01-05", updateDate: "2024-02-01" },
  { id: "CASE-2024-001240", appNo: "2024103456789.5", client: "百度在线", title: "自动驾驶路径规划方法", type: "发明", status: "实质审查", submitDate: "2023-12-20", updateDate: "2024-01-28" },
  { id: "CASE-2024-001235", appNo: "2024104567890.2", client: "腾讯科技", title: "游戏反作弊检测系统", type: "发明", status: "补正通知", submitDate: "2023-12-15", updateDate: "2024-02-03" },
  { id: "CASE-2024-001230", appNo: "2024105678901.8", client: "阿里巴巴", title: "云计算资源调度方法", type: "发明", status: "驳回待答复", submitDate: "2023-11-20", updateDate: "2024-02-06" },
]

export function NationalIP({ onNavigate }: NationalIPProps) {
  const [searchKeyword, setSearchKeyword] = useState("")

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      "初审合格": { className: "bg-blue-100 text-blue-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      "实质审查": { className: "bg-purple-100 text-purple-700", icon: <Clock className="h-3 w-3 mr-1" /> },
      "授权公告": { className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      "补正通知": { className: "bg-orange-100 text-orange-700", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      "驳回待答复": { className: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    }
    const cfg = config[status] || { className: "bg-gray-100 text-gray-600", icon: null }
    return (
      <Badge className={`${cfg.className} flex items-center`}>
        {cfg.icon}
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">国知局状态</h1>
          <p className="text-muted-foreground mt-1">同步国家知识产权局案件审查状态</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          同步最新状态
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">初审中</p>
              <p className="text-2xl font-semibold text-blue-600">12</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">实审中</p>
              <p className="text-2xl font-semibold text-purple-600">18</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">已授权</p>
              <p className="text-2xl font-semibold text-green-600">8</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">待答复</p>
              <p className="text-2xl font-semibold text-orange-600">5</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">驳回/撤回</p>
              <p className="text-2xl font-semibold text-red-600">2</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索申请号、案件号、专利名称..."
                className="pl-9"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">案件号</TableHead>
                <TableHead className="w-[160px]">申请号</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">类型</TableHead>
                <TableHead className="w-[100px]">国知局状态</TableHead>
                <TableHead className="w-[100px]">提交日期</TableHead>
                <TableHead className="w-[100px]">最后更新</TableHead>
                <TableHead className="w-[100px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockIPCases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-primary cursor-pointer" onClick={() => onNavigate("m09-case-detail")}>{item.id}</TableCell>
                  <TableCell className="font-mono text-sm">{item.appNo}</TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.title}>{item.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.submitDate}</TableCell>
                  <TableCell>{item.updateDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
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
