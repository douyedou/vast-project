"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Users,
  Shield,
  Key,
  Bell,
  Database,
  FileText,
  Building,
  Globe,
  Lock,
} from "lucide-react"

interface SystemSettingsProps {
  onNavigate: (page: string) => void
}

const settingCards = [
  {
    id: "users",
    title: "用户管理",
    description: "管理系统用户及角色分配",
    icon: Users,
    count: 245,
    page: "sys-users",
  },
  {
    id: "roles",
    title: "角色权限",
    description: "管理角色、组织架构和权限配置",
    icon: Shield,
    count: 8,
    page: "sys-roles",
  },
  {
    id: "notifications",
    title: "通知配置",
    description: "配置系统通知和消息推送规则",
    icon: Bell,
    count: 24,
    page: "sys-notifications",
  },
  {
    id: "integration",
    title: "系统集成",
    description: "管理第三方系统对接和API配置",
    icon: Globe,
    count: 6,
    page: "sys-integration",
  },
  {
    id: "data",
    title: "数据管理",
    description: "数据备份、归档和清理策略",
    icon: Database,
    count: 0,
    page: "sys-data",
  },
  {
    id: "logs",
    title: "操作日志",
    description: "查看系统操作和审计日志",
    icon: FileText,
    count: 12580,
    page: "sys-logs",
  },
]

export function SystemSettings({ onNavigate }: SystemSettingsProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">系统设置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理系统配置、用户权限和组织架构
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="basic">基础配置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {settingCards.map((card) => {
              const Icon = card.icon
              return (
                <Card
                  key={card.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigate(card.page)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
                        <Icon className="h-5 w-5 text-[#2F80ED]" />
                      </div>
                      {card.count > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {card.count}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm mt-3">{card.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">系统状态</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">系统版本</span>
                  <span className="font-medium">VAST 8.0.1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">许可证状态</span>
                  <span className="text-green-600 font-medium">有效</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">到期时间</span>
                  <span className="font-medium">2027-12-31</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">在线用户</span>
                  <span className="font-medium">128</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onNavigate("sys-users")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  添加新用户
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onNavigate("sys-roles")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  创建新角色
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onNavigate("sys-data")}
                >
                  <Database className="h-4 w-4 mr-2" />
                  数据备份
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">最近变更</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                    <div>
                      <p className="text-foreground">
                        更新了「专利经理」角色权限
                      </p>
                      <p className="text-xs text-muted-foreground">
                        管理员 · 2小时前
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                    <div>
                      <p className="text-foreground">新增用户「王工程师」</p>
                      <p className="text-xs text-muted-foreground">
                        管理员 · 5小时前
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5" />
                    <div>
                      <p className="text-foreground">
                        修改了M07模块功能权限配置
                      </p>
                      <p className="text-xs text-muted-foreground">
                        管理员 · 1天前
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基础信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>系统名称</Label>
                  <Input defaultValue="VAST 专利智能生产系统" />
                </div>
                <div className="space-y-2">
                  <Label>企业名称</Label>
                  <Input defaultValue="专利服务有限公司" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>联系邮箱</Label>
                  <Input defaultValue="admin@patent.com" />
                </div>
                <div className="space-y-2">
                  <Label>联系电话</Label>
                  <Input defaultValue="400-123-4567" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>保存配置</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                安全策略
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">密码强度要求</p>
                  <p className="text-xs text-muted-foreground">
                    要求密码包含大小写字母、数字和特殊字符
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  配置
                </Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">登录失败锁定</p>
                  <p className="text-xs text-muted-foreground">
                    连续5次登录失败后锁定账户30分钟
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  配置
                </Button>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-sm">会话超时</p>
                  <p className="text-xs text-muted-foreground">
                    用户无操作30分钟后自动退出
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  配置
                </Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">双因素认证</p>
                  <p className="text-xs text-muted-foreground">
                    管理员账户强制启用双因素认证
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
