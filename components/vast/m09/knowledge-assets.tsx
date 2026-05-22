"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertCircle,
  Award,
  BarChart3,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  RefreshCw,
  Search,
  Star,
} from "lucide-react"
import { sanitizeDisplayText } from "@/lib/text-sanitize"

interface KnowledgeAssetsProps {
  onNavigate: (page: string) => void
}

interface KnowledgeAsset {
  id: string
  field: string
  title: string
  content: string
  source: string
  source_type: "patent" | "paper" | "template" | "other"
  source_url?: string
  chunk_count: number
  updated_at?: string
  created_at?: string
}

interface KnowledgeStats {
  documents: number
  chunks: number
  documents_without_embedding: number
  chunks_without_embedding: number
  fields: number
  fieldStats?: Array<{ field: string; chunks: number }>
  sourceTypeStats?: Array<{ source_type: string; chunks: number }>
  ingestRuns?: Array<{
    id: string
    type: string
    status: string
    source?: string
    total_documents: number
    total_chunks: number
    started_at: string
    finished_at?: string
  }>
}

const SOURCE_LABELS: Record<string, string> = {
  all: "全部",
  patent: "专利",
  paper: "论文",
  template: "模板",
  other: "其他",
}

const SOURCE_BADGE: Record<string, string> = {
  patent: "bg-blue-100 text-blue-700",
  paper: "bg-emerald-100 text-emerald-700",
  template: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("vast_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function downloadText(filename: string, content: string, type = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("zh-CN")
}

function sourceCount(stats: KnowledgeStats | null, sourceType: string) {
  if (!stats?.sourceTypeStats) return 0
  if (sourceType === "all") return stats.chunks || 0
  return stats.sourceTypeStats.find((item) => item.source_type === sourceType)?.chunks || 0
}

function assetMarkdown(asset: KnowledgeAsset) {
  return `# ${asset.title}

- 领域：${asset.field || "通用"}
- 类型：${SOURCE_LABELS[asset.source_type] || asset.source_type}
- 来源：${asset.source || "-"}
- 链接：${asset.source_url || "-"}
- 分块数：${asset.chunk_count || 0}

## 摘要

${asset.content || "暂无摘要"}
`
}

export function KnowledgeAssets({ onNavigate }: KnowledgeAssetsProps) {
  const [searchKeyword, setSearchKeyword] = useState("")
  const [fieldFilter, setFieldFilter] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [assets, setAssets] = useState<KnowledgeAsset[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<KnowledgeStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<KnowledgeAsset | null>(null)

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const fields = useMemo(() => stats?.fieldStats?.map((item) => item.field).filter(Boolean) || [], [stats])

  const loadAssets = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim())
      if (fieldFilter) params.set("field", fieldFilter)
      if (activeTab !== "all") params.set("sourceType", activeTab)

      const response = await fetch(`/api/ai/rag?${params.toString()}`, {
        headers: getAuthHeaders(),
      })
      const payload = await response.json()
      if (!response.ok || payload.code !== 200) {
        throw new Error(payload.message || "知识资产加载失败")
      }
      const data = payload.data || {}
      const nextAssets = (data.list || []).map((item: KnowledgeAsset) => ({
        ...item,
        field: sanitizeDisplayText(item.field),
        title: sanitizeDisplayText(item.title),
        content: sanitizeDisplayText(item.content),
        source: sanitizeDisplayText(item.source),
      }))
      setAssets(nextAssets)
      setTotal(data.total || 0)
      setStats(data.stats || null)
      if (selected && !nextAssets.some((item: KnowledgeAsset) => item.id === selected.id)) setSelected(null)
    } catch (err: any) {
      setError(err.message || "知识资产加载失败")
    } finally {
      setLoading(false)
    }
  }, [activeTab, fieldFilter, page, searchKeyword, selected])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const exportReport = () => {
    if (!stats) return
    const fieldLines = (stats.fieldStats || [])
      .map((item) => `- ${item.field}: ${item.chunks} chunks`)
      .join("\n")
    const typeLines = (stats.sourceTypeStats || [])
      .map((item) => `- ${SOURCE_LABELS[item.source_type] || item.source_type}: ${item.chunks} chunks`)
      .join("\n")
    const ingestLines = (stats.ingestRuns || [])
      .map((run) => `- ${run.type} / ${run.status}: 文档 ${run.total_documents}, 分块 ${run.total_chunks}`)
      .join("\n")
    downloadText(
      `知识资产分析报告-${new Date().toISOString().slice(0, 10)}.md`,
      `# 知识资产分析报告

## 总览

- 文档数：${stats.documents}
- 分块数：${stats.chunks}
- 领域数：${stats.fields}
- 未向量化文档：${stats.documents_without_embedding}
- 未向量化分块：${stats.chunks_without_embedding}

## 领域分布

${fieldLines || "暂无领域统计"}

## 来源类型

${typeLines || "暂无来源类型统计"}

## 最近导入任务

${ingestLines || "暂无导入记录"}
`
    )
  }

  const exportList = () => {
    if (!assets.length) return
    const header = ["编号", "领域", "类型", "标题", "来源", "分块数", "更新时间"]
    const rows = assets.map((item) => [
      item.id,
      item.field,
      SOURCE_LABELS[item.source_type] || item.source_type,
      item.title,
      item.source,
      String(item.chunk_count || 0),
      formatDate(item.updated_at || item.created_at),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    downloadText(`知识资产清单-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8")
  }

  const applySearch = () => {
    setPage(1)
    loadAssets()
  }

  const getValueBadge = (asset: KnowledgeAsset) => {
    const sourceType = asset.source_type || "other"
    const icon =
      sourceType === "patent" ? <Award className="h-3 w-3 mr-1" /> :
      sourceType === "template" ? <Star className="h-3 w-3 mr-1" /> :
      null
    return (
      <Badge className={`${SOURCE_BADGE[sourceType] || SOURCE_BADGE.other} flex items-center`}>
        {icon}
        {SOURCE_LABELS[sourceType] || sourceType}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">知识资产</h1>
          <p className="text-muted-foreground mt-1">管理 M06 可检索的专利、论文和交底模板知识</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportReport} disabled={!stats} title={!stats ? "统计数据加载后可导出" : "导出知识资产分析报告"}>
            <BarChart3 className="mr-2 h-4 w-4" />
            资产分析报告
          </Button>
          <Button variant="outline" onClick={exportList} disabled={!assets.length} title={!assets.length ? "当前列表无数据可导出" : "导出当前筛选结果"}>
            <Download className="mr-2 h-4 w-4" />
            导出资产清单
          </Button>
          <Button variant="outline" onClick={loadAssets} disabled={loading} title="刷新知识资产列表">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">知识文档</p>
                <p className="text-2xl font-semibold">{stats?.documents ?? "-"}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">检索分块</p>
                <p className="text-2xl font-semibold text-blue-600">{stats?.chunks ?? "-"}</p>
              </div>
              <Layers className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">覆盖领域</p>
                <p className="text-2xl font-semibold text-emerald-600">{stats?.fields ?? "-"}</p>
              </div>
              <Database className="h-8 w-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">待向量化</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {(stats?.documents_without_embedding || 0) + (stats?.chunks_without_embedding || 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value)
                setPage(1)
              }}
            >
              <TabsList className="flex h-auto flex-wrap justify-start">
                {["all", "patent", "paper", "template", "other"].map((value) => (
                  <TabsTrigger key={value} value={value}>
                    {SOURCE_LABELS[value]} ({sourceCount(stats, value)})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={fieldFilter}
                onChange={(event) => {
                  setFieldFilter(event.target.value)
                  setPage(1)
                }}
                title="按领域筛选"
              >
                <option value="">全部领域</option>
                {fields.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              <div className="relative min-w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索标题、来源或内容"
                  className="pl-9"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applySearch()
                  }}
                />
              </div>
              <Button variant="outline" onClick={applySearch} disabled={loading} title="执行当前搜索与筛选">
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">领域</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead className="w-[120px]">类型</TableHead>
                  <TableHead className="w-[260px]">来源</TableHead>
                  <TableHead className="w-[90px] text-right">分块</TableHead>
                  <TableHead className="w-[110px]">更新</TableHead>
                  <TableHead className="w-[120px] text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      正在加载知识资产...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !assets.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      暂无匹配知识资产，可调整筛选条件或运行知识库导入脚本。
                    </TableCell>
                  </TableRow>
                )}
                {!loading && assets.map((item) => (
                  <TableRow key={item.id} className={selected?.id === item.id ? "bg-muted/40" : ""}>
                    <TableCell>
                      <Badge variant="outline">{item.field || "通用"}</Badge>
                    </TableCell>
                    <TableCell className="min-w-[260px]">
                      <div className="font-medium leading-5 break-words">{item.title}</div>
                      <div className="mt-1 line-clamp-2 max-w-[520px] whitespace-normal break-words text-xs text-muted-foreground">
                        {item.content || "暂无摘要"}
                      </div>
                    </TableCell>
                    <TableCell>{getValueBadge(item)}</TableCell>
                    <TableCell className="max-w-[260px] whitespace-normal break-words text-sm text-muted-foreground" title={item.source}>
                      {item.source || "-"}
                    </TableCell>
                    <TableCell className="text-right">{item.chunk_count || 0}</TableCell>
                    <TableCell>{formatDate(item.updated_at || item.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelected(item)}
                          title="查看知识资产详情"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => downloadText(`${item.title || item.id}.md`, assetMarkdown(item))}
                          title="下载该知识资产摘要"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>共 {total} 条，当前第 {page} / {totalPages} 页</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} title={page <= 1 ? "已经是第一页" : "上一页"} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                上一页
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} title={page >= totalPages ? "已经是最后一页" : "下一页"} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-lg">{selected.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.field} · {SOURCE_LABELS[selected.source_type] || selected.source_type} · {selected.chunk_count || 0} 个分块
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.source_url && (
                  <Button variant="outline" size="sm" onClick={() => window.open(selected.source_url, "_blank")} title="打开公开来源链接">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    打开来源
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onNavigate("m09-case-detail")} title="进入知识资产关联视图">
                  <Eye className="mr-2 h-4 w-4" />
                  关联视图
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelected(null)} title="关闭详情">
                  关闭
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-muted/20 p-4 text-sm leading-6 whitespace-pre-wrap break-words">
              {selected.content || "该知识资产暂无摘要内容。"}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
