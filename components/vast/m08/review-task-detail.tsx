'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertCircle, CheckCircle, FileText, Clock,
  ChevronLeft, ChevronRight, Play, MessageSquare, Download, Loader2, Pencil, Trash2, Plus,
} from 'lucide-react'

interface ReviewTaskDetailProps {
  reviewId: string | null
  onNavigate?: (page: string) => void
}

interface DetailData {
  review: { id: string; result: string | null; comments: string | null; preliminaryDone: boolean; disclosureDone: boolean; fiveBooksDone: boolean; createdAt: string; updatedAt: string }
  case: { caseNo: string; title: string; type: string; applicationMethod: string; status: string; priority: string; reviewId: string; reviewerName: string; submitTime: string }
  blockingCount: number
  warningCount: number
  spec: { aiRate: number | null; duplicateRate: number | null; disclosureCoverage: number | null; supportRate: number | null; ipcPrediction: string | null }
  disclosureItems: { label: string; status: string; ok: boolean }[]
  books: { id: string; key: string; label: string; ready: boolean; documentId: string }[]
  reviewItems: { id: string; type: string; typeLabel: string; content: string; severity: string; status: string; createdAt: string }[]
  progress: { step: string; key: string; status: string; time: string | null }[]
  logs: { action: string; user: string; time: string }[]
}

const statusLabelMap: Record<string, string> = {
  pending: '待处理', resolved: '已解决', ignored: '已忽略',
}

