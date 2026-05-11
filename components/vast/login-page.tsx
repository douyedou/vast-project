"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  EyeOff,
  Shield,
  Zap,
  FileText,
  Users,
  Lock,
  ArrowRight,
} from "lucide-react"

interface LoginPageProps {
  onLogin: () => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // 模拟登录
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    onLogin()
  }

  const features = [
    {
      icon: FileText,
      title: "智能交底书处理",
      description: "AI 驱动的交底书解析与结构化",
    },
    {
      icon: Zap,
      title: "高效专利创作",
      description: "双文档协同编辑，实时覆盖率检测",
    },
    {
      icon: Shield,
      title: "质量全程把控",
      description: "多维度审核规则，确保申请文件质量",
    },
    {
      icon: Users,
      title: "团队协作管理",
      description: "角色权限分配，任务流程可视化",
    },
  ]

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E5EFF] to-[#0A3CC2] p-12 flex-col justify-between relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-white/30" />
          <div className="absolute top-40 right-20 w-96 h-96 rounded-full border border-white/20" />
          <div className="absolute bottom-20 left-40 w-48 h-48 rounded-full border border-white/25" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white text-xl font-bold">V8</span>
            </div>
            <div>
              <div className="text-white text-2xl font-bold">VAST 8.0</div>
              <div className="text-white/70 text-sm">专利智能生产系统</div>
            </div>
          </div>
        </div>

        {/* 中间内容 */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-white text-4xl font-bold leading-tight">
              让专利创作
              <br />
              更智能、更高效
            </h1>
            <p className="text-white/70 mt-4 text-lg max-w-md">
              VAST 8.0 是新一代专利智能生产平台，覆盖从交底书收集到案件管理的全流程，助力企业提升专利申请效率与质量。
            </p>
          </div>

          {/* 特性列表 */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/15 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-white/90 mb-3" />
                <div className="text-white font-medium">{feature.title}</div>
                <div className="text-white/60 text-sm mt-1">
                  {feature.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部版权 */}
        <div className="relative z-10 text-white/50 text-sm">
          &copy; 2024 VAST 专利智能生产系统. All rights reserved.
        </div>
      </div>

      {/* 右侧登录区域 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F7FA]">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1E5EFF] flex items-center justify-center">
                <span className="text-white text-lg font-bold">V8</span>
              </div>
              <div className="text-left">
                <div className="text-[#111827] text-xl font-bold">VAST 8.0</div>
                <div className="text-[#6B7280] text-xs">专利智能生产系统</div>
              </div>
            </div>
          </div>

          {/* 登录卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#111827]">欢迎回来</h2>
              <p className="text-[#6B7280] mt-2">请登录您的账户以继续</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#374151]">
                  用户名 / 邮箱
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名或邮箱"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 pl-4 pr-4 bg-[#F9FAFB] border-[#E5E7EB] focus:border-[#2F80ED] focus:ring-[#2F80ED]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#374151]">
                  密码
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-4 pr-12 bg-[#F9FAFB] border-[#E5E7EB] focus:border-[#2F80ED] focus:ring-[#2F80ED]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-[#6B7280] cursor-pointer"
                  >
                    记住我
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-[#2F80ED] hover:text-[#1E5EFF]"
                >
                  忘记密码?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full h-12 bg-[#1E5EFF] hover:bg-[#0A3CC2] text-white font-medium rounded-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>登录中...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    <span>登录</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            {/* 分隔线 */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E7EB]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-[#9CA3AF]">或</span>
              </div>
            </div>

            {/* 其他登录方式 */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-12 border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                  />
                </svg>
                企业SSO
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 border-[#E5E7EB] text-[#374151] hover:bg-[#F5F7FA]"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  />
                </svg>
                访客模式
              </Button>
            </div>

            {/* 安全提示 */}
            <div className="mt-8 p-4 bg-[#F0F9FF] rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#2F80ED] flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="text-[#1E40AF] font-medium">安全提示</div>
                  <div className="text-[#6B7280] mt-1">
                    请勿在公共设备上保存登录信息，定期修改密码以确保账户安全。
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部链接 */}
          <div className="mt-6 text-center text-sm text-[#6B7280]">
            遇到问题？
            <button className="text-[#2F80ED] hover:text-[#1E5EFF] ml-1">
              联系管理员
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
