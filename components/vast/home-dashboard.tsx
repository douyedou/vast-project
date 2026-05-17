"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Cpu,
  Edit3,
  Shield,
  FolderArchive,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Calendar,
  Bell,
  Star,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"

interface HomeDashboardProps {
  onNavigate: (page: string) => void
}

// 模块数据
const moduleStats = [
  {
    id: "m05",
    name: "M05 咨询立案",
    icon: FileText,
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    stats: { total: 156, pending: 23, completed: 133 },
    trend: "+12%",
    page: "m05-dashboard",
  },
  {
    id: "m06",
    name: "M06 交底书引擎",
    icon: Cpu,
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    stats: { total: 89, pending: 15, completed: 74 },
    trend: "+8%",
    page: "m06-dashboard",
  },
  {
    id: "m07",
    name: "M07 专利创作",
    icon: Edit3,
    color: "#10B981",
    bgColor: "#ECFDF5",
    stats: { total: 234, pending: 45, completed: 189 },
    trend: "+15%",
    page: "m07-dashboard",
  },
  {
    id: "m08",
    name: "M08 质量审核",
    icon: Shield,
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    stats: { total: 178, pending: 32, completed: 146 },
    trend: "+5%",
    page: "m08-dashboard",
  },
  {
    id: "m09",
    name: "M09 案件管理",
    icon: FolderArchive,
    color: "#EF4444",
    bgColor: "#FEF2F2",
    stats: { total: 567, pending: 67, completed: 500 },
    trend: "+18%",
    page: "m09-dashboard",
  },
]

// 待办事项
const todoItems = [
  {
    id: 1,
    title: "待分配交底书",
    count: 8,
    type: "urgent",
    module: "M05",
    page: "dashboard",
  },
  {
    id: 2,
    title: "AI初检待确认",
    count: 5,
    type: "warning",
    module: "M06",
    page: "m06-ai-inspection",
  },
  {
    id: 3,
    title: "说明书待撰写",
    count: 12,
    type: "normal",
    module: "M07",
    page: "m07-list",
  },
  {
    id: 4,
    title: "待审核任务",
    count: 15,
    type: "urgent",
    module: "M08",
    page: "m08-task-list",
  },
  {
    id: 5,
    title: "待交案案件",
    count: 23,
    type: "warning",
    module: "M09",
    page: "m09-waiting-cases",
  },
]

// 趋势数据
const trendData = [
  { month: "1月", m05: 45, m06: 32, m07: 58, m08: 42, m09: 78 },
  { month: "2月", m05: 52, m06: 38, m07: 65, m08: 48, m09: 85 },
  { month: "3月", m05: 48, m06: 42, m07: 72, m08: 55, m09: 92 },
  { month: "4月", m05: 61, m06: 48, m07: 78, m08: 62, m09: 98 },
  { month: "5月", m05: 55, m06: 52, m07: 85, m08: 68, m09: 105 },
  { month: "6月", m05: 67, m06: 58, m07: 92, m08: 75, m09: 112 },
]

// 状态分布
const statusDistribution = [
  { name: "已完成", value: 542, color: "#10B981" },
  { name: "进行中", value: 182, color: "#3B82F6" },
  { name: "待处理", value: 98, color: "#F59E0B" },
  { name: "已退回", value: 45, color: "#EF4444" },
]

// 团队绩效
const teamPerformance = [
  { name: "张工程师", completed: 45, quality: 96 },
  { name: "李经理", completed: 38, quality: 98 },
  { name: "王工程师", completed: 42, quality: 94 },
  { name: "刘工程师", completed: 35, quality: 97 },
  { name: "陈经理", completed: 40, quality: 95 },
]

// 最近动态
const recentActivities = [
  {
    id: 1,
    action: "提交审核",
    target: "智能家居控制系统专利申请",
    user: "张工程师",
    time: "5分钟前",
    module: "M07",
  },
  {
    id: 2,
    action: "审核通过",
    target: "新能源电池管理方法",
    user: "李经理",
    time: "15分钟前",
    module: "M08",
  },
  {
    id: 3,
    action: "完成交底建模",
    target: "图像识别算法优化方案",
    user: "王工程师",
    time: "30分钟前",
    module: "M06",
  },
  {
    id: 4,
    action: "新增交底来源",
    target: "自动驾驶感知系统",
    user: "系统",
    time: "1小时前",
    module: "M05",
  },
  {
    id: 5,
    action: "案件已交案",
    target: "CN2024XXXXXX.X",
    user: "刘工程师",
    time: "2小时前",
    module: "M09",
  },
]