export function ReviewTaskDetail({ reviewId, onNavigate }: ReviewTaskDetailProps) {
  const [activeTab, setActiveTab] = useState('info')
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const [runningPreliminary, setRunningPreliminary] = useState(false)
  const [showProblemDialog, setShowProblemDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [problemForm, setProblemForm] = useState({ content: '', type: 'form', severity: 'medium', status: 'pending' })

  useEffect(() => {
    if (!reviewId) {
      setData(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    setData(null)
    const token = localStorage.getItem('vast_token')
    fetch(`/api/m08/reviews/${reviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok || json.code !== 200) {
          throw new Error(json.message || `请求失败 (${r.status})`)
        }
        setData(json.data)
      })
      .catch((err) => {
        console.error('审核详情加载失败:', err)
        setError(err.message || '加载失败')
      })
      .finally(() => setLoading(false))
  }, [reviewId, retryKey])

  // 未选择任务
  if (!reviewId) {
    return (
      <div className="w-full p-6 flex flex-col items-center justify-center min-h-[400px] text-[#9CA3AF]">
        <FileText className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">请从审核任务列表中选择一个任务</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => onNavigate?.('m08-task-list')}>
          返回任务列表
        </Button>
      </div>
    )
  }

  // 加载中
  if (loading) {
    return (
      <div className="w-full p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2F80ED]" />
        <span className="ml-2 text-sm text-[#9CA3AF]">加载审核详情...</span>
      </div>
    )
  }

  // 加载失败
  if (error || !data) {
    return (
      <div className="w-full p-6 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-10 h-10 text-[#DC2626] mb-3 opacity-60" />
        <p className="text-sm text-[#DC2626] font-medium mb-1">加载失败</p>
        <p className="text-xs text-[#9CA3AF] mb-4">{error || '未知错误'}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate?.('m08-task-list')}>返回列表</Button>
          <Button size="sm" className="bg-[#2F80ED] text-white" onClick={() => setRetryKey(k => k + 1)}>重试</Button>
        </div>
      </div>
    )
  }

  const { case: caseInfo, blockingCount, warningCount, spec, disclosureItems, books, reviewItems, logs } = data
  const reviewStatus = data.review

  const getSeverityStyle = (severity: string) => {
    if (severity === 'critical' || severity === 'high') return 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]'
    if (severity === 'medium') return 'border-[#FED7AA] bg-[#FFF7ED] text-[#EA580C]'
    return 'border-[#E5E9F0] bg-[#F9FAFB] text-[#374151]'
  }

  const fmtTime = (t: string | null) => {
    if (!t) return '-'
    return new Date(t).toLocaleString('zh-CN', { hour12: false })
  }

  const runPreliminary = async () => {
    if (!reviewId) return
    setRunningPreliminary(true)
    try {
      const token = localStorage.getItem('vast_token')
      const res = await fetch(`/api/m08/reviews/${reviewId}/preliminary`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d?.code === 200) {
        // 刷新页面数据
        setRetryKey(k => k + 1)
      } else {
        alert(d?.message || '初审失败')
      }
    } catch (e: any) {
      alert('初审异常: ' + e.message)
    } finally {
      setRunningPreliminary(false)
    }
  }

  const openAddDialog = () => {
    setProblemForm({ content: '', type: 'form', severity: 'medium', status: 'pending' })
    setEditingItem(null)
    setShowProblemDialog(true)
  }

  const openEditDialog = (item: any) => {
    setProblemForm({ content: item.content || '', type: item.type || 'form', severity: item.severity || 'medium', status: item.status || 'pending' })
    setEditingItem(item)
    setShowProblemDialog(true)
  }

  const deleteItem = async (id: string) => {
    const token = localStorage.getItem('vast_token')
    const res = await fetch(`/api/m08/review-items/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setRetryKey(k => k + 1)
  }

  const saveProblem = async () => {
    if (!reviewId) return
    if (!problemForm.content.trim()) return
    const token = localStorage.getItem('vast_token')
    if (editingItem) {
      const res = await fetch(`/api/m08/review-items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(problemForm),
      })
      if (res.ok) { setShowProblemDialog(false); setRetryKey(k => k + 1) }
    } else {
      const res = await fetch('/api/m08/review-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewId, ...problemForm }),
      })
      const d = await res.json()
      if (d?.code === 200) { setShowProblemDialog(false); setRetryKey(k => k + 1) }
    }
  }

  const reviewActions = [
    { label: runningPreliminary ? '初审中...' : '进行初审', icon: runningPreliminary ? Loader2 : Play, page: null, action: runPreliminary, disabled: runningPreliminary },
    { label: '交底书审核', icon: FileText, page: 'm08-disclosure-review' },
    { label: '审核决策', icon: CheckCircle, page: 'm08-review-decision' },
    { label: '新增问题', icon: MessageSquare, page: null, action: openAddDialog },
  ]

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
          <h1 className="text-xl font-semibold text-[#111827]">{caseInfo.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-[#9CA3AF]">案件编号：{caseInfo.caseNo}</span>
            <span className="text-xs text-[#9CA3AF]">审核编号：{caseInfo.reviewId}</span>
            <span className="text-xs bg-[#EAF4FF] text-[#2F80ED] px-2 py-0.5 rounded-full font-medium">{caseInfo.status}</span>
            <span className="text-xs border border-[#E5E9F0] text-[#374151] px-2 py-0.5 rounded-full">{caseInfo.type}</span>
            <span className="text-xs border border-[#E5E9F0] text-[#374151] px-2 py-0.5 rounded-full">{caseInfo.applicationMethod}</span>
          </div>
        </div>
        <div className="text-right text-sm text-[#9CA3AF]">
          <p>审核人：{caseInfo.reviewerName}</p>
          <p className="mt-0.5">{fmtTime(caseInfo.submitTime)}</p>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="flex gap-2 flex-wrap">
        {reviewActions.map((action) => {
          const Icon = action.icon
          return (
            <Button key={action.label} variant="outline" size="sm"
              disabled={action.disabled}
              className="h-8 border-[#E5E9F0] text-[#374151] text-xs"
              onClick={() => action.action ? action.action() : action.page && onNavigate?.(action.page)}>
              {action.disabled && action.label.includes('初审') ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />初审中...</>
              ) : (
                <><Icon className="w-3.5 h-3.5 mr-1.5" />{action.label}</>
              )}
            </Button>
          )
        })}
      </div>

      {blockingCount > 0 && (
        <Alert className="border-[#FECACA] bg-[#FEF2F2] py-3">
          <AlertCircle className="h-4 w-4 text-[#DC2626]" />
          <AlertDescription className="text-[#DC2626] text-sm">
            存在 {blockingCount} 个阻断项{warningCount > 0 ? `、${warningCount} 个警告项` : ''}，不允许直接通过审核，需先处理所有阻断项。
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 h-9">
          <TabsTrigger value="info" className="text-xs">案件信息</TabsTrigger>
          <TabsTrigger value="m06" className="text-xs">M06交底</TabsTrigger>
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
                  { label: '案件编号', value: caseInfo.caseNo },
                  { label: '专利类型', value: caseInfo.type },
                  { label: '申请方式', value: caseInfo.applicationMethod },
                  { label: '优先级', value: caseInfo.priority === 'high' ? '高' : caseInfo.priority === 'urgent' ? '紧急' : caseInfo.priority === 'low' ? '低' : '普通' },
                  { label: '审核编号', value: caseInfo.reviewId },
                  { label: '审核人', value: caseInfo.reviewerName },
                  { label: '提交时间', value: fmtTime(caseInfo.submitTime) },
                  { label: '状态', value: caseInfo.status },
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
                {disclosureItems.map((item) => (
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
                {books.map((doc) => (
                  <div key={doc.key} className="flex items-center p-3 border border-[#E5E9F0] rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#374151]">{doc.label}</span>
                      {doc.ready ? (
                        <span className="text-xs bg-[#F0FDF4] text-[#16A34A] px-1.5 py-0.5 rounded">已生成</span>
                      ) : (
                        <span className="text-xs bg-[#F5F7FA] text-[#9CA3AF] px-1.5 py-0.5 rounded">未生成</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full border-[#E5E9F0] text-[#374151] text-xs"
                onClick={() => onNavigate?.('m08-five-books-review')}>
                进入五书审核
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selfcheck">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">自检结果摘要</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: '覆盖率', value: spec.disclosureCoverage != null ? `${spec.disclosureCoverage}%` : '--', color: 'text-[#16A34A]' },
                  { label: '支持率', value: spec.supportRate != null ? `${spec.supportRate}%` : '--', color: 'text-[#16A34A]' },
                  { label: 'AI相似性', value: spec.duplicateRate != null ? `${spec.duplicateRate}%` : '--', color: spec.duplicateRate != null && spec.duplicateRate > 30 ? 'text-[#DC2626]' : 'text-[#16A34A]' },
                  { label: 'IPC预测', value: spec.ipcPrediction || '待预测', color: 'text-[#2F80ED]' },
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
              {reviewItems.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] py-8 text-center">暂无审核问题</p>
              ) : (
                <div className="space-y-2">
                  {reviewItems.map((item) => (
                    <div key={item.id} className={`p-3 rounded-lg border-2 ${getSeverityStyle(item.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.content}</p>
                          <div className="flex gap-2 mt-1.5">
                            <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded">{item.typeLabel}</span>
                            <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded">{statusLabelMap[item.status] || item.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100" onClick={() => openEditDialog(item)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-60 hover:opacity-100 text-[#DC2626]" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  { step: '待分配', status: '完成', time: fmtTime(caseInfo.submitTime) },
                  { step: '初步审核', status: reviewStatus?.preliminaryDone ? '完成' : '进行中', time: null },
                  { step: '交底审核', status: reviewStatus?.disclosureDone ? '完成' : '待开始', time: null },
                  { step: '五书审核', status: reviewStatus?.fiveBooksDone ? '完成' : '待开始', time: null },
                  { step: '审核结果', status: '待开始', time: null },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F7FA]">
                      {item.status === '完成' && <CheckCircle className="w-5 h-5 text-[#16A34A]" />}
                      {item.status === '进行中' && <Clock className="w-5 h-5 text-[#2F80ED]" />}
                      {item.status === '待开始' && <div className="w-2 h-2 rounded-full bg-[#D1D5DB]" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-[#111827]">{item.step}</p>
                      <p className="text-xs text-[#9CA3AF]">{item.time ? fmtTime(item.time) : '-'}</p>
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

        <TabsContent value="logs">
          <Card className="border-[#E5E9F0]">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-[#111827]">操作日志</CardTitle></CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] py-8 text-center">暂无操作日志</p>
              ) : (
                <div className="space-y-0">
                  {logs.map((log, idx, arr) => (
                    <div key={idx} className={`flex justify-between items-center py-2.5 ${idx < arr.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}>
                      <div>
                        <p className="font-medium text-sm text-[#111827]">{log.action}</p>
                        <p className="text-xs text-[#9CA3AF]">{log.user}</p>
                      </div>
                      <p className="text-xs text-[#9CA3AF]">{fmtTime(log.time)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showProblemDialog} onOpenChange={setShowProblemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑问题' : '新增问题'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#6B7280]">问题描述</label>
              <input className="w-full text-sm border rounded px-3 py-2 mt-1" value={problemForm.content}
                onChange={e => setProblemForm(p => ({ ...p, content: e.target.value }))} placeholder="请输入问题描述" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#6B7280]">类型</label>
                <select className="w-full text-sm border rounded px-2 py-2 mt-1" value={problemForm.type}
                  onChange={e => setProblemForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="completeness">交底覆盖</option><option value="uniformity">术语一致性</option>
                  <option value="novelty">AI相似性</option><option value="form">形式审查</option><option value="support">权利要求支持</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">严重程度</label>
                <select className="w-full text-sm border rounded px-2 py-2 mt-1" value={problemForm.severity}
                  onChange={e => setProblemForm(p => ({ ...p, severity: e.target.value }))}>
                  <option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="critical">严重</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">状态</label>
                <select className="w-full text-sm border rounded px-2 py-2 mt-1" value={problemForm.status}
                  onChange={e => setProblemForm(p => ({ ...p, status: e.target.value }))}>
                  <option value="pending">待处理</option><option value="resolved">已解决</option><option value="ignored">忽略</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowProblemDialog(false)}>取消</Button>
            <Button size="sm" onClick={saveProblem}>{editingItem ? '保存' : '添加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
