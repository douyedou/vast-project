"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shield, Clock, CheckCircle, AlertTriangle, FileText, Eye, Send } from "lucide-react"

interface ProtectionCenterProps {
  onNavigate: (page: string) => void
}

const mockProtectionCases = [
  { id: "PC-2024-0056", caseId: "CASE-2024-001253", client: "字节跳动", title: "短视频推荐算法优化方法", center: "北京保护中心", status: "预审中", submitDate: "2024-02-06", expectDate: "2024-02-20" },
  { id: "PC-2024-0055", caseId: "CASE-2024-001248", client: "美团科技", title: "外卖配送路径优化系统", center: "北京保护中心", status: "已通过", submitDate: "2024-02-01", expectDate: "2024-02-15" },
  { id: "PC-2024-0054", caseId: "CASE-2024-001240", client: "滴滴出行", title: "智能打车匹配方法", center: "深圳保护中心", status: "需补正", submitDate: "2024-01-28", expectDate: "2024-02-12" },
  { id: "PC-2024-0053", caseId: "CASE-2024-001235", client: "蚂蚁集团", title: "区块链支付验证方法", center: "杭州保护中心", status: "待提交", submitDate: "-", expectDate: "2024-02-25" },
]

export function ProtectionCenter({ onNavigate }: ProtectionCenterProps) {
  const [activeTab, setActiveTab] = useState("all")

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      "待提交": { className: "bg-gray-100 text-gray-600", icon: <Clock className="h-3 w-3 mr-1" /> },
      "预审中": { className: "bg-blue-100 text-blue-700", icon: <Shield className="h-3 w-3 mr-1" /> },
      "已通过": { className: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      "需补正": { className: "bg-orange-100 text-orange-700", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
    }
    const cfg = config[status] || config["待提交"]
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
          <h1 className="text-2xl font-semibold text-foreground">保护中心</h1>
          <p className="text-muted-foreground mt-1">管理知识产权保护中心预审案件</p>
        </div>
        <Button>
          <Send className="mr-2 h-4 w-4" />
          提交预审申请
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待提交</p>
                <p className="text-2xl font-semibold">5</p>
              </div>
              <Clock className="h-8 w-8 text-gray-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">预审中</p>
                <p className="text-2xl font-semibold text-blue-600">3</p>
              </div>
              <Shield className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已通过</p>
                <p className="text-2xl font-semibold text-green-600">2</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">需补正</p>
                <p className="text-2xl font-semibold text-orange-600">2</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">全部 (12)</TabsTrigger>
              <TabsTrigger value="pending">待提交 (5)</TabsTrigger>
              <TabsTrigger value="reviewing">预审中 (3)</TabsTrigger>
              <TabsTrigger value="passed">已通过 (2)</TabsTrigger>
              <TabsTrigger value="correction">需补正 (2)</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">预审编号</TableHead>
                <TableHead className="w-[140px]">关联案件</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[120px]">保护中心</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[100px]">提交日期</TableHead>
                <TableHead className="w-[100px]">预计完成</TableHead>
                <TableHead className="w-[80px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProtectionCases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell className="text-primary cursor-pointer" onClick={() => onNavigate("m09-case-detail")}>{item.caseId}</TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.title}>{item.title}</TableCell>
                  <TableCell>{item.center}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.submitDate}</TableCell>
                  <TableCell>{item.expectDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FileText className="h-4 w-4" />
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
