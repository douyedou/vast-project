"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, Edit, Send, Clock, User, FileText, Calendar, Building } from "lucide-react"

interface CaseDetailProps {
  onNavigate: (page: string) => void
}

export function CaseDetail({ onNavigate }: CaseDetailProps) {
  const [activeTab, setActiveTab] = useState("basic")

  const caseInfo = {
    id: "CASE-2024-001256",
    client: "腾讯科技有限公司",
    title: "一种基于深度学习的图像识别方法及系统",
    type: "发明专利",
    status: "撰写中",
    engineer: "张工",
    manager: "刘经理",
    createDate: "2024-01-15",
    deadline: "2024-02-15",
    progress: 65,
  }

  const timeline = [
    { date: "2024-01-15 09:30", action: "案件创建", user: "系统", desc: "从M05交底书来源模块创建案件" },
    { date: "2024-01-15 10:00", action: "分配工程师", user: "刘经理", desc: "分配给张工处理" },
    { date: "2024-01-16 14:20", action: "开始撰写", user: "张工", desc: "进入M07专利创作平台" },
    { date: "2024-01-18 16:45", action: "说明书初稿完成", user: "张工", desc: "AI辅助生成说明书初稿" },
    { date: "2024-01-20 11:30", action: "权利要求书撰写中", user: "张工", desc: "正在撰写权利要求书" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("m09-all-cases")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{caseInfo.id}</h1>
              <Badge className="bg-blue-100 text-blue-700">{caseInfo.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{caseInfo.title}</p>
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
          <Button size="sm" onClick={() => onNavigate("m09-waiting-cases")}>
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
                <p className="text-sm text-muted-foreground">客户名称</p>
                <p className="font-medium">{caseInfo.client}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">专利类型</p>
                <p className="font-medium">{caseInfo.type}</p>
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
                <p className="text-sm text-muted-foreground">负责工程师</p>
                <p className="font-medium">{caseInfo.engineer}</p>
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
                <p className="text-sm text-muted-foreground">截止日期</p>
                <p className="font-medium">{caseInfo.deadline}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="disclosure">交底书</TabsTrigger>
              <TabsTrigger value="documents">申请文件</TabsTrigger>
              <TabsTrigger value="timeline">流程记录</TabsTrigger>
              <TabsTrigger value="files">附件管理</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="mt-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">案件信息</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">案件编号</span>
                      <span className="font-medium">{caseInfo.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">客户名称</span>
                      <span className="font-medium">{caseInfo.client}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">专利名称</span>
                      <span className="font-medium max-w-[300px] text-right">{caseInfo.title}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">专利类型</span>
                      <span className="font-medium">{caseInfo.type}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">案件状态</span>
                      <Badge className="bg-blue-100 text-blue-700">{caseInfo.status}</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">人员与时间</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">负责工程师</span>
                      <span className="font-medium">{caseInfo.engineer}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">专利经理</span>
                      <span className="font-medium">{caseInfo.manager}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">创建日期</span>
                      <span className="font-medium">{caseInfo.createDate}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">截止日期</span>
                      <span className="font-medium">{caseInfo.deadline}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">撰写进度</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${caseInfo.progress}%` }} />
                        </div>
                        <span className="font-medium">{caseInfo.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="disclosure" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>交底书内容预览区域</p>
                <Button variant="outline" className="mt-4" onClick={() => onNavigate("m06-model-detail")}>
                  查看完整交底书
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="documents" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>申请文件预览区域（说明书、权利要求书、摘要等）</p>
                <Button variant="outline" className="mt-4" onClick={() => onNavigate("m07-workspace")}>
                  进入创作平台
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="timeline" className="mt-6">
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      {index < timeline.length - 1 && <div className="w-px h-full bg-border flex-1 my-1" />}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.action}</span>
                        <Badge variant="outline">{item.user}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="files" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>附件管理区域</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
