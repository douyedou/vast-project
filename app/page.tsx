"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/vast/app-header"
import { AppSidebar } from "@/components/vast/app-sidebar"
// 登录和首页
import { LoginPage } from "@/components/vast/login-page"
import { HomeDashboard } from "@/components/vast/home-dashboard"
// M05 咨询立案组件
import { ConsultationFilingDashboard } from "@/components/vast/m05/consultation-filing-dashboard"
import { ConsultationFilingList } from "@/components/vast/m05/consultation-filing-list"
import { PresaleTicketDetail } from "@/components/vast/presale/presale-ticket-detail"
import { PresaleForm } from "@/components/vast/presale-form"
// M06 组件
import { EngineDashboard as P01Dashboard } from "@/components/vast/m06/p01-dashboard"
import { ModelList } from "@/components/vast/m06/model-list"
import { CreateModel } from "@/components/vast/m06/create-model"
import { ModelDetail } from "@/components/vast/m06/model-detail"
import { AIInspection } from "@/components/vast/m06/ai-inspection"
import { DisclosureSupplement } from "@/components/vast/m06/disclosure-supplement"
import { SupplementModeSelection } from "@/components/vast/m06/supplement-mode-selection"
import { SupplementFastMode } from "@/components/vast/m06/supplement-fast-mode"
import { SupplementExpertMode } from "@/components/vast/m06/supplement-expert-mode"
import { SecondSearch } from "@/components/vast/m06/second-search"
import { PriorArtComparison } from "@/components/vast/m06/prior-art-comparison"
import { FactStructuring } from "@/components/vast/m06/fact-structuring"
import { RelationModeling } from "@/components/vast/m06/relation-modeling"
import { CompletenessValidation } from "@/components/vast/m06/completeness-validation"
import { DisclosurePackage } from "@/components/vast/m06/disclosure-package"
import { SubmitM07 } from "@/components/vast/m06/submit-m07"
import { VersionLogs } from "@/components/vast/m06/version-logs"
// M07 组件
import { CreationDashboard } from "@/components/vast/m07/creation-dashboard"
import { CreationTaskList } from "@/components/vast/m07/creation-task-list"
import { DualDocWorkspace } from "@/components/vast/m07/dual-doc-workspace"
import { SpecDraftPage } from "@/components/vast/m07/spec-draft-page"
import { ClaimsWritingPage } from "@/components/vast/m07/claims-writing-page"
import { FullReviewPage } from "@/components/vast/m07/full-review-page"
import { FiveBooksPage } from "@/components/vast/m07/five-books-page"
import { SubmitM08Page } from "@/components/vast/m07/submit-m08-page"
// M08 组件
import { ReviewDashboard } from "@/components/vast/m08/review-dashboard"
import { ReviewTaskList } from "@/components/vast/m08/review-task-list"
import { ReviewTaskDetail } from "@/components/vast/m08/review-task-detail"
import { DisclosureReviewPage } from "@/components/vast/m08/disclosure-review"
import { ReviewDecisionPage } from "@/components/vast/m08/review-decision"
// M09 组件
import { CaseDashboard } from "@/components/vast/m09/case-dashboard"
import { AllCasesList } from "@/components/vast/m09/all-cases-list"
import { CaseDetail } from "@/components/vast/m09/case-detail"
import { WaitingCases } from "@/components/vast/m09/waiting-cases"
import { ProtectionCenter } from "@/components/vast/m09/protection-center"
import { NationalIP } from "@/components/vast/m09/national-ip"
import { ScrapCases } from "@/components/vast/m09/scrap-cases"
import { KnowledgeAssets } from "@/components/vast/m09/knowledge-assets"
// M10 组件
import { ResourceDashboard } from "@/components/vast/m10/resource-dashboard"
import { ResourceLibrary } from "@/components/vast/m10/resource-library"
// 系统设置组件
import { SystemSettings } from "@/components/vast/system/system-settings"
import { RoleManagement } from "@/components/vast/system/role-management"
import { UserManagement } from "@/components/vast/system/user-management"
import { PermissionManagement } from "@/components/vast/system/permission-management"

