'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react'

interface ReviewDashboardProps {
  onNavigate?: (page: string) => void
}

export function ReviewDashboard({ onNavigate }: ReviewDashboardProps) {
  const [activeTab, setActiveTab] = useState('pending')

  const stats = [
    { label: '待审核', value: 12, colorBg: 'bg-[#F5F7FA]', colorText: 'text-[#374151]', icon: Clock, page: 'm08-task-list' },
    { label: '审核中', value: 8, colorBg: 'bg-[#EAF4FF]', colorText: 'text-[#2F80ED]', icon: TrendingUp, page: 'm08-task-list' },
    { label: '已退回', value: 5, colorBg: 'bg-[#FEF2F2]', colorText: 'text-[#DC2626]', icon: AlertCircle, page: 'm08-task-list' },
    { label: '已通过', value: 24, colorBg: 'bg-[#F0FDF4]', colorText: 'text-[#16A34A]', icon: CheckCircle, page: 'm08-task-list' },
    { label: '高风险', value: 3, colorBg: 'bg-[#FFF7ED]', colorText: 'text-[#EA580C]', icon: AlertTriangle, page: 'm08-task-list' },
    { label: '超期', value: 2, colorBg: 'bg-[#FEF2F2]', colorText: 'text-[#DC2626]', icon: AlertCircle, page: 'm08-task-list' },
  ]

  const myTasks = [
    { id: 'T001', caseNo: 'C2024001', title: '智能人体识别装置', status: '待审核', priority: '高', dueDate: '2024-05-10', blocking: 3 },
    { id: 'T002', caseNo: 'C2024002', title: '机器学习优化方法', status: '审核中', priority: '中', dueDate: '2024-05-12', blocking: 0 },
    { id: 'T003', caseNo: 'C2024003', title: '数据加密传输协议', status: '待审核', priority: '高', dueDate: '2024-05-08', blocking: 5 },
  ]

  const riskAlerts = [
    { id: 'R001', type: '权利要求无支持', count: 3, severity: 'blocking', cases: ['C2024001', 'C2024004'] },
    { id: 'R002', type: 'AI相似性超标', count: 2, severity: 'warning', cases: ['C2024002'] },
    { id: 'R003', type: '交底不完整', count: 4, severity: 'warning', cases: ['C2024005', 'C2024006'] },
    { id: 'R004', type: '新创性不足', count: 1, severity: 'blocking', cases: ['C2024007'] },
    { id: 'R005', type: '图号术语异常', count: 2, severity: 'suggestion', cases: ['C2024003'] },
  ]

  const recentActivity = [
    { id: 'A001', action: '任务创建', caseNo: 'C2024008', time: '2024-05-05 10:30', user: '张工' },
    { id: 'A002', action: '规则检查', caseNo: 'C2024001', time: '2024-05-05 09:45', user: '李工' },
    { id: 'A003', action: '审核通过', caseNo: 'C2024002', time: '2024-05-04 16:20', user: '王工' },
    { id: 'A004', action: '退回M07', caseNo: 'C2024003', time: '2024-05-04 14:15', user: '李工' },
  ]

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'blocking': return 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
      case 'warning': return 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]'
      case 'suggestion': return 'bg-[#EAF4FF] text-[#2F80ED] border border-[#BFDBFE]'
      default: return 'bg-[#F5F7FA] text-[#374151]'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case '待审核': return 'bg-[#F5F7FA] text-[#374151]'
      case '审核中': return 'bg-[#EAF4FF] text-[#2F80ED]'
      case '已退回': return 'bg-[#FEF2F2] text-[#DC2626]'
      case '已通过': return 'bg-[#F0FDF4] text-[#16A34A]'
      default: return 'bg-[#F5F7FA] text-[#374151]'
    }
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">M08 质量审核工作台</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">强制质量门 — 交底、申请文件、五书全面审核</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[#374151]">
            <Settings className="w-4 h-4 mr-1.5" />规则配置
          </Button>
          <Button variant="outline" size="sm" className="text-[#374151]">
            <BarChart3 className="w-4 h-4 mr-1.5" />审核报告
          </Button>
        </div>
      </div>

      {/* 快速导航 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: '审核任务列表', page: 'm08-task-list' },
          { label: '审核任务详情', page: 'm08-task-detail' },
          { label: '交底书审核', page: 'm08-disclosure-review' },
          { label: '审核决策', page: 'm08-review-decision' },
        ].map((item) => (
          <Button key={item.label} variant="outline" size="sm" className="text-[#374151] text-xs"
            onClick={() => onNavigate?.(item.page)}>
            {item.label}
          </Button>
        ))}
      </div>

      {/* 数据看板 */}
      <div className="grid grid-cols-6 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="cursor-pointer hover:shadow-md transition-shadow border-[#E5E9F0]"
              onClick={() => onNavigate?.(stat.page)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#111827] mt-0.5">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.colorBg}`}>
                    <Icon className={`w-4 h-4 ${stat.colorText}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 我的审核任务 */}
        <Card className="col-span-2 border-[#E5E9F0]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#111827]">我的审核任务</CardTitle>
              <Button variant="ghost" size="sm" className="text-[#2F80ED] text-xs h-7"
                onClick={() => onNavigate?.('m08-task-list')}>
                查看全部 <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 h-8">
                <TabsTrigger value="pending" className="text-xs">今日待审</TabsTrigger>
                <TabsTrigger value="overdue" className="text-xs">即将超期</TabsTrigger>
                <TabsTrigger value="rereview" className="text-xs">退回复审</TabsTrigger>
                <TabsTrigger value="high" className="text-xs">高优先级</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-3">
                <div className="space-y-2">
                  {myTasks.map((task) => (
                    <div key={task.id}
                      className="flex items-center justify-between p-3 border border-[#E5E9F0] rounded-lg hover:bg-[#F5F7FA] cursor-pointer transition-colors"
                      onClick={() => onNavigate?.('m08-task-detail')}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#111827] truncate">{task.title}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{task.caseNo} · 截止 {task.dueDate}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {task.blocking > 0 && (
                          <span className="text-xs bg-[#FEF2F2] text-[#DC2626] px-1.5 py-0.5 rounded font-medium">{task.blocking} 阻断</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(task.status)}`}>{task.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="overdue" className="mt-3">
                <p className="text-sm text-[#9CA3AF] text-center py-6">暂无即将超期任务</p>
              </TabsContent>
              <TabsContent value="rereview" className="mt-3">
                <p className="text-sm text-[#9CA3AF] text-center py-6">暂无退回复审任务</p>
              </TabsContent>
              <TabsContent value="high" className="mt-3">
                <p className="text-sm text-[#9CA3AF] text-center py-6">暂无高优先级任务</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 风险提醒 */}
        <Card className="border-[#E5E9F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#111827]">风险提醒</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskAlerts.map((alert) => (
                <div key={alert.id}
                  className={`p-2.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${getSeverityStyle(alert.severity)}`}
                  onClick={() => onNavigate?.('m08-task-list')}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{alert.type}</p>
                    <span className="text-xs font-bold">{alert.count}</span>
                  </div>
                  <p className="text-xs opacity-70 mt-0.5">{alert.cases.join('、')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近动态 */}
      <Card className="border-[#E5E9F0]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#111827]">最近动态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {recentActivity.map((activity, idx) => (
              <div key={activity.id}
                className={`flex items-center justify-between py-2.5 ${idx < recentActivity.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2F80ED]" />
                  <div>
                    <p className="text-sm text-[#111827]">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-[#9CA3AF] mx-1">·</span>
                      <span className="text-[#9CA3AF]">{activity.caseNo}</span>
                      <span className="text-[#9CA3AF] mx-1">·</span>
                      <span className="text-[#9CA3AF]">{activity.user}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#9CA3AF]">{activity.time}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
