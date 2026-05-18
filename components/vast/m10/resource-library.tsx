'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Upload, Plus, Edit, Trash2, Eye, Copy, Lock } from 'lucide-react'

interface ResourceLibraryProps {
  libraryType: 'terminology' | 'template' | 'specification' | 'drawing' | 'formula' | 'ipc' | 'citation' | 'rules' | 'claims' | 'samples'
  onNavigate?: (page: string) => void
}

interface KnowledgeItem {
  id: string
  field: string
  title: string
  content: string
  source: string
  source_type: string
  created_at: string
}

const libraryConfig: Record<string, { title: string; description: string; icon: string }> = {
  terminology: { title: '术语库', description: '维护原始术语、标准术语、撰写术语和同义词', icon: '📚' },
  template: { title: '模板库', description: '管理交底书、说明书、权利要求等各类模板', icon: '📄' },
  specification: { title: '规范库', description: '维护交底、撰写、审核等业务规范', icon: '📋' },
  drawing: { title: '图纸库', description: '管理机械图、流程图、电路图等图纸资源', icon: '🎨' },
  formula: { title: '公式库', description: '维护数学、物理、化学等领域公式', icon: '∑' },
  ipc: { title: 'IPC分类库', description: '维护国际专利分类数据', icon: '🏷️' },
  citation: { title: '引用规范库', description: '维护专利、非专利、标准等引用格式', icon: '📑' },
  rules: { title: '质量规则库', description: '配置M06-M09使用的质量规则', icon: '⚙️' },
  claims: { title: '权利要求句式库', description: '维护独权、从权、替代方案等句式', icon: '✍️' },
  samples: { title: 'AI训练样本库', description: '管理授权、退回、废案等样本', icon: '📊' },
}

interface ApiResource {
  id: string
  field: string
  title: string
  content: string
  source: string
  source_type: string
  created_at?: string
}

export function ResourceLibrary({ libraryType, onNavigate }: ResourceLibraryProps) {
  const [resources, setResources] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fieldFilter, setFieldFilter] = useState('all')

  const config = libraryConfig[libraryType]

  useEffect(() => {
    const token = localStorage.getItem('vast_token')
    fetch('/api/ai/rag?page=1&pageSize=20', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) {
          setResources(data.data.list || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title?.includes(searchQuery) ||
      item.content?.includes(searchQuery) ||
      item.field?.includes(searchQuery)
    const matchesType = statusFilter === 'all' || item.source_type === statusFilter
    const matchesField = fieldFilter === 'all' || item.field === fieldFilter
    return matchesSearch && matchesType && matchesField
  })

  const getStatusBadge = (sourceType: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      patent: { label: '专利', className: 'bg-blue-100 text-blue-800' },
      template: { label: '模板', className: 'bg-green-100 text-green-800' },
      rule: { label: '规则', className: 'bg-purple-100 text-purple-800' },
    }
    const map = statusMap[sourceType] || { label: sourceType, className: 'bg-gray-100 text-gray-800' }
    return <Badge className={map.className}>{map.label}</Badge>
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
                <label className="text-xs font-medium text-muted-foreground mb-2 block">类型</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="patent">专利</SelectItem>
                    <SelectItem value="template">模板</SelectItem>
                    <SelectItem value="rule">规则</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">领域</label>
                <Select value={fieldFilter} onValueChange={setFieldFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="机械">机械</SelectItem>
                    <SelectItem value="软通">软通</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setFieldFilter('all') }}>重置</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 资源列表 */}
        <Card>
          <CardHeader>
            <CardTitle>资源列表 ({filteredResources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">加载中...</div>
            ) : (
              <div className="space-y-3">
                {filteredResources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{resource.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {resource.field} • {resource.source_type} • {new Date(resource.created_at).toLocaleDateString('zh-CN')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{resource.content?.substring(0, 100)}...</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                      {getStatusBadge(resource.source_type)}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
