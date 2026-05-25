"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useM06Document } from "@/hooks/use-m06-document"
import {
  ArrowLeft,
  Save,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  Link2,
  Tag,
  Image,
  Network,
  Sparkles,
  Loader2,
} from "lucide-react"

interface RelationModelingProps {
  caseId?: string | null
  onBack?: () => void
  onNext?: () => void
}

export function RelationModeling({ caseId, onBack, onNext }: RelationModelingProps) {
  const [activeTab, setActiveTab] = useState("features")
  const [saving, setSaving] = useState(false)
  const { content, saveContent, runAction, runningAction } = useM06Document(caseId, "RELATE")

  const technicalFeatures = (content?.structure.technicalFeatures || []).map((name, i) => ({
    id: `f${i + 1}`,
    name,
    isCore: content?.structure.protectionPoints?.includes(name) || i < 3,
    drawingRef: "-",
  }))

  const relations = (content?.structure.relations || []).map((relation, i) => ({
    id: `r${i + 1}`,
    subject: relation.split(/[，,]/)[0] || "技术特征",
    object: "相关对象",
    action: relation,
    stateChange: "形成技术效果",
    result: relation,
  }))

  const alternatives = (content?.structure.alternatives || []).map((alternative, i) => ({
    id: `a${i + 1}`,
    originalFeature: technicalFeatures[i]?.name || "技术特征",
    alternative,
    equivalentEffect: "实现等同或相近技术效果",
    suggestClaim: content?.structure.protectionPoints?.includes(alternative) || false,
  }))

  const terminology = content?.structure.terminology || {}
  const termMappings = Object.entries(terminology).map(([original, writing], i) => ({
    id: `t${i + 1}`,
    original,
    standard: writing,
    writing,
    confirmed: true,
  }))

  const effectBindings = (content?.sections.beneficialEffects || "")
    .split(/\n|；|;|。/)
    .filter((line) => line.trim())
    .map((line, i) => ({
      id: `e${i + 1}`,
      effectName: line.trim().slice(0, 40),
      effectDesc: line.trim(),
      supportFeatures: technicalFeatures.slice(0, 3).map((f) => f.name),
      supportRelations: relations.slice(0, 2).map((r) => r.id),
    }))

  const drawingLabels = (content?.sections.drawings || "")
    .split(/\n/)
    .filter((line) => line.trim())
    .map((line, i) => ({
      id: `d${i + 1}`,
      figNo: `图${i + 1}`,
      figName: line.trim().slice(0, 30),
      label: `${(i + 1) * 100 + 1}`,
      partName: line.trim(),
      featureRef: technicalFeatures[i]?.id || "f1",
    }))

  const handleSave = async () => {
    setSaving(true)
    try {
      if (content) await saveContent({ ...content, meta: { ...content.meta, currentStage: "RELATE" } })
    } finally { setSaving(false) }
  }

  const handleGenerateRelations = async () => {
    await runAction("relation")
  }

  const commitStructure = async (patch: Record<string, any>) => {
    if (!content) return
    await saveContent({ ...content, meta: { ...content.meta, currentStage: "RELATE" }, structure: { ...content.structure, ...patch } })
  }

  const handleAddCurrent = async () => {
    if (activeTab === "features") {
      const value = window.prompt("请输入技术特征名称")
      if (value?.trim()) await commitStructure({ technicalFeatures: [...technicalFeatures.map((f) => f.name), value.trim()] })
      return
    }
    if (activeTab === "relations") {
      const value = window.prompt("请输入作用关系描述")
      if (value?.trim()) await commitStructure({ relations: [...relations.map((r) => r.result), value.trim()] })
      return
    }
    if (activeTab === "alternatives") {
      const value = window.prompt("请输入替代方案")
      if (value?.trim()) await commitStructure({ alternatives: [...alternatives.map((a) => a.alternative), value.trim()] })
      return
    }
    if (activeTab === "terms") {
      const original = window.prompt("请输入原始术语")
      if (!original?.trim()) return
      const standard = window.prompt("请输入撰写术语或标准术语", original.trim())
      await commitStructure({ terminology: { ...terminology, [original.trim()]: standard?.trim() || original.trim() } })
      return
    }
    if (activeTab === "drawings") {
      await runAction("figure")
      return
    }
    const value = window.prompt("请输入技术效果说明")
    if (value?.trim() && content) {
      await saveContent({ ...content, sections: { ...content.sections, beneficialEffects: [content.sections.beneficialEffects, value.trim()].filter(Boolean).join("\n\n") } })
    }
  }

  const handleEditFeature = async (feature: typeof technicalFeatures[number]) => {
    const value = window.prompt("编辑技术特征", feature.name)
    if (!value?.trim()) return
    await commitStructure({ technicalFeatures: technicalFeatures.map((f) => (f.id === feature.id ? value.trim() : f.name)) })
  }

  const handleDeleteFeature = async (feature: typeof technicalFeatures[number]) => {
    await commitStructure({ technicalFeatures: technicalFeatures.filter((f) => f.id !== feature.id).map((f) => f.name) })
  }

  const handleToggleFeatureCore = async (feature: typeof technicalFeatures[number], checked: boolean) => {
    const existing = content?.structure.protectionPoints || []
    await commitStructure({
      protectionPoints: checked ? Array.from(new Set([...existing, feature.name])) : existing.filter((p) => p !== feature.name),
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-lg font-semibold">技术方案关系建模</h1>
            <p className="text-sm text-muted-foreground">建立技术特征、作用关系、效果、替代方案之间的关系</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "保存中..." : "保存"}</Button>
          <Button variant="outline" onClick={handleGenerateRelations} disabled={Boolean(runningAction)}>
            {runningAction === "relation" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {runningAction === "relation" ? "生成中..." : "AI生成关系"}
          </Button>
          <Button onClick={onNext}>下一步：结构化<ChevronRight className="h-4 w-4 ml-2" /></Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">关系建模步骤</h2></div>
          <div className="p-2 space-y-1">
            {[
              { id: "features", label: "技术特征管理", icon: Network, count: technicalFeatures.length },
              { id: "relations", label: "作用关系管理", icon: ArrowRight, count: relations.length },
              { id: "effects", label: "技术效果绑定", icon: Link2, count: effectBindings.length },
              { id: "alternatives", label: "替代方案管理", icon: Sparkles, count: alternatives.length },
              { id: "terms", label: "术语映射", icon: Tag, count: termMappings.length },
              { id: "drawings", label: "附图标号", icon: Image, count: drawingLabels.length },
            ].map((step) => (
              <button key={step.id} onClick={() => setActiveTab(step.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${activeTab === step.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <step.icon className="h-4 w-4" />
                <span className="flex-1 truncate">{step.label}</span>
                <Badge variant={activeTab === step.id ? "secondary" : "outline"} className="text-xs">{step.count}</Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
              <TabsList className="bg-transparent p-0 h-auto">
                <TabsTrigger value="features" className="data-[state=active]:bg-background">技术特征</TabsTrigger>
                <TabsTrigger value="relations" className="data-[state=active]:bg-background">作用关系</TabsTrigger>
                <TabsTrigger value="effects" className="data-[state=active]:bg-background">效果绑定</TabsTrigger>
                <TabsTrigger value="alternatives" className="data-[state=active]:bg-background">替代方案</TabsTrigger>
                <TabsTrigger value="terms" className="data-[state=active]:bg-background">术语映射</TabsTrigger>
                <TabsTrigger value="drawings" className="data-[state=active]:bg-background">附图标号</TabsTrigger>
              </TabsList>
              <Button size="sm" onClick={handleAddCurrent} disabled={Boolean(runningAction)}><Plus className="h-4 w-4 mr-1" />新增</Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                <TabsContent value="features" className="mt-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>特征名称</TableHead><TableHead>是否核心</TableHead><TableHead>关联附图</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {technicalFeatures.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">暂无技术特征，请先进行AI解构或手动添加</TableCell></TableRow>
                      ) : technicalFeatures.map((feature) => (
                        <TableRow key={feature.id}>
                          <TableCell className="font-medium">{feature.name}</TableCell>
                          <TableCell><Checkbox checked={feature.isCore} onCheckedChange={(c) => handleToggleFeatureCore(feature, Boolean(c))} /></TableCell>
                          <TableCell><Badge variant="secondary">{feature.drawingRef}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditFeature(feature)}>编辑</Button>
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteFeature(feature)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="relations" className="mt-0 space-y-4">
                  {relations.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">暂无作用关系，点击"新增"或"AI生成关系"添加</div>
                  ) : relations.map((rel) => (
                    <Card key={rel.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-blue-100 text-blue-700">{rel.subject}</Badge><ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-purple-100 text-purple-700">{rel.object}</Badge><ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-green-100 text-green-700">{rel.action}</Badge><ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-orange-100 text-orange-700">{rel.stateChange}</Badge><ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge className="bg-cyan-100 text-cyan-700">{rel.result}</Badge>
                          <div className="ml-auto flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {
                              const v = window.prompt("编辑作用关系", rel.result)
                              if (v?.trim()) commitStructure({ relations: relations.map((r) => (r.id === rel.id ? v.trim() : r.result)) })
                            }}>编辑</Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => commitStructure({ relations: relations.filter((r) => r.id !== rel.id).map((r) => r.result) })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="effects" className="mt-0 space-y-4">
                  {effectBindings.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">暂无技术效果数据，请在交底书中填写有益效果</div>
                  ) : effectBindings.map((effect) => (
                    <Card key={effect.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{effect.effectName}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {
                              const v = window.prompt("编辑技术效果", effect.effectDesc)
                              if (v?.trim() && content) saveContent({ ...content, sections: { ...content.sections, beneficialEffects: effectBindings.map((e) => (e.id === effect.id ? v.trim() : e.effectDesc)).join("\n") } })
                            }}>编辑</Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => {
                              if (!content) return
                              saveContent({ ...content, sections: { ...content.sections, beneficialEffects: effectBindings.filter((e) => e.id !== effect.id).map((e) => e.effectDesc).join("\n") } })
                            }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{effect.effectDesc}</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground">支撑特征：</span>
                          {effect.supportFeatures.map((f, i) => <Badge key={i} variant="outline">{f}</Badge>)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="alternatives" className="mt-0">
                  {alternatives.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">暂无替代方案，点击"新增"添加</div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow><TableHead>原技术特征</TableHead><TableHead>替代方案</TableHead><TableHead>等同效果</TableHead><TableHead>建议从权</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {alternatives.map((alt) => (
                          <TableRow key={alt.id}>
                            <TableCell className="font-medium">{alt.originalFeature}</TableCell>
                            <TableCell>{alt.alternative}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{alt.equivalentEffect}</TableCell>
                            <TableCell>
                              <Checkbox checked={alt.suggestClaim} onCheckedChange={(c) => {
                                const existing = content?.structure.protectionPoints || []
                                commitStructure({ protectionPoints: c ? Array.from(new Set([...existing, alt.alternative])) : existing.filter((p) => p !== alt.alternative) })
                              }} />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  const v = window.prompt("编辑替代方案", alt.alternative)
                                  if (v?.trim()) commitStructure({ alternatives: alternatives.map((a) => (a.id === alt.id ? v.trim() : a.alternative)) })
                                }}>编辑</Button>
                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => commitStructure({ alternatives: alternatives.filter((a) => a.id !== alt.id).map((a) => a.alternative) })}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="terms" className="mt-0">
                  {termMappings.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">暂无术语映射，点击"新增"添加</div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow><TableHead>原始术语</TableHead><TableHead>标准术语</TableHead><TableHead>撰写术语</TableHead><TableHead>确认状态</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {termMappings.map((term) => (
                          <TableRow key={term.id}>
                            <TableCell>{term.original}</TableCell>
                            <TableCell>{term.standard}</TableCell>
                            <TableCell className="font-medium">{term.writing}</TableCell>
                            <TableCell><Badge className={term.confirmed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{term.confirmed ? "已确认" : "待确认"}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  const next = { ...terminology }
                                  if (term.confirmed) delete next[term.original]; else next[term.original] = term.writing
                                  commitStructure({ terminology: next })
                                }}>{term.confirmed ? "取消" : "确认"}</Button>
                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { const next = { ...terminology }; delete next[term.original]; commitStructure({ terminology: next }) }}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="drawings" className="mt-0">
                  {drawingLabels.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">暂无附图标号，请填写附图说明或点击"新增"生成</div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow><TableHead>图号</TableHead><TableHead>图名</TableHead><TableHead>标号</TableHead><TableHead>部件名称</TableHead><TableHead>关联特征</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {drawingLabels.map((label) => (
                          <TableRow key={label.id}>
                            <TableCell><Badge variant="outline">{label.figNo}</Badge></TableCell>
                            <TableCell>{label.figName}</TableCell>
                            <TableCell className="font-mono font-medium">{label.label}</TableCell>
                            <TableCell>{label.partName}</TableCell>
                            <TableCell><Badge variant="secondary">{technicalFeatures.find((f) => f.id === label.featureRef)?.name || "-"}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => { const v = window.prompt("编辑附图说明", `${label.figNo} ${label.figName}`); if (v?.trim() && content) saveContent({ ...content, sections: { ...content.sections, drawings: [content.sections.drawings, v.trim()].filter(Boolean).join("\n") } }) }}>编辑</Button>
                                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if (!content) return; saveContent({ ...content, sections: { ...content.sections, drawings: content.sections.drawings.split("\n").filter((l) => !l.includes(label.label)).join("\n") } }) }}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <div className="w-72 border-l flex flex-col">
          <div className="p-3 border-b bg-muted/30"><h2 className="font-medium text-sm">关系图 / 校验提示</h2></div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">关系图</CardTitle></CardHeader>
                <CardContent className="p-2">
                  {relations.length === 0 ? (
                    <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground"><Network className="h-6 w-6 mx-auto mb-1" /><p className="text-xs">暂无关系数据，点击「AI生成关系」创建</p></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-muted/30 rounded-lg p-3 border">
                        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                          {relations.map((rel, i) => (
                            <div key={rel.id} className="flex items-center gap-1.5 text-[11px] p-1.5 bg-white rounded border">
                              <Badge className="text-[9px] bg-blue-100 text-blue-700 h-5">{rel.subject.slice(0, 8)}</Badge>
                              <span className="text-[#9CA3AF] font-bold">→</span>
                              <Badge className="text-[9px] bg-green-100 text-green-700 h-5">{rel.action.slice(0, 12)}</Badge>
                              {i < relations.length - 1 && <span className="text-[#9CA3AF] ml-auto text-[9px]">↓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button variant="link" size="sm" className="h-6 px-0 text-[11px]" onClick={() => setActiveTab("relations")}>查看并编辑关系列表</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="pb-2"><CardTitle className="text-sm">校验提示</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {technicalFeatures.filter((f) => f.drawingRef === "-").length > 0 && (
                    <div className="p-2 bg-background rounded border text-sm">
                      <span className="text-yellow-600 font-medium">提示：</span>
                      <span className="text-muted-foreground">{technicalFeatures.filter((f) => f.drawingRef === "-").length} 个特征未关联附图标号</span>
                    </div>
                  )}
                  {technicalFeatures.length === 0 && (
                    <div className="p-2 bg-background rounded border text-sm">
                      <span className="text-yellow-600 font-medium">提示：</span>
                      <span className="text-muted-foreground">暂无技术特征，请先进行AI解构</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
