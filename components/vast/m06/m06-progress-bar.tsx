"use client"

import {
  Search,
  FileText,
  Layers,
  GitBranch,
  ShieldCheck,
  Package,
  Send,
  CheckCircle,
  Brain,
  Network,
  FileCheck,
} from "lucide-react"

interface M06ProgressBarProps {
  currentStep: number
  onStepClick?: (step: number) => void
}

// 与重构后流程一致：解构 → 初检/补全(分支) → 完整交底 → 二次检索 → 技术对比 → 关系建模 → 结构化 → 质量控制 → 数据包 → 提交
const steps = [
  { id: 1, label: "解构", icon: Layers, route: "m06-p02-decomposition" },
  { id: 2, label: "初检", icon: Brain, route: "m06-p03-ai-inspection", branch: true },
  { id: 3, label: "补全", icon: FileText, route: "m06-p04-supplement", branch: true },
  { id: 4, label: "完整交底", icon: FileCheck, route: "m06-p05-final-disclosure" },
  { id: 5, label: "二次检索", icon: Search, route: "m06-p06-second-search" },
  { id: 6, label: "技术对比", icon: Layers, route: "m06-p07-prior-art" },
  { id: 7, label: "关系建模", icon: GitBranch, route: "m06-p08-relation-mapping" },
  { id: 8, label: "结构化", icon: Network, route: "m06-p09-assets" },
  { id: 9, label: "质量控制", icon: ShieldCheck, route: "m06-p10-quality" },
  { id: 10, label: "数据包", icon: Package, route: "m06-p11-package" },
  { id: 11, label: "提交", icon: Send, route: "m06-p12-submit" },
]

export function M06ProgressBar({ currentStep, onStepClick }: M06ProgressBarProps) {
  return (
    <div className="bg-white border-b border-[#E5E7EB] px-4 py-2">
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index < currentStep - 1
          const isCurrent = index === currentStep - 1
          const isBranch = step.branch

          return (
            <div key={step.id} className="flex items-center">
              {/* 分支起点标记 */}
              {index === 1 && (
                <div className="text-[8px] text-[#9CA3AF] mr-0.5 -rotate-45">分支</div>
              )}
              
              <button
                className={`flex items-center gap-1 px-1.5 py-1 rounded transition-all ${
                  isCurrent
                    ? "bg-[#EFF6FF]"
                    : isCompleted
                    ? "hover:bg-[#F0FDF4]"
                    : "hover:bg-[#F9FAFB]"
                } ${isBranch ? "border border-dashed border-[#D1D5DB] mx-0.5" : ""}`}
                onClick={() => onStepClick?.(step.id)}
                title={step.label}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-[#16A34A] text-white"
                      : isCurrent
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#E5E7EB] text-[#9CA3AF]"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                </div>
                <span className={`text-[9px] whitespace-nowrap ${
                  isCurrent ? "text-[#2563EB] font-medium" : isCompleted ? "text-[#16A34A]" : "text-[#9CA3AF]"
                }`}>
                  {step.label}
                </span>
              </button>
              
              {/* 分支合流标记 */}
              {index === 2 && (
                <div className="text-[8px] text-[#9CA3AF] ml-0.5 rotate-45">合流</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