type Page =
  // 首页和登录
  | "login"
  | "home"
  // M05 咨询立案页面
  | "m05-dashboard"
  | "m05-new"
  | "m05-list"
  | "m05-detail"
  | "m05-assigning"
  | "m05-searching"
  | "m05-confirming"
  | "m05-filing"
  | "m05-completed"
  | "m05-rejected"
  // M06 页面 - 交底书引擎模块（P01-P13）
  | "m06-p01-dashboard"        // P01 交底书任务工作台
  | "m06-p02-decomposition"    // P02 交底书解构
  | "m06-p03-ai-inspection"    // P03 AI初检与专利检索
  | "m06-p04-supplement"       // P04 交底书补全
  | "m06-p04-fast"             // P04 极速补全
  | "m06-p04-expert"           // P04 专家补全
  | "m06-p05-final-disclosure" // P05 完整交底书生成
  | "m06-p06-second-search"    // P06 二次AI检索
  | "m06-p07-prior-art"        // P07 现有技术对比
  | "m06-p08-relation-mapping" // P08 技术方案关系建模
  | "m06-p09-assets"           // P09 结构化资产管理
  | "m06-p10-quality"          // P10 质量控制
  | "m06-p11-package"          // P11 可撰写数据包生成
  | "m06-p12-submit"           // P12 提交M07确认
  | "m06-p13-version"          // P13 版本与日志
  // M07 页面
  | "m07-dashboard"
  | "m07-list"
  | "m07-detail"
  | "m07-workspace"
  | "m07-spec-draft"
  | "m07-spec-edit"
  | "m07-claims"
  | "m07-review"
  | "m07-five-books"
  | "m07-submit"
  | "m07-return"
  // M08 页面
  | "m08-dashboard"
  | "m08-task-list"
  | "m08-task-detail"
  | "m08-disclosure-review"
  | "m08-review-decision"
  // M09 页面
  | "m09-dashboard"
  | "m09-all-cases"
  | "m09-case-detail"
  | "m09-waiting-cases"
  | "m09-protection-center"
  | "m09-national-ip"
  | "m09-scrap-cases"
  | "m09-knowledge-assets"
  // M10 页面
  | "m10-dashboard"
  | "m10-terminology"
  | "m10-template"
  | "m10-specification"
  | "m10-drawing"
  | "m10-formula"
  | "m10-ipc"
  | "m10-citation"
  | "m10-quality-rules"
  | "m10-claims-phrase"
  | "m10-sample"
  | "m10-statistics"
  // 系统设置页面
  | "sys-settings"
  | "sys-roles"
  | "sys-permissions"
  | "sys-users"
  | "sys-org"
  | "sys-notifications"
  | "sys-integration"
  | "sys-logs"

const PAGE_ALIASES: Record<string, Page> = {
  "m06-dashboard": "m06-p01-dashboard",
  "m06-model-list": "m06-p01-dashboard",
  "m06-model-detail": "m06-p02-decomposition",
  "m06-create-model": "m06-p02-decomposition",
  "m06-ai-inspection": "m06-p03-ai-inspection",
  "m06-supplement": "m06-p04-supplement",
  "m06-p04-supplement-mode": "m06-p04-supplement",
  "m06-second-search": "m06-p06-second-search",
  "m06-prior-art": "m06-p07-prior-art",
  "m06-validation": "m06-p10-quality",
  "m06-package": "m06-p11-package",
  "m06-submit-m07": "m06-p12-submit",
  "m06-p13-version-logs": "m06-p13-version",
}

