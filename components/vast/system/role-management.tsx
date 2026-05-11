"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Shield,
  Users,
  Check,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RoleManagementProps {
  onNavigate: (page: string) => void
}

const roles = [
  {
    id: "1",
    name: "系统管理员",
    code: "ADMIN",
    description: "拥有系统所有权限",
    userCount: 3,
    status: "active",
    isSystem: true,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "专利经理",
    code: "PATENT_MANAGER",
    description: "负责专利案件的分配和审核",
    userCount: 12,
    status: "active",
    isSystem: false,
    createdAt: "2024-01-15",
  },
  {
    id: "3",
    name: "专利工程师",
    code: "PATENT_ENGINEER",
    description: "负责专利撰写和创作",
    userCount: 45,
    status: "active",
    isSystem: false,
    createdAt: "2024-01-15",
  },
  {
    id: "4",
    name: "质量审核员",
    code: "QA_REVIEWER",
    description: "负责专利质量审核",
    userCount: 8,
    status: "active",
    isSystem: false,
    createdAt: "2024-02-01",
  },
  {
    id: "5",
    name: "客服专员",
    code: "CUSTOMER_SERVICE",
    description: "负责客户咨询和立案",
    userCount: 15,
    status: "active",
    isSystem: false,
    createdAt: "2024-02-15",
  },
  {
    id: "6",
    name: "售前顾问",
    code: "PRESALE",
    description: "负责售前咨询和评估",
    userCount: 10,
    status: "active",
    isSystem: false,
    createdAt: "2024-03-01",
  },
  {
    id: "7",
    name: "资源管理员",
    code: "RESOURCE_ADMIN",
    description: "负责资源库维护",
    userCount: 5,
    status: "active",
    isSystem: false,
    createdAt: "2024-03-15",
  },
  {
    id: "8",
    name: "访客",
    code: "GUEST",
    description: "只读访问权限",
    userCount: 147,
    status: "inactive",
    isSystem: true,
    createdAt: "2024-01-01",
  },
]

const modulePermissions = [
  {
    module: "M05 交底书来源",
    permissions: [
      { id: "m05-view", name: "查看", desc: "查看交底书来源列表" },
      { id: "m05-create", name: "新建", desc: "新建交底书来源" },
      { id: "m05-edit", name: "编辑", desc: "编辑交底书来源" },
      { id: "m05-delete", name: "删除", desc: "删除交底书来源" },
      { id: "m05-assign", name: "分配", desc: "分配交底书任务" },
      { id: "m05-filing", name: "立案", desc: "执行立案操作" },
    ],
  },
  {
    module: "M06 交底书引擎",
    permissions: [
      { id: "m06-view", name: "查看", desc: "查看交底模型" },
      { id: "m06-create", name: "新建", desc: "新建交底模型" },
      { id: "m06-edit", name: "编辑", desc: "编辑交底模型" },
      { id: "m06-ai", name: "AI检索", desc: "执行AI初检" },
      { id: "m06-submit", name: "提交", desc: "提交到M07" },
    ],
  },
  {
    module: "M07 专利创作平台",
    permissions: [
      { id: "m07-view", name: "查看", desc: "查看创作任务" },
      { id: "m07-create", name: "创作", desc: "进行专利创作" },
      { id: "m07-edit", name: "编辑", desc: "编辑专利文档" },
      { id: "m07-review", name: "复核", desc: "执行全文件复核" },
      { id: "m07-submit", name: "提交", desc: "提交到M08审核" },
    ],
  },
  {
    module: "M08 质量审核",
    permissions: [
      { id: "m08-view", name: "查看", desc: "查看审核任务" },
      { id: "m08-review", name: "审核", desc: "执行审核操作" },
      { id: "m08-approve", name: "审批", desc: "审批通过/退回" },
      { id: "m08-reassign", name: "转派", desc: "转派审核任务" },
    ],
  },
  {
    module: "M09 案件管理",
    permissions: [
      { id: "m09-view", name: "查看", desc: "查看案件列表" },
      { id: "m09-submit", name: "交案", desc: "提交交案" },
      { id: "m09-manage", name: "管理", desc: "管理案件状态" },
      { id: "m09-scrap", name: "废案", desc: "执行废案操作" },
    ],
  },
  {
    module: "M10 资源库",
    permissions: [
      { id: "m10-view", name: "查看", desc: "查看资源库" },
      { id: "m10-create", name: "新建", desc: "新建资源" },
      { id: "m10-edit", name: "编辑", desc: "编辑资源" },
      { id: "m10-delete", name: "删除", desc: "删除资源" },
      { id: "m10-import", name: "导入", desc: "批量导入资源" },
      { id: "m10-export", name: "导出", desc: "批量导出资源" },
    ],
  },
  {
    module: "系统设置",
    permissions: [
      { id: "sys-view", name: "查看", desc: "查看系统设置" },
      { id: "sys-users", name: "用户管理", desc: "管理系统用户" },
      { id: "sys-roles", name: "角色管理", desc: "管理角色权限" },
      { id: "sys-config", name: "配置", desc: "修改系统配置" },
    ],
  },
]

