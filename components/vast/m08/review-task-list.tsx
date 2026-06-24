'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Filter, Download } from 'lucide-react'

interface ReviewTaskListProps {
  onNavigate?: (page: string) => void
  onReviewSelect?: (reviewId: string) => void
}

interface CaseItem {
  id: string
  reviewId: string
  case_id: string
  title: string
  type: string
  status: string
  reviewer_name: string | null
  blocking_count: number
  returned_count: number
  created_at: string
}

const typeMap: Record<string, string> = {
  invention: '发明',
  utility: '实用新型',
  design: '外观设计',
}

const statusLabelMap: Record<string, string> = {
  draft: '草稿',
  assigning: '待分配',
  searching: '检索中',
  confirming: '待确认',
  filing: '立案中',
  disclosure_pending: '待交底',
  writing: '撰写中',
  reviewing: '审核中',
  completed: '已完成',
  rejected: '已退回',
}

const statusStyleMap: Record<string, string> = {
  reviewing: 'bg-[#EAF4FF] text-[#2F80ED]',
  completed: 'bg-[#F0FDF4] text-[#16A34A]',
  rejected: 'bg-[#FEF2F2] text-[#DC2626]',
  writing: 'bg-[#F5F7FA] text-[#374151]',
  default: 'bg-[#F5F7FA] text-[#374151]',
}

export function ReviewTaskList({ onNavigate, onReviewSelect }: ReviewTaskListProps) {
  const [tasks, setTasks] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('vast_token')
    fetch(`/api/m08/reviews?page=1&pageSize=50${status !== 'all' ? '&status=' + status : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) {
          setTasks(data.data.list || [])
        }
      })
      .finally(() => setLoading(false))
  }, [status])

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = status === 'all' || task.status === status
    const matchesSearch =
      !searchTerm ||
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.case_id?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="w-full space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111827]">审核任务列表</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">集中管理全部审核任务</p>
      </div>

      <Card className="border-[#E5E9F0]">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] w-4 h-4" />
              <Input
                placeholder="搜索案件编号或名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 border-[#E5E9F0]"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32 h-9 border-[#E5E9F0]">
                <SelectValue placeholder="案件状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="reviewing">审核中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="rejected">已退回</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-9 border-[#E5E9F0]">
                <SelectValue placeholder="专利类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="invention">发明</SelectItem>
                <SelectItem value="utility">实用新型</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 border-[#E5E9F0] text-[#374151]">
              <Filter className="w-4 h-4 mr-1.5" />更多筛选
            </Button>
            <Button variant="outline" size="sm" className="h-9 border-[#E5E9F0] text-[#374151]">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E9F0]">
        <CardContent className="pt-0 px-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#E5E9F0] bg-[#F9FAFB]">
                  <TableHead className="text-xs text-[#9CA3AF] w-20 pl-4">案件编号</TableHead>
                  <TableHead className="text-xs text-[#9CA3AF]">专利名称</TableHead>
                  <TableHead className="text-xs text-[#9CA3AF] w-20">专利类型</TableHead>
                  <TableHead className="text-xs text-[#9CA3AF] w-20">案件状态</TableHead>
                  <TableHead className="text-xs text-[#9CA3AF] w-16">审核人</TableHead>
                  <TableHead className="text-xs text-[#9CA3AF] w-20 text-center pr-4">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} className="border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer"
                    onClick={() => { onReviewSelect?.(task.reviewId); onNavigate?.('m08-task-detail') }}>
                    <TableCell className="font-mono text-xs text-[#9CA3AF] pl-4">{task.case_id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-[#111827]">{task.title}</p>
                        <p className="text-xs text-[#9CA3AF]">{new Date(task.created_at).toLocaleDateString('zh-CN')}
                          {task.blocking_count > 0 && <span className="ml-2 text-red-500">· {task.blocking_count} 阻断</span>}
                          {task.returned_count > 0 && <span className="ml-2 text-orange-500">· 退回 {task.returned_count} 次</span>}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#374151]">{typeMap[task.type] || task.type}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyleMap[task.status] || statusStyleMap.default}`}>
                        {statusLabelMap[task.status] || task.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[#374151]">{task.reviewer_name || '未分配'}</TableCell>
                    <TableCell className="text-center pr-4">
                      <Button variant="ghost" size="sm" className="text-xs text-[#2F80ED] h-7 px-2"
                        onClick={(e) => { e.stopPropagation(); onReviewSelect?.(task.reviewId); onNavigate?.('m08-task-detail') }}>
                        进入审核
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9CA3AF]">共 {filteredTasks.length} 条记录</p>
      </div>
    </div>
  )
}
