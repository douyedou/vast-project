"use client"

import { cn } from "@/lib/utils"

export type DisclosureStatus = 
  | "presale" 
  | "checking" 
  | "waiting-order" 
  | "waiting-filing" 
  | "filed" 
  | "not-filed" 
  | "supplement"
  // M07 专利创作平台状态
  | "processing"
  | "initial-review"
  | "returned"
  | "pending-review"
  | "spec-generating"
  | "claims-writing"
  | "full-review"

const statusConfig: Record<DisclosureStatus, { label: string; className: string }> = {
  // M05 交底书来源模块状态
  presale: {
    label: "售前咨询",
    className: "bg-[#EAF4FF] text-[#2F80ED]",
  },
  checking: {
    label: "初检中",
    className: "bg-[#F1EDFF] text-[#6F4FF2]",
  },
  "waiting-order": {
    label: "等待订单",
    className: "bg-[#FFF7E6] text-[#FAAD14]",
  },
  "waiting-filing": {
    label: "等待立案",
    className: "bg-[#E6F8FB] text-[#00A8C8]",
  },
  filed: {
    label: "已立案",
    className: "bg-[#E8F8F5] text-[#52C41A]",
  },
  "not-filed": {
    label: "不立案",
    className: "bg-[#F5F5F5] text-[#9CA3AF]",
  },
  supplement: {
    label: "退回补充",
    className: "bg-[#FFF1F0] text-[#F5222D]",
  },
  // M07 专利创作平台状态
  processing: {
    label: "处理中",
    className: "bg-[#EAF4FF] text-[#2F80ED]",
  },
  "initial-review": {
    label: "初审中",
    className: "bg-[#E6F8FB] text-[#06B6D4]",
  },
  returned: {
    label: "退回修改",
    className: "bg-[#FFF1F0] text-[#F5222D]",
  },
  "pending-review": {
    label: "待审核",
    className: "bg-[#FFF7E6] text-[#FAAD14]",
  },
  "spec-generating": {
    label: "说明书生成中",
    className: "bg-[#F1EDFF] text-[#8B5CF6]",
  },
  "claims-writing": {
    label: "权利要求撰写中",
    className: "bg-[#E6F8FB] text-[#06B6D4]",
  },
  "full-review": {
    label: "全文件复核中",
    className: "bg-[#FFF7E6] text-[#FAAD14]",
  },
}

interface StatusBadgeProps {
  status: DisclosureStatus
  label?: string  // 可选的自定义标签
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  // 如果状态不存在，使用默认样式
  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium",
          "bg-[#F5F5F5] text-[#6B7280]",
          className
        )}
      >
        {label || status}
      </span>
    )
  }
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium",
        config.className,
        className
      )}
    >
      {label || config.label}
    </span>
  )
}
