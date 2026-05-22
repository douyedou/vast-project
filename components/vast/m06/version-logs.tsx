"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { M06_SECTION_DEFS, mergeM06Content, sanitizeM06Text } from "@/lib/m06"
import {
  ArrowLeft,
  Clock3,
  GitCompare,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react"

interface VersionLogsProps {
  caseId?: string | null
  onBack?: () => void
  onNavigate?: (page: string) => void
}

function actionLabel(action: string) {
  const m: Record<string, string> = {
    save: "保存草稿", upload: "上传资料", extract: "资料提取",
    decompose: "AI 解构", initialInspection: "AI 初检", supplement: "AI 补全",
    secondSearch: "二次检索", compare: "现有技术对比", relation: "关系建模",
    structure: "事实结构化", innovationIdeas: "创新思路", figure: "主要图生成",
    validate: "完整性校验", package: "数据包生成", submit: "提交 M07", restore: "恢复版本",
  }
  return m[action] || sanitizeM06Text(action) || "版本记录"
}

function formatTime(value?: string) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString("zh-CN", { hour12: false })
}

function summarizeContent(raw: any) {
  if (!raw) return { title: "无数据", stage: "", filledSections: 0, featureCount: 0, figureCount: 0, qualityScore: 0 }
  const c = mergeM06Content(raw)
  return {
    title: c.meta.caseTitle || "未命名",
    stage: c.meta.currentStage || "",
    filledSections: M06_SECTION_DEFS.filter((s) => c.sections[s.key]?.trim()).length,
    featureCount: (c.structure.technicalFeatures || []).length,
    figureCount: (c.figures || []).length,
    qualityScore: c.workflow.qualityScore || c.aiResults.completeness?.score || 0,
  }
}

function buildDiff(a: any, b: any) {
  const ca = mergeM06Content(a)
  const cb = mergeM06Content(b)
  return M06_SECTION_DEFS.map((s) => {
    const at = sanitizeM06Text(ca.sections[s.key])
    const bt = sanitizeM06Text(cb.sections[s.key])
    return { label: s.label, changed: at !== bt, aLen: at.length, bLen: bt.length, aPreview: at.slice(0, 160), bPreview: bt.slice(0, 160) }
  })
}

export function VersionLogs({ caseId, onBack, onNavigate }: VersionLogsProps) {
  const hook = useM06Document(caseId, "VERSION_LOGS")
  const { document, content, versions, loadVersions, restoreVersion, loading, saving, error } = hook
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [initDone, setInitDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      try {
        const list = await loadVersions()
        if (!cancelled && list.length > 0 && !selectedId) {
          setSelectedId(list[0].id)
        }
      } catch { /* ignore */ }
      if (!cancelled) setInitDone(true)
    }
    init()
    return () => { cancelled = true }
  }, [])

  const sel = versions.find((v) => v.id === selectedId) || null

  const curSum = useMemo(() => summarizeContent(content), [content])
  const selSum = useMemo(() => summarizeContent(sel?.content_json), [sel?.content_json])
  const diffs = useMemo(() => (sel?.content_json && content ? buildDiff(content, sel.content_json) : []), [content, sel?.content_json])
  const aiCount = versions.filter((v) => v.action && v.action !== "save").length

  const handleRefresh = async () => {
    const list = await loadVersions()
    if (!selectedId && list.length > 0) setSelectedId(list[0].id)
  }

  const handleRestore = async () => {
    if (!sel?.id) return
    await restoreVersion(sel.id)
    await loadVersions()
  }

  if (loading && !initDone) {
    return (
      <div className="flex flex-col h-full">
        <M06ProgressBar currentStep={12} onStepClick={(_, route) => onNavigate?.(route)} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          <span className="ml-3 text-sm text-[#6B7280]">加载版本记录...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <M06ProgressBar currentStep={12} onStepClick={(_, route) => onNavigate?.(route)} />

      <div className="flex items-center justify-between p-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">版本日志</h1>
            <p className="text-sm text-muted-foreground truncate">查看 M06 保存、AI 生成、提交和恢复历史</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading || saving}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}刷新
          </Button>
          <Button variant="outline" disabled={!sel || saving} onClick={handleRestore}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}恢复版本
          </Button>
        </div>
      </div>

      {error && <div className="mx-4 mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex-1 grid grid-cols-[360px_1fr] gap-4 p-4 overflow-hidden bg-[#F8FAFC]">
        {/* 左侧历史列表 */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-3 shrink-0"><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />历史记录</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 pt-0">
            {versions.length === 0 && initDone ? (
              <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">暂无版本记录。</div>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => {
                  const s = summarizeContent(v.content_json)
                  return (
                    <button key={v.id} type="button" onClick={() => setSelectedId(v.id)}
                      className={`w-full text-left rounded border p-3 transition bg-white hover:border-blue-300 ${sel?.id === v.id ? "border-blue-500 ring-2 ring-blue-100" : "border-[#E5E7EB]"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">v{v.version}</span>
                        <Badge variant={v.action === "save" ? "secondary" : "default"} className="text-[10px]">{actionLabel(v.action)}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{formatTime(v.created_at)}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">章节 {s.filledSections}/6 · 特征 {s.featureCount} · 质量 {s.qualityScore || "-"}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧对比 */}
        <div className="grid grid-rows-[auto_1fr] gap-4 overflow-hidden">
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {[
              ["当前版本", `v${document?.version || "-"}`],
              ["历史记录", String(versions.length)],
              ["AI 动作", String(aiCount)],
              ["选中版本", `v${sel?.version || "-"}`],
            ].map(([label, value]) => (
              <Card key={label}><CardContent className="p-3 text-center"><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-semibold mt-1">{value}</div></CardContent></Card>
            ))}
          </div>

          <Card className="overflow-hidden flex flex-col">
            <CardHeader className="pb-2 shrink-0"><CardTitle className="text-sm flex items-center gap-2"><GitCompare className="h-4 w-4" />版本对比</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-0">
              {!sel ? (
                <div className="p-8 text-center text-sm text-muted-foreground">请从左侧选择一个历史版本</div>
              ) : diffs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">版本内容相同，无差异</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-3 sticky top-0 bg-white py-2">
                    <div className="rounded border bg-[#EFF6FF] p-2 text-xs"><span className="font-medium">当前版本</span> · {curSum.title}</div>
                    <div className="rounded border bg-[#FEF3C7] p-2 text-xs"><span className="font-medium">v{sel.version}</span> · {selSum.title}</div>
                  </div>
                  <div className="space-y-2">
                    {diffs.map((d) => (
                      <div key={d.label} className="rounded border bg-white p-2.5">
                        <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">{d.label}</span><Badge variant={d.changed ? "destructive" : "secondary"} className="text-[10px]">{d.changed ? "有变化" : "相同"}</Badge></div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded bg-[#F0F9FF] p-2"><div className="mb-1 text-[10px] text-muted-foreground">当前 · {d.aLen}字</div><div className="whitespace-pre-wrap break-words">{d.aPreview || "空"}</div></div>
                          <div className="rounded bg-[#FFFBF0] p-2"><div className="mb-1 text-[10px] text-muted-foreground">历史 · {d.bLen}字</div><div className="whitespace-pre-wrap break-words">{d.bPreview || "空"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-3 text-[11px] text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" />AI 操作和保存都会自动记录版本。</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
