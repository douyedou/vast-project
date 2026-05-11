"use client"

import { Bell, Search, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AppHeaderProps {
  onLogout?: () => void
}

export function AppHeader({ onLogout }: AppHeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-[#123A9C] text-white flex items-center justify-between px-4">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 border border-white/25 shadow-inner">
            {/* VAST 文字 Logo SVG */}
            <svg width="26" height="14" viewBox="0 0 26 14" fill="none">
              <text x="0" y="12" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="13" fill="white" letterSpacing="-0.5">VAST</text>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-[17px] tracking-widest text-white">VAST</span>
            <span className="text-[10px] font-medium text-white/70 tracking-wider mt-0.5">专利智能系统</span>
          </div>
        </div>
        
        {/* Global Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            placeholder="搜索客户名称、来源编号、专利名称..."
            className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 h-9"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F5222D] rounded-full text-xs flex items-center justify-center">
            3
          </span>
        </Button>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm">张三</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>个人设置</DropdownMenuItem>
            <DropdownMenuItem>我的消息</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>退出登录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
