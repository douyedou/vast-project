'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, AlertCircle, Clock, Download, Upload, Plus, Edit, Trash2, Eye, Copy, Lock } from 'lucide-react'

interface ResourceLibraryProps {
  libraryType: 'terminology' | 'template' | 'specification' | 'drawing' | 'formula' | 'ipc' | 'citation' | 'rules' | 'claims' | 'samples'
  onNavigate?: (page: string) => void
}

export function ResourceLibrary({ libraryType, onNavigate }: ResourceLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')

  const libraryConfig: Record<string, { title: string; description: string; icon: string; items: any[] }> = {
    terminology: {
      title: '术语库',
      description: '维护原始术语、标准术语、撰写术语和同义词',
      icon: '📚',
      items: [
        { id: 1, name: '深度学习算法', original: '深度学习算法', standard: '深度学习算法', usage: '撰写术语', domain: '软件/AI', status: 'published', calls: 2543 },
        { id: 2, name: '机械结构', original: '机械结构件', standard: '机械结构', usage: '标准术语', domain: '机械', status: 'published', calls: 1876 },
        { id: 3, name: '控制电路', original: '控制电路模块', standard: '控制电路', usage: '标准术语', domain: '电气', status: 'draft', calls: 0 },
      ]
    },
    template: {
      title: '模板库',
      description: '管理交底书、说明书、权利要求等各类模板',
      icon: '📄',
      items: [
        { id: 1, name: '说明书标准格式v2.0', type: '说明书模板', domain: '通用', status: 'published', version: '2.0', calls: 1654 },
        { id: 2, name: '权利要求书_发明专利', type: '权利要求书模板', domain: '发明专利', status: 'published', version: '1.5', calls: 1234 },
        { id: 3, name: '交底书模板_软件行业', type: '交底书模板', domain: '软件', status: 'pending', version: '1.0', calls: 0 },
      ]
    },
    specification: {
      title: '规范库',
      description: '维护交底、撰写、审核等业务规范',
      icon: '📋',
      items: [
        { id: 1, name: '交底书撰写规范2024', type: '交底规范', module: 'M06', status: 'published', chapters: 12, calls: 890 },
        { id: 2, name: '说明书撰写规范', type: '撰写规范', module: 'M07', status: 'published', chapters: 8, calls: 756 },
        { id: 3, name: '审核规范指南', type: '审核规范', module: 'M08', status: 'review', chapters: 15, calls: 0 },
      ]
    },
    drawing: {
      title: '图纸库',
      description: '管理机械图、流程图、电路图等图纸资源',
      icon: '🎨',
      items: [
        { id: 1, name: '系统架构图_v3', type: '系统架构图', domain: '系统', status: 'published', format: 'PNG', calls: 543 },
        { id: 2, name: '电路原理图', type: '电路图', domain: '电气', status: 'published', format: 'DWG', calls: 423 },
        { id: 3, name: '流程示意图', type: '流程图', domain: '通用', status: 'draft', format: 'PNG', calls: 0 },
      ]
    },
    formula: {
      title: '公式库',
      description: '维护数学、物理、化学等领域公式',
      icon: '∑',
      items: [
        { id: 1, name: '频率计算公式', type: '物理公式', domain: '通信', status: 'published', variables: 5, calls: 342 },
        { id: 2, name: '功率计算公式', type: '物理公式', domain: '电气', status: 'published', variables: 4, calls: 289 },
        { id: 3, name: '算法复杂度', type: '数学公式', domain: '软件', status: 'draft', variables: 3, calls: 0 },
      ]
    },
    ipc: {
      title: 'IPC分类库',
      description: '维护国际专利分类数据',
      icon: '🏷️',
      items: [
        { id: 1, code: 'G06F', name: '电子计算机及相关技术', domain: '软件', status: 'published', confidence: 0.95, calls: 2156 },
        { id: 2, code: 'H04L', name: '数字信息传输', domain: '通信', status: 'published', confidence: 0.92, calls: 1834 },
        { id: 3, code: 'B60L', name: '电动车辆', domain: '车辆', status: 'draft', confidence: 0, calls: 0 },
      ]
    },
    citation: {
      title: '引用规范库',
      description: '维护专利、非专利、标准等引用格式',
      icon: '📑',
      items: [
        { id: 1, name: '专利文献引用格式', type: '专利引用', status: 'published', examples: 8, calls: 456 },
        { id: 2, name: '学术论文引用格式', type: '非专利引用', status: 'published', examples: 12, calls: 378 },
        { id: 3, name: '标准文献引用', type: '标准引用', status: 'draft', examples: 5, calls: 0 },
      ]
    },
    rules: {
      title: '质量规则库',
      description: '配置M06-M09使用的质量规则',
      icon: '⚙️',
      items: [
        { id: 1, name: '交底完整性规则', module: 'M06', severity: 'blocking', status: 'published', conditions: 8, calls: 1234 },
        { id: 2, name: '权利要求支持规则', module: 'M07', severity: 'blocking', status: 'published', conditions: 6, calls: 987 },
        { id: 3, name: '质量审核规则', module: 'M08', severity: 'warning', status: 'review', conditions: 12, calls: 0 },
      ]
    },
    claims: {
      title: '权利要求句式库',
      description: '维护独权、从权、替代方案等句式',
      icon: '✍️',
      items: [
        { id: 1, name: '产品独立权句式1', type: '独立权句式', domain: '机械', status: 'published', usage: 234, calls: 567 },
        { id: 2, name: '方法从属权句式', type: '从属权句式', domain: '方法', status: 'published', usage: 156, calls: 423 },
        { id: 3, name: '替代方案句式', type: '替代方案', domain: '通用', status: 'draft', usage: 0, calls: 0 },
      ]
    },
    samples: {
      title: 'AI训练样本库',
      description: '管理授权、退回、废案等样本',
      icon: '📊',
      items: [
        { id: 1, name: '授权案件样本_批次12', type: '授权样本', quality: '优质', status: 'published', samples: 245, calls: 156 },
        { id: 2, name: '退回案件样本_批次11', type: '退回样本', quality: '可用', status: 'published', samples: 178, calls: 89 },
        { id: 3, name: '废案样本_批次10', type: '废案样本', quality: '待审核', status: 'pending', samples: 92, calls: 0 },
      ]
    }
  }

  const config = libraryConfig[libraryType]
  const [resources] = useState(config.items)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      published: { label: '已发布', className: 'bg-green-100 text-green-800' },
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-800' },
      pending: { label: '待审核', className: 'bg-orange-100 text-orange-800' },
      review: { label: '审核中', className: 'bg-blue-100 text-blue-800' }
    }
    const map = statusMap[status] || statusMap.draft
    return <Badge className={map.className}>{map.label}</Badge>
  }

  const getSeverityColor = (severity: string) => {
    return severity === 'blocking' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{config.icon} {config.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              导入
            </Button>
            <Button size="sm" onClick={() => onNavigate?.(`m10-add-${libraryType}`)}>
              <Plus className="w-4 h-4 mr-1" />
              新增
            </Button>
          </div>
        </div>

        {/* 筛选区 */}
        <Card className="bg-muted/30 border-0">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">搜索</label>
                <Input 
                  placeholder="搜索资源..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">状态</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">适用模块</label>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="m06">M06</SelectItem>
                    <SelectItem value="m07">M07</SelectItem>
                    <SelectItem value="m08">M08</SelectItem>
                    <SelectItem value="m09">M09</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" className="flex-1">重置</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 资源列表 */}
        <Card>
          <CardHeader>
            <CardTitle>资源列表 ({resources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{resource.name || resource.code}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {resource.type || resource.module || resource.domain} 
                          {resource.calls > 0 && ` • ${resource.calls} 次调用`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {resource.severity && <Badge className={getSeverityColor(resource.severity)}>{resource.severity}</Badge>}
                    {getStatusBadge(resource.status)}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onNavigate?.(`m10-detail-${resource.id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
