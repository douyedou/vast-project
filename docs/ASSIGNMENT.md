# VAST 8.0 五人并行开发分工表

> 后端 38 个 API 已全部完成，当前核心任务是**前端组件 Mock 数据替换为真实 API 调用**。约 55 个组件待改造。

---

## 参考范例（先看这些，照着写）

| 组件 | 文件路径 | 连调 API | 关键技术 |
|------|----------|----------|----------|
| 全部案件列表 | `components/vast/m09/all-cases-list.tsx` | `GET /api/cases` | useEffect + fetch + 状态流转 |
| 案件详情 | `components/vast/m09/case-detail.tsx` | `GET /api/cases/:id` | 路由参数 + 详情展示 |
| 发起咨询表单 | `components/vast/presale-form.tsx` | `POST /api/cases` | 表单校验 + 文件上传 |
| 资源库 | `components/vast/m10/resource-library.tsx` | `GET /api/ai/rag` | RAG 检索展示 |

**学习路径**：打开 `all-cases-list.tsx`，看 `useEffect` 怎么调 API、`loadTransitions` 怎么调状态机、`doTransition` 怎么执行状态流转。

---

## 同学 A：M05 立案 + 公共组件

### 范围
M05 立案模块剩余页面 + 几个跨模块公共组件。

### 组件清单（12 个）

| 优先级 | 组件 | 文件 | 对应 API | 难度 |
|--------|------|------|----------|------|
| P0 | 立案看板 | `m05/consultation-filing-dashboard.tsx` | `GET /api/cases`（统计） | ⭐⭐ |
| P0 | 售前仪表盘 | `presale/presale-dashboard.tsx` | `GET /api/cases` | ⭐⭐ |
| P0 | 售前工单列表 | `presale/presale-ticket-list.tsx` | `GET /api/cases` | ⭐⭐ |
| P1 | 售前工单详情 | `presale/presale-ticket-detail.tsx` | `GET /api/cases/:id` | ⭐⭐ |
| P1 | 分派页面 | `assign-page.tsx` | `PUT /api/cases/:id/assign` | ⭐⭐⭐ |
| P1 | 立案表单 | `filing-form.tsx` | `POST /api/cases` | ⭐⭐ |
| P2 | 等待立案列表 | `waiting-filing-list.tsx` | `GET /api/cases?status=filing` | ⭐⭐ |
| P2 | 来源列表 | `source-list.tsx` | `GET /api/cases` | ⭐ |
| P2 | 来源详情 | `source-detail.tsx` | `GET /api/cases/:id` | ⭐ |
| P2 | 状态标签 | `status-badge.tsx` | 无（纯 UI） | ⭐ |

### 核心目标
- **立案全流程跑通**：发起咨询 → 工单列表 → 工单详情 → 立案分派
- 公共组件 `assign-page` 要能真正修改案件的 `engineer_id`

### 阻塞依赖
- 无（后端 API 已全通）

---

## 同学 B：M07 撰写中心 + M08 质检审核

### 范围
专利撰写全流程 + 质检审核全流程。这是**用户体验的核心路径**。

### 组件清单（12 个）

| 优先级 | 组件 | 文件 | 对应 API | 难度 |
|--------|------|------|----------|------|
| P0 | 撰写仪表盘 | `m07/creation-dashboard.tsx` | `GET /api/cases`（统计） | ⭐⭐ |
| P0 | 说明书起草页 | `m07/spec-draft-page.tsx` | `GET/POST /api/cases/:id/documents` | ⭐⭐⭐ |
| P0 | 权利要求书 | `m07/claims-writing-page.tsx` | `GET/POST /api/cases/:id/documents` | ⭐⭐⭐ |
| P0 | OnlyOffice 编辑器 | `m07/onlyoffice-editor.tsx` | OnlyOffice API | ⭐⭐⭐⭐ |
| P0 | 五书页面 | `m07/five-books-page.tsx` | `GET /api/cases/:id/documents` | ⭐⭐⭐ |
| P0 | 提交审核页 | `m07/submit-m08-page.tsx` | `POST /api/reviews` | ⭐⭐ |
| P1 | 双文档工作台 | `m07/dual-doc-workspace.tsx` | `GET /api/cases/:id/documents` | ⭐⭐⭐ |
| P1 | 全文审核页 | `m07/full-review-page.tsx` | `GET /api/cases/:id/documents` | ⭐⭐⭐ |
| P1 | 质检仪表盘 | `m08/review-dashboard.tsx` | `GET /api/reviews` | ⭐⭐ |
| P1 | 审核任务详情 | `m08/review-task-detail.tsx` | `GET /api/reviews/:id` | ⭐⭐ |
| P1 | 交底书审核 | `m08/disclosure-review.tsx` | `GET/PUT /api/reviews/:id` | ⭐⭐⭐ |
| P1 | 审核决策 | `m08/review-decision.tsx` | `PUT /api/reviews/:id` | ⭐⭐⭐ |

