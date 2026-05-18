/**
 * 案件状态机
 * 定义案件从创建到完成的完整状态流转规则
 */

export type CaseStatus =
  | 'draft'
  | 'assigning'
  | 'searching'
  | 'confirming'
  | 'filing'
  | 'disclosure_pending'
  | 'writing'
  | 'reviewing'
  | 'completed'
  | 'rejected'

export interface TransitionRule {
  from: CaseStatus
  to: CaseStatus
  label: string
  requiredFields?: string[]
  description?: string
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  draft: '草稿',
  assigning: '待分配',
  searching: '检索中',
  confirming: '待确认',
  filing: '立案中',
  disclosure_pending: '交底书补全中',
  writing: '撰写中',
  reviewing: '审核中',
  completed: '已完成',
  rejected: '已驳回',
}

// 状态流转规则
export const TRANSITION_RULES: TransitionRule[] = [
  { from: 'draft', to: 'assigning', label: '提交分配', description: '案件创建完成，提交分配' },
  { from: 'assigning', to: 'searching', label: '开始检索', description: '已分配工程师，开始检索' },
  { from: 'searching', to: 'confirming', label: '检索完成', description: '检索完成，等待客户确认' },
  { from: 'confirming', to: 'filing', label: '确认立案', description: '客户确认，开始立案' },
  { from: 'filing', to: 'disclosure_pending', label: '立案完成', description: '立案完成，开始交底书补全' },
  { from: 'disclosure_pending', to: 'writing', label: '开始撰写', description: '交底书补全完成，开始撰写' },
  { from: 'writing', to: 'reviewing', label: '提交审核', description: '撰写完成，提交审核' },
  { from: 'reviewing', to: 'completed', label: '审核通过', description: '审核通过，案件完成' },
  { from: 'reviewing', to: 'rejected', label: '审核驳回', description: '审核不通过，退回修改' },
  { from: 'rejected', to: 'writing', label: '重新撰写', description: '修改后重新提交撰写' },
]

// 获取允许的下一状态
export function getAllowedTransitions(status: CaseStatus): TransitionRule[] {
  return TRANSITION_RULES.filter((rule) => rule.from === status)
}

// 检查状态跳转是否合法
export function isTransitionAllowed(from: CaseStatus, to: CaseStatus): boolean {
  return TRANSITION_RULES.some((rule) => rule.from === from && rule.to === to)
}

// 获取状态流转标签
export function getTransitionLabel(from: CaseStatus, to: CaseStatus): string {
  const rule = TRANSITION_RULES.find((r) => r.from === from && r.to === to)
  return rule?.label || '状态更新'
}

// 检查状态跳转的前置条件
export async function checkTransitionPrerequisites(
  caseId: string,
  from: CaseStatus,
  to: CaseStatus,
  queryFn: (sql: string, params?: any[]) => Promise<any>
): Promise<{ valid: boolean; message?: string }> {
  if (!isTransitionAllowed(from, to)) {
    return { valid: false, message: `不允许从 ${CASE_STATUS_LABELS[from]} 跳转到 ${CASE_STATUS_LABELS[to]}` }
  }

  // 特定状态的前置条件检查
  switch (to) {
    case 'assigning':
      // 检查是否有工程师分配
      const caseResult = await queryFn('SELECT engineer_id FROM cases WHERE id = $1', [caseId])
      if (!caseResult.rows[0]?.engineer_id) {
        return { valid: false, message: '请先分配工程师' }
      }
      break

    case 'disclosure_pending':
      // 检查是否已立案（有案件文件）
      const filesResult = await queryFn('SELECT COUNT(*) as count FROM case_files WHERE case_id = $1', [caseId])
      if (parseInt(filesResult.rows[0].count) === 0) {
        return { valid: false, message: '请先上传立案材料' }
      }
      break

    case 'writing':
      // 检查是否有交底书
      const disclosureResult = await queryFn(
        'SELECT COUNT(*) as count FROM disclosure_documents WHERE case_id = $1',
        [caseId]
      )
      if (parseInt(disclosureResult.rows[0].count) === 0) {
        return { valid: false, message: '请先完成交底书' }
      }
      break

    case 'reviewing':
      // 检查是否有专利文档
      const docResult = await queryFn(
        'SELECT COUNT(*) as count FROM patent_documents WHERE case_id = $1',
        [caseId]
      )
      if (parseInt(docResult.rows[0].count) === 0) {
        return { valid: false, message: '请先完成专利文档撰写' }
      }
      break
  }

  return { valid: true }
}

// 状态流向图（用于前端展示）
export const STATUS_FLOW = [
  { status: 'draft', position: 0 },
  { status: 'assigning', position: 1 },
  { status: 'searching', position: 2 },
  { status: 'confirming', position: 3 },
  { status: 'filing', position: 4 },
  { status: 'disclosure_pending', position: 5 },
  { status: 'writing', position: 6 },
  { status: 'reviewing', position: 7 },
  { status: 'completed', position: 8 },
]

export function getStatusProgress(status: CaseStatus): number {
  const flow = STATUS_FLOW.find((s) => s.status === status)
  if (!flow) return 0
  return Math.round((flow.position / (STATUS_FLOW.length - 1)) * 100)
}
