"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  Send,
  Archive,
  Plus,
  ArrowRight,
  AlertCircle,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react"

interface ConsultationFilingDashboardProps {
  onNavigate: (page: string) => void
}

export function ConsultationFilingDashboard({ onNavigate }: ConsultationFilingDashboardProps) {
  const stats = [
    { label: "今日新建",     value: 8,  icon: Plus,        color: "bg-[#2F80ED]", page: "m05-list" },
    { label: "待分配", value: 5,  icon: Users,       color: "bg-[#F59E0B]", page: "m05-assigning" },
    { label: "待检索",   value: 7,  icon: Search,      color: "bg-[#8B5CF6]", page: "m05-searching" },
    { label: "待确认",   value: 4,  icon: Clock,       color: "bg-[#06B6D4]", page: "m05-confirming" },
    { label: "待立案",   value: 6,  icon: Send,        color: "bg-[#10B981]", page: "m05-filing" },
    { label: "已立案",  value: 12, icon: CheckCircle, color: "bg-[#1E5EFF]", page: "m05-completed" },
  ]

  const recentCases = [
    { id: "M05-2024-0128", client: "华为技术有限公司", type: "发明专利", status: "assigning",  time: "10分钟前", salesperson: "刘销售", serviceRep: "陈客服" },
    { id: "M05-2024-0127", client: "腾讯科技",         type: "专利布局", status: "searching",  time: "30分钟前", salesperson: "王销售", serviceRep: "李客服" },
    { id: "M05-2024-0126", client: "阿里巴巴",         type: "实用新型", status: "confirming", time: "1小时前",  salesperson: "张销售", serviceRep: "赵客服" },
    { id: "M05-2024-0125", client: "字节跳动",         type: "发明专利", status: "filing",     time: "2小时前",  salesperson: "陈销售", serviceRep: "刘客服" },
    { id: "M05-2024-0124", client: "小米科技",         type: "外观设计", status: "completed",  time: "3小时前",  salesperson: "李销售", serviceRep: "陈客服" },
  ]

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      assigning:  { label: "待分配", className: "bg-[#FFF7E6] text-[#D46B08] border-[#FFD591]" },
      searching:  { label: "待检索",   className: "bg-[#F0F5FF] text-[#2F54EB] border-[#ADC6FF]" },
      confirming: { label: "待确认",   className: "bg-[#E6F7FF] text-[#1890FF] border-[#91D5FF]" },
      filing:     { label: "待立案",   className: "bg-[#E6FFFB] text-[#13C2C2] border-[#87E8DE]" },
      completed:  { label: "已立案",  className: "bg-[#F6FFED] text-[#52C41A] border-[#B7EB8F]" },
      rejected:   { label: "不立案归档",   className: "bg-[#F5F5F5] text-[#8C8C8C] border-[#D9D9D9]" },
    }
    const config = configs[status] || configs.assigning
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">M05 咨询立案工作台</h1>
          <p className="text-sm text-[#6B7280] mt-1">销售/客服发起咨询 → 分配工程师 → 检索初检 → 客户确认 → 正式立案 → 进入M06</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => onNavigate("m05-new")} className="bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            发起咨询
          </Button>
          <Button onClick={() => onNavigate("m05-assigning")} variant="outline" className="border-[#F59E0B] text-[#F59E0B] hover:bg-[#FFF7E6]">
            <Users className="h-4 w-4 mr-2" />
            待分配 (5)
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate(stat.page)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#111827]">{stat.value}</div>
                    <div className="text-xs text-[#6B7280]">{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 最近案件 */}
        <Card className="col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">最近案件</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#2F80ED]" onClick={() => onNavigate("m05-list")}>
              查看全部 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCases.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg hover:bg-[#F3F4F6] cursor-pointer transition-colors"
                  onClick={() => onNavigate("m05-detail")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#2F80ED]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[#111827]">{item.id}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="text-xs text-[#6B7280]">{item.client} · {item.type}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-xs text-[#6B7280]">{item.time}</div>
                    <div className="text-xs text-[#9CA3AF]">
                      销售：<span className="text-[#CA8A04] font-medium">{item.salesperson}</span>
                      <span className="mx-1">·</span>
                      客服：<span className="text-[#0369A1] font-medium">{item.serviceRep}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 + 今日待办 */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => onNavigate("m05-new")}>
                <Plus className="h-5 w-5 text-[#2F80ED]" />
                <span className="text-xs">发起咨询</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => onNavigate("m05-assigning")}>
                <Users className="h-5 w-5 text-[#F59E0B]" />
                <span className="text-xs">分配工程师</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => onNavigate("m05-confirming")}>
                <Clock className="h-5 w-5 text-[#06B6D4]" />
                <span className="text-xs">客户确认</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => onNavigate("m05-completed")}>
                <Send className="h-5 w-5 text-[#10B981]" />
                <span className="text-xs">提交M06</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">今日待办</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm cursor-pointer hover:text-[#2F80ED]" onClick={() => onNavigate("m05-assigning")}>
                <span className="text-[#6B7280]">待分配</span>
                <Badge variant="outline" className="bg-[#FEF3C7] text-[#D97706]">5</Badge>
              </div>
              <div className="flex items-center justify-between text-sm cursor-pointer hover:text-[#2F80ED]" onClick={() => onNavigate("m05-confirming")}>
                <span className="text-[#6B7280]">待确认</span>
                <Badge variant="outline" className="bg-[#DBEAFE] text-[#2563EB]">4</Badge>
              </div>
              <div className="flex items-center justify-between text-sm cursor-pointer hover:text-[#2F80ED]" onClick={() => onNavigate("m05-filing")}>
                <span className="text-[#6B7280]">待正式立案</span>
                <Badge variant="outline" className="bg-[#D1FAE5] text-[#059669]">6</Badge>
              </div>
              <div className="flex items-center justify-between text-sm cursor-pointer hover:text-[#2F80ED]" onClick={() => onNavigate("m05-completed")}>
                <span className="text-[#6B7280]">待提交M06</span>
                <Badge variant="outline" className="bg-[#E0E7FF] text-[#4F46E5]">12</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 工作流程图 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">M05 咨询立案流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: "发起咨询",     desc: "销售/客服发起", icon: FileText,    color: "bg-[#2F80ED]" },
              { step: 2, label: "分配工程师",   desc: "指定专利工程师", icon: Users,       color: "bg-[#8B5CF6]" },
              { step: 3, label: "检索初检",     desc: "工程师检索专利", icon: Search,      color: "bg-[#F59E0B]" },
              { step: 4, label: "客户确认",     desc: "反馈初检结果",   icon: CheckCircle, color: "bg-[#06B6D4]" },
              { step: 5, label: "是否立案",     desc: "客户决策",       icon: AlertCircle, color: "bg-[#EF4444]", branch: true },
              { step: 6, label: "正式立案",     desc: "确认生成案件",   icon: Send,        color: "bg-[#10B981]" },
              { step: 7, label: "进入M06",      desc: "交底书引擎",     icon: Zap,         color: "bg-[#1E5EFF]" },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-11 h-11 rounded-full ${item.color} flex items-center justify-center mb-2 ${item.branch ? "ring-2 ring-offset-1 ring-[#EF4444]" : ""}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-[#111827]">{item.label}</div>
                    <div className="text-[10px] text-[#6B7280] text-center max-w-[72px] leading-tight mt-0.5">{item.desc}</div>
                    {item.branch && (
                      <div className="text-[9px] text-[#EF4444] font-medium mt-1">决策节点</div>
                    )}
                  </div>
                  {index < 6 && (
                    <ArrowRight className="h-4 w-4 text-[#D1D5DB] mx-2" />
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
