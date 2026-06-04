"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/vast/status-badge"
import {
  FileText,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCcw,
  Send,
  AlertCircle,
  FileCheck,
} from "lucide-react"

interface CreationDashboardProps {
  onNavigate: (page: string) => void
}

interface DashboardStat {
  label: string
  value: number
  icon: typeof FileText
  color: string
}

interface DashboardTask {
  id: string
  name: string
  type: string
  status: string
  deadline: string | null
  priority: string
}

interface DashboardRisk {
  type: string
  count: number
  severity: "warning" | "error" | "normal"
}

interface DashboardActivity {
  time: string
  action: string
  target: string
  user: string
}

const initialStats: DashboardStat[] = [
  { label: "待创作", value: 0, icon: FileText, color: "#9CA3AF" },
  { label: "说明书处理中", value: 0, icon: Edit3, color: "#2F80ED" },
  { label: "权利要求处理中", value: 0, icon: FileCheck, color: "#06B6D4" },
  { label: "退回修改", value: 0, icon: RotateCcw, color: "#EF4444" },
  { label: "待提交审核", value: 0, icon: Send, color: "#10B981" },
]

const initialMyTasks: DashboardTask[] = []

const initialRisks: DashboardRisk[] = []

const initialRecentActivities: DashboardActivity[] = []

const getStatusVariant = (status: string) => {
  switch (status) {
    case "说明书生成中":
      return "processing"
    case "权利要求撰写中":
      return "initial-review"
    case "退回修改":
      return "returned"
    case "全文件复核中":
      return "waiting-order"
    case "待提交审核":
      return "filed"
    default:
      return "presale"
  }
}

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "urgent":
      return { label: "紧急", color: "bg-red-100 text-red-700" }
    case "high":
      return { label: "优先", color: "bg-orange-100 text-orange-700" }
    default:
      return null
  }
}

export function CreationDashboard({ onNavigate }: CreationDashboardProps) {
  const [stats, setStats] = useState(initialStats)
  const [myTasks, setMyTasks] = useState(initialMyTasks)
  const [risks, setRisks] = useState(initialRisks)
  const [recentActivities, setRecentActivities] = useState(initialRecentActivities)

  useEffect(() => {
    const token = localStorage.getItem('vast_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined

    fetch('/api/m07/dashboard', { headers })
      .then((res) => res.json())
      .then((res) => {
        if (!res || !res.success) return
        const data = res.data || {}

        setStats([
          { label: "待创作", value: data.stats?.pending ?? 0, icon: FileText, color: "#9CA3AF" },
          { label: "说明书处理中", value: data.stats?.specWriting ?? 0, icon: Edit3, color: "#2F80ED" },
          { label: "权利要求处理中", value: data.stats?.claimsWriting ?? 0, icon: FileCheck, color: "#06B6D4" },
          { label: "退回修改", value: data.stats?.returned ?? 0, icon: RotateCcw, color: "#EF4444" },
          { label: "待提交审核", value: data.stats?.reviewPending ?? 0, icon: Send, color: "#10B981" },
        ])

        setMyTasks((data.myTasks || []).map((t: any) => ({
          id: String(t.id),
          name: t.name || t.title || '',
          type: t.type || '',
          // 优先使用后端 statusLabel，再退回到原始 status
          status: t.statusLabel || t.status || '',
          deadline: t.deadline || null,
          priority: t.priority || 'normal',
        })))

        setRisks(data.risks || [])
        setRecentActivities(data.recentActivities || [])
      })
      .catch((err) => console.error('fetch dashboard failed', err))
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">M07 专利创作平台工作台</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理专利申请文件创作任务</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onNavigate("m07-return")}>
            <RotateCcw className="h-4 w-4 mr-2" />
            退回修改
          </Button>
          <Button onClick={() => onNavigate("m07-list")}>
            <FileText className="h-4 w-4 mr-2" />
            进入创作任务
          </Button>
        </div>
      </div>

      {/* 数据看板 */}
      <div className="grid grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigate("m07-list")}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-2xl font-bold text-[#111827]">{stat.value}</span>
                </div>
                <div className="mt-3 text-sm text-[#6B7280]">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 我的创作任务 */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">我的创作任务</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("m07-list")}>
                查看全部
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTasks.map((task) => {
                const priority = getPriorityLabel(task.priority)
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                    onClick={() => onNavigate("m07-workspace")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#EAF4FF] flex items-center justify-center">
                        <FileText className="h-4 w-4 text-[#2F80ED]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#111827]">{task.name}</span>
                          {priority && (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${priority.color}`}>
                              {priority.label}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5">
                          {task.type} · 截止 {task.deadline}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={getStatusVariant(task.status)} label={task.status} />
                      <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 风险提醒 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              风险提醒
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risks.map((risk) => (
                <div
                  key={risk.type}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#F9FAFB]"
                >
                  <div className="flex items-center gap-2">
                    {risk.severity === "error" ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : risk.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm text-[#374151]">{risk.type}</span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      risk.count > 0
                        ? risk.severity === "error"
                          ? "text-red-600"
                          : "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {risk.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 + 最近动态 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 快捷入口 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">快捷入口</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => onNavigate("m07-workspace")}
              >
                <Edit3 className="h-5 w-5 text-[#2F80ED]" />
                <span className="text-xs">双文档工作台</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => onNavigate("m07-spec-draft")}
              >
                <FileText className="h-5 w-5 text-[#8B5CF6]" />
                <span className="text-xs">说明书初稿</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => onNavigate("m07-claims")}
              >
                <FileCheck className="h-5 w-5 text-[#06B6D4]" />
                <span className="text-xs">权利要求撰写</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => onNavigate("m07-review")}
              >
                <CheckCircle className="h-5 w-5 text-[#10B981]" />
                <span className="text-xs">全文件复核</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 最近动态 */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">最近动态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="text-xs text-[#9CA3AF] w-12 pt-0.5">{activity.time}</div>
                  <div className="w-2 h-2 rounded-full bg-[#2F80ED] mt-1.5" />
                  <div className="flex-1">
                    <span className="text-sm text-[#374151]">{activity.action}</span>
                    <span className="text-sm text-[#2F80ED] ml-1">《{activity.target}》</span>
                    <span className="text-xs text-[#9CA3AF] ml-2">- {activity.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
