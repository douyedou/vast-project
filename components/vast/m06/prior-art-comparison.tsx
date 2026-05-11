"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { M06ProgressBar } from "@/components/vast/m06/m06-progress-bar"
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Plus,
} from "lucide-react"

interface PriorArtComparisonProps {
  onBack: () => void
  onNext: () => void
}

const mockPriorArts = [
  {
    id: "CN201234567B",
    title: "一种多模态图像融合识别方法",
    applicant: "A科技公司",
    date: "2024-01-15",
    relevance: 89,
    riskLevel: "high",
    selected: true,
  },
  {
    id: "CN101234567B",
    title: "一种图像识别方法及装置",
    applicant: "B公司",
    date: "2022-03-15",
    relevance: 92,
    riskLevel: "high",
    selected: true,
  },
  {
    id: "CN202345678A",
    title: "轻量化神经网络推理系统",
    applicant: "C研究院",
    date: "2024-02-20",
    relevance: 76,
    riskLevel: "medium",
    selected: false,
  },
]

const mockFeatureComparison = [
  {
    feature: "多模态特征融合算法",
    ourTech: "采用注意力机制的多模态特征融合",
    priorArt1: "简单特征拼接",
    priorArt2: "加权平均融合",
    isDistinct: true,
  },
  {
    feature: "自适应权重调整机制",
    ourTech: "基于场景的动态权重调整",
    priorArt1: "固定权重",
    priorArt2: "手动调整",
    isDistinct: true,
  },
  {
    feature: "轻量化推理优化",
    ourTech: "知识蒸馏+量化压缩",
    priorArt1: "无优化",
    priorArt2: "仅量化",
    isDistinct: true,
  },
  {
    feature: "卷积神经网络结构",
    ourTech: "ResNet-50骨干网络",
    priorArt1: "ResNet-34",
    priorArt2: "VGG-16",
    isDistinct: false,
  },
  {
    feature: "图像预处理",
    ourTech: "标准化+数据增强",
    priorArt1: "标准化",
    priorArt2: "标准化+增强",
    isDistinct: false,
  },
]

export function PriorArtComparison({ onBack, onNext }: PriorArtComparisonProps) {
  const [selectedArt, setSelectedArt] = useState(mockPriorArts[0])

  const distinctFeatures = mockFeatureComparison.filter(f => f.isDistinct)
  const commonFeatures = mockFeatureComparison.filter(f => !f.isDistinct)

  return (
    <div className="flex flex-col h-full">
      {/* M06 Progress Bar */}
      <M06ProgressBar currentStep={6} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[#111827]">现有技术对比</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              对比分析现有技术，确认区别技术特征
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出对比报告
          </Button>
          <Button onClick={onNext}>
            下一步：结构化
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* 左侧：现有技术列表 */}
        <div className="w-80 border-r bg-[#F9FAFB] p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">现有技术 ({mockPriorArts.length})</h3>
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-40px)]">
            <div className="space-y-2">
              {mockPriorArts.map((art) => (
                <div
                  key={art.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedArt.id === art.id
                      ? "bg-white border-2 border-[#2F80ED]"
                      : "bg-white border hover:border-[#2F80ED]/50"
                  }`}
                  onClick={() => setSelectedArt(art)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-[#2F80ED]">{art.id}</span>
                    <Badge
                      variant={
                        art.riskLevel === "high"
                          ? "destructive"
                          : art.riskLevel === "medium"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {art.riskLevel === "high" ? "高" : art.riskLevel === "medium" ? "中" : "低"}
                    </Badge>
                  </div>
                  <div className="text-sm text-[#374151] line-clamp-2">{art.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    相关度 {art.relevance}%
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 右侧：对比详情 */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <Tabs defaultValue="features">
            <TabsList>
              <TabsTrigger value="features">特征对比</TabsTrigger>
              <TabsTrigger value="claims">权利要求对比</TabsTrigger>
              <TabsTrigger value="summary">对比总结</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="mt-4 space-y-4">
              {/* 区别技术特征 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-base">区别技术特征 ({distinctFeatures.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">技术特征</th>
                          <th className="text-left py-2 px-3 font-medium bg-blue-50">本申请</th>
                          <th className="text-left py-2 px-3 font-medium">对比文件1</th>
                          <th className="text-left py-2 px-3 font-medium">对比文件2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distinctFeatures.map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-3 font-medium">{item.feature}</td>
                            <td className="py-3 px-3 bg-blue-50 text-blue-700">{item.ourTech}</td>
                            <td className="py-3 px-3 text-muted-foreground">{item.priorArt1}</td>
                            <td className="py-3 px-3 text-muted-foreground">{item.priorArt2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* 共有技术特征 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-base">共有技术特征 ({commonFeatures.length})</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">技术特征</th>
                          <th className="text-left py-2 px-3 font-medium">本申请</th>
                          <th className="text-left py-2 px-3 font-medium">对比文件1</th>
                          <th className="text-left py-2 px-3 font-medium">对比文件2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commonFeatures.map((item, i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-3 font-medium">{item.feature}</td>
                            <td className="py-3 px-3">{item.ourTech}</td>
                            <td className="py-3 px-3">{item.priorArt1}</td>
                            <td className="py-3 px-3">{item.priorArt2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">权利要求对比分析</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>权利要求对比分析功能正在开发中...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">对比总结</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{distinctFeatures.length}</div>
                      <div className="text-sm text-green-700">区别技术特征</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">{commonFeatures.length}</div>
                      <div className="text-sm text-yellow-700">共有技术特征</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{mockPriorArts.length}</div>
                      <div className="text-sm text-blue-700">对比文件数</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">AI分析结论</h4>
                    <p className="text-sm text-muted-foreground">
                      本申请相对于现有技术具有{distinctFeatures.length}个区别技术特征，
                      主要体现在多模态融合算法、自适应权重调整和轻量化推理优化方面。
                      这些区别特征能够带来明显的技术效果提升，建议继续推进申请。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
