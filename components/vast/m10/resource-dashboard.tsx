'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Plus, Upload, FileText, Database, BookOpen, Grid3x3, 
  Link2, Zap, Brain, TrendingUp, AlertCircle, CheckCircle2,
  Package, Clock, ArchiveX, Eye, Edit, Trash2
} from 'lucide-react'

interface ResourceDashboardProps {
  onNavigate?: (page: string) => void
}

export function ResourceDashboard({ onNavigate }: ResourceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const resourceStats = [
    { label: '术语总量', value: '2,456', color: '#1E5EFF', icon: FileText, badge: '+120' },
    { label: '模板总数', value: '187', color: '#2F80ED', icon: BookOpen, badge: '+8' },
    { label: '规范库', value: '34', color: '#27AE60', icon: Grid3x3, badge: '3' },
    { label: 'IPC分类', value: '8,540', color: '#E74C3C', icon: Database, badge: '+450' },
    { label: '图纸资源', value: '523', color: '#F39C12', icon: Package, badge: '+25' },
    { label: '样本总数', value: '12,847', color: '#9B59B6', icon: Brain, badge: '+1,230' },
  ]

  const pendingTasks = [
    { id: 1, type: '待审核资源', count: 12, color: 'bg-orange-50', badge: 'warning' },
    { id: 2, type: '待发布模板', count: 8, color: 'bg-blue-50', badge: 'info' },
    { id: 3, type: '待更新规则', count: 5, color: 'bg-purple-50', badge: 'pending' },
    { id: 4, type: '待归类样本', count: 156, color: 'bg-pink-50', badge: 'attention' },
    { id: 5, type: '失效资源', count: 3, color: 'bg-red-50', badge: 'danger' },
  ]

  const frequentResources = [
    { name: '技术特征', calls: 2543, status: '已发布' },
    { name: '设计方案', calls: 2108, status: '已发布' },
    { name: '性能参数', calls: 1876, status: '已发布' },
    { name: '说明书标准格式', calls: 1654, status: '已发布' },
  ]

  const resourceTrend = [
    { month: '1月', 术语: 180, 模板: 12, 规则: 5, 样本: 450 },
    { month: '2月', 术语: 210, 模板: 15, 规则: 7, 样本: 580 },
    { month: '3月', 术语: 245, 模板: 18, 规则: 6, 样本: 720 },
    { month: '4月', 术语: 290, 模板: 21, 规则: 9, 样本: 890 },
    { month: '5月', 术语: 320, 模板: 24, 规则: 11, 样本: 1050 },
  ]

  const recentActivities = [
    { id: 1, action: '新增术语', resource: '深度学习算法', user: '张三', time: '2小时前' },
    { id: 2, action: '发布规则', resource: 'M07交底覆盖规则v2.0', user: '李四', time: '5小时前' },
    { id: 3, action: '上传图纸', resource: '系统架构图_v3', user: '王五', time: '1天前' },
    { id: 4, action: '导入样本', resource: '授权案件样本_批次12', user: '赵六', time: '2天前' },
  ]

  const quickActions = [
    { label: '新增术语', icon: Plus, action: () => onNavigate?.('m10-terminology') },
    { label: '新增模板', icon: Plus, action: () => onNavigate?.('m10-template') },
    { label: '新增规则', icon: Plus, action: () => onNavigate?.('m10-quality-rules') },
    { label: '导入样本', icon: Upload, action: () => onNavigate?.('m10-sample') },
  ]

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">M10 资源库工作台</h1>
            <p className="text-sm text-muted-foreground mt-1">统一管理术语、模板、规范、规则和AI训练样本</p>
          </div>
          <div className="flex gap-2">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant={idx === 0 ? 'default' : 'outline'}
                size="sm"
                onClick={action.action}
              >
                <action.icon className="w-4 h-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border border-border">
            <TabsTrigger value="overview">数据概览</TabsTrigger>
            <TabsTrigger value="pending">待处理事项</TabsTrigger>
            <TabsTrigger value="frequent">高频资源</TabsTrigger>
            <TabsTrigger value="activity">最近动态</TabsTrigger>
          </TabsList>

          {/* 数据概览 */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {resourceStats.map((stat, idx) => {
                const IconComponent = stat.icon
                return (
                  <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onNavigate?.(`m10-${stat.label}`)}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                          <p className="text-xs text-green-600 mt-2">{stat.badge}</p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                          <IconComponent className="w-6 h-6" style={{ color: stat.color }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* 资源增长趋势 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  资源增长趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resourceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="术语" stroke="#1E5EFF" strokeWidth={2} />
                    <Line type="monotone" dataKey="模板" stroke="#2F80ED" strokeWidth={2} />
                    <Line type="monotone" dataKey="规则" stroke="#27AE60" strokeWidth={2} />
                    <Line type="monotone" dataKey="样本" stroke="#9B59B6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 待处理事项 */}
          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {pendingTasks.map((task) => (
                <Card key={task.id} className={`${task.color} border-0`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{task.type}</p>
                        <p className="text-2xl font-bold mt-2">{task.count}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onNavigate?.(`m10-${task.type}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 高频资源 */}
          <TabsContent value="frequent">
            <Card>
              <CardHeader>
                <CardTitle>高频调用资源排行</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {frequentResources.map((resource, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-primary">{idx + 1}</div>
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">{resource.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{resource.calls.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">次调用</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 最近动态 */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>最近动态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium"><span className="text-primary">{activity.action}</span> - {activity.resource}</p>
                            <p className="text-sm text-muted-foreground mt-1">{activity.user} • {activity.time}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