### 核心目标
- **撰写 → 保存 → 提交审核 → 审核详情 → 审核决策** 全流程跑通
- **OnlyOffice 浏览器真机验证**：能打开编辑器、编辑内容、保存回调入库

### 重点难点
- `onlyoffice-editor.tsx` 需要对接 `app/api/onlyoffice/route.ts` 和 `app/api/onlyoffice/callback/route.ts`
- 文档下载路由 `app/api/onlyoffice/document/[id]/route.ts` 已通，直接调用

### 阻塞依赖
- 无（后端 API + OnlyOffice 容器已全通）

---

## 同学 C：M09 案件管理 + M10 资源中心 + 系统设置 + 首页

### 范围
案件库统计看板、各状态案件列表、系统管理、首页数据。

### 组件清单（15 个）

| 优先级 | 组件 | 文件 | 对应 API | 难度 |
|--------|------|------|----------|------|
| P0 | 案件仪表盘 | `m09/case-dashboard.tsx` | `GET /api/cases`（统计聚合） | ⭐⭐ |
| P0 | 等待处理案件 | `m09/waiting-cases.tsx` | `GET /api/cases?status=xxx` | ⭐⭐ |
| P0 | 废弃案件 | `m09/scrap-cases.tsx` | `GET /api/cases?status=rejected` | ⭐⭐ |
| P1 | 保护中心 | `m09/protection-center.tsx` | `GET /api/cases`（筛选） | ⭐⭐ |
| P1 | 知识产权库 | `m09/national-ip.tsx` | `GET /api/cases` | ⭐⭐ |
| P1 | 知识资产 | `m09/knowledge-assets.tsx` | `GET /api/ai/rag` | ⭐⭐ |
| P1 | 资源仪表盘 | `m10/resource-dashboard.tsx` | `GET /api/ai/rag` | ⭐⭐ |
| P2 | 权限管理 | `system/permission-management.tsx` | `GET/POST /api/permissions` | ⭐⭐⭐ |
| P2 | 角色管理 | `system/role-management.tsx` | `GET/POST /api/roles` | ⭐⭐⭐ |
| P2 | 系统设置 | `system/system-settings.tsx` | `GET/PUT /api/settings` | ⭐⭐ |
| P2 | 首页仪表盘 | `home-dashboard.tsx` | `GET /api/dashboard/stats` | ⭐⭐ |
| P2 | 全局仪表盘 | `dashboard.tsx` | `GET /api/dashboard/stats` | ⭐⭐ |
| P2 | 侧边栏 | `app-sidebar.tsx` | 无（静态导航） | ⭐ |

> 已完成的参考：`all-cases-list.tsx`、`case-detail.tsx`、`resource-library.tsx`、`user-management.tsx`

### 核心目标
- 案件统计看板数据真实（各状态案件数、趋势图）
- 系统设置（用户/角色/权限）CRUD 可用
- 首页数据从后端实时获取

### 阻塞依赖
- 无

---

## 同学 D：M06 交底书引擎 + AI 核心功能

### 范围
交底书补全流程（16 个组件）+ AI 能力真正可用。

### 组件清单（16 个）

| 优先级 | 组件 | 文件 | 对应 API | 难度 |
|--------|------|------|----------|------|
| P0 | 交底书仪表盘 | `m06/p01-dashboard.tsx` | `GET /api/cases/:id/disclosure` | ⭐⭐ |
| P0 | 事实结构化 | `m06/fact-structuring.tsx` | `GET/PUT /api/cases/:id/disclosure` | ⭐⭐⭐ |
| P0 | 交底书补全 | `m06/disclosure-supplement.tsx` | `GET/PUT /api/cases/:id/disclosure` | ⭐⭐⭐ |
| P0 | 快速补全模式 | `m06/supplement-fast-mode.tsx` | `POST /api/ai/generate` | ⭐⭐⭐ |
| P0 | 专家补全模式 | `m06/supplement-expert-mode.tsx` | `POST /api/ai/generate` | ⭐⭐⭐ |
| P0 | 模式选择 | `m06/supplement-mode-selection.tsx` | 无（纯 UI） | ⭐ |
| P1 | 模型列表 | `m06/model-list.tsx` | `GET /api/cases/:id/disclosure` | ⭐⭐ |
| P1 | 模型详情 | `m06/model-detail.tsx` | `GET /api/cases/:id/disclosure` | ⭐⭐ |
| P1 | 创建模型 | `m06/create-model.tsx` | `POST /api/cases/:id/disclosure` | ⭐⭐⭐ |
| P1 | 关联建模 | `m06/relation-modeling.tsx` | `GET/PUT /api/cases/:id/disclosure` | ⭐⭐⭐ |
| P1 | 新颖性检索 | `m06/second-search.tsx` | `POST /api/ai/rag` | ⭐⭐⭐ |
| P1 | 现有技术对比 | `m06/prior-art-comparison.tsx` | `POST /api/ai/rag` | ⭐⭐⭐ |
| P1 | 完整性校验 | `m06/completeness-validation.tsx` | `POST /api/ai/detect` | ⭐⭐⭐ |
| P1 | AI 质检 | `m06/ai-inspection.tsx` | `POST /api/ai/detect` | ⭐⭐⭐ |
| P1 | 交底书打包 | `m06/disclosure-package.tsx` | `GET /api/cases/:id/disclosure` | ⭐⭐ |
| P1 | 提交 M07 | `m06/submit-m07.tsx` | `PUT /api/cases/:id/status` | ⭐⭐ |