export function HomeDashboard({ onNavigate }: HomeDashboardProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vast_token')
    fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.code === 200) setStats(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const currentUser = {
    name: "用户",
    role: "专利工程师",
    avatar: "ZM",
  }

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  return (
    <div className="p-6 space-y-6">
      {/* Logo 和标题区域 */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1E5EFF] to-[#0A3CC2] flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl font-bold">V8</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">VAST 8.0</h1>
          <p className="text-[#6B7280] text-sm">专利智能生产系统 - 系统首页</p>
        </div>
      </div>
      
      {/* 顶部欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">
            欢迎回来，{currentUser.name}
          </h1>
          <p className="text-[#6B7280] mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {today}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => onNavigate("sys-notifications")}
          >
            <Bell className="h-4 w-4" />
            通知中心
            <Badge className="bg-[#EF4444] text-white">3</Badge>
          </Button>
          <Button
            className="gap-2 bg-[#1E5EFF] hover:bg-[#0A3CC2]"
            onClick={() => onNavigate("dashboard")}
          >
            <Zap className="h-4 w-4" />
            快速开始
          </Button>
        </div>
      </div>

      {/* 核心指标概览 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {moduleStats.map((module) => {
          const Icon = module.icon
          const apiTotal = stats?.moduleStats?.[module.id]?.total ?? module.stats.total
          const apiPending = stats?.moduleStats?.[module.id]?.pending ?? module.stats.pending
          const completionRate = apiTotal > 0 ? Math.round(((apiTotal - apiPending) / apiTotal) * 100) : 0
          return (
            <Card
              key={module.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm"
              onClick={() => onNavigate(module.page)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: module.bgColor }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: module.color }}
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[#10B981] border-[#10B981]/30 bg-[#ECFDF5]"
                  >
                    {module.trend}
                  </Badge>
                </div>
                <div className="text-xs text-[#6B7280] mb-1">{module.name}</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-[#111827]">
                    {loading ? '-' : apiTotal}
                  </div>
                  <div className="text-xs text-[#9CA3AF]">
                    待处理 {loading ? '-' : apiPending}
                  </div>
                </div>
                <Progress value={completionRate} className="h-1.5 mt-3" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 主内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - 待办事项 + 趋势图 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 待办事项 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[#111827]">
                  待办事项
                </CardTitle>
                <Badge variant="outline" className="text-[#EF4444] border-[#EF4444]/30">
                  {stats?.todoItems ? stats.todoItems.reduce((acc: number, item: any) => acc + item.count, 0) : todoItems.reduce((acc, item) => acc + item.count, 0)} 项待处理
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.todoItems ?? todoItems).map((item: any, index: number) => (
                  <div
                    key={item.id ?? index}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                    onClick={() => onNavigate(item.page)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.type === "urgent"
                            ? "bg-[#EF4444]"
                            : item.type === "warning"
                              ? "bg-[#F59E0B]"
                              : "bg-[#3B82F6]"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium text-[#111827]">
                          {item.title}
                        </div>
                        <div className="text-xs text-[#6B7280]">{item.module}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          item.type === "urgent"
                            ? "bg-[#FEF2F2] text-[#EF4444]"
                            : item.type === "warning"
                              ? "bg-[#FFFBEB] text-[#F59E0B]"
                              : "bg-[#EFF6FF] text-[#3B82F6]"
                        }
                      >
                        {item.count}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 趋势图表 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[#111827]">
                  各模块任务趋势
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[#6B7280]">
                    近6个月
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.trendData ?? trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <YAxis
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    {stats?.trendData ? (
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="案件总数"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: "#3B82F6", r: 4 }}
                      />
                    ) : (
                      <>
                        <Line type="monotone" dataKey="m05" name="M05 交底书来源" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 4 }} />
                        <Line type="monotone" dataKey="m06" name="M06 交底书引擎" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 4 }} />
                        <Line type="monotone" dataKey="m07" name="M07 专利创作" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 4 }} />
                        <Line type="monotone" dataKey="m08" name="M08 质量审核" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 4 }} />
                        <Line type="monotone" dataKey="m09" name="M09 案件管理" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 4 }} />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* 图例 */}
              <div className="flex items-center justify-center gap-6 mt-4">
                {moduleStats.map((module) => (
                  <div key={module.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: module.color }}
                    />
                    <span className="text-xs text-[#6B7280]">{module.id.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧 - 状态分布 + 团队绩效 + 最近动态 */}
        <div className="space-y-6">
          {/* 状态分布 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-[#111827]">
                任务状态分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.statusDistribution ?? statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(stats?.statusDistribution ?? statusDistribution).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {(stats?.statusDistribution ?? statusDistribution).map((item: any) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-[#6B7280]">{item.name}</span>
                    <span className="text-xs font-medium text-[#111827] ml-auto">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 团队绩效 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[#111827]">
                  团队绩效
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#2F80ED]">
                  查看全部
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamPerformance.slice(0, 4).map((member, index) => (
                  <div
                    key={member.name}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-xs font-medium text-[#2F80ED]">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#111827]">
                          {member.name}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          {member.completed} 件
                        </span>
                      </div>
                      <Progress value={member.quality} className="h-1.5" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#F59E0B]">
                      <Star className="h-3 w-3 fill-current" />
                      {member.quality}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 最近动态 */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-[#111827]">
                最近动态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#2F80ED] mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#111827]">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-[#6B7280]"> {activity.action} </span>
                        <span className="text-[#2F80ED]">{activity.target}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs py-0">
                          {activity.module}
                        </Badge>
                        <span className="text-xs text-[#9CA3AF]">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 快捷入口 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-[#111827]">
            快捷入口
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: "新建交底来源", icon: FileText, page: "presale-form", color: "#3B82F6" },
              { label: "AI建模", icon: Cpu, page: "m06-create-model", color: "#8B5CF6" },
              { label: "创作任务", icon: Edit3, page: "m07-list", color: "#10B981" },
              { label: "审核任务", icon: Shield, page: "m08-task-list", color: "#F59E0B" },
              { label: "待交案", icon: Clock, page: "m09-waiting-cases", color: "#EF4444" },
              { label: "资源库", icon: Zap, page: "m10-dashboard", color: "#6366F1" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.label}
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:border-[#2F80ED] hover:bg-[#EFF6FF]"
                  onClick={() => onNavigate(item.page)}
                >
                  <Icon className="h-6 w-6" style={{ color: item.color }} />
                  <span className="text-sm text-[#374151]">{item.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
