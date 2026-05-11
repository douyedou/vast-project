"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Settings,
  FileText,
  Cpu,
  Edit3,
  AlertCircle,
  FolderArchive,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PermissionManagementProps {
  onNavigate: (page: string) => void
}

const modulePermissions = [
  {
    id: "m05",
    name: "M05 交底书来源",
    icon: FileText,
    color: "blue",
    permissions: [
      {
        id: "m05-dashboard",
        name: "工作台",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "stats", name: "统计", enabled: true },
        ],
      },
      {
        id: "m05-source",
        name: "来源管理",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "create", name: "新建", enabled: true },
          { id: "edit", name: "编辑", enabled: true },
          { id: "delete", name: "删除", enabled: false },
          { id: "assign", name: "分配", enabled: true },
        ],
      },
      {
        id: "m05-filing",
        name: "立案操作",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "filing", name: "立案", enabled: true },
          { id: "reject", name: "不立案", enabled: true },
          { id: "delay", name: "延期", enabled: false },
        ],
      },
    ],
  },
  {
    id: "m06",
    name: "M06 交底书引擎",
    icon: Cpu,
    color: "purple",
    permissions: [
      {
        id: "m06-model",
        name: "模型管理",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "create", name: "新建", enabled: true },
          { id: "edit", name: "编辑", enabled: true },
          { id: "delete", name: "删除", enabled: false },
        ],
      },
      {
        id: "m06-ai",
        name: "AI功能",
        actions: [
          { id: "inspection", name: "AI初检", enabled: true },
          { id: "structuring", name: "结构化", enabled: true },
          { id: "validation", name: "校验", enabled: true },
        ],
      },
      {
        id: "m06-submit",
        name: "提交流程",
        actions: [
          { id: "preview", name: "预览", enabled: true },
          { id: "submit", name: "提交M07", enabled: true },
        ],
      },
    ],
  },
  {
    id: "m07",
    name: "M07 专利创作平台",
    icon: Edit3,
    color: "green",
    permissions: [
      {
        id: "m07-task",
        name: "创作任务",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "create", name: "创作", enabled: true },
          { id: "edit", name: "编辑", enabled: true },
        ],
      },
      {
        id: "m07-doc",
        name: "文档操作",
        actions: [
          { id: "spec", name: "说明书", enabled: true },
          { id: "claims", name: "权利要求", enabled: true },
          { id: "abstract", name: "摘要", enabled: true },
          { id: "drawing", name: "附图", enabled: true },
        ],
      },
      {
        id: "m07-review",
        name: "复核提交",
        actions: [
          { id: "review", name: "全文件复核", enabled: true },
          { id: "generate", name: "五书生成", enabled: true },
          { id: "submit", name: "提交审核", enabled: true },
        ],
      },
    ],
  },
  {
    id: "m08",
    name: "M08 质量审核",
    icon: AlertCircle,
    color: "orange",
    permissions: [
      {
        id: "m08-task",
        name: "审核任务",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "claim", name: "认领", enabled: true },
          { id: "transfer", name: "转派", enabled: false },
        ],
      },
      {
        id: "m08-review",
        name: "审核操作",
        actions: [
          { id: "review", name: "执行审核", enabled: true },
          { id: "approve", name: "审批通过", enabled: true },
          { id: "reject", name: "退回", enabled: true },
        ],
      },
    ],
  },
  {
    id: "m09",
    name: "M09 案件管理",
    icon: FolderArchive,
    color: "cyan",
    permissions: [
      {
        id: "m09-case",
        name: "案件管理",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "submit", name: "交案", enabled: true },
          { id: "manage", name: "状态管理", enabled: true },
          { id: "scrap", name: "废案", enabled: false },
        ],
      },
      {
        id: "m09-asset",
        name: "知识资产",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "manage", name: "管理", enabled: false },
        ],
      },
    ],
  },
  {
    id: "m10",
    name: "M10 资源库",
    icon: Zap,
    color: "yellow",
    permissions: [
      {
        id: "m10-resource",
        name: "资源管理",
        actions: [
          { id: "view", name: "查看", enabled: true },
          { id: "create", name: "新建", enabled: true },
          { id: "edit", name: "编辑", enabled: true },
          { id: "delete", name: "删除", enabled: false },
          { id: "import", name: "导入", enabled: false },
          { id: "export", name: "导出", enabled: true },
        ],
      },
    ],
  },
  {
    id: "system",
    name: "系统设置",
    icon: Settings,
    color: "gray",
    permissions: [
      {
        id: "sys-settings",
        name: "系统配置",
        actions: [
          { id: "view", name: "查看", enabled: false },
          { id: "edit", name: "修改", enabled: false },
        ],
      },
      {
        id: "sys-users",
        name: "用户管理",
        actions: [
          { id: "view", name: "查看", enabled: false },
          { id: "create", name: "新建", enabled: false },
          { id: "edit", name: "编辑", enabled: false },
          { id: "delete", name: "删除", enabled: false },
        ],
      },
      {
        id: "sys-roles",
        name: "角色权限",
        actions: [
          { id: "view", name: "查看", enabled: false },
          { id: "manage", name: "管理", enabled: false },
        ],
      },
    ],
  },
]

