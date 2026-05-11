'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  User,
  ChevronRight,
} from 'lucide-react'

interface CaseDashboardProps {
  onNavigate?: (page: string) => void
}

export function CaseDashboard({ onNavigate }: CaseDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  const caseStats = [
    { label: '未立案', value: 45, color: '#9CA3AF', icon: Clock },
    { label: '撰写失败', value: 12, color: '#EF4444', icon: XCircle },
    { label: '审核未通过', value: 28, color: '#F97316', icon: AlertCircle },
    { label: '待交案', value: 67, color: '#3B82F6', icon: FileText },
    { label: '已交案', value: 156, color: '#8B5CF6', icon: CheckCircle },
    { label: '授权', value: 89, color: '#10B981', icon: CheckCircle },
    { label: '废案', value: 23, color: '#1F2937', icon: XCircle },
  ]

  const todoItems = [
    { id: 1, title: '案件 PA-2024-001 待交案', type: '待交案', time: '2024-05-05' },
    { id: 2, title: '保护中心案件 PC-008 已退回', type: '保护中心退回', time: '2024-05-04', urgent: true },
    { id: 3, title: '案件 PA-2024-015 待提交国知局', type: '待提交国知局', time: '2024-05-03' },
    { id: 4, title: '案件 PA-2024-021 待上传授权文件', type: '待上传授权', time: '2024-05-02' },
    { id: 5, title: '案件 PA-2024-009 待归档', type: '待归档', time: '2024-05-01' },
  ]

  const riskAlerts = [
    { id: 1, title: '交案超期', count: 8, color: '#EF4444', level: 'high' },
    { id: 2, title: '保护中心退回未处理', count: 5, color: '#F97316', level: 'medium' },
    { id: 3, title: '保护中心驳回', count: 2, color: '#EF4444', level: 'high' },
    { id: 4, title: '国知局状态异常', count: 3, color: '#F97316', level: 'medium' },
    { id: 5, title: '文件缺失', count: 12, color: '#FBBF24', level: 'low' },
  ]

  const recentActivities = [
    { id: 1, action: '案件 PA-2024-088 已授权', time: '2024-05-05 10:30', user: '张三' },
    { id: 2, action: '案件 PA-2024-087 提交保护中心', time: '2024-05-05 09:15', user: '李四' },
    { id: 3, action: '案件 PA-2024-086 国知局受理', time: '2024-05-04 16:45', user: '系统' },
    { id: 4, action: '案件 PA-2024-085 上传授权文件', time: '2024-05-04 14:20', user: '王五' },
  ]

  const chartData = [
    { month: '1月', 未立案: 45, 待交案: 32, 已交案: 120, 授权: 68 },
    { month: '2月', 未立案: 52, 待交案: 45, 已交案: 145, 授权: 85 },
    { month: '3月', 未立案: 48, 待交案: 38, 已交案: 168, 授权: 102 },
    { month: '4月', 未立案: 55, 待交案: 52, 已交案: 182, 授权: 115 },
    { month: '5月', 未立案: 45, 待交案: 67, 已交案: 156, 授权: 89 },
  ]

  const handleQuickAccess = (page: string) => {
    onNavigate?.(page)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">案件管理工作台</h1>
          <p className="text-sm text-muted-foreground mt-1">统一管理 VAST 全流程案件状态、归档和知识资产沉淀</p>
        </div>

        {/* 快捷入口 */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAccess('m09-waiting-cases')}
            className="gap-2"
          >
            待交案列表
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAccess('m09-protection-center')}
            className="gap-2"
          >
            保护中心状态
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAccess('m09-national-ip')}
            className="gap-2"
          >
            国知局状态
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAccess('m09-scrap-cases')}
            className="gap-2"
          >
            废案管理
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAccess('m09-knowledge-assets')}
            className="gap-2"
          >
            知识资产
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 数据看板 */}
        <div className="grid grid-cols-7 gap-4">
          {caseStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={index}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedMetric(stat.label)
                  handleQuickAccess('m09-all-cases')
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  <Badge variant="secondary" className="text-xs">
                    {stat.value}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
              </Card>
            )
          })}
        </div>

        {/* 主体内容：待办和风险 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 我的待办 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              我的待办
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todoItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                  onClick={() => handleQuickAccess('m09-case-detail')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                    </div>
                    {item.urgent && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 风险提醒 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              风险提醒
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {riskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors border-l-4"
                  style={{ borderLeftColor: alert.color }}
                  onClick={() => handleQuickAccess('m09-all-cases')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.count} 个案件</p>
                    </div>
                    <Badge
                      variant={alert.level === 'high' ? 'destructive' : alert.level === 'medium' ? 'outline' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 案件动态趋势 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            案件动态趋势（近5月）
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="未立案" stroke="#9CA3AF" strokeWidth={2} />
              <Line type="monotone" dataKey="待交案" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="已交案" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="授权" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 最近动态 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">最近动态</h2>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-4 pb-3 border-b last:border-b-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.action}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">{activity.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