### AI 核心任务（深水区）

| 任务 | 说明 | 涉及后端 |
|------|------|----------|
| RAG 检索质量优化 | 当前 13 条知识库太少，5 问错 3。需要扩充数据量或优化分块策略 | `app/api/ai/rag/route.ts` |
| AI 说明书生成 | 交底书 → 技术领域/背景技术/具体实施方式 | `app/api/ai/generate/route.ts` |
| AI 权利要求书生成 | 技术方案 → 独立权利要求 + 从属权利要求 | `app/api/ai/generate/route.ts` |
| AI 率检测前端接入 | M08 质检页面调用 `/api/ai/detect` | `app/api/ai/detect/route.ts` |
| Prompt 模板工程 | 把硬编码 prompt 抽成可配置模板 | `lib/ai-service.ts` |

### 核心目标
- 交底书补全流程：P01 仪表盘 → 事实结构化 → 补全（快速/专家）→ 完整性校验 → 提交 M07
- AI 生成功能真正有实用价值（不是玩具）

### 阻塞依赖
- 如需改表结构（RAG 分块需要 `knowledge_chunks` 表），需同步更新 `docs/schema.sql` 并通知全员

---

## 同学 E：测试 + 部署收尾（阶段性）

### 当前已完成
- ✅ Docker Compose 全栈编排

### 后续任务（项目后期）
| 阶段 | 任务 |
|------|------|
| 中期 | 帮 A/B/C/D code review，处理公共 Bug |
| 后期 | 整站走查测试，记录 bug 清单 |
| 后期 | 部署文档 `DEPLOY.md` |
| 后期 | 生产环境 Docker 优化 |

---

## 各模块 API 速查

所有后端 API 已通，前端直接调用即可：

```
GET    /api/cases                  案件列表
POST   /api/cases                  创建案件
GET    /api/cases/:id              案件详情
PUT    /api/cases/:id              更新案件
PUT    /api/cases/:id/assign       分派工程师
GET    /api/cases/:id/transitions  查询下一状态
POST   /api/cases/:id/transition   执行状态流转

GET    /api/cases/:id/disclosure   交底书详情
PUT    /api/cases/:id/disclosure   更新交底书

GET    /api/cases/:id/documents    专利文档列表
POST   /api/cases/:id/documents    创建专利文档
PUT    /api/cases/:id/documents/:docId 更新文档

GET    /api/reviews                审核列表
POST   /api/reviews                提交审核
GET    /api/reviews/:id            审核详情
PUT    /api/reviews/:id            更新审核

GET    /api/users                  用户列表
POST   /api/users                  创建用户
GET    /api/roles                  角色列表
GET    /api/permissions            权限列表

POST   /api/ai/generate            AI 文本生成
POST   /api/ai/detect              AI 率检测
GET    /api/ai/rag                 RAG 检索问答

GET    /api/onlyoffice             OnlyOffice 配置
POST   /api/onlyoffice/callback    OnlyOffice 回调
GET    /api/onlyoffice/document/:id 文档下载
```

完整 API 文档见各 `app/api/xxx/route.ts` 文件内的注释。

---

## 协作规则

1. **每天开工先 pull**：`git pull origin main`
2. **commit 前再 pull**：避免冲突
3. **commit 消息规范**：`feat: M05 添加xxx功能`、`fix: M07 修复xxx问题`
4. **改公共文件要通知**：改 `lib/`、`app/api/`、`docs/schema.sql` 等公共文件时群里喊一声
5. **D 同学改表结构要同步**：如需新增表/字段，更新 `docs/schema.sql` 并通知全员 `docker-compose down -v && docker-compose up -d` 重置
