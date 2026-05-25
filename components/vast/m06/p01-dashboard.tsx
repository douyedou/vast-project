"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertCircle,
  ArrowUpDown,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileClock,
  FileText,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  Send,
} from "lucide-react"
import { M06_STAGE_LABELS, M06_STAGE_ROUTES, M06Stage, mergeM06Content } from "@/lib/m06"

interface EngineDashboardProps {
  onNavigate: (page: string) => void
  onOpenCase?: (caseId: string, page?: string) => void
}

interface CaseRow {
  id: string
  case_id?: string
  title: string
  type?: string
  status?: string
  priority?: string
  description?: string
  engineer_name?: string
  applicant_name?: string
  reviewer_name?: string
  created_at?: string
  updated_at?: string
}

interface DisclosureRow {
  id: string
  caseUuid: string
  caseNo: string
  topic: string
  patentType: string
  field: string
  source: string
  stage: M06Stage
  stageLabel: string
  status: "READY" | "PROCESSING" | "BLOCKED" | "SUBMITTED" | "EMPTY"
  risk: "LOW" | "MEDIUM" | "HIGH" | null
  score: number | null
  engineer: string
  applicant: string
  updateTime: string
  hasDocument: boolean
  documentId?: string
  version?: number
}

const PAGE_SIZE = 8

const STAGE_FILTER_MAP: Record<string, M06Stage> = {
  decomposition: "DECOMPOSITION",
  ai_check: "AI_PRE_CHECK",
  supplement: "SUPPLEMENT",
  second_search: "SECOND_SEARCH",
  compare: "COMPARE",
  validate: "VALIDATE",
  package: "PACKAGE",
  submit: "SUBMIT",
}

const STATUS_LABELS: Record<DisclosureRow["status"], { label: string; className: string }> = {
  READY: { label: "可继续", className: "bg-green-50 text-green-700 border-green-200" },
  PROCESSING: { label: "进行中", className: "bg-blue-50 text-blue-700 border-blue-200" },
  BLOCKED: { label: "需处理", className: "bg-red-50 text-red-700 border-red-200" },
  SUBMITTED: { label: "已提交", className: "bg-slate-100 text-slate-700 border-slate-200" },
  EMPTY: { label: "未开始", className: "bg-amber-50 text-amber-700 border-amber-200" },
}

