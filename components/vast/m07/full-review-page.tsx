"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronLeft,
  PlayCircle,
  RefreshCw,
  Save,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  ArrowRight,
} from "lucide-react"

interface FullReviewPageProps {
  onBack: () => void
  onSubmit: () => void
}

const reviewStats = {
  blocking: 2,
  warning: 3,
  passed: 12,
  coverageRate: 85,
  supportRate: 90,
  duplicateRate: 8,
  aiSimilarity: 12,
}

const reviewItems = [
  {
    id: "r1",
    type: "交底覆盖",
    severity: "blocking",
    description: "交底书替代方案-强化学习算法章节未在说明书中覆盖",
    source: "交底覆盖核对",
    location: "说明书-发明内容",
    status: "pending",
  },
  {
    id: "r2",
    type: "权利要求支持",
    severity: "blocking",
    description: "权利要求4中的人体红外传感器特征在说明书中无支持",
    source: "支持核对",
    location: "权利要求4",
    status: "pending",
  },
  {
    id: "r3",
    type: "术语一致性",
    severity: "warning",
    description: "说明书中使用AI处理模块，权利要求书中使用AI处理单元，术语不一致",
    source: "术语检查",
    location: "说明书-具体实施方式/权利要求1",
    status: "pending",
  },
  {
    id: "r4",
    type: "图号标号",
    severity: "warning",
    description: "附图说明中引用了图5，但附图中仅有图1-图4",
    source: "图号核对",
    location: "附图说明",
    status: "pending",
  },
  {
    id: "r5",
    type: "格式完整性",
    severity: "warning",
    description: "摘要字数超过300字，建议精简",
    source: "格式检查",
    location: "摘要",
    status: "pending",
  },
]

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "blocking":
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
          <XCircle className="h-3 w-3" />
          阻断项
        </span>
      )
    case "warning":
      return (
        <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
          <AlertTriangle className="h-3 w-3" />
          警告项
        </span>
      )
    default:
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
          <CheckCircle className="h-3 w-3" />
          通过
        </span>
      )
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "fixed":
      return (
        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">已处理</span>
      )
    case "ignored":
      return (
        <span className="text-xs text-[#6B7280] bg-[#F0F3F8] px-2 py-0.5 rounded">已忽略</span>
      )
    default:
      return (
        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">待处理</span>
      )
  }
}

export function FullReviewPage({ onBack, onSubmit }: FullReviewPageProps) {
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewed, setReviewed] = useState(true)
  const [items, setItems] = useState(reviewItems)

  const handleReview = () => {
    setIsReviewing(true)
    setTimeout(() => {
      setIsReviewing(false)
      setReviewed(true)
    }, 2000)
  }

  const hasBlocking = items.some((i) => i.severity === "blocking" && i.status === "pending")

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F5F7FA]">
      {/* 顶部操作栏 */}
      <div className="h-14 px-4 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">全文件与交底书复核</h1>
            <p className="text-xs text-[#9CA3AF]">智能温控系统发明专利</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReview} disabled={isReviewing}>
            {isReviewing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                复核中...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                执行全文件复核
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            保存审核锁定版本
          </Button>
          <Button size="sm" disabled={hasBlocking} onClick={onSubmit}>
            <Send className="h-4 w-4 mr-2" />
            提交 M08
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* 复核结果卡片 */}
        <div className="grid grid-cols-7 gap-4">
          <Card className={reviewStats.blocking > 0 ? "border-red-200 bg-red-50" : ""}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{reviewStats.blocking}</div>
              <div className="text-xs text-red-600 mt-1">阻断项</div>
            </CardContent>
          </Card>
          <Card className={reviewStats.warning > 0 ? "border-orange-200 bg-orange-50" : ""}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{reviewStats.warning}</div>
              <div className="text-xs text-orange-600 mt-1">警告项</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{reviewStats.passed}</div>
              <div className="text-xs text-green-600 mt-1">通过项</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#2F80ED]">{reviewStats.coverageRate}%</div>
              <div className="text-xs text-[#6B7280] mt-1">交底覆盖率</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#2F80ED]">{reviewStats.supportRate}%</div>
              <div className="text-xs text-[#6B7280] mt-1">权利要求支持率</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{reviewStats.duplicateRate}%</div>
              <div className="text-xs text-[#6B7280] mt-1">查重率</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{reviewStats.aiSimilarity}%</div>
              <div className="text-xs text-[#6B7280] mt-1">AI相似性</div>
            </CardContent>
          </Card>
        </div>

        {/* 问题列表 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">问题列表</CardTitle>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span>共 {items.length} 项</span>
                <span>·</span>
                <span className="text-red-600">阻断 {items.filter((i) => i.severity === "blocking").length}</span>
                <span>·</span>
                <span className="text-orange-600">警告 {items.filter((i) => i.severity === "warning").length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F9FAFB]">
                  <TableHead className="w-28">问题类型</TableHead>
                  <TableHead className="w-24">严重级别</TableHead>
                  <TableHead>问题描述</TableHead>
                  <TableHead className="w-24">来源模块</TableHead>
                  <TableHead className="w-40">定位位置</TableHead>
                  <TableHead className="w-24">处理状态</TableHead>
                  <TableHead className="w-28 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-[#F9FAFB]">
                    <TableCell className="text-sm text-[#374151]">{item.type}</TableCell>
                    <TableCell>{getSeverityBadge(item.severity)}</TableCell>
                    <TableCell className="text-sm text-[#374151]">{item.description}</TableCell>
                    <TableCell className="text-xs text-[#6B7280]">{item.source}</TableCell>
                    <TableCell className="text-xs text-[#2F80ED]">{item.location}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-[#6B7280]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ArrowRight className="h-4 w-4 text-[#2F80ED]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 阻断提示 */}
        {hasBlocking && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm font-medium text-red-800">存在未处理的阻断项</div>
                  <div className="text-xs text-red-600 mt-1">
                    请先处理所有阻断项后才能提交 M08 审核
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
