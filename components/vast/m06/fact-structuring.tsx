"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Save,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Link,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useM06Document } from "@/hooks/use-m06-document"
import { M06StructureNode } from "@/lib/m06"

interface FactStructuringProps {
  caseId?: string | null
  onBack?: () => void
  onNext?: () => void
}

const NODE_TYPE_CONFIGS = [
  { id: "technical-problem", label: "技术问题节点", color: "bg-red-100 text-red-700" },
  { id: "technical-background", label: "技术背景节点", color: "bg-gray-100 text-gray-700" },
  { id: "technical-solution", label: "技术方案节点", color: "bg-blue-100 text-blue-700" },
  { id: "technical-effect", label: "技术效果节点", color: "bg-green-100 text-green-700" },
  { id: "key-protection", label: "关键保护点节点", color: "bg-purple-100 text-purple-700" },
  { id: "alternative", label: "替代方案节点", color: "bg-orange-100 text-orange-700" },
]

export function FactStructuring({ caseId, onBack, onNext }: FactStructuringProps) {
  const [activeType, setActiveType] = useState("technical-solution")
  const [saving, setSaving] = useState(false)
  const [structuredNodes, setStructuredNodes] = useState<Record<string, M06StructureNode[]>>({})
  const { content, saveContent, runAction, runningAction } = useM06Document(caseId, "STRUCTURE")

  useEffect(() => {
    if (!content) return

    const grouped: Record<string, M06StructureNode[]> = Object.fromEntries(
      NODE_TYPE_CONFIGS.map((t) => [t.id, []])
    )

    if (content.structure.factNodes?.length) {
      content.structure.factNodes.forEach((node, i) => {
        const type = grouped[node.type] ? node.type : "technical-solution"
        grouped[type].push({
          id: node.id || `node-${i + 1}`,
          type: node.type || type,
          content: node.content,
          sourceParaId: node.sourceParaId || `AI-${i + 1}`,
          isCore: Boolean(node.isCore),
          status: node.status || "draft",
        })
      })
      setStructuredNodes(grouped)
      return
    }

    // Seed from sections
    const seedNodes: Record<string, M06StructureNode[]> = {
      "technical-problem": (content.sections.technicalProblem || "").split(/\n|。|；/).filter(Boolean).slice(0, 6).map((c, i) => ({
        id: `tp-${i + 1}`, type: "technical-problem", content: c.trim(), sourceParaId: `P1-S${i + 1}`, isCore: i < 2, status: "draft",
      })),
      "technical-background": (content.sections.backgroundTechnology || "").split(/\n|。|；/).filter(Boolean).slice(0, 6).map((c, i) => ({
        id: `tb-${i + 1}`, type: "technical-background", content: c.trim(), sourceParaId: `P2-S${i + 1}`, isCore: false, status: "draft",
      })),
      "technical-solution": (content.structure.technicalFeatures || []).map((f, i) => ({
        id: `ts-${i + 1}`, type: "technical-solution", content: f, sourceParaId: `P5-S${i + 1}`, isCore: i < 3, status: i < 2 ? "confirmed" : "draft",
      })),
      "technical-effect": (content.sections.beneficialEffects || "").split(/\n|。|；/).filter(Boolean).slice(0, 8).map((c, i) => ({
        id: `te-${i + 1}`, type: "technical-effect", content: c.trim(), sourceParaId: `P7-S${i + 1}`, isCore: i < 2, status: "draft",
      })),
      "key-protection": (content.structure.protectionPoints || []).map((p, i) => ({
        id: `kp-${i + 1}`, type: "key-protection", content: p, sourceParaId: `P6-S${i + 1}`, isCore: i < 3, status: i < 2 ? "confirmed" : "draft",
      })),
      "alternative": (content.structure.alternatives || []).map((a, i) => ({
        id: `alt-${i + 1}`, type: "alternative", content: a, sourceParaId: `P8-S${i + 1}`, isCore: false, status: "draft",
      })),
    }
    setStructuredNodes(seedNodes)
  }, [content])

  const displayNodeTypes = NODE_TYPE_CONFIGS.map((t) => ({ ...t, count: (structuredNodes[t.id] || []).length }))
  const currentNodes = structuredNodes[activeType] || []

  const mutateNodes = (updater: (source: Record<string, M06StructureNode[]>) => Record<string, M06StructureNode[]>) => {
    setStructuredNodes((prev) => updater(prev))
  }

  const handleNodeChange = (node: M06StructureNode, value: string) => {
    mutateNodes((prev) => ({
      ...prev,
      [node.type]: (prev[node.type] || []).map((n) => n.id === node.id ? { ...n, content: value } : n),
    }))
  }

  const handleAddNode = (contentValue = "") => {
    const newNode: M06StructureNode = {
      id: `${activeType}-${Date.now()}`,
      type: activeType,
      content: contentValue || "新节点，请补充事实内容",
      sourceParaId: "manual",
      isCore: false,
      status: "draft",
    }
    mutateNodes((prev) => ({ ...prev, [activeType]: [...(prev[activeType] || []), newNode] }))
  }

  const handleDeleteNode = (node: M06StructureNode) => {
    mutateNodes((prev) => ({ ...prev, [node.type]: (prev[node.type] || []).filter((n) => n.id !== node.id) }))
  }

  const handleToggleCore = (node: M06StructureNode, checked: boolean) => {
    mutateNodes((prev) => ({ ...prev, [node.type]: (prev[node.type] || []).map((n) => n.id === node.id ? { ...n, isCore: checked } : n) }))
  }

  const handleToggleStatus = (node: M06StructureNode) => {
    mutateNodes((prev) => ({ ...prev, [node.type]: (prev[node.type] || []).map((n) =>
      n.id === node.id ? { ...n, status: n.status === "confirmed" ? "draft" : "confirmed" } : n
    ) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (!content) return
      const factNodes = Object.values(structuredNodes).flat()
      await saveContent({ ...content, meta: { ...content.meta, currentStage: "STRUCTURE" }, structure: { ...content.structure, factNodes } })
    } finally { setSaving(false) }
  }

  const handleStructure = async () => {
    await runAction("relation")
  }

  const totalNodes = Object.values(structuredNodes).flat().length
  const confirmedNodes = Object.values(structuredNodes).flat().filter((n) => n.status === "confirmed").length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-lg font-semibold">交底事实结构化</h1>
            <p className="text-sm text-muted-foreground">将交底书内容拆分为可计算、可校验的结构化数据</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "保存中..." : "保存"}</Button>
          <Button variant="outline" onClick={handleStructure} disabled={Boolean(runningAction)}>
            {runningAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {runningAction ? "生成中..." : "AI结构化"}
          </Button>
          <Button onClick={onNext}>下一步：校验<ChevronRight className="h-4 w-4 ml-2" /></Button>
        </div>
      </div>

      <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
        <span className="text-sm">结构化进度</span>
        <span className="text-sm text-muted-foreground">已确认 {confirmedNodes}/{totalNodes} 个节点</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">节点类型</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {displayNodeTypes.map((type) => (
                <button key={type.id} onClick={() => setActiveType(type.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors ${activeType === type.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  <span>{type.label}</span>
                  <Badge variant={activeType === type.id ? "secondary" : "outline"} className="text-xs">{type.count}</Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="font-medium">{displayNodeTypes.find((t) => t.id === activeType)?.label}</h2>
            <Button size="sm" onClick={() => handleAddNode()}><Plus className="h-4 w-4 mr-1" />新增节点</Button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {currentNodes.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <p>暂无节点数据</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => handleAddNode()}>添加第一个节点</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentNodes.map((node) => (
                  <Card key={node.id} className={node.status === "confirmed" ? "border-green-200" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="cursor-move text-muted-foreground hover:text-foreground"><GripVertical className="h-5 w-5" /></div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Textarea value={node.content} onChange={(e) => handleNodeChange(node, e.target.value)} className="min-h-[60px] text-sm" />
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(node)} title={node.status === "confirmed" ? "取消确认" : "确认节点"}>
                                <Link className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteNode(node)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">来源:</span>
                                <Badge variant="outline" className="text-xs">{node.sourceParaId}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox id={`core-${node.id}`} checked={node.isCore} onCheckedChange={(c) => handleToggleCore(node, Boolean(c))} />
                                <label htmlFor={`core-${node.id}`} className="text-xs text-muted-foreground">核心节点</label>
                              </div>
                            </div>
                            <Badge className={node.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                              {node.status === "confirmed" ? <><CheckCircle className="h-3 w-3 mr-1" />已确认</> : <><AlertCircle className="h-3 w-3 mr-1" />待确认</>}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-80 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">节点统计 / AI建议</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">节点统计</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {displayNodeTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{type.label}</span>
                        <Badge className={type.color}>{type.count}</Badge>
                      </div>
                    ))}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center justify-between text-sm font-medium"><span>总计</span><span>{totalNodes} 个节点</span></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-500" />AI建议</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">点击"AI结构化"自动从交底书解构内容中提取事实节点。</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleStructure} disabled={Boolean(runningAction)}>
                    {runningAction ? "结构化中..." : "执行结构化"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
