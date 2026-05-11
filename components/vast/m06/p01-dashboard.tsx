"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertTriangle,
  Send,
  Clock,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  MoreHorizontal,
  Brain,
  Package,
  ChevronLeft,
  Layers,
  ArrowUpDown,
} from "lucide-react"

interface EngineDashboardProps {
  onNavigate: (page: string) => void
}

// 阶段顺序 - 用于判断是否到达质量控制阶段
const STAGE_ORDER = ["DECOMPOSITION", "AI_PRE_CHECK", "SUPPLEMENT", "FINAL_DISCLOSURE", "SECOND_SEARCH", "COMPARE", "RELATE", "STRUCTURE", "VALIDATE", "PACKAGE", "SUBMIT"]
const QUALITY_STAGE_INDEX = STAGE_ORDER.indexOf("VALIDATE") // 质量控制阶段索引

// 交底书数据 - 全部从M05流转而来
// 售前来源：只到AI初检阶段，完成后返回M05
// 立案来源：走完整流程直到提交M07
const DISCLOSURES = [
  { 
    id: "D-2024-0601", 
    topic: "一种基于大模型的专利质量自动审核方法", 
    patentType: "发明",
    field: "人工智能",
    source: "filed",  // 立案
    stage: "SECOND_SEARCH", 
    stageLabel: "二次检索", 
    status: "BLOCKED", 
    risk: "HIGH", 
    score: null, 
    engineer: "张明", 
    sales: "王丽",
    support: "李娜",
    updateTime: "2024-01-15 10:30" 
  },
  { 
    id: "D-2024-0602", 
    topic: "智能终端多eSIM切换控制电路", 
    patentType: "发明",
    field: "通信技术",
    source: "presale",  // 售前 - 只到AI初检
    stage: "AI_PRE_CHECK", 
    stageLabel: "AI初检", 
    status: "PROCESSING", 
    risk: null,
    score: null,
    engineer: "李华", 
    sales: "张芳",
    support: "王敏",
    updateTime: "2024-01-15 09:25" 
  },
  { 
    id: "D-2024-0603", 
    topic: "无人机避障路径规划系统", 
    patentType: "发明",
    field: "机器人技术",
    source: "filed",  // 立案
    stage: "PACKAGE", 
    stageLabel: "数据包", 
    status: "READY", 
    risk: "LOW", 
    score: 88, 
    engineer: "王伟", 
    sales: "赵琳",
    support: "孙艳",
    updateTime: "2024-01-15 08:15" 
  },
  { 
    id: "D-2024-0604", 
    topic: "基于深度学习的图像识别方法", 
    patentType: "实用新型",
    field: "人工智能",
    source: "presale",  // 售前 - 只到AI初检
    stage: "DECOMPOSITION", 
    stageLabel: "解构", 
    status: "PROCESSING", 
    risk: null,
    score: null,
    engineer: "赵强", 
    sales: "刘倩",
    support: "陈静",
    updateTime: "2024-01-14 16:45" 
  },
  { 
    id: "D-2024-0605", 
    topic: "智能家居控制系统及其控制方法", 
    patentType: "发明",
    field: "物联网",
    source: "filed",  // 立案
    stage: "VALIDATE", 
    stageLabel: "质量控制", 
    status: "PROCESSING", 
    risk: "LOW", 
    score: 90,
    engineer: "孙磊", 
    sales: "周婷",
    support: "吴静",
    updateTime: "2024-01-14 14:20" 
  },
  { 
    id: "D-2024-0606", 
    topic: "区块链数据存储与验证方法", 
    patentType: "发明",
    field: "区块链",
    source: "filed",  // 立案
    stage: "COMPARE", 
    stageLabel: "技术对比", 
    status: "PROCESSING", 
    risk: "MEDIUM",
    score: null,
    engineer: "周杰", 
    sales: "吴燕",
    support: "郑霞",
    updateTime: "2024-01-14 11:30" 
  },
  { 
    id: "D-2024-0607", 
    topic: "一种新型锂电池快充控制方法", 
    patentType: "发明",
    field: "电池技术",
    source: "filed",  // 立案
    stage: "DECOMPOSITION", 
    stageLabel: "解构", 
    status: "PROCESSING", 
    risk: null,
    score: null,
    engineer: "钱坤", 
    sales: "郑红",
    support: "冯雪",
    updateTime: "2024-01-14 09:00" 
  },
  { 
    id: "D-2024-0608", 
    topic: "基于5G的工业物联网通信协议优化", 
    patentType: "发明",
    field: "通信技术",
    source: "presale",  // 售前 - 只到AI初检
    stage: "AI_PRE_CHECK", 
    stageLabel: "AI初检", 
    status: "PROCESSING", 
    risk: null,
    score: null,
    engineer: "吴刚", 
    sales: "冯丽",
    support: "黄莉",
    updateTime: "2024-01-13 16:30" 
  },
  { 
    id: "D-2024-0609", 
    topic: "智能语音交互系统优化方法", 
    patentType: "发明",
    field: "人工智能",
    source: "presale",  // 售前 - 已完成初检，待返回M05
    stage: "AI_PRE_CHECK", 
    stageLabel: "AI初检", 
    status: "READY",  // 售前初检完成，就绪返回M05
    risk: "LOW",
    score: null,
    engineer: "郑伟", 
    sales: "黄芳",
    support: "杨静",
    updateTime: "2024-01-13 15:00" 
  },
  { 
    id: "D-2024-0610", 
    topic: "分布式存储系统架构设计", 
    patentType: "发明",
    field: "云计算",
    source: "filed",  // 立案
    stage: "RELATE", 
    stageLabel: "关系建模", 
    status: "PROCESSING", 
    risk: "MEDIUM",
    score: null,
    engineer: "杨明", 
    sales: "许丽",
    support: "何燕",
    updateTime: "2024-01-13 11:20" 
  },
]

