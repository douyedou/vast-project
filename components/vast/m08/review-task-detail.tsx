'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle, CheckCircle, FileText, Clock,
  ChevronLeft, ChevronRight, Play, MessageSquare, Download,
} from 'lucide-react'

interface ReviewTaskDetailProps {
  onNavigate?: (page: string) => void
}

export function ReviewTaskDetail({ onNavigate }: ReviewTaskDetailProps) {
  const [activeTab, setActiveTab] = useState('info')

  const taskInfo = {
    id: 'R001', caseNo: 'C2024001', title: '智能人体识别装置',
    type: '发明专利', method: '电子申请', status: '审核中',
    priority: '高', reviewer: '李四', submitTime: '2024-05-05 10:30',
    blockingCount: 3, warningCount: 1,
  }

  const reviewItems = [
    { type: 'blocking', title: '权利要求4中的「人体红外传感器」特征在说明书中无支持', module: '权利要求支持', status: '待处理' },
    { type: 'blocking', title: '交底书「替代方案-强化学习算法」章节未在说明书中覆盖', module: '交底覆盖', status: '待处理' },
    { type: 'blocking', title: '说明书AI相似性(45%)超过30%阈值', module: 'AI相似性', status: '待处理' },
    { type: 'warning', title: '说明书中使用「AI处理模块」，权利要求书中使用「AI处理单元」，术语不一致', module: '术语一致性', status: '待处理' },
  ]

  const reviewActions = [
    { label: '运行规则', icon: Play, page: null },
    { label: '交底书审核', icon: FileText, page: 'm08-disclosure-review' },
    { label: '审核决策', icon: CheckCircle, page: 'm08-review-decision' },
    { label: '新增问题', icon: MessageSquare, page: null },
    { label: '生成报告', icon: Download, page: null },
  ]

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'blocking': return 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]'
      case 'warning': return 'border-[#FED7AA] bg-[#FFF7ED] text-[#EA580C]'
      default: return 'border-[#E5E9F0] bg-[#F9FAFB] text-[#374151]'
    }
  }

  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-[#9CA3AF] h-7 px-2 -ml-2"
              onClick={() => onNavigate?.('m08-task-list')}>
              <ChevronLeft className="w-4 h-4 mr-1" />审核任务列表
            </Button>
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">{taskInfo.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-[#9CA3AF]">案件编号：{taskInfo.caseNo}</span>
            <span className="text-xs text-[#9CA3AF]">审核编号：{taskInfo.id}</span>
            <span className="text-xs bg-[#EAF4FF] text-[#2F80ED] px-2 py-0.5 rounded-full font-medium">{taskInfo.status}</span>
            <span className="text-xs border border-[#E5E9F0] text-[#374151] px-2 py-0.5 rounded-full">{taskInfo.type}</span>
            <span className="text-xs border border-[#E5E9F0] text-[#374151] px-2 py-0.5 rounded-full">{taskInfo.method}</span>
          </div>
        </div>
        <div className="text-right text-sm text-[#9CA3AF]">
          <p>审核人：{taskInfo.reviewer}</p>
          <p className="mt-0.5">{taskInfo.submitTime}</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="flex gap-2 flex-wrap">
        {reviewActions.map((action) => {
          const Icon = action.icon
          return (
            <Button key={action.label} variant="outline" size="sm"
              className="h-8 border-[#E5E9F0] text-[#374151] text-xs"
              onClick={() => action.page && onNavigate?.(action.page)}>
              <Icon className="w-3.5 h-3.5 mr-1.5" />{action.label}
            </Button>
          )
        })}
      </div>

      {taskInfo.blockingCount > 0 && (
        <Alert className="border-[#FECACA] bg-[#FEF2F2] py-3">
          <AlertCircle className="h-4 w-4 text-[#DC2626]" />
          <AlertDescription className="text-[#DC2626] text-sm">
            存在 {taskInfo.blockingCount} 个阻断项，不允许直接通过审核，需先处理所有阻断项。
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8 h-9">
          <TabsTrigger value="info" className="text-xs">案件信息</TabsTrigger>
          <TabsTrigger value="m06" className="text-xs">M06交底</TabsTrigger>
          <TabsTrigger value="disclosure" className="text-xs">完整交底书</TabsTrigger>
          <TabsTrigger value="m07" className="text-xs">M07申请文件</TabsTrigger>
          <TabsTrigger value="selfcheck" className="text-xs">自检结果</TabsTrigger>
          <TabsTrigger value="issues" className="text-xs">审核问题</TabsTrigger>
          <TabsTrigger value="progress" className="text-xs">审核进度</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">案件基础信息</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: '案件编号', value: taskInfo.caseNo },
                  { label: '专利类型', value: taskInfo.type },
                  { label: '申请方式', value: taskInfo.method },
                  { label: '优先级', value: taskInfo.priority },
                  { label: '审核编号', value: taskInfo.id },
                  { label: '审核人', value: taskInfo.reviewer },
                  { label: '提交时间', value: taskInfo.submitTime },
                  { label: '状态', value: taskInfo.status },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-[#9CA3AF]">{item.label}</p>
                    <p className="font-medium text-sm text-[#111827] mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="m06">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">M06 交底模型</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: '技术问题', status: '已完整', ok: true },
                  { label: '技术特征', status: '已完整', ok: true },
                  { label: '作用关系', status: '弱覆盖', ok: false },
                  { label: '技术效果', status: '已完整', ok: true },
                  { label: '关键保护点', status: '已完整', ok: true },
                  { label: '替代方案', status: '未覆盖', ok: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 border border-[#E5E9F0] rounded-lg">
                    <span className="text-sm text-[#374151]">{item.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.ok ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FFF7ED] text-[#EA580C]'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full border-[#E5E9F0] text-[#374151] text-xs"
                onClick={() => onNavigate?.('m08-disclosure-review')}>
                进入交底书审核
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="m07">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">M07 申请文件</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['说明书', '权利要求书', '摘要', '附图说明', '摘要附图'].map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-3 border border-[#E5E9F0] rounded-lg">
                    <span className="text-sm text-[#374151]">{doc}</span>
                    <Button variant="ghost" size="sm" className="text-xs text-[#2F80ED] h-7">查看</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selfcheck">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">自检结果摘要</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: '覆盖率', value: '85%', color: 'text-[#16A34A]' },
                  { label: '支持率', value: '92%', color: 'text-[#16A34A]' },
                  { label: 'AI相似性', value: '45%', color: 'text-[#DC2626]' },
                  { label: 'IPC预测', value: 'G06F', color: 'text-[#2F80ED]' },
                ].map((item) => (
                  <div key={item.label} className="p-4 border border-[#E5E9F0] rounded-lg text-center">
                    <p className="text-xs text-[#9CA3AF]">{item.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">审核问题概览</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reviewItems.map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border-2 ${getTypeStyle(item.type)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded">{item.module}</span>
                          <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded">{item.status}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0 opacity-60" />
                    </div>
                  </div>
                ))}
              </div>
              <Button size="sm" className="mt-3 w-full bg-[#2F80ED] text-white text-xs"
                onClick={() => onNavigate?.('m08-review-decision')}>
                进入审核决策
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">审核进度</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { step: '任务分配', status: '完成', time: '2024-05-05 10:30' },
                  { step: '规则运行', status: '完成', time: '2024-05-05 10:45' },
                  { step: '审核中', status: '进行中', time: '2024-05-05 11:00' },
                  { step: '问题处理', status: '待开始', time: '-' },
                  { step: '审核决策', status: '待开始', time: '-' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F7FA]">
                      {item.status === '完成' && <CheckCircle className="w-5 h-5 text-[#16A34A]" />}
                      {item.status === '进行中' && <Clock className="w-5 h-5 text-[#2F80ED]" />}
                      {item.status === '待开始' && <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-[#111827]">{item.step}</p>
                      <p className="text-xs text-[#9CA3AF]">{item.time}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === '完成' ? 'bg-[#F0FDF4] text-[#16A34A]' :
                      item.status === '进行中' ? 'bg-[#EAF4FF] text-[#2F80ED]' :
                      'bg-[#F5F7FA] text-[#9CA3AF]'
                    }`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disclosure">
          <Card className="border-[#E5E9F0]">
            <CardContent className="pt-6 text-center">
              <FileText className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
              <p className="text-sm text-[#374151] mb-3">查看完整交底书内容</p>
              <Button size="sm" className="bg-[#2F80ED] text-white text-xs"
                onClick={() => onNavigate?.('m08-disclosure-review')}>
                进入交底书审核页
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">操作日志</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                {[
                  { action: '规则运行', user: '系统', time: '2024-05-05 10:45' },
                  { action: '问题新增', user: '李四', time: '2024-05-05 10:50' },
                  { action: '任务分配', user: '王工', time: '2024-05-05 10:30' },
                ].map((log, idx, arr) => (
                  <div key={idx} className={`flex justify-between items-center py-2.5 ${idx < arr.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}>
                    <div>
                      <p className="font-medium text-sm text-[#111827]">{log.action}</p>
                      <p className="text-xs text-[#9CA3AF]">{log.user}</p>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{log.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
