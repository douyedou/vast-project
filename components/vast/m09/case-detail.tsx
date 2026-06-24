"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Edit, Send, Clock, User, FileText, Calendar, Building } from "lucide-react"

interface CaseDetailProps {
  onNavigate: (page: string) => void
  caseId: string | null
}

interface CaseData {
  id: string
  case_id: string
  title: string
  type: string
  status: string
  description: string
  priority: string
  created_at: string
  updated_at: string
  applicant_name: string | null
  engineer_name: string | null
  reviewer_name: string | null
  files?: { id: string; filename: string; original_name?: string; created_at: string; size?: number }[]
}

interface HistoryItem {
  id: string
  from_status: string
  to_status: string
  operator_name: string | null
  remark: string | null
  created_at: string
}

const typeMap: Record<string, string> = {
  invention: "发明",
  utility: "实用新型",
  design: "外观设计",
}

const statusMap: Record<string, string> = {
  draft: "草稿",
  assigning: "待分配",
  searching: "检索中",
  confirming: "待确认",
  filing: "立案中",
  disclosure_pending: "待交底",
  writing: "撰写中",
  reviewing: "审核中",
  completed: "已完成",
  rejected: "已退回",
}

const statusColor: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  assigning: "bg-orange-100 text-orange-700",
  searching: "bg-cyan-100 text-cyan-700",
  confirming: "bg-yellow-100 text-yellow-700",
  filing: "bg-indigo-100 text-indigo-700",
  disclosure_pending: "bg-pink-100 text-pink-700",
  writing: "bg-blue-100 text-blue-700",
  reviewing: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

export function CaseDetail({ onNavigate, caseId }: CaseDetailProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!caseId) {
      setLoading(false)
      return
    }
    const token = localStorage.getItem("vast_token")
    fetch(`/api/cases/${caseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) {
          setCaseData(data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [caseId])

  useEffect(() => {
    if (!caseId || activeTab !== "history") return
    setLoadingHistory(true)
    const token = localStorage.getItem("vast_token")
    fetch(`/api/cases/${caseId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) {
          setHistory(data.data || [])
        }
      })
      .finally(() => setLoadingHistory(false))
  }, [caseId, activeTab])

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">加载中...</div>
  }

  if (!caseData) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">未找到案件信息</p>
        <Button variant="outline" className="mt-4" onClick={() => onNavigate("m09-all-cases")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("m09-all-cases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{caseData.case_id}</h1>
              <Badge className={statusColor[caseData.status] || "bg-gray-100 text-gray-700"}>
                {statusMap[caseData.status] || caseData.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{caseData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出案件
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            编辑信息
          </Button>
          <Button size="sm">
            <Send className="mr-2 h-4 w-4" />
            提交交案
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">专利类型</p>
                <p className="font-medium">{typeMap[caseData.type] || caseData.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">工程师</p>
                <p className="font-medium">{caseData.engineer_name || "未分配"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">审核人</p>
                <p className="font-medium">{caseData.reviewer_name || "未分配"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">创建时间</p>
                <p className="font-medium">{new Date(caseData.created_at).toLocaleDateString("zh-CN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="documents">文档</TabsTrigger>
          <TabsTrigger value="history">状态历史</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">案件信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">案件编号</p>
                  <p className="font-medium">{caseData.case_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">专利名称</p>
                  <p className="font-medium">{caseData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">专利类型</p>
                  <p className="font-medium">{typeMap[caseData.type] || caseData.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">优先级</p>
                  <p className="font-medium">{caseData.priority}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">描述</p>
                <p className="text-sm mt-1">{caseData.description}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">案件文档</CardTitle>
            </CardHeader>
            <CardContent>
              {(caseData.files || []).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无文档</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(caseData.files || []).map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.original_name || file.filename}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(file.created_at).toLocaleDateString("zh-CN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">状态流转历史</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="py-8 text-center text-muted-foreground">加载中...</div>
              ) : history.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无状态历史</p>
                </div>
              ) : (
                <div className="relative pl-4 border-l border-border space-y-6">
                  {history.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{statusMap[item.from_status] || item.from_status}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{statusMap[item.to_status] || item.to_status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          操作人：{item.operator_name || "系统"} · {new Date(item.created_at).toLocaleString("zh-CN")}
                        </div>
                        {item.remark && <div className="text-xs text-muted-foreground">备注：{item.remark}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
