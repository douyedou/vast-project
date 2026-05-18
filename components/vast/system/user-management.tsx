"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Key,
  Ban,
  CheckCircle,
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiRequest } from "@/hooks/use-api"

interface UserManagementProps {
  onNavigate: (page: string) => void
}

interface UserItem {
  id: string
  name: string
  username: string
  email: string | null
  phone: string | null
  role: string
  status: string
  department: string | null
  created_at: string
}

const roleLabelMap: Record<string, string> = {
  admin: "系统管理员",
  engineer: "专利工程师",
  reviewer: "质量审核员",
  manager: "专利经理",
  customer_service: "客服专员",
  consultant: "售前顾问",
}

export function UserManagement({ onNavigate }: UserManagementProps) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("vast_token")
    fetch("/api/users?page=1&pageSize=50", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200) {
          setUsers(data.data.list || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.name?.includes(searchQuery) ||
      user.username?.includes(searchQuery) ||
      user.email?.includes(searchQuery)
    const matchesDept =
      selectedDepartment === "all" ||
      (user.department || "未分配") === selectedDepartment
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus
    return matchesSearch && matchesDept && matchesRole && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    pending: users.filter((u) => u.status === "pending").length,
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
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理系统用户及角色分配
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            批量导入
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加用户
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selectedStatus === "all" && "ring-2 ring-blue-500"
          )}
          onClick={() => setSelectedStatus("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">全部用户</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selectedStatus === "active" && "ring-2 ring-green-500"
          )}
          onClick={() => setSelectedStatus("active")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">正常状态</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selectedStatus === "inactive" && "ring-2 ring-gray-500"
          )}
          onClick={() => setSelectedStatus("inactive")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <UserX className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">已停用</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-colors",
            selectedStatus === "pending" && "ring-2 ring-orange-500"
          )}
          onClick={() => setSelectedStatus("pending")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">待激活</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、用户名或邮箱..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部部门" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部部门</SelectItem>
            <SelectItem value="专利撰写部">专利撰写部</SelectItem>
            <SelectItem value="质量管理部">质量管理部</SelectItem>
            <SelectItem value="项目管理部">项目管理部</SelectItem>
            <SelectItem value="客户服务部">客户服务部</SelectItem>
            <SelectItem value="资源管理部">资源管理部</SelectItem>
            <SelectItem value="售前部">售前部</SelectItem>
            <SelectItem value="技术部">技术部</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            <SelectItem value="admin">系统管理员</SelectItem>
            <SelectItem value="engineer">专利工程师</SelectItem>
            <SelectItem value="reviewer">质量审核员</SelectItem>
            <SelectItem value="manager">专利经理</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 用户列表 */}
      <Card>
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">加载中...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">用户</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>角色</TableHead>
                <TableHead className="text-center">状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {user.name?.slice(0, 2) || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email || user.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.department || "未分配"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {roleLabelMap[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                        user.status === "active" &&
                          "bg-green-100 text-green-700",
                        user.status === "inactive" &&
                          "bg-gray-100 text-gray-700",
                        user.status === "pending" &&
                          "bg-orange-100 text-orange-700"
                      )}
                    >
                      {user.status === "active" && (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          正常
                        </>
                      )}
                      {user.status === "inactive" && (
                        <>
                          <Ban className="h-3 w-3" />
                          停用
                        </>
                      )}
                      {user.status === "pending" && (
                        <>
                          <Clock className="h-3 w-3" />
                          待激活
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    -
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("zh-CN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="h-4 w-4 mr-2" />
                          编辑信息
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Key className="h-4 w-4 mr-2" />
                          重置密码
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "active" ? (
                          <DropdownMenuItem className="text-orange-600">
                            <Ban className="h-4 w-4 mr-2" />
                            停用账户
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            启用账户
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除用户
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* 添加用户弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input placeholder="请输入姓名" />
              </div>
              <div className="space-y-2">
                <Label>手机号</Label>
                <Input placeholder="请输入手机号" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input placeholder="请输入邮箱地址" type="email" />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="请选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineer">专利工程师</SelectItem>
                  <SelectItem value="reviewer">质量审核员</SelectItem>
                  <SelectItem value="manager">专利经理</SelectItem>
                  <SelectItem value="admin">系统管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>初始密码</Label>
              <Input placeholder="请设置初始密码" type="password" />
              <p className="text-xs text-muted-foreground">
                用户首次登录后需修改密码
              </p>
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
              添加用户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