export function EngineDashboard({ onNavigate }: EngineDashboardProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterSource, setFilterSource] = useState("all")
  const [filterStage, setFilterStage] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // 统计数据 - 按来源区分
  const stats = {
    total: DISCLOSURES.length,
    filed: DISCLOSURES.filter(d => d.source === "filed").length,
    presale: DISCLOSURES.filter(d => d.source === "presale").length,
    processing: DISCLOSURES.filter(d => d.status === "PROCESSING").length,
    blocked: DISCLOSURES.filter(d => d.status === "BLOCKED").length,
    ready: DISCLOSURES.filter(d => d.status === "READY").length,
  }

  const getSourceBadge = (source: string) => {
    return source === "presale"
      ? <Badge variant="outline" className="text-xs px-2 py-0.5 border-[#7C3AED] text-[#7C3AED] bg-[#F5F3FF]">售前</Badge>
      : <Badge variant="outline" className="text-xs px-2 py-0.5 border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]">立案</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BLOCKED": return (
        <Badge className="text-xs px-2.5 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-medium">
          阻断
        </Badge>
      )
      case "READY": return (
        <Badge className="text-xs px-2.5 py-0.5 bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] font-medium">
          就绪
        </Badge>
      )
      default: return (
        <Badge className="text-xs px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-medium">
          处理中
        </Badge>
      )
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "HIGH": return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#DC2626]">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" />高
        </span>
      )
      case "MEDIUM": return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#F59E0B]">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />中
        </span>
      )
      case "LOW": return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#16A34A]">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />低
        </span>
      )
      default: return <span className="text-[#D1D5DB] text-base">—</span>
    }
  }

  const getStageBadge = (stageLabel: string) => {
    const styles: Record<string, string> = {
      "解构":    "bg-slate-100  text-slate-700  border-slate-200",
      "AI初检":  "bg-blue-50    text-blue-700   border-blue-200",
      "交底补全": "bg-indigo-50  text-indigo-700 border-indigo-200",
      "完整交底": "bg-purple-50  text-purple-700 border-purple-200",
      "二次检索": "bg-cyan-50    text-cyan-700   border-cyan-200",
      "技术对比": "bg-teal-50    text-teal-700   border-teal-200",
      "关系建模": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "结构化":   "bg-green-50   text-green-700  border-green-200",
      "质量控制": "bg-amber-50   text-amber-700  border-amber-200",
      "数据包":   "bg-orange-50  text-orange-700 border-orange-200",
    }
    return (
      <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-medium border ${styles[stageLabel] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
        {stageLabel}
      </Badge>
    )
  }

  const getStageRoute = (stage: string) => {
    const routes: Record<string, string> = {
      "DECOMPOSITION": "m06-p02-decomposition",
      "AI_PRE_CHECK": "m06-p03-ai-inspection",
      "SUPPLEMENT": "m06-p04-supplement",
      "FINAL_DISCLOSURE": "m06-p05-final-disclosure",
      "SECOND_SEARCH": "m06-p06-second-search",
      "COMPARE": "m06-p07-prior-art",
      "RELATE": "m06-p08-relation-mapping",
      "STRUCTURE": "m06-p09-assets",
      "VALIDATE": "m06-p10-quality",
      "PACKAGE": "m06-p11-package",
    }
    return routes[stage] || "m06-p02-decomposition"
  }

  // 筛选数据
  const filteredData = DISCLOSURES.filter(item => {
    if (searchKeyword && !item.topic.includes(searchKeyword) && !item.id.includes(searchKeyword)) return false
    if (filterSource !== "all" && item.source !== filterSource) return false
    if (filterStatus !== "all" && item.status !== filterStatus.toUpperCase()) return false
    return true
  })

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      {/* 页面头部 */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[#111827]">交底书工作台</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">管理从M05流转的交底书任务</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate("m06-p10-quality")}>
              <AlertTriangle size={14} className="mr-1.5 text-[#DC2626]" />
              阻断任务 ({stats.blocked})
            </Button>
            <Button variant="outline" size="sm" className="text-[#16A34A] border-[#16A34A]" onClick={() => onNavigate("m06-p12-submit")}>
              <Send size={14} className="mr-1.5" />
              待提交M07 ({stats.ready})
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {/* 统计卡片 - 按来源区分 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#6B7280] text-sm mb-1">
              <FileText size={16} />
              全部任务
            </div>
            <div className="text-2xl font-bold text-[#111827]">{stats.total}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">处理中 {stats.processing}</div>
          </div>
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4 cursor-pointer hover:bg-[#DBEAFE] transition" onClick={() => setFilterSource("filed")}>
            <div className="flex items-center gap-2 text-[#2563EB] text-sm mb-1">
              <FileText size={16} />
              立案来源
            </div>
            <div className="text-2xl font-bold text-[#111827]">{stats.filed}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">完整流程至M07</div>
          </div>
          <div className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-lg p-4 cursor-pointer hover:bg-[#EDE9FE] transition" onClick={() => setFilterSource("presale")}>
            <div className="flex items-center gap-2 text-[#7C3AED] text-sm mb-1">
              <FileText size={16} />
              售前来源
            </div>
            <div className="text-2xl font-bold text-[#111827]">{stats.presale}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">初检后返回M05</div>
          </div>
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 cursor-pointer hover:bg-[#DCFCE7] transition" onClick={() => setFilterStatus("processing")}>
            <div className="flex items-center gap-2 text-[#16A34A] text-sm mb-1">
              <Clock size={16} />
              进行中
            </div>
            <div className="text-2xl font-bold text-[#111827]">{stats.processing}</div>
            <div className="text-xs text-[#9CA3AF] mt-1">阻断 {stats.blocked} / 就绪 {stats.ready}</div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl h-full flex flex-col">
          {/* 筛选栏 */}
          <div className="flex items-center justify-between gap-4 p-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 text-[#9CA3AF]" size={16} />
                <Input 
                  className="pl-9 h-9 bg-[#F9FAFB] border-[#E5E7EB]" 
                  placeholder="搜索编号或技术主题..." 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue placeholder="来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部来源</SelectItem>
                  <SelectItem value="presale">售前咨询</SelectItem>
                  <SelectItem value="filed">立案</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue placeholder="阶段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部阶段</SelectItem>
                  <SelectItem value="decomposition">解构</SelectItem>
                  <SelectItem value="ai_check">AI初检</SelectItem>
                  <SelectItem value="supplement">交底补全</SelectItem>
                  <SelectItem value="second_search">二次检索</SelectItem>
                  <SelectItem value="compare">技术对比</SelectItem>
                  <SelectItem value="validate">质量控制</SelectItem>
                  <SelectItem value="package">数据包</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="processing">处理中</SelectItem>
                  <SelectItem value="blocked">阻断</SelectItem>
                  <SelectItem value="ready">就绪</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-[#6B7280]">
              共 <span className="font-medium text-[#111827]">{filteredData.length}</span> 条
            </div>
          </div>

          {/* 数据表格 */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-[#F9FAFB] sticky top-0">
                <TableRow className="text-sm">
                  <TableHead className="w-32 text-[#374151] font-semibold">编号</TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">来源</TableHead>
                  <TableHead className="text-[#374151] font-semibold">技术主题</TableHead>
                  <TableHead className="w-24 text-[#374151] font-semibold">专利类型</TableHead>
                  <TableHead className="w-24 text-[#374151] font-semibold">技术领域</TableHead>
                  <TableHead className="w-28 text-[#374151] font-semibold">当前阶段</TableHead>
                  <TableHead className="w-24 text-[#374151] font-semibold">状态</TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">风险</TableHead>
                  <TableHead className="w-20 text-center text-[#374151] font-semibold">
                    <div className="flex items-center justify-center gap-1">
                      质量分
                      <ArrowUpDown size={13} className="text-[#9CA3AF]" />
                    </div>
                  </TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">工程师</TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">销售</TableHead>
                  <TableHead className="w-20 text-[#374151] font-semibold">客服</TableHead>
                  <TableHead className="w-32 text-[#374151] font-semibold">更新时间</TableHead>
                  <TableHead className="w-28 text-center text-[#374151] font-semibold">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer transition-colors ${item.status === "BLOCKED" ? "bg-[#FEF9F9] hover:bg-[#FEF2F2]" : "hover:bg-[#F5F9FF]"}`}
                    onClick={() => onNavigate(getStageRoute(item.stage))}
                  >
                    <TableCell className="font-mono text-sm text-[#6B7280] py-3.5">{item.id}</TableCell>
                    <TableCell className="py-3.5">{getSourceBadge(item.source)}</TableCell>
                    <TableCell className="py-3.5">
                      <div>
                        <span className="text-sm font-medium text-[#111827] line-clamp-1">{item.topic}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium border-[#D1D5DB] text-[#6B7280]">
                        {item.patentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className="text-sm text-[#374151]">{item.field}</span>
                    </TableCell>
                    <TableCell className="py-3.5">{getStageBadge(item.stageLabel)}</TableCell>
                    <TableCell className="py-3.5">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="py-3.5">
                      {item.risk ? getRiskBadge(item.risk) : <span className="text-[#D1D5DB] text-base">—</span>}
                    </TableCell>
                    <TableCell className="text-center py-3.5">
                      {(() => {
                        const stageIdx = STAGE_ORDER.indexOf(item.stage)
                        const hasScore = stageIdx >= QUALITY_STAGE_INDEX && item.score !== null
                        if (!hasScore) return <span className="text-[#D1D5DB] text-base">—</span>
                        return (
                          <span className={`text-base font-bold ${item.score! >= 85 ? "text-[#16A34A]" : item.score! >= 70 ? "text-[#F59E0B]" : "text-[#DC2626]"}`}>
                            {item.score}
                          </span>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="text-sm text-[#374151] py-3.5">{item.engineer}</TableCell>
                    <TableCell className="text-sm text-[#6B7280] py-3.5">{item.sales}</TableCell>
                    <TableCell className="text-sm text-[#6B7280] py-3.5">{item.support}</TableCell>
                    <TableCell className="text-sm text-[#9CA3AF] py-3.5">{item.updateTime}</TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* 进入当前阶段 - 主操作 */}
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white gap-1"
                          onClick={() => onNavigate(getStageRoute(item.stage))}
                        >
                          进入
                          <ChevronRight size={13} />
                        </Button>
                        {/* 更多操作 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 border-[#E5E7EB]">
                              <MoreHorizontal size={15} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem className="text-sm" onClick={() => onNavigate("m06-p02-decomposition")}>
                              <Layers size={14} className="mr-2" />
                              查看解构
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-sm" onClick={() => onNavigate("m06-p03-ai-inspection")}>
                              <Brain size={14} className="mr-2" />
                              AI初检
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-sm" onClick={() => onNavigate("m06-p11-package")}>
                              <Package size={14} className="mr-2" />
                              数据包
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-sm" onClick={() => onNavigate("m06-p13-version")}>
                              <Clock size={14} className="mr-2" />
                              版本日志
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
            <div className="text-sm text-[#6B7280]">
              显示 1-{filteredData.length} 条，共 128 条
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft size={14} className="mr-1" />
                上一页
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-[#2563EB] text-white border-[#2563EB]">1</Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0">2</Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0">3</Button>
                <span className="px-1 text-[#9CA3AF]">...</span>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0">22</Button>
              </div>
              <Button variant="outline" size="sm">
                下一页
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
