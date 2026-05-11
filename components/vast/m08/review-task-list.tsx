'use client'

import { useState } from 'react'
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
}

export function ReviewTaskList({ onNavigate }: ReviewTaskListProps) {
  const [status, setStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const tasks = [
    { id: 'R001', caseNo: 'C2024001', title: '智能人体识别装置', type: '发明专利', method: '电子申请', reviewType: '初审', reviewStatus: '待审核', blockingCount: 3, warningCount: 1, similarity: '28%', reviewer: '李四', submitTime: '2024-05-05' },
    { id: 'R002', caseNo: 'C2024002', title: '机器学习优化方法', type: '发明专利', method: '电子申请', reviewType: '复审', reviewStatus: '审核中', blockingCount: 0, warningCount: 2, similarity: '32%', reviewer: '李四', submitTime: '2024-05-04' },
    { id: 'R003', caseNo: 'C2024003', title: '数据加密传输协议', type: '发明专利', method: '纸质申请', reviewType: '初审', reviewStatus: '已退回', blockingCount: 5, warningCount: 3, similarity: '45%', reviewer: '王工', submitTime: '2024-05-03' },
    { id: 'R004', caseNo: 'C2024004', title: '图像处理芯片', type: '实用新型', method: '电子申请', reviewType: '初审', reviewStatus: '已通过', blockingCount: 0, warningCount: 0, similarity: '15%', reviewer: '李四', submitTime: '2024-05-02' },
    { id: 'R005', caseNo: 'C2024005', title: '云计算架构优化', type: '发明专利', method: '电子申请', reviewType: '初审', reviewStatus: '待审核', blockingCount: 2, warningCount: 4, similarity: '38%', reviewer: '未分配', submitTime: '2024-05-01' },
  ]

  const getStatusStyle = (s: string) => {
    switch (s) {
      case '待审核': return 'bg-[#F5F7FA] text-[#374151]'
      case '审核中': return 'bg-[#EAF4FF] text-[#2F80ED]'
      case '已退回': return 'bg-[#FEF2F2] text-[#DC2626]'
      case '已通过': return 'bg-[#F0FDF4] text-[#16A34A]'
      default: return 'bg-[#F5F7FA] text-[#374151]'
    }
  }

  const getSimilarityColor = (similarity: string) => {
    const value = parseInt(similarity)
    if (value > 40) return 'text-[#DC2626] font-semibold'
    if (value > 30) return 'text-[#EA580C] font-semibold'
    return 'text-[#16A34A] font-semibold'
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = status === 'all' || task.reviewStatus === status
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.caseNo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="w-full space-y-4 p-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111827]">审核任务列表</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">集中管理全部审核任务</p>
      </div>

      {/* 筛选区 */}
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
            <Select defaultValue="all" onValueChange={setStatus}>
              <SelectTrigger className="w-32 h-9 border-[#E5E9F0]">
                <SelectValue placeholder="审核状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="待审核">待审核</SelectItem>
                <SelectItem value="审核中">审核中</SelectItem>
                <SelectItem value="已退回">已退回</SelectItem>
                <SelectItem value="已通过">已通过</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-9 border-[#E5E9F0]">
                <SelectValue placeholder="专利类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="发明">发明专利</SelectItem>
                <SelectItem value="实用">实用新型</SelectItem>
                <SelectItem value="外观">外观设计</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-9 border-[#E5E9F0]">
                <SelectValue placeholder="风险等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="blocking">阻断</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="safe">安全</SelectItem>
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

      {/* 任务表格 */}
      <Card className="border-[#E5E9F0]">
        <CardContent className="pt-0 px-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E9F0] bg-[#F9FAFB]">
                <TableHead className="text-xs text-[#9CA3AF] w-16 pl-4">审核编号</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">案件编号</TableHead>
                <TableHead className="text-xs text-[#9CA3AF]">专利名称</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">专利类型</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">申请方式</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">审核状态</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-14 text-center">阻断</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-14 text-center">警告</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20">AI相似性</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-16">审核人</TableHead>
                <TableHead className="text-xs text-[#9CA3AF] w-20 text-center pr-4">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id} className="border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer"
                  onClick={() => onNavigate?.('m08-task-detail')}>
                  <TableCell className="font-mono text-xs text-[#9CA3AF] pl-4">{task.id}</TableCell>
                  <TableCell className="font-mono text-xs text-[#9CA3AF]">{task.caseNo}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm text-[#111827]">{task.title}</p>
                      <p className="text-xs text-[#9CA3AF]">{task.submitTime}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[#374151]">{task.type}</TableCell>
                  <TableCell className="text-sm text-[#374151]">{task.method}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(task.reviewStatus)}`}>
                      {task.reviewStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {task.blockingCount > 0 && (
                      <span className="text-xs bg-[#FEF2F2] text-[#DC2626] px-1.5 py-0.5 rounded font-semibold">
                        {task.blockingCount}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {task.warningCount > 0 && (
                      <span className="text-xs bg-[#FFF7ED] text-[#EA580C] px-1.5 py-0.5 rounded font-semibold">
                        {task.warningCount}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${getSimilarityColor(task.similarity)}`}>{task.similarity}</span>
                  </TableCell>
                  <TableCell className="text-sm text-[#374151]">{task.reviewer}</TableCell>
                  <TableCell className="text-center pr-4">
                    <Button variant="ghost" size="sm" className="text-xs text-[#2F80ED] h-7 px-2"
                      onClick={(e) => { e.stopPropagation(); onNavigate?.('m08-task-detail') }}>
                      进入审核
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9CA3AF]">共 {filteredTasks.length} 条记录</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 border-[#E5E9F0] text-[#374151]">上一页</Button>
          <Button size="sm" className="h-8 bg-[#2F80ED] text-white">1</Button>
          <Button variant="outline" size="sm" className="h-8 border-[#E5E9F0] text-[#374151]">下一页</Button>
        </div>
      </div>
    </div>
  )
}
