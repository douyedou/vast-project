"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  UserPlus,
  List,
  Clock,
  FileCheck,
  Archive,
  ChevronRight,
  ChevronDown,
  Edit3,
  BookOpen,
  CheckCircle,
  Send,
  Cpu,
  Brain,
  Layers,
  Network,
  Shield,
  Sparkles,
  Star,
  Package,
  History,
  Database,
  Target,
  AlertCircle,
  FolderArchive,
  Zap,
  Grid3x3,
  Link2,
  TrendingUp,
  Settings,
  Users,
  Key,
  Building,
  Bell,
  Globe,
  Home,
  Search,
  GitBranch,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    id: "home",
    label: "系统首页",
    icon: Home,
    children: [
      { id: "home", label: "系统首页", icon: Home },
    ],
  },
  {
    id: "m05",
    label: "咨询立案",
    icon: FileText,
    children: [
      { id: "m05-dashboard",      label: "咨询立案工作台", icon: LayoutDashboard, badge: 18 },
      { id: "m05-new",            label: "发起咨询",       icon: FileText },
      { id: "m05-list",           label: "全部案件",       icon: List,        badge: 68 },
      { id: "m05-assigning",      label: "待分配",       icon: Users,       badge: 5 },
      { id: "m05-searching",      label: "待检索",     icon: FileCheck,   badge: 7 },
      { id: "m05-confirming",     label: "待确认",     icon: Clock,       badge: 4 },
      { id: "m05-filing",         label: "待立案",     icon: Send,        badge: 6 },
      { id: "m05-completed",      label: "已立案",    icon: CheckCircle, badge: 12 },
      { id: "m05-rejected",       label: "不立案归档",     icon: Archive,     badge: 5 },
    ],
  },
  {
    id: "m06",
    label: "交底书引擎",
    icon: Cpu,
    children: [
      { id: "m06-p01-dashboard",        label: "任务工作台",    icon: LayoutDashboard },
      { id: "m06-p02-decomposition",    label: "交底书解构",    icon: Layers, badge: 8 },
      { id: "m06-p03-ai-inspection",    label: "AI初检",        icon: Brain, badge: 5 },
      { id: "m06-p04-supplement",       label: "交底补全",      icon: FileText, badge: 12 },
      { id: "m06-p05-final-disclosure", label: "生成完整交底",  icon: FileText },
      { id: "m06-p06-second-search",    label: "二次检索",      icon: Search },
      { id: "m06-p07-prior-art",        label: "现有技术对比",  icon: Layers },
      { id: "m06-p08-relation-mapping", label: "关系建模",      icon: GitBranch },
      { id: "m06-p09-assets",           label: "结构化资产",    icon: Package },
      { id: "m06-p10-quality",          label: "质量控制",      icon: Shield, badge: 3 },
      { id: "m06-p11-package",          label: "数据包生成",    icon: Package, badge: 7 },
      { id: "m06-p12-submit",           label: "提交M07",       icon: Send, badge: 2 },
      { id: "m06-p13-version",          label: "版本日志",      icon: History },
    ],
  },
  {
    id: "m07",
    label: "专利创作平台",
    icon: Edit3,
    children: [
      { id: "m07-dashboard", label: "创作工作台", icon: LayoutDashboard },
      { id: "m07-list", label: "创作任务", icon: List, badge: 12 },
      { id: "m07-workspace", label: "双文档工作台", icon: BookOpen },
      { id: "m07-spec-draft", label: "说明书创作", icon: FileText },
      { id: "m07-claims", label: "权利要求书", icon: Target },
      { id: "m07-review", label: "全文件复核", icon: CheckCircle },
      { id: "m07-five-books", label: "五书生成", icon: Package },
      { id: "m07-submit", label: "提交审核", icon: Send },
    ],
  },
  {
    id: "m08",
    label: "质量审核",
    icon: AlertCircle,
    children: [
      { id: "m08-dashboard", label: "审核工作台", icon: LayoutDashboard, badge: 12 },
      { id: "m08-task-list", label: "审核任务列表", icon: List, badge: 25 },
      { id: "m08-task-detail", label: "审核任务详情", icon: FileText },
      { id: "m08-disclosure-review", label: "交底书审核", icon: BookOpen },
      { id: "m08-review-decision", label: "审核决策", icon: CheckCircle, badge: 5 },
    ],
  },
  {
    id: "m09",
    label: "案件管理",
    icon: FolderArchive,
    children: [
      { id: "m09-dashboard", label: "案件工作台", icon: LayoutDashboard, badge: 8 },
      { id: "m09-all-cases", label: "全部案件列表", icon: List, badge: 356 },
      { id: "m09-case-detail", label: "案件详情", icon: FileText },
      { id: "m09-waiting-cases", label: "待交案案件", icon: Clock, badge: 67 },
      { id: "m09-protection-center", label: "保护中心", icon: Shield, badge: 12 },
      { id: "m09-national-ip", label: "国知局状态", icon: CheckCircle, badge: 45 },
      { id: "m09-scrap-cases", label: "废案管理", icon: Archive, badge: 23 },
      { id: "m09-knowledge-assets", label: "知识资产", icon: Star },
    ],
  },
  {
    id: "m10",
    label: "M10 资源库",
    icon: Zap,
    children: [
      { id: "m10-dashboard", label: "资源库工作台", icon: LayoutDashboard },
      { id: "m10-terminology", label: "术语库", icon: FileText, badge: 2456 },
      { id: "m10-template", label: "模板库", icon: BookOpen, badge: 187 },
      { id: "m10-specification", label: "规范库", icon: List },
      { id: "m10-drawing", label: "图纸库", icon: Package, badge: 523 },
      { id: "m10-formula", label: "公式库", icon: Database },
      { id: "m10-ipc", label: "IPC分类库", icon: Grid3x3, badge: 8540 },
      { id: "m10-citation", label: "引用规范库", icon: Link2 },
      { id: "m10-quality-rules", label: "质量规则库", icon: Zap },
      { id: "m10-claims-phrase", label: "权利要求句式", icon: Edit3 },
      { id: "m10-sample", label: "AI训练样本", icon: Brain, badge: 12847 },
      { id: "m10-statistics", label: "统计分析", icon: TrendingUp },
    ],
  },
  {
    id: "system",
    label: "系统设置",
    icon: Settings,
    children: [
      { id: "sys-settings", label: "系统设置", icon: Settings },
      { id: "sys-users", label: "用户管理", icon: Users, badge: 245 },
      { id: "sys-roles", label: "角色权限", icon: Shield, badge: 8 },
      { id: "sys-notifications", label: "通知配置", icon: Bell },
      { id: "sys-integration", label: "系统集成", icon: Globe },
      { id: "sys-logs", label: "操作日志", icon: FileText },
    ],
  },
]