export function PermissionManagement({ onNavigate }: PermissionManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedModules, setExpandedModules] = useState<string[]>(["m05", "m07"])
  const [selectedRole, setSelectedRole] = useState("专利工程师")

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const roles = [
    "系统管理员",
    "专利经理",
    "专利工程师",
    "质量审核员",
    "客服专员",
    "售前顾问",
    "资源管理员",
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("sys-settings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">功能权限</h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置各模块的功能访问权限
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 角色选择侧栏 */}
        <Card className="w-56 shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              选择角色
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                    selectedRole === role
                      ? "bg-blue-500 text-white"
                      : "hover:bg-muted"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 权限配置区域 */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索功能模块..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              当前配置角色：
              <span className="font-medium text-foreground">{selectedRole}</span>
            </div>
          </div>

          <div className="space-y-3">
            {modulePermissions.map((module) => {
              const Icon = module.icon
              const isExpanded = expandedModules.includes(module.id)

              return (
                <Card key={module.id}>
                  <Collapsible open={isExpanded}>
                    <CollapsibleTrigger
                      className="w-full"
                      onClick={() => toggleModule(module.id)}
                    >
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                module.color === "blue" && "bg-blue-100",
                                module.color === "purple" && "bg-purple-100",
                                module.color === "green" && "bg-green-100",
                                module.color === "orange" && "bg-orange-100",
                                module.color === "cyan" && "bg-cyan-100",
                                module.color === "yellow" && "bg-yellow-100",
                                module.color === "gray" && "bg-gray-100"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-4 w-4",
                                  module.color === "blue" && "text-blue-600",
                                  module.color === "purple" && "text-purple-600",
                                  module.color === "green" && "text-green-600",
                                  module.color === "orange" && "text-orange-600",
                                  module.color === "cyan" && "text-cyan-600",
                                  module.color === "yellow" && "text-yellow-600",
                                  module.color === "gray" && "text-gray-600"
                                )}
                              />
                            </div>
                            <CardTitle className="text-sm font-medium">
                              {module.name}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {module.permissions.reduce(
                                (acc, p) =>
                                  acc + p.actions.filter((a) => a.enabled).length,
                                0
                              )}
                              /
                              {module.permissions.reduce(
                                (acc, p) => acc + p.actions.length,
                                0
                              )}{" "}
                              项已启用
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-4">
                          {module.permissions.map((perm) => (
                            <div
                              key={perm.id}
                              className="border rounded-lg p-4"
                            >
                              <h4 className="text-sm font-medium mb-3">
                                {perm.name}
                              </h4>
                              <div className="grid grid-cols-6 gap-3">
                                {perm.actions.map((action) => (
                                  <div
                                    key={`${perm.id}-${action.id}`}
                                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                                  >
                                    <span className="text-sm">{action.name}</span>
                                    <Switch
                                      checked={action.enabled}
                                      className="scale-75"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline">重置为默认</Button>
            <Button>保存权限配置</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
