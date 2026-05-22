"use client"

import type { CSSProperties } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge, type DisclosureStatus } from "./status-badge"
import {
  FileText,
  Search,
  Clock,
  FileCheck,
  CheckCircle,
  XCircle,
  Plus,
  Users,
  ArrowRight,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string; style?: CSSProperties }>
  color: string
  bgColor: string
  trend?: string
}

function StatCard({ title, value, icon: Icon, color, bgColor, trend }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[#6B7280]">{title}</p>
            <p className="text-2xl font-semibold text-[#111827] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
              {value}
            </p>
            {trend && <p className="text-xs text-[#52C41A] mt-1">{trend}</p>}
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const stats = [
  { title: "咨询转入", value: 12, icon: FileText, color: "#2F80ED", bgColor: "#EAF4FF", trend: "+3 本周新增" },
  { title: "待立案", value: 18, icon: Clock, color: "#FAAD14", bgColor: "#FFF7E6" },
  { title: "立案中", value: 8, icon: Search, color: "#6F4FF2", bgColor: "#F1EDFF" },
  { title: "已立案", value: 45, icon: CheckCircle, color: "#52C41A", bgColor: "#E8F8F5", trend: "+12 本月" },
  { title: "待进入M06", value: 6, icon: FileCheck, color: "#00A8C8", bgColor: "#E6F8FB" },
  { title: "不立案归档", value: 7, icon: XCircle, color: "#9CA3AF", bgColor: "#F5F5F5" },
]

const todoItems = [
  { id: 1, title: "咨询转入待处理", count: 5, type: "transfer" },
  { id: 2, title: "待分配", count: 3, type: "assign" },
  { id: 3, title: "待补充材料", count: 2, type: "supplement" },
  { id: 4, title: "待正式立案", count: 8, type: "filing" },
  { id: 5, title: "待提交M06", count: 4, type: "m06" },
]

const recentActivities = [
  { id: 1, action: "咨询转入立案", client: "华为技术有限公司", time: "10分钟前", status: "presale" as DisclosureStatus },
  { id: 2, action: "分配工程师完成", client: "小米科技有限公司", time: "25分钟前", status: "checking" as DisclosureStatus },
  { id: 3, action: "材料补充完成", client: "腾讯科技有限公司", time: "1小时前", status: "waiting-filing" as DisclosureStatus },
  { id: 4, action: "正式立案完成", client: "阿里巴巴集团", time: "2小时前", status: "filed" as DisclosureStatus },
  { id: 5, action: "提交至M06建模", client: "百度科技有限公司", time: "2.5小时前", status: "filed" as DisclosureStatus },
  { id: 6, action: "不立案归档", client: "字节跳动有限公司", time: "3小时前", status: "not-filed" as DisclosureStatus },
]

const chartData = [
  { name: "周一", 售前: 4, 立案: 2 },
  { name: "周二", 售前: 3, 立案: 5 },
  { name: "周三", 售前: 6, 立案: 3 },
  { name: "周四", 售前: 2, 立案: 4 },
  { name: "周五", 售前: 5, 立案: 6 },
]

const pieData = [
  { name: "咨询转入", value: 12, color: "#2F80ED" },
  { name: "待立案", value: 18, color: "#FAAD14" },
  { name: "立案中", value: 8, color: "#6F4FF2" },
  { name: "已立案", value: 45, color: "#52C41A" },
  { name: "不立案归档", value: 7, color: "#9CA3AF" },
]

interface DashboardProps {
  onNavigate: (page: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">立案工作台</h1>
          <p className="text-sm text-[#6B7280] mt-1">M05 立案管理中心</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => onNavigate("filing-new")}
            className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建立案
          </Button>
          <Button
            onClick={() => onNavigate("filing-pending")}
            variant="outline"
            className="border-[#2F80ED] text-[#2F80ED] hover:bg-[#EAF4FF]"
          >
            <Clock className="h-4 w-4 mr-2" />
            待立案
          </Button>
          <Button
            onClick={() => onNavigate("assign")}
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            待分配
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Todo List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#111827]">我的待办</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todoItems.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F7FA] transition-colors text-left"
              >
                <span className="text-sm text-[#1F2937]">{item.title}</span>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#F0F3F8] text-xs flex items-center justify-center text-[#6B7280]">
                    {item.count}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#111827]">来源状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#6B7280]">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#111827]">本周趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip />
                  <Bar dataKey="售前" fill="#2F80ED" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="立案" fill="#52C41A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[#111827]">最近动态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#2F80ED]" />
                  <div>
                    <p className="text-sm text-[#1F2937]">
                      <span className="font-medium">{activity.action}</span>
                      <span className="mx-2 text-[#9CA3AF]">·</span>
                      <span>{activity.client}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={activity.status} />
                  <span className="text-xs text-[#9CA3AF]">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