function normalizePage(page: string): Page {
  return PAGE_ALIASES[page] || (page as Page)
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>("login")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('vast_token')
    if (token) {
      // 验证 token 有效性
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.code === 200) {
            setCurrentUser(data.data)
            setIsLoggedIn(true)
            setCurrentPage("home")
          } else {
            localStorage.removeItem('vast_token')
          }
        })
        .catch(() => localStorage.removeItem('vast_token'))
    }
  }, [])

  const handleLogin = (user: any) => {
    setCurrentUser(user)
    setIsLoggedIn(true)
    setCurrentPage("home")
  }

  const handleLogout = () => {
    localStorage.removeItem('vast_token')
    setCurrentUser(null)
    setIsLoggedIn(false)
    setCurrentPage("login")
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(normalizePage(page))
  }

  const handleM06ViewDetail = (id: string) => {
    setSelectedCaseId(id)
    setCurrentPage("m06-p02-decomposition")
  }

  const handleM07ViewDetail = (id: string) => {
    setSelectedCaseId(id)
    setCurrentPage("m07-detail")
  }

  const handleViewCaseDetail = (id: string) => {
    setSelectedCaseId(id)
    setCurrentPage("m09-case-detail")
  }

  const handleM06Back = () => {
    setCurrentPage("m06-p01-dashboard")
  }

  const handleM06BackToList = () => {
    setCurrentPage("m06-p01-dashboard")
  }

  const handleM07Back = () => {
    setCurrentPage("m07-dashboard")
  }

  const handleM07BackToList = () => {
    setCurrentPage("m07-list")
  }

  const getSidebarActiveItem = () => {
    if (currentPage === "m05-new") return "m05-new"
    if (currentPage === "m05-detail") return "m05-list"
    if (currentPage === "m07-detail") return "m07-list"
    if (currentPage === "m07-spec-edit") return "m07-spec-draft"
    if (currentPage === "m07-return") return "m07-dashboard"
    return currentPage
  }

  const renderContent = () => {
    switch (currentPage) {
      // 首页
      case "home":
        return <HomeDashboard onNavigate={handleNavigate} />
      
      // M05 咨询立案页面
      case "m05-dashboard":
        return <ConsultationFilingDashboard onNavigate={handleNavigate} />
      case "m05-new":
        return <PresaleForm onBack={() => setCurrentPage("m05-dashboard")} />
      case "m05-list":
        return <ConsultationFilingList onNavigate={handleNavigate} />
      case "m05-detail":
        return <PresaleTicketDetail onBack={() => setCurrentPage("m05-list")} onNavigate={handleNavigate} />
      case "m05-assigning":
        return <ConsultationFilingList onNavigate={handleNavigate} filterStatus="assigning" />
      case "m05-searching":
        return <ConsultationFilingList onNavigate={handleNavigate} filterStatus="searching" />
      case "m05-confirming":
        return <ConsultationFilingList onNavigate={handleNavigate} filterStatus="confirming" />
      case "m05-filing":
        return <ConsultationFilingList onNavigate={handleNavigate} filterStatus="filing" />
      case "m05-completed":
        return <ConsultationFilingList onNavigate={handleNavigate} filterStatus="completed" />
      case "m05-rejected":
        return <ConsultationFilingList onNavigate={handleNavigate} filterStatus="rejected" />

      // M06 页面
      case "m06-p01-dashboard":
        return (
          <P01Dashboard
            onNavigate={handleNavigate}
            onOpenCase={(caseId, page) => {
              setSelectedCaseId(caseId)
              setCurrentPage(normalizePage(page || "m06-p02-decomposition"))
            }}
          />
        )
      case "m06-p02-decomposition":
        return (
          <ModelDetail
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p01-dashboard")}
            onNavigate={handleNavigate}
          />
        )
      case "m06-p03-ai-inspection":
        return (
          <AIInspection
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p02-decomposition")}
            onContinue={() => setCurrentPage("m06-p04-supplement")}
          />
        )
      case "m06-p04-supplement":
        return (
          <SupplementModeSelection
            onBack={() => setCurrentPage("m06-p02-decomposition")}
            onGoInspection={() => setCurrentPage("m06-p03-ai-inspection")}
            onSelectMode={(mode) => {
              setCurrentPage("m06-p05-final-disclosure")
            }}
          />
        )
      case "m06-p04-fast":
        return (
          <SupplementFastMode
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p04-supplement")}
            onNext={() => setCurrentPage("m06-p05-final-disclosure")}
          />
        )
      case "m06-p04-expert":
        return (
          <SupplementExpertMode
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p04-supplement")}
            onNext={() => setCurrentPage("m06-p05-final-disclosure")}
          />
        )
      case "m06-p05-final-disclosure":
        return (
          <DisclosureSupplement
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p04-supplement")}
            onNext={() => setCurrentPage("m06-p06-second-search")}
          />
        )
      case "m06-p06-second-search":
        return (
          <SecondSearch
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p05-final-disclosure")}
            onNext={() => setCurrentPage("m06-p07-prior-art")}
          />
        )
      case "m06-p07-prior-art":
        return (
          <PriorArtComparison
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p06-second-search")}
            onNext={() => setCurrentPage("m06-p08-relation-mapping")}
          />
        )
      case "m06-p08-relation-mapping":
        return (
          <RelationModeling
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p07-prior-art")}
            onNext={() => setCurrentPage("m06-p09-assets")}
          />
        )
      case "m06-p09-assets":
        return (
          <FactStructuring
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p08-relation-mapping")}
            onNext={() => setCurrentPage("m06-p10-quality")}
          />
        )
      case "m06-p10-quality":
        return (
          <CompletenessValidation
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p09-assets")}
            onNext={() => setCurrentPage("m06-p11-package")}
            onNavigate={handleNavigate}
          />
        )
      case "m06-p11-package":
        return (
          <DisclosurePackage
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p10-quality")}
            onNext={() => setCurrentPage("m06-p12-submit")}
            onNavigate={handleNavigate}
          />
        )
      case "m06-p12-submit":
        return (
          <SubmitM07
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p11-package")}
            onSubmit={() => setCurrentPage("m07-dashboard")}
            onNavigate={handleNavigate}
          />
        )
      case "m06-p13-version":
        return (
          <VersionLogs
            caseId={selectedCaseId}
            onBack={() => setCurrentPage("m06-p01-dashboard")}
            onNavigate={handleNavigate}
          />
        )

      // M07 页面
      case "m07-dashboard":
        return <CreationDashboard onNavigate={handleNavigate} />
      case "m07-list":
        return <CreationTaskList onViewDetail={handleM07ViewDetail} />
      case "m07-workspace":
        return <DualDocWorkspace onBack={handleM07Back} />
      case "m07-spec-draft":
        return (
          <SpecDraftPage
            onBack={handleM07Back}
            onEdit={() => setCurrentPage("m07-workspace")}
          />
        )
      case "m07-claims":
        return <ClaimsWritingPage onBack={handleM07Back} />
      case "m07-review":
        return (
          <FullReviewPage
            onBack={handleM07Back}
            onSubmit={() => setCurrentPage("m07-submit")}
          />
        )
      case "m07-five-books":
        return (
          <FiveBooksPage
            onBack={handleM07Back}
            onSubmit={() => setCurrentPage("m07-submit")}
          />
        )
      case "m07-submit":
        return <SubmitM08Page onBack={handleM07Back} onNavigate={handleNavigate} />

      // M08 页面
      case "m08-dashboard":
        return <ReviewDashboard onNavigate={handleNavigate} />
      case "m08-task-list":
        return <ReviewTaskList onNavigate={handleNavigate} />
      case "m08-task-detail":
        return <ReviewTaskDetail onNavigate={handleNavigate} />
      case "m08-disclosure-review":
        return <DisclosureReviewPage onNavigate={handleNavigate} />
      case "m08-review-decision":
        return <ReviewDecisionPage onNavigate={handleNavigate} />

      // M09 页面
      case "m09-dashboard":
        return <CaseDashboard onNavigate={handleNavigate} />
      case "m09-all-cases":
        return <AllCasesList onNavigate={handleNavigate} onViewDetail={handleViewCaseDetail} />
      case "m09-case-detail":
        return <CaseDetail onNavigate={handleNavigate} caseId={selectedCaseId} />
      case "m09-waiting-cases":
        return <WaitingCases onNavigate={handleNavigate} />
      case "m09-protection-center":
        return <ProtectionCenter onNavigate={handleNavigate} />
      case "m09-national-ip":
        return <NationalIP onNavigate={handleNavigate} />
      case "m09-scrap-cases":
        return <ScrapCases onNavigate={handleNavigate} />
      case "m09-knowledge-assets":
        return <KnowledgeAssets onNavigate={handleNavigate} />

      // M10 页面
      case "m10-dashboard":
        return <ResourceDashboard onNavigate={handleNavigate} />
      case "m10-terminology":
        return <ResourceLibrary libraryType="terminology" onNavigate={handleNavigate} />
      case "m10-template":
        return <ResourceLibrary libraryType="template" onNavigate={handleNavigate} />
      case "m10-specification":
        return <ResourceLibrary libraryType="specification" onNavigate={handleNavigate} />
      case "m10-drawing":
        return <ResourceLibrary libraryType="drawing" onNavigate={handleNavigate} />
      case "m10-formula":
        return <ResourceLibrary libraryType="formula" onNavigate={handleNavigate} />
      case "m10-ipc":
        return <ResourceLibrary libraryType="ipc" onNavigate={handleNavigate} />
      case "m10-citation":
        return <ResourceLibrary libraryType="citation" onNavigate={handleNavigate} />
      case "m10-quality-rules":
        return <ResourceLibrary libraryType="rules" onNavigate={handleNavigate} />
      case "m10-claims-phrase":
        return <ResourceLibrary libraryType="claims" onNavigate={handleNavigate} />
      case "m10-sample":
        return <ResourceLibrary libraryType="samples" onNavigate={handleNavigate} />
      case "m10-statistics":
        return <ResourceLibrary libraryType="samples" onNavigate={handleNavigate} />

      // 系统设置页面
      case "sys-settings":
        return <SystemSettings onNavigate={handleNavigate} />
      case "sys-roles":
        return <RoleManagement onNavigate={handleNavigate} />
      case "sys-permissions":
        return <PermissionManagement onNavigate={handleNavigate} />
      case "sys-users":
        return <UserManagement onNavigate={handleNavigate} />
      case "sys-org":
      case "sys-notifications":
      case "sys-integration":
      case "sys-logs":
        return <SystemSettings onNavigate={handleNavigate} />

      default:
        return <ConsultationFilingDashboard onNavigate={handleNavigate} />
    }
  }

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  // 已登录但未获取到用户信息，显示 loading
  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <AppHeader user={currentUser} onLogout={handleLogout} />
      <div className="flex h-[calc(100vh-56px)]">
        <AppSidebar
          activeItem={getSidebarActiveItem()}
          onNavigate={handleNavigate}
        />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  )
}