const RISK_LABELS = {
  LOW: { label: "低", className: "text-green-700" },
  MEDIUM: { label: "中", className: "text-amber-700" },
  HIGH: { label: "高", className: "text-red-700" },
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("vast_token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseApi<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (payload.code !== 200) throw new Error(payload.message || "请求失败")
  return payload.data as T
}

function patentTypeLabel(type?: string) {
  if (type === "utility") return "实用新型"
  if (type === "design") return "外观设计"
  return "发明"
}

function formatTime(value?: string) {
  if (!value) return "-"
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function inferField(caseData: CaseRow) {
  const text = `${caseData.title || ""} ${caseData.description || ""}`
  if (/机械|吊具|夹持|拉脱|试验台/.test(text)) return "机械"
  if (/树脂|血液|灌流|聚苯乙烯|生物|化学/.test(text)) return "生物化学"
  if (/通信|救援|水面|系统|软件|AI|人工智能|模型/.test(text)) return "软件通信/AI"
  return "通用"
}

function stageFromCaseStatus(status?: string): M06Stage {
  if (status === "writing" || status === "reviewing" || status === "completed") return "SUBMIT"
  if (status === "disclosure_pending") return "DECOMPOSITION"
  return "DECOMPOSITION"
}

function statusFromDocument(caseStatus: string | undefined, docStatus: string | undefined, score: number | null, hasBlocking: boolean): DisclosureRow["status"] {
  if (caseStatus === "writing" || caseStatus === "reviewing" || caseStatus === "completed" || docStatus === "approved") return "SUBMITTED"
  if (!docStatus) return "EMPTY"
  if (hasBlocking) return "BLOCKED"
  if (score !== null && score >= 70) return "READY"
  return "PROCESSING"
}

async function buildDisclosureRow(caseData: CaseRow, headers: HeadersInit): Promise<DisclosureRow> {
  try {
    const response = await fetch(`/api/cases/${caseData.id}/disclosure`, { headers })
    if (!response.ok) throw new Error("no disclosure")
    const data = await parseApi<{ document: any; case: CaseRow }>(response)
    const content = mergeM06Content(data.document.content_json, data.case)
    const validation = content.aiResults.completeness
    const score = content.workflow.qualityScore || validation?.score || null
    const hasBlocking = Boolean(validation?.issues?.some((issue) => issue.severity === "blocking"))
    const stage = content.meta.currentStage || stageFromCaseStatus(caseData.status)
    const highestSource = content.sourceMaterials.length ? "资料上传" : "案件资料"

    return {
      id: data.document.id,
      caseUuid: caseData.id,
      caseNo: caseData.case_id || "-",
      topic: caseData.title,
      patentType: patentTypeLabel(caseData.type),
      field: inferField(caseData),
      source: highestSource,
      stage,
      stageLabel: M06_STAGE_LABELS[stage],
      status: statusFromDocument(caseData.status, data.document.status, score, hasBlocking),
      risk: content.aiResults.initialInspection?.riskLevel
        ? content.aiResults.initialInspection.riskLevel.toUpperCase() as DisclosureRow["risk"]
        : null,
      score,
      engineer: caseData.engineer_name || "-",
      applicant: caseData.applicant_name || "-",
      updateTime: formatTime(data.document.updated_at || caseData.updated_at),
      hasDocument: true,
      documentId: data.document.id,
      version: data.document.version,
    }
  } catch {
    const stage = stageFromCaseStatus(caseData.status)
    return {
      id: caseData.case_id || caseData.id,
      caseUuid: caseData.id,
      caseNo: caseData.case_id || "-",
      topic: caseData.title,
      patentType: patentTypeLabel(caseData.type),
      field: inferField(caseData),
      source: "案件资料",
      stage,
      stageLabel: M06_STAGE_LABELS[stage],
      status: statusFromDocument(caseData.status, undefined, null, false),
      risk: null,
      score: null,
      engineer: caseData.engineer_name || "-",
      applicant: caseData.applicant_name || "-",
      updateTime: formatTime(caseData.updated_at || caseData.created_at),
      hasDocument: false,
    }
  }
}

export function EngineDashboard({ onNavigate, onOpenCase }: EngineDashboardProps) {
  const [rows, setRows] = useState<DisclosureRow[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterSource, setFilterSource] = useState("all")
  const [filterStage, setFilterStage] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortKey, setSortKey] = useState<"update" | "score" | "stage">("update")
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadDisclosures = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const headers = getAuthHeaders()
      const response = await fetch("/api/cases?page=1&pageSize=100", { headers })
      const data = await parseApi<{ list: CaseRow[] }>(response)
      const built = await Promise.all((data.list || []).map((caseData) => buildDisclosureRow(caseData, headers)))
      setRows(built)
      setPage(1)
    } catch (err: any) {
      setLoadError(err.message || "加载 M06 工作台失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDisclosures()
  }, [loadDisclosures])

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    const list = rows.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.topic.toLowerCase().includes(keyword) ||
        item.caseNo.toLowerCase().includes(keyword) ||
        item.field.toLowerCase().includes(keyword)
      const matchSource = filterSource === "all" || item.source === filterSource
      const matchStage = filterStage === "all" || item.stage === STAGE_FILTER_MAP[filterStage]
      const matchStatus = filterStatus === "all" || item.status === filterStatus
      return matchKeyword && matchSource && matchStage && matchStatus
    })

    const sorted = [...list].sort((a, b) => {
      if (sortKey === "score") return (a.score || 0) - (b.score || 0)
      if (sortKey === "stage") return a.stageLabel.localeCompare(b.stageLabel, "zh-CN")
      return a.updateTime.localeCompare(b.updateTime, "zh-CN")
    })
    return sortDesc ? sorted.reverse() : sorted
  }, [filterSource, filterStage, filterStatus, rows, searchKeyword, sortDesc, sortKey])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = useMemo(() => {
    const total = rows.length
    const processing = rows.filter((item) => item.status === "PROCESSING").length
    const blocked = rows.filter((item) => item.status === "BLOCKED").length
    const ready = rows.filter((item) => item.status === "READY").length
    const submitted = rows.filter((item) => item.status === "SUBMITTED").length
    return { total, processing, blocked, ready, submitted }
  }, [rows])

  function openCase(row: DisclosureRow, pageId = M06_STAGE_ROUTES[row.stage]) {
    if (onOpenCase) onOpenCase(row.caseUuid, pageId)
    else onNavigate(pageId)
  }

  function applyStatFilter(status: "all" | DisclosureRow["status"]) {
    setFilterStatus(status)
    setPage(1)
  }

  function toggleSort(nextKey: typeof sortKey) {
    if (sortKey === nextKey) setSortDesc((current) => !current)
    else {
      setSortKey(nextKey)
      setSortDesc(true)
    }
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">交底书引擎工作台</h1>
          <p className="text-sm text-[#6B7280] mt-1">从案件进入 M06，完成解构、初检、补全、检索、校验、数据包与提交。</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDisclosures} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
        <button onClick={() => applyStatFilter("all")} className="rounded-lg border bg-white p-4 text-left hover:border-blue-300">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">全部案件</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#111827]">{stats.total}</div>
        </button>
        <button onClick={() => applyStatFilter("PROCESSING")} className="rounded-lg border bg-white p-4 text-left hover:border-blue-300">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">进行中</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#111827]">{stats.processing}</div>
        </button>
        <button onClick={() => applyStatFilter("BLOCKED")} className="rounded-lg border bg-white p-4 text-left hover:border-red-300">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">需处理</span>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#111827]">{stats.blocked}</div>
        </button>
        <button onClick={() => applyStatFilter("READY")} className="rounded-lg border bg-white p-4 text-left hover:border-green-300">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">可继续</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#111827]">{stats.ready}</div>
        </button>
        <button onClick={() => applyStatFilter("SUBMITTED")} className="rounded-lg border bg-white p-4 text-left hover:border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#6B7280]">已提交</span>
            <Send className="h-4 w-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-[#111827]">{stats.submitted}</div>
        </button>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="p-4 border-b flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              value={searchKeyword}
              onChange={(event) => {
                setSearchKeyword(event.target.value)
                setPage(1)
              }}
              placeholder="搜索案件号、标题、领域"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterSource} onValueChange={(value) => { setFilterSource(value); setPage(1) }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="案件资料">案件资料</SelectItem>
                <SelectItem value="资料上传">资料上传</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={(value) => { setFilterStage(value); setPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                <SelectItem value="decomposition">交底书解构</SelectItem>
                <SelectItem value="ai_check">AI初检</SelectItem>
                <SelectItem value="supplement">交底补全</SelectItem>
                <SelectItem value="second_search">二次检索</SelectItem>
                <SelectItem value="compare">现有技术对比</SelectItem>
                <SelectItem value="validate">质量控制</SelectItem>
                <SelectItem value="package">数据包</SelectItem>
                <SelectItem value="submit">提交M07</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); setPage(1) }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="EMPTY">未开始</SelectItem>
                <SelectItem value="PROCESSING">进行中</SelectItem>
                <SelectItem value="BLOCKED">需处理</SelectItem>
                <SelectItem value="READY">可继续</SelectItem>
                <SelectItem value="SUBMITTED">已提交</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[260px]">案件</TableHead>
                <TableHead>类型/领域</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-7 px-1 gap-1" onClick={() => toggleSort("stage")}>
                    当前阶段
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </Button>
                </TableHead>
                <TableHead>状态</TableHead>
                <TableHead>风险</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-7 px-1 gap-1" onClick={() => toggleSort("score")}>
                    质量分
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </Button>
                </TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-7 px-1 gap-1" onClick={() => toggleSort("update")}>
                    更新时间
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-[#6B7280]">
                    正在加载 M06 案件...
                  </TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-36 text-center">
                    <div className="flex flex-col items-center gap-2 text-[#6B7280]">
                      <Package className="h-8 w-8 text-[#CBD5E1]" />
                      <div className="text-sm">没有匹配的交底书任务</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => {
                  const status = STATUS_LABELS[row.status]
                  const risk = row.risk ? RISK_LABELS[row.risk] : null
                  return (
                    <TableRow key={row.caseUuid} className="hover:bg-[#F8FAFC]">
                      <TableCell>
                        <div className="font-medium text-[#111827] break-words">{row.topic}</div>
                        <div className="mt-1 text-xs text-[#6B7280] font-mono">{row.caseNo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-[#111827]">{row.patentType}</div>
                        <div className="text-xs text-[#6B7280]">{row.field}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {row.stageLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {risk ? <span className={`text-sm font-medium ${risk.className}`}>{risk.label}</span> : <span className="text-sm text-[#9CA3AF]">-</span>}
                      </TableCell>
                      <TableCell>
                        {row.score !== null ? <span className="font-medium">{row.score}</span> : <span className="text-[#9CA3AF]">-</span>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-[#111827]">{row.engineer}</div>
                        <div className="text-xs text-[#6B7280]">{row.applicant}</div>
                      </TableCell>
                      <TableCell className="text-sm text-[#6B7280]">{row.updateTime}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" className="h-8 gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]" onClick={() => openCase(row)}>
                            进入当前阶段
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="更多 M06 操作">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openCase(row, "m06-p02-decomposition")}>
                                <Brain className="mr-2 h-4 w-4" />
                                交底书解构
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openCase(row, "m06-p03-ai-inspection")}>
                                <Search className="mr-2 h-4 w-4" />
                                AI初检
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openCase(row, "m06-p10-quality")}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                质量控制
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openCase(row, "m06-p11-package")}>
                                <Package className="mr-2 h-4 w-4" />
                                数据包
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openCase(row, "m06-p13-version")}>
                                <FileClock className="mr-2 h-4 w-4" />
                                版本日志
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-[#6B7280]">
          <span>共 {filteredRows.length} 条，当前第 {page} / {totalPages} 页</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
