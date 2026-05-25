"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import { useM06Document } from "@/hooks/use-m06-document"
import { evaluateM06Completeness } from "@/lib/m06"
import { buildM06ReportMarkdown } from "@/lib/m06-ai"
import { downloadText } from "@/components/vast/m06/m06-page-utils"
import {
  ArrowLeft,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileJson,
  Database,
  ChevronRight,
  Copy,
} from "lucide-react"

interface DisclosurePackageProps {
  caseId?: string | null
  onNavigate?: (page: string) => void
  onBack?: () => void
  onNext?: () => void
}

function buildWordHtml(pkg: any, md: string, mermaidFigs: any[]): string {
  const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

  const sections = [
    { title: "一、基本信息", rows: [
      ["文档编号", pkg.docId], ["版本", pkg.version], ["生成时间", pkg.generatedAt],
      ["质量评分", `${pkg.qualityScore.overall}/100`], ["是否就绪", pkg.qualityScore.overall >= 70 ? "是" : "否"],
    ]},
    { title: "二、技术问题", text: pkg.technicalProblem },
    { title: "三、技术背景", text: pkg.technicalBackground },
    { title: "四、技术方案", text: pkg.technicalSolution },
    { title: "五、技术特征", items: pkg.technicalFeatures.map((f: any) => `${f.distinguishing ? "【区别】" : ""}${f.name}`) },
    { title: "六、技术效果", items: pkg.technicalEffects },
    { title: "七、关键保护点", items: pkg.protectionPoints },
    { title: "八、替代方案",
      table: {
        headers: ["原技术特征", "替代方案", "等同效果", "风险提示"],
        rows: pkg.alternativeSolutions.map((a: any) => [
          a.originalFeature || a.name,
          a.alternative || a.name,
          a.equivalence || "可作为等同替代",
          a.risk || "需结合二次检索结果复核",
        ]),
      },
    },
    { title: "九、术语映射",
      table: {
        headers: ["原始术语", "标准术语", "撰写术语"],
        rows: pkg.terminologyMapping.map((t: any) => [t.original, t.standard, t.writing]),
      },
    },
    { title: "十、附图说明",
      text: pkg.figures.length > 0
        ? pkg.figures.map((f: any) => `${f.id}: ${f.title}`).join("\n")
        : "暂无附图",
    },
  ]

  // 追加 Mermaid 图草稿
  const mermaidFigures = mermaidFigs || []
  if (mermaidFigures.length > 0) {
    const figSection: any = { title: "十一、主要附图草稿（Mermaid）" }
    let figHtml = ""
    for (const fig of mermaidFigures) {
      figHtml += `<h3>${esc(fig.title)}（${esc(fig.type)}）</h3>`
      figHtml += `<p style="text-indent:2em;margin-bottom:4pt;">${esc(fig.description)}</p>`
      figHtml += `<pre style="background:#f9f9f9;border:1px solid #ddd;padding:8pt;font-family:'Courier New',monospace;font-size:9pt;white-space:pre-wrap;margin-bottom:12pt;">${esc(fig.mermaid)}</pre>`
    }
    sections.push({ ...figSection, _html: figHtml })
  }

  let body = ""
  for (const sec of sections) {
    if ((sec as any)._html) {
      body += (sec as any)._html
      continue
    }
    body += `<h2>${esc(sec.title)}</h2>`
    if (sec.rows) {
      body += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:12pt;">`
      for (const [k, v] of sec.rows) {
        body += `<tr><td style="width:30%;background:#f5f5f5;font-weight:bold;">${esc(k)}</td><td>${esc(v)}</td></tr>`
      }
      body += `</table>`
    }
    if (sec.table) {
      body += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:12pt;">`
      body += `<tr>${sec.table.headers.map((h: string) => `<th style="background:#f5f5f5;text-align:left;">${esc(h)}</th>`).join("")}</tr>`
      for (const row of sec.table.rows) {
        body += `<tr>${row.map((cell: string) => `<td>${esc(cell)}</td>`).join("")}</tr>`
      }
      body += `</table>`
    }
    if (sec.text) {
      body += `<p style="text-indent:2em;line-height:2;margin-bottom:8pt;">${esc(sec.text)}</p>`
    }
    if (sec.items?.length) {
      body += `<ul style="line-height:2;">${sec.items.map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>`
    }
  }

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>M06交底书数据包</title>
<style>
body{font-family:'SimSun','Microsoft YaHei',sans-serif;font-size:12pt;line-height:1.8;padding:2cm;color:#333;}
h1{font-size:18pt;text-align:center;margin-bottom:24pt;border-bottom:2px solid #333;padding-bottom:12pt;}
h2{font-size:14pt;margin-top:18pt;margin-bottom:10pt;}
table{width:100%;border-collapse:collapse;margin-bottom:12pt;}
table td{padding:6px 8px;border:1px solid #999;font-size:11pt;}
ul{margin-left:1.5em;}
li{margin-bottom:4pt;}
</style></head>
<body>
<h1>M06 交底书数据包</h1>
${body}
<p style="text-align:center;color:#999;margin-top:36pt;">— 由 M06 交底书引擎自动生成 —</p>
</body></html>`
}

export function DisclosurePackage({ caseId, onNavigate, onBack, onNext }: DisclosurePackageProps) {
  const [packageReady, setPackageReady] = useState(false)
  const { content, document: disclosureDoc, runAction, runningAction } = useM06Document(caseId, "PACKAGE")
  const validation = content?.aiResults.completeness || (content ? evaluateM06Completeness(content) : null)

  useEffect(() => {
    setPackageReady(Boolean(content?.aiResults.package))
  }, [content?.aiResults.package])

  const lines = (text?: string) => (text || "").split(/\n|；|;|。/).map((s) => s.trim()).filter(Boolean)

  const packageData = content ? {
    docId: disclosureDoc?.id || "M06",
    version: String(disclosureDoc?.version || "1"),
    generatedAt: content.aiResults.package?.generatedAt || disclosureDoc?.updated_at || "",
    technicalProblem: content.sections.technicalProblem || "未填写",
    technicalBackground: content.sections.backgroundTechnology || "未填写",
    technicalSolution: content.sections.technicalSolution || "未填写",
    technicalFeatures: (content.structure.technicalFeatures || []).map((name, i) => ({
      id: `F${String(i + 1).padStart(3, "0")}`,
      name,
      description: name,
      status: "confirmed",
      distinguishing: content.structure.distinguishingFeatures.includes(name),
    })),
    actionRelationships: (content.structure.relations || []).map((rel, i) => ({
      id: `R${String(i + 1).padStart(3, "0")}`,
      from: `F${String(i + 1).padStart(3, "0")}`,
      to: `F${String(i + 2).padStart(3, "0")}`,
      relation: rel,
      result: rel,
    })),
    technicalEffects: lines(content.sections.beneficialEffects),
    protectionPoints: content.structure.protectionPoints || [],
    alternativeSolutions: (content.structure.alternatives || []).map((alt, i) => ({
      name: alt,
      originalFeature: (content.structure.technicalFeatures || [])[i] || "相关技术特征",
      alternative: alt,
      equivalence: "可作为同等或近似技术效果的替代方案",
      risk: "需结合二次检索结果复核",
    })),
    terminologyMapping: Object.entries(content.structure.terminology || {}).map(([original, writing]) => ({
      original, standard: writing, writing, confirmed: true,
    })),
    figures: lines(content.sections.drawings).map((title, i) => ({ id: `FIG${i + 1}`, title, labels: [] })),
    qualityScore: {
      completeness: validation?.score || 0,
      overall: validation?.score || content.workflow.qualityScore || 0,
    },
  } : null

  const handleGeneratePackage = async () => {
    await runAction("package")
    setPackageReady(true)
  }

  const buildJson = () => JSON.stringify(packageData, null, 2)

  const handleExportJson = () => {
    downloadText(`${disclosureDoc?.id || "M06"}-数据包.json`, buildJson(), "application/json;charset=utf-8")
  }

  const handleExportMarkdown = () => {
    const md = content?.aiResults.package?.markdown || (content ? buildM06ReportMarkdown(content, "M06提交M07数据包") : buildJson())
    downloadText(`${disclosureDoc?.id || "M06"}-数据包.md`, md, "text/markdown;charset=utf-8")
  }

  const handleExportDocx = () => {
    if (!packageData) return
    const md = content?.aiResults.package?.markdown || (content ? buildM06ReportMarkdown(content, "M06提交M07数据包") : buildJson())
    const html = buildWordHtml(packageData, md, content?.figures || [])
    const blob = new Blob(["\ufeff" + html], { type: "application/msword;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement("a")
    a.href = url
    a.download = `${disclosureDoc?.id || "M06"}-数据包.doc`
    window.document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleCopyJson = async () => { await navigator.clipboard.writeText(buildJson()) }

  if (!packageData) {
    return (
      <div className="flex flex-col h-full">
        <M06ProgressBar currentStep={10} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center"><p className="text-sm text-muted-foreground">正在加载数据...</p></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <M06ProgressBar currentStep={10} />

      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-lg font-semibold">可撰写数据包预览</h1>
            <p className="text-sm text-muted-foreground">预览提交给M07的完整交底数据包</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGeneratePackage} disabled={Boolean(runningAction)}>
            <RefreshCw className="h-4 w-4 mr-2" />{runningAction === "package" ? "生成中..." : "重新生成"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson}><Download className="h-4 w-4 mr-2" />JSON</Button>
          <Button variant="outline" size="sm" onClick={handleExportMarkdown}><Download className="h-4 w-4 mr-2" />Markdown</Button>
          <Button variant="outline" size="sm" onClick={handleExportDocx}><Download className="h-4 w-4 mr-2" />Word</Button>
          {packageReady ? (
            <Button onClick={onNext} className="gap-2"><CheckCircle className="h-4 w-4" />确认就绪<ChevronRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={handleGeneratePackage} disabled={Boolean(runningAction)} className="gap-2">
              <AlertTriangle className="h-4 w-4" />{runningAction === "package" ? "生成中" : "生成数据包"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-4 px-6 py-4">
        <Card className="w-64 flex flex-col shrink-0">
          <CardHeader className="pb-3 shrink-0"><CardTitle className="text-sm">数据包目录</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-1 text-sm">
              {[
                { icon: FileJson, label: "元数据" }, { icon: Database, label: "技术问题" }, { icon: Database, label: "技术背景" },
                { icon: Database, label: "技术方案" }, { icon: Database, label: `技术特征 (${packageData.technicalFeatures.length})` },
                { icon: Database, label: `作用关系 (${packageData.actionRelationships.length})` }, { icon: Database, label: "技术效果" },
                { icon: Database, label: "关键保护点" }, { icon: Database, label: `替代方案 (${packageData.alternativeSolutions.length})` },
                { icon: Database, label: `术语映射 (${packageData.terminologyMapping.length})` }, { icon: Database, label: `图纸 (${packageData.figures.length})` },
                { icon: Database, label: "质量评分" },
              ].map((item, i) => (
                <div key={i} className="py-1.5 px-2 hover:bg-muted rounded cursor-pointer flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /><span className="text-xs truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mb-3 shrink-0 flex-wrap">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="features">技术特征</TabsTrigger>
              <TabsTrigger value="protection">保护点</TabsTrigger>
              <TabsTrigger value="alternatives">替代方案</TabsTrigger>
              <TabsTrigger value="json">JSON预览</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">核心内容</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">技术问题</div>
                        <div className="text-foreground whitespace-pre-wrap break-words leading-relaxed">{packageData.technicalProblem}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">技术方案</div>
                        <div className="text-foreground whitespace-pre-wrap break-words leading-relaxed">{packageData.technicalSolution}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">技术背景</div>
                        <div className="text-foreground whitespace-pre-wrap break-words leading-relaxed">{packageData.technicalBackground}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">关键指标</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">技术特征数</span><Badge>{packageData.technicalFeatures.length}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">作用关系数</span><Badge>{packageData.actionRelationships.length}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">区别特征数</span><Badge>{packageData.technicalFeatures.filter((f) => f.distinguishing).length}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">替代方案数</span><Badge>{packageData.alternativeSolutions.length}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">质量评分</span><Badge className="bg-green-100 text-green-700">{packageData.qualityScore.overall}/100</Badge></div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="features" className="mt-0">
                {packageData.technicalFeatures.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">暂无技术特征数据</p>
                ) : (
                  <div className="space-y-2">
                    {packageData.technicalFeatures.map((f) => (
                      <Card key={f.id}><CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0"><div className="font-medium break-words">{f.name}</div></div>
                          <div className="flex gap-1 shrink-0 ml-2">{f.distinguishing && <Badge className="bg-purple-100 text-purple-700">区别特征</Badge>}<Badge variant="outline" className="text-xs">{f.status}</Badge></div>
                        </div>
                      </CardContent></Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="protection" className="mt-0">
                <div className="space-y-2">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">关键保护点</CardTitle></CardHeader>
                    <CardContent>
                      {packageData.protectionPoints.length === 0 ? (
                        <p className="text-sm text-muted-foreground">暂无保护点</p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {packageData.protectionPoints.map((p, i) => (
                            <li key={i} className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" /><span>{p}</span></li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">技术效果</CardTitle></CardHeader>
                    <CardContent>
                      {packageData.technicalEffects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">暂无效果数据</p>
                      ) : (
                        <ul className="space-y-1 text-sm">{packageData.technicalEffects.map((e, i) => <li key={i} className="flex items-start gap-2"><span className="text-green-600">✓</span><span>{e}</span></li>)}</ul>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alternatives" className="mt-0">
                {packageData.alternativeSolutions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">暂无替代方案</p>
                ) : (
                  <div className="space-y-2">
                    {packageData.alternativeSolutions.map((alt, i) => (
                      <Card key={i}><CardContent className="pt-4">
                        <div className="space-y-2 text-sm">
                          <div className="font-medium">{alt.name}</div>
                          <div className="text-muted-foreground"><div>等同性：{alt.equivalence}</div></div>
                        </div>
                      </CardContent></Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="json" className="mt-0">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">JSON结构预览</CardTitle>
                      <Button size="sm" variant="ghost" onClick={handleCopyJson}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                      <pre>{JSON.stringify({
                        doc_id: packageData.docId,
                        version: packageData.version,
                        technical_features: packageData.technicalFeatures.length,
                        action_relationships: packageData.actionRelationships.length,
                        distinguishing_features: packageData.technicalFeatures.filter((f) => f.distinguishing).length,
                        protection_points: packageData.protectionPoints.length,
                        alternative_solutions: packageData.alternativeSolutions.length,
                        figures: packageData.figures.length,
                        quality_score: packageData.qualityScore.overall,
                        ready_for_m07: validation?.passed || false,
                      }, null, 2)}</pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <Card className="w-72 flex flex-col shrink-0">
          <CardHeader className="pb-3 shrink-0"><CardTitle className="text-sm">M07使用映射</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2">
            {[
              { m06: `技术特征 (${packageData.technicalFeatures.length})`, m07: "权利要求撰写", status: packageData.technicalFeatures.length > 0 ? "ready" : "pending" },
              { m06: `区别特征 (${packageData.technicalFeatures.filter((f) => f.distinguishing).length})`, m07: "从权撰写", status: "ready" },
              { m06: `替代方案 (${packageData.alternativeSolutions.length})`, m07: "从权撰写", status: "ready" },
              { m06: "关键保护点", m07: "独立权利要求", status: packageData.protectionPoints.length > 0 ? "ready" : "pending" },
              { m06: "技术效果", m07: "效果描述", status: packageData.technicalEffects.length > 0 ? "ready" : "pending" },
              { m06: `图纸 (${packageData.figures.length})`, m07: "说明书图纸", status: "ready" },
              { m06: `术语映射 (${packageData.terminologyMapping.length})`, m07: "撰写术语", status: "ready" },
              { m06: "质量评分", m07: "质量审核", status: packageData.qualityScore.overall >= 70 ? "ready" : "review" },
            ].map((mapping, i) => (
              <div key={i} className="p-2 border rounded text-xs">
                <div className="font-medium text-foreground">{mapping.m06}</div>
                <div className="text-muted-foreground mt-0.5">→ {mapping.m07}</div>
                <Badge variant="outline" className={`mt-1 text-xs ${mapping.status === "ready" ? "bg-green-50 text-green-700" : mapping.status === "review" ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-700"}`}>
                  {mapping.status === "ready" ? "已就绪" : mapping.status === "review" ? "待审核" : "待处理"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {!packageReady && (
        <div className="px-6 py-3 bg-blue-50 border-t shrink-0">
          <Alert className="bg-transparent border-0 p-0">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-700">点击「生成数据包」确认数据就绪后提交至M07。</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
