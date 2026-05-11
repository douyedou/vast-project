'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FileText, ChevronDown, ChevronLeft, CheckCircle, AlertCircle, BookOpen, AlertTriangle,
} from 'lucide-react'

interface DisclosureReviewPageProps {
  onNavigate?: (page: string) => void
}

export function DisclosureReviewPage({ onNavigate }: DisclosureReviewPageProps) {
  const [expandedSections, setExpandedSections] = useState(['section-1'])
  const [activeSection, setActiveSection] = useState('section-1')

  const disclosureSections = [
    { id: 'section-1', title: '技术问题', complete: true, content: '申请人发现了X类设备在Y场景下的Z问题，现有方案存在识别精度低、功耗大等不足。' },
    { id: 'section-2', title: '技术背景', complete: true, content: '现有的A技术存在B缺陷，导致C后果，相关技术文献D、E、F表明此问题长期存在。' },
    { id: 'section-3', title: '现有技术缺点', complete: true, content: '现有方案采用传统CNN模型，存在以下缺点：1.实时性不足；2.边缘部署困难；3.功耗过高。' },
    { id: 'section-4', title: '发明目的', complete: true, content: '本发明旨在解决上述问题，提供一种低功耗、高精度的智能人体识别装置及方法。' },
    { id: 'section-5', title: '技术方案', complete: true, content: '本发明采用以下技术方案：采用轻量化神经网络G方法，结合红外传感器阵列实现实时识别。' },
    { id: 'section-6', title: '关键保护点', complete: true, content: '本发明的关键保护点为：轻量化神经网络结构、红外传感器阵列布局、自适应功耗控制算法。' },
    { id: 'section-7', title: '有益效果', complete: true, content: '本发明相比现有技术的优点：识别精度提升35%，功耗降低60%，可实现边缘实时部署。' },
    { id: 'section-8', title: '实际产品', complete: false, content: '' },
  ]

  const reviewChecklist = [
    { item: '是否有技术问题', status: true },
    { item: '是否有技术背景', status: true },
    { item: '是否有现有技术缺点', status: true },
    { item: '是否有发明目的', status: true },
    { item: '是否有完整技术方案', status: true },
    { item: '是否有关键保护点', status: true },
    { item: '是否有有益效果', status: true },
    { item: '是否有实际产品说明', status: false },
    { item: '是否有图纸材料', status: true },
  ]

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" className="text-[#9CA3AF] h-7 px-2 -ml-2"
              onClick={() => onNavigate?.('m08-task-detail')}>
              <ChevronLeft className="w-4 h-4 mr-1" />审核任务详情
            </Button>
          </div>
          <h1 className="text-xl font-semibold text-[#111827]">交底书审核</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">审核M06交底书的完整性和质量</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-[#E5E9F0] text-[#374151] h-8 text-xs">运行交底审核</Button>
          <Button variant="outline" size="sm" className="border-[#E5E9F0] text-[#374151] h-8 text-xs">新增问题</Button>
          <Button size="sm" className="bg-[#2F80ED] text-white h-8 text-xs"
            onClick={() => onNavigate?.('m08-review-decision')}>
            进入审核决策
          </Button>
        </div>
      </div>

      {/* 三栏布局 */}
      <div className="grid grid-cols-12 gap-4">
        {/* 左栏：交底书目录 */}
        <Card className="col-span-2 border-[#E5E9F0]">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold text-[#374151]">交底书目录</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3 space-y-0.5">
            {disclosureSections.map((section) => (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id); setExpandedSections((p) => p.includes(section.id) ? p : [...p, section.id]) }}
                className={`w-full text-left px-2 py-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                  activeSection === section.id
                    ? 'bg-[#EAF4FF] text-[#2F80ED] font-medium'
                    : 'text-[#374151] hover:bg-[#F5F7FA]'
                }`}
              >
                <span className="flex-1 truncate">{section.title}</span>
                {section.complete
                  ? <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 ml-1" />
                  : <AlertCircle className="w-3.5 h-3.5 text-[#DC2626] flex-shrink-0 ml-1" />
                }
              </button>
            ))}
          </CardContent>
        </Card>

        {/* 中栏：交底书预览 */}
        <Card className="col-span-6 border-[#E5E9F0]">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold text-[#374151]">完整交底书预览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] pr-2">
            {disclosureSections.map((section) => (
              <div key={section.id} className={`border rounded-lg transition-colors ${
                activeSection === section.id ? 'border-[#2F80ED]' : 'border-[#E5E9F0]'
              }`}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F9FAFB] rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span className={`text-sm font-medium ${activeSection === section.id ? 'text-[#2F80ED]' : 'text-[#111827]'}`}>
                      {section.title}
                    </span>
                    {!section.complete && (
                      <span className="text-xs bg-[#FEF2F2] text-[#DC2626] px-1.5 py-0.5 rounded">缺失</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#9CA3AF] transition-transform ${expandedSections.includes(section.id) ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.includes(section.id) && (
                  <div className="px-3 py-2 border-t border-[#F3F4F6] bg-[#F9FAFB] text-sm text-[#374151] rounded-b-lg leading-relaxed">
                    {section.content || <span className="text-[#9CA3AF] italic">暂无内容</span>}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 右栏：审核清单 */}
        <Card className="col-span-4 border-[#E5E9F0]">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs font-semibold text-[#374151]">交底结构审核清单</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pb-3">
            {reviewChecklist.map((item, idx) => (
              <div key={idx} className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                item.status ? 'border-[#BBF7D0] bg-[#F0FDF4]' : 'border-[#FECACA] bg-[#FEF2F2]'
              }`}>
                {item.status
                  ? <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
                }
                <span className={`text-xs font-medium ${item.status ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                  {item.item}
                </span>
              </div>
            ))}

            <div className="pt-2">
              <Alert className="border-[#FED7AA] bg-[#FFF7ED] py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-[#EA580C]" />
                <AlertDescription className="text-[#EA580C] text-xs ml-1">
                  缺少「实际产品说明」，建议补充或标记为不适用
                </AlertDescription>
              </Alert>
            </div>

            <div className="pt-2 space-y-2">
              <p className="text-xs font-medium text-[#374151]">审核结论</p>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[#E5E9F0] hover:bg-[#F5F7FA]">
                <input type="radio" name="conclusion" value="pass" className="w-3.5 h-3.5 accent-[#2F80ED]" />
                <span className="text-xs text-[#374151]">交底通过审核</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[#E5E9F0] hover:bg-[#F5F7FA]">
                <input type="radio" name="conclusion" value="fail" className="w-3.5 h-3.5 accent-[#DC2626]" />
                <span className="text-xs text-[#374151]">交底不通过审核</span>
              </label>
              <Button size="sm" className="w-full bg-[#2F80ED] text-white text-xs h-8">保存审核结论</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
