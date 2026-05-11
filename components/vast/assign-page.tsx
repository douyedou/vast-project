"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "./status-badge"
import { ArrowLeft, Check, User, Calendar, FileText, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssignPageProps {
  onBack: () => void
}

const pendingItems = [
  {
    id: "1",
    code: "DS-2024-001",
    clientName: "华为技术有限公司",
    patentTitle: "一种无线通信设备及方法",
    patentType: "发明专利",
    createdAt: "2024-03-01 10:30:00",
  },
  {
    id: "2",
    code: "DS-2024-008",
    clientName: "比亚迪股份有限公司",
    patentTitle: "电池管理系统及方法",
    patentType: "发明专利",
    createdAt: "2024-03-02 09:15:00",
  },
  {
    id: "3",
    code: "DS-2024-009",
    clientName: "大疆创新科技有限公司",
    patentTitle: "无人机飞行控制方法",
    patentType: "实用新型",
    createdAt: "2024-03-02 14:20:00",
  },
  {
    id: "4",
    code: "DS-2024-010",
    clientName: "宁德时代新能源科技股份有限公司",
    patentTitle: "锂电池电解液配方",
    patentType: "发明专利",
    createdAt: "2024-03-03 08:45:00",
  },
  {
    id: "5",
    code: "DS-2024-011",
    clientName: "海康威视数字技术股份有限公司",
    patentTitle: "视频监控智能分析系统",
    patentType: "发明专利",
    createdAt: "2024-03-03 11:30:00",
  },
]

const engineers = [
  { id: "1", name: "王五", tasks: 3, specialty: "电子信息" },
  { id: "2", name: "赵六", tasks: 2, specialty: "机械工程" },
  { id: "3", name: "钱七", tasks: 5, specialty: "化学化工" },
  { id: "4", name: "孙八", tasks: 1, specialty: "软件与计算机" },
  { id: "5", name: "周九", tasks: 4, specialty: "生物技术" },
]

export function AssignPage({ onBack }: AssignPageProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [selectedEngineer, setSelectedEngineer] = useState<string>("")
  const [taskType, setTaskType] = useState<string>("presale")
  const [assignNote, setAssignNote] = useState("")
  const [deadline, setDeadline] = useState("")

  const selectedSource = pendingItems.find((item) => item.id === selectedItem)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">专利经理分配</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            将售前咨询或客服立案任务分配给专利工程师
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Left: Pending List */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-[#111827]">
                  待分配来源
                </CardTitle>
                <span className="text-sm text-[#6B7280]">
                  共 <span className="font-medium text-[#1F2937]">{pendingItems.length}</span> 条
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F7FA]">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="font-medium text-[#6B7280]">来源编号</TableHead>
                    <TableHead className="font-medium text-[#6B7280]">客户名称</TableHead>
                    <TableHead className="font-medium text-[#6B7280]">技术主题</TableHead>
                    <TableHead className="font-medium text-[#6B7280]">专利类型</TableHead>
                    <TableHead className="font-medium text-[#6B7280]">创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedItem === item.id
                          ? "bg-[#EAF4FF]"
                          : "hover:bg-[#F5F7FA]/50"
                      )}
                      onClick={() => setSelectedItem(item.id)}
                    >
                      <TableCell>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            selectedItem === item.id
                              ? "border-[#2F80ED] bg-[#2F80ED]"
                              : "border-[#E5EAF2]"
                          )}
                        >
                          {selectedItem === item.id && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-[#2F80ED]">
                        {item.code}
                      </TableCell>
                      <TableCell className="text-[#1F2937]">{item.clientName}</TableCell>
                      <TableCell className="text-[#1F2937] max-w-40 truncate">
                        {item.patentTitle}
                      </TableCell>
                      <TableCell className="text-[#6B7280]">{item.patentType}</TableCell>
                      <TableCell className="text-[#6B7280] font-mono text-xs">
                        {item.createdAt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right: Assign Form */}
        <div className="col-span-2 space-y-4">
          {/* Source Summary */}
          {selectedSource && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[#111827]">
                  来源摘要
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">来源编号</span>
                  <span className="font-mono text-[#2F80ED]">{selectedSource.code}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">客户名称</span>
                  <span className="text-[#1F2937]">{selectedSource.clientName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">技术主题</span>
                  <span className="text-[#1F2937] truncate max-w-40">
                    {selectedSource.patentTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">专利类型</span>
                  <span className="text-[#1F2937]">{selectedSource.patentType}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assign Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#111827]">
                分配设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">
                  选择工程师 <span className="text-[#F5222D]">*</span>
                </Label>
                <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择专利工程师" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineers.map((engineer) => (
                      <SelectItem key={engineer.id} value={engineer.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                              <User className="h-3 w-3 text-[#2F80ED]" />
                            </div>
                            <span>{engineer.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                            <span>{engineer.specialty}</span>
                            <span className="px-1.5 py-0.5 bg-[#F0F3F8] rounded">
                              {engineer.tasks} 任务
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEngineer && (
                <div className="p-3 bg-[#F5F7FA] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EAF4FF] flex items-center justify-center">
                      <User className="h-5 w-5 text-[#2F80ED]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1F2937]">
                        {engineers.find((e) => e.id === selectedEngineer)?.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        当前任务：
                        {engineers.find((e) => e.id === selectedEngineer)?.tasks} 个
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">
                  任务类型 <span className="text-[#F5222D]">*</span>
                </Label>
                <RadioGroup
                  value={taskType}
                  onValueChange={setTaskType}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="presale" id="presale" />
                    <Label htmlFor="presale" className="font-normal cursor-pointer">
                      售前初检
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="structure" id="structure" />
                    <Label htmlFor="structure" className="font-normal cursor-pointer">
                      交底解构
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-[#9CA3AF]">
                  {taskType === "presale"
                    ? "售前初检：进入 AI初检/反馈路径"
                    : "交底解构：进入 M06 交底书引擎模型"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">截止时间</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1F2937]">分配说明</Label>
                <Textarea
                  placeholder="请输入分配说明（可选）"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              取消
            </Button>
            <Button
              className="flex-1 bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white"
              disabled={!selectedItem || !selectedEngineer}
            >
              确认分配
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
