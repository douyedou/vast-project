"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Clock,
  CheckCircle,
  Send,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  Plus,
} from "lucide-react"

interface PresaleDashboardProps {
  onNavigate: (page: string) => void
}

export function PresaleDashboard({ onNavigate }: PresaleDashboardProps) {
  const stats = [
    { label: "今日新建", value: 8, icon: Plus, color: "bg-[#2F80ED]", change: "+3", page: "presale-list" },
    { label: "待分配工程师", value: 5, icon: Users, color: "bg-[#F59E0B]", change: "+2", page: "presale-pending" },
    { label: "待检索", value: 7, icon: FileText, color: "bg-[#8B5CF6]", change: "+3", page: "presale-processing" },
    { label: "待确认", value: 4, icon: Clock, color: "bg-[#06B6D4]", change: "-1", page: "presale-confirm" },
    { label: "待立案", value: 3, icon: Send, color: "bg-[#10B981]", change: "+1", page: "presale-to-filing" },
    { label: "超期未处理", value: 2, icon: AlertCircle, color: "bg-[#EF4444]", change: "0", page: "presale-pending" },
  ]

  const recentTickets = [
    { id: "PQ-2024-0128", client: "华为技术有限公司", type: "发明专利咨询", status: "assigning", time: "10分钟前", salesperson: "刘销售", serviceRep: "陈客服" },
    { id: "PQ-2024-0127", client: "腾讯科技", type: "专利布局咨询", status: "searching", time: "30分钟前", salesperson: "王销售", serviceRep: "李客服" },
    { id: "PQ-2024-0126", client: "阿里巴巴", type: "实用新型咨询", status: "confirming", time: "1小时前", salesperson: "张销售", serviceRep: "赵客服" },
    { id: "PQ-2024-0125", client: "字节跳动", type: "发明专利咨询", status: "to-filing", time: "2小时前", salesperson: "陈销售", serviceRep: "刘客服" },
    { id: "PQ-2024-0124", client: "小米科技", type: "外观设计咨询", status: "filing-pending", time: "3小时前", salesperson: "李销售", serviceRep: "陈客服" },
  ]

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      assigning:    { label: "待分配", className: "bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]" },
      searching:    { label: "待检索",   className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      confirming:   { label: "待确认",   className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
      "to-filing":  { label: "客户同意立案", className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
      "no-filing":  { label: "客户不立案",   className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
      "filing-pending": { label: "等待立案", className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
      closed:       { label: "已关闭",       className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[status] || configs.assigning
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">售前咨询工作台</h1>
          <p className="text-sm text-[#6B7280] mt-1">管理客户专利咨询工单，提供专业咨询服务</p>
        </div>
        <Button className="bg-[#2F80ED] gap-2" onClick={() => onNavigate("presale-new")}>
          <Plus className="h-4 w-4" />
          新建咨询工单
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate(stat.page)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium ${stat.change.startsWith('+') ? 'text-[#10B981]' : stat.change.startsWith('-') ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#111827]">{stat.value}</div>
                <div className="text-xs text-[#6B7280]">{stat.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 最近工单 */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">最近咨询工单</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#2F80ED] gap-1" onClick={() => onNavigate("presale-list")}>
              查看全部 <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                  onClick={() => onNavigate("presale-detail")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#2F80ED]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[#111827]">{ticket.id}</span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <div className="text-xs text-[#6B7280]">{ticket.client} · {ticket.type}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-xs text-[#6B7280]">{ticket.time}</div>
                    <div className="text-xs text-[#9CA3AF]">
                      销售：<span className="text-[#CA8A04] font-medium">{ticket.salesperson}</span>
                      <span className="mx-1">·</span>
                      客服：<span className="text-[#0369A1] font-medium">{ticket.serviceRep}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => onNavigate("presale-new")}>
              <Plus className="h-4 w-4 text-[#2F80ED]" />
              新建咨询工单
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => onNavigate("presale-pending")}>
              <Clock className="h-4 w-4 text-[#F59E0B]" />
              处理待办工单
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => onNavigate("presale-to-filing")}>
              <Send className="h-4 w-4 text-[#06B6D4]" />
              转交立案
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => onNavigate("presale-list")}>
              <FileText className="h-4 w-4 text-[#8B5CF6]" />
              查看所有工单
            </Button>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-[#374151] mb-3">今日待办</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm cursor-pointer hover:text-[#2F80ED]" onClick={() => onNavigate("presale-pending")}>
                  <span className="text-[#6B7280]">待分配工程师</span>
                  <Badge variant="outline" className="bg-[#FEF3C7] text-[#D97706]">5</Badge>
                </div>
                <div className="flex items-center justify-between text-sm cursor-pointer hover:text-[#2F80ED]" onClick={() => onNavigate("presale-confirm")}>
                  <span className="text-[#6B7280]">待确认</span>
                  <Badge variant="outline" className="bg-[#DBEAFE] text-[#2563EB]">4</Badge>
                </div>
                <div className="flex items-center justify-between text-sm cursor-pointer hover:text-[#2F80ED]" onClick={() => onNavigate("presale-to-filing")}>
                  <span className="text-[#6B7280]">客户同意待立案</span>
                  <Badge variant="outline" className="bg-[#D1FAE5] text-[#059669]">3</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工单流程说明 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">咨询工单流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "发起咨询",     desc: "销售/客服发起工单", icon: FileText,    color: "bg-[#2F80ED]" },
              { step: 2, label: "分配工程师",   desc: "指定专利工程师跟进", icon: Users,      color: "bg-[#8B5CF6]" },
              { step: 3, label: "检索初检",     desc: "工程师检索相关专利", icon: FileText,    color: "bg-[#F59E0B]" },
              { step: 4, label: "客户确认",     desc: "向客户反馈初检结果", icon: CheckCircle, color: "bg-[#06B6D4]" },
              { step: 5, label: "是否立案",     desc: "客户决策是否申请",   icon: AlertCircle, color: "bg-[#EF4444]",  branch: true },
              { step: 6, label: "立即立案",     desc: "确认立案，生成案件", icon: Send,        color: "bg-[#10B981]" },
              { step: 7, label: "进入等待立案", desc: "进入M05立案队列",    icon: Clock,       color: "bg-[#1E5EFF]" },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mb-2 ${item.branch ? "ring-2 ring-offset-1 ring-[#EF4444]" : ""}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-[#111827]">{item.label}</div>
                    <div className="text-[10px] text-[#6B7280] text-center max-w-[76px] leading-tight mt-0.5">{item.desc}</div>
                    {item.branch && (
                      <div className="text-[9px] text-[#EF4444] font-medium mt-1">决策节点</div>
                    )}
                  </div>
                  {index < 6 && (
                    <ArrowRight className="h-4 w-4 text-[#D1D5DB] mx-1.5" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