export function RoleManagement({ onNavigate }: RoleManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<(typeof roles)[0] | null>(
    null
  )
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [checkedPermissions, setCheckedPermissions] = useState<string[]>([
    "m05-view",
    "m05-create",
    "m06-view",
    "m07-view",
    "m07-create",
  ])

  const filteredRoles = roles.filter(
    (role) =>
      role.name.includes(searchQuery) || role.code.includes(searchQuery)
  )

  const togglePermission = (permId: string) => {
    setCheckedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    )
  }

  const toggleModuleAll = (modulePerms: { id: string }[]) => {
    const allIds = modulePerms.map((p) => p.id)
    const allChecked = allIds.every((id) => checkedPermissions.includes(id))
    if (allChecked) {
      setCheckedPermissions((prev) =>
        prev.filter((id) => !allIds.includes(id))
      )
    } else {
      setCheckedPermissions((prev) => [...new Set([...prev, ...allIds])])
    }
  }

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
        <div>
          <h1 className="text-xl font-semibold text-foreground">角色权限</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理角色、组织架构和权限配置
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">角色列表</TabsTrigger>
          <TabsTrigger value="org">组织架构</TabsTrigger>
          <TabsTrigger value="matrix">权限矩阵</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索角色名称或编码..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新建角色
            </Button>
          </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">角色名称</TableHead>
              <TableHead>角色编码</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="text-center">用户数</TableHead>
              <TableHead className="text-center">状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Shield
                      className={cn(
                        "h-4 w-4",
                        role.isSystem ? "text-amber-500" : "text-blue-500"
                      )}
                    />
                    <span className="font-medium">{role.name}</span>
                    {role.isSystem && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        系统
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {role.code}
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {role.description}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {role.userCount}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      role.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {role.status === "active" ? "启用" : "停用"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {role.createdAt}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedRole(role)
                        setShowPermissionDialog(true)
                      }}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={role.isSystem}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={role.isSystem}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      disabled={role.isSystem}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
        </TabsContent>

        <TabsContent value="org" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">部门架构</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "专利撰写部", count: 45, manager: "王经理" },
                  { name: "质量管理部", count: 12, manager: "李主管" },
                  { name: "项目管理部", count: 8, manager: "张总监" },
                  { name: "客户服务部", count: 15, manager: "刘经理" },
                  { name: "资源管理部", count: 5, manager: "陈主管" },
                  { name: "售前部", count: 10, manager: "赵经理" },
                  { name: "技术部", count: 6, manager: "孙总监" },
                ].map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">负责人：{dept.manager}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{dept.count} 人</span>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">权限矩阵</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">模块/角色</TableHead>
                    <TableHead className="text-center">系统管理员</TableHead>
                    <TableHead className="text-center">专利经理</TableHead>
                    <TableHead className="text-center">专利工程师</TableHead>
                    <TableHead className="text-center">质量审核员</TableHead>
                    <TableHead className="text-center">客服专员</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["M05 咨询立案", "M06 交底书引擎", "M07 专利创作", "M08 质量审核", "M09 案件管理", "M10 资源库"].map((module) => (
                    <TableRow key={module}>
                      <TableCell className="font-medium">{module}</TableCell>
                      <TableCell className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Check className="h-4 w-4 text-green-500 mx-auto" /></TableCell>
                      <TableCell className="text-center">{module.includes("M07") || module.includes("M06") ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</TableCell>
                      <TableCell className="text-center">{module.includes("M08") ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</TableCell>
                      <TableCell className="text-center">{module.includes("M05") ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新建角色弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建角色</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>角色名称</Label>
              <Input placeholder="请输入角色名称" />
            </div>
            <div className="space-y-2">
              <Label>角色编码</Label>
              <Input placeholder="请输入角色编码（英文大写）" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input placeholder="请输入角色描述" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              取消
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              创建并配置权限
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 权限配置弹窗 */}
      <Dialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              配置权限 - {selectedRole?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {modulePermissions.map((module) => {
                const allIds = module.permissions.map((p) => p.id)
                const allChecked = allIds.every((id) =>
                  checkedPermissions.includes(id)
                )
                const someChecked =
                  allIds.some((id) => checkedPermissions.includes(id)) &&
                  !allChecked

                return (
                  <Card key={module.module}>
                    <CardHeader className="py-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allChecked}
                          className={someChecked ? "opacity-50" : ""}
                          onCheckedChange={() =>
                            toggleModuleAll(module.permissions)
                          }
                        />
                        <CardTitle className="text-sm font-medium">
                          {module.module}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-3">
                        {module.permissions.map((perm) => (
                          <label
                            key={perm.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              checkedPermissions.includes(perm.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-border hover:bg-muted/50"
                            )}
                          >
                            <Checkbox
                              checked={checkedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <div>
                              <p className="text-sm font-medium">{perm.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {perm.desc}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
              已选择{" "}
              <span className="font-medium text-foreground">
                {checkedPermissions.length}
              </span>{" "}
              项权限
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPermissionDialog(false)}
            >
              取消
            </Button>
            <Button onClick={() => setShowPermissionDialog(false)}>
              保存权限
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
