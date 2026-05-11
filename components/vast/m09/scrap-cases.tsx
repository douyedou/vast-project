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
import { Search, Archive, RotateCcw, Trash2, Eye, FileText } from "lucide-react"

interface ScrapCasesProps {
  onNavigate: (page: string) => void
}

const mockScrapCases = [
  { id: "CASE-2024-001250", client: "网易科技", title: "游戏场景渲染优化系统", type: "发明", reason: "新创性不足", scrapDate: "2024-02-05", operator: "刘经理", stage: "M06交底" },
  { id: "CASE-2024-001238", client: "快手科技", title: "直播互动特效生成方法", type: "发明", reason: "客户撤回", scrapDate: "2024-02-01", operator: "王经理", stage: "M07撰写" },
  { id: "CASE-2024-001225", client: "B站科技", title: "弹幕防遮挡算法", type: "发明", reason: "技术方案不完整", scrapDate: "2024-01-28", operator: "张经理", stage: "M06交底" },
  { id: "CASE-2024-001218", client: "知乎网络", title: "问答推荐排序系统", type: "实用新型", reason: "重复申请", scrapDate: "2024-01-20", operator: "李经理", stage: "M08审核" },
  { id: "CASE-2024-001205", client: "微博科技", title: "热点话题挖掘方法", type: "发明", reason: "审核未通过", scrapDate: "2024-01-15", operator: "赵经理", stage: "M08审核" },
]

export function ScrapCases({ onNavigate }: ScrapCasesProps) {
  const [searchKeyword, setSearchKeyword] = useState("")

  const getReasonBadge = (reason: string) => {
    const config: Record<string, string> = {
      "新创性不足": "bg-orange-100 text-orange-700",
      "客户撤回": "bg-gray-100 text-gray-600",
      "技术方案不完整": "bg-red-100 text-red-700",
      "重复申请": "bg-purple-100 text-purple-700",
      "审核未通过": "bg-red-100 text-red-700",
    }
    return <Badge className={config[reason] || "bg-gray-100 text-gray-600"}>{reason}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">废案管理</h1>
          <p className="text-muted-foreground mt-1">共 23 个废案记录</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">新创性不足</p>
              <p className="text-2xl font-semibold text-orange-600">8</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">客户撤回</p>
              <p className="text-2xl font-semibold text-gray-600">6</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">技术方案问题</p>
              <p className="text-2xl font-semibold text-red-600">5</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">其他原因</p>
              <p className="text-2xl font-semibold">4</p>
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
                placeholder="搜索案件号、客户名称、专利名称..."
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
                <TableHead className="w-[100px]">客户</TableHead>
                <TableHead>专利名称</TableHead>
                <TableHead className="w-[80px]">类型</TableHead>
                <TableHead className="w-[120px]">废案原因</TableHead>
                <TableHead className="w-[100px]">废案阶段</TableHead>
                <TableHead className="w-[100px]">废案日期</TableHead>
                <TableHead className="w-[80px]">操作人</TableHead>
                <TableHead className="w-[120px] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockScrapCases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-muted-foreground">{item.id}</TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.title}>{item.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{getReasonBadge(item.reason)}</TableCell>
                  <TableCell>{item.stage}</TableCell>
                  <TableCell>{item.scrapDate}</TableCell>
                  <TableCell>{item.operator}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate("m09-case-detail")}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" title="恢复案件">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="永久删除">
                        <Trash2 className="h-4 w-4" />
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
