"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Send, Clock, AlertTriangle, CheckCircle, Eye, FileCheck } from "lucide-react"

interface WaitingCasesProps {
  onNavigate: (page: string) => void
}

const mockWaitingCases = [
  { id: "CASE-2024-001253", client: "字节跳动", title: "短视频推荐算法优化方法", type: "发明", engineer: "赵工", reviewDate: "2024-02-06", deadline: "2024-02-08", status: "ready", checkItems: { disclosure: true, fiveBooks: true, quality: true } },
  { id: "CASE-2024-001248", client: "美团科技", title: "外卖配送路径优化系统", type: "发明", engineer: "钱工", reviewDate: "2024-02-05", deadline: "2024-02-10", status: "ready", checkItems: { disclosure: true, fiveBooks: true, quality: true } },
  { id: "CASE-2024-001247", client: "滴滴出行", title: "智能打车匹配方法", type: "发明", engineer: "孙工", reviewDate: "2024-02-04", deadline: "2024-02-12", status: "pending", checkItems: { disclosure: true, fiveBooks: true, quality: false } },
  { id: "CASE-2024-001246", client: "携程旅行", title: "酒店推荐智能排序系统", type: "实用新型", engineer: "李工", reviewDate: "2024-02-03", deadline: "2024-02-15", status: "pending", checkItems: { disclosure: true, fiveBooks: false, quality: false } },
  { id: "CASE-2024-001245", client: "拼多多", title: "社交电商分享激励方法", type: "发明", engineer: "周工", reviewDate: "2024-02-02", deadline: "2024-02-18", status: "overdue", checkItems: { disclosure: true, fiveBooks: true, quality: true } },
]

export function WaitingCases({ onNavigate }: WaitingCasesProps) {
  const [selectedCases, setSelectedCases] = useState<string[]>([])

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      "ready": { label: "可交案", className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      "pending": { label: "待完善", className: "bg-orange-100 text-orange-700", icon: <Clock className="h-3 w-3 mr-1" /> },
      "overdue": { label: "已超期", className: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    }
    const cfg = config[status]
    return (
      <Badge className={`${cfg.className} flex items-center`}>
        {cfg.icon}
        {cfg.label}
      </Badge>
    )
  }

  const toggleSelect = (id: string) => {
    setSelectedCases(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const readyCases = mockWaitingCases.filter(c => c.status === "ready").map(c => c.id)
    setSelectedCases(prev => prev.length === readyCases.length ? [] : readyCases)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">待交案案件</h1>
          <p className="text-muted-foreground mt-1">共 67 个案件待交案，其中 23 个已满足交案条件</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            disabled={selectedCases.length === 0}
            onClick={() => onNavigate("m09-protection-center")}
          >
            <FileCheck className="mr-2 h-4 w-4" />
            批量预检
          </Button>
          <Button disabled={selectedCases.length === 0}>
            <Send className="mr-2 h-4 w-4" />
            批量交案 ({selectedCases.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">可交案</p>
                <p className="text-2xl font-semibold text-green-600">23</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待完善</p>
                <p className="text-2xl font-semibold text-orange-600">32</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已超期</p>
                <p className="text-2xl font-semibold text-red-600">12</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">待交案列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedCases.length === mockWaitingCases.filter(c => c.status === "ready").length}
                    onCheckedChange={selectAll}
                  />
                </TableHead>
                <TableHead className="w-[140px]">案件号</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">工程师</TableHead>
                <TableHead className="w-[100px]">审核通过日</TableHead>
                <TableHead className="w-[100px]">交案截止</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[150px]">交案检查项</TableHead>
                <TableHead className="w-[80px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockWaitingCases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedCases.includes(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      disabled={item.status !== "ready"}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-primary">{item.id}</TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.title}>{item.title}</TableCell>
                  <TableCell>{item.engineer}</TableCell>
                  <TableCell>{item.reviewDate}</TableCell>
                  <TableCell>{item.deadline}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={item.checkItems.disclosure ? "default" : "outline"} className="text-xs">交底</Badge>
                      <Badge variant={item.checkItems.fiveBooks ? "default" : "outline"} className="text-xs">五书</Badge>
                      <Badge variant={item.checkItems.quality ? "default" : "outline"} className="text-xs">质检</Badge>
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
                      {item.status === "ready" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                          <Send className="h-4 w-4" />
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
    </div>
  )
}
