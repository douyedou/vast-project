"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Star, TrendingUp, Award, FileText, Eye, Download, BarChart3 } from "lucide-react"

interface KnowledgeAssetsProps {
  onNavigate: (page: string) => void
}

const mockAssets = [
  { id: "PA-2024-0089", caseId: "CASE-2024-001252", client: "小米科技", title: "智能家居控制装置", type: "实用新型", status: "已授权", authDate: "2024-02-01", patentNo: "ZL202410001234.5", value: "高价值" },
  { id: "PA-2024-0078", caseId: "CASE-2024-001230", client: "阿里巴巴", title: "云计算资源调度方法", type: "发明", status: "已授权", authDate: "2024-01-15", patentNo: "ZL202310012345.8", value: "核心专利" },
  { id: "PA-2024-0065", caseId: "CASE-2024-001215", client: "华为技术", title: "5G基站信号优化方法", type: "发明", status: "已授权", authDate: "2023-12-20", patentNo: "ZL202310023456.1", value: "核心专利" },
  { id: "PA-2024-0052", caseId: "CASE-2024-001200", client: "腾讯科技", title: "游戏AI对战系统", type: "发明", status: "已授权", authDate: "2023-11-28", patentNo: "ZL202310034567.5", value: "高价值" },
  { id: "PA-2024-0041", caseId: "CASE-2024-001185", client: "百度在线", title: "语音识别降噪方法", type: "发明", status: "已授权", authDate: "2023-10-15", patentNo: "ZL202310045678.2", value: "普通" },
]

export function KnowledgeAssets({ onNavigate }: KnowledgeAssetsProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const getValueBadge = (value: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode }> = {
      "核心专利": { className: "bg-red-100 text-red-700", icon: <Award className="h-3 w-3 mr-1" /> },
      "高价值": { className: "bg-orange-100 text-orange-700", icon: <Star className="h-3 w-3 mr-1" /> },
      "普通": { className: "bg-gray-100 text-gray-600", icon: null },
    }
    const cfg = config[value] || config["普通"]
    return (
      <Badge className={`${cfg.className} flex items-center`}>
        {cfg.icon}
        {value}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">知识资产</h1>
          <p className="text-muted-foreground mt-1">管理已授权专利资产</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            资产分析报告
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出资产清单
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">专利总数</p>
                <p className="text-2xl font-semibold">156</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">核心专利</p>
                <p className="text-2xl font-semibold text-red-600">23</p>
              </div>
              <Award className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">高价值专利</p>
                <p className="text-2xl font-semibold text-orange-600">45</p>
              </div>
              <Star className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">本年新增</p>
                <p className="text-2xl font-semibold text-green-600">+18</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">全部 (156)</TabsTrigger>
                <TabsTrigger value="core">核心专利 (23)</TabsTrigger>
                <TabsTrigger value="high">高价值 (45)</TabsTrigger>
                <TabsTrigger value="invention">发明 (98)</TabsTrigger>
                <TabsTrigger value="utility">实用新型 (58)</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索专利号、名称、客户..."
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
                <TableHead className="w-[120px]">资产编号</TableHead>
                <TableHead className="w-[160px]">专利号</TableHead>
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">类型</TableHead>
                <TableHead className="w-[100px]">价值等级</TableHead>
                <TableHead className="w-[100px]">授权日期</TableHead>
                <TableHead className="w-[100px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAssets.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell className="font-mono text-sm text-primary">{item.patentNo}</TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.title}>{item.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{getValueBadge(item.value)}</TableCell>
                  <TableCell>{item.authDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate("m09-case-detail")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
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