interface AppSidebarProps {
  activeItem: string
  onNavigate: (id: string) => void
}

export function AppSidebar({ activeItem, onNavigate }: AppSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>(["home", "m05", "m06", "m07", "m08", "m09", "m10", "system"])

  const toggleModule = (id: string) => {
    setExpandedModules((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const getActiveModule = () => {
    if (activeItem === "home") return "home"
    if (activeItem.startsWith("m05")) return "m05"
    if (activeItem.startsWith("m06")) return "m06"
    if (activeItem.startsWith("m07")) return "m07"
    if (activeItem.startsWith("m08")) return "m08"
    if (activeItem.startsWith("m09")) return "m09"
    if (activeItem.startsWith("m10")) return "m10"
    if (activeItem.startsWith("sys")) return "system"
    return "m05"
  }

  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#1E5EFF] flex items-center justify-center">
            <span className="text-white text-xs font-bold">V8</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#111827]">VAST 8.0</div>
            <div className="text-xs text-[#9CA3AF]">专利智能生产系统</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((module) => {
            const ModuleIcon = module.icon
            const isExpanded = expandedModules.includes(module.id)
            const isActiveModule = getActiveModule() === module.id

            return (
              <li key={module.id}>
                <button
                  onClick={() => toggleModule(module.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    isActiveModule
                      ? "bg-[#EAF4FF] text-[#2F80ED] font-medium"
                      : "text-[#374151] hover:bg-[#F5F7FA]"
                  )}
                >
                  <ModuleIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left text-xs">{module.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {isExpanded && module.children && (
                  <ul className="mt-1 ml-4 space-y-0.5">
                    {module.children.map((item) => {
                      const Icon = item.icon
                      const isActive = activeItem === item.id

                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => onNavigate(item.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                              isActive
                                ? "bg-[#2F80ED] text-white font-medium"
                                : "text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#1F2937]"
                            )}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "min-w-5 h-5 px-1.5 rounded-full text-xs flex items-center justify-center",
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-[#F0F3F8] text-[#6B7280]"
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-xs text-[#9CA3AF]">
          当前角色：<span className="text-[#1F2937]">专利工程师</span>
        </div>
      </div>
    </aside>
  )
}
