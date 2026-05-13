# E 的前三天施工方案

## 施工原则
1. 每完成一个阶段，产生可验证的交付物
2. 不阻塞 A/B/C/D 的并行工作
3. 代码即文档，尽量减少额外文档

---

## Day 1 上午：数据库 Schema + 连接（硬阻塞）

### 任务 1.1：设计 ER 图
产出物：`docs/er-diagram.png`（用 draw.io / dbdiagram.io 画）

核心实体关系：
- users 1:N cases（一个交案人创建多个案件）
- users 1:N patent_documents（一个工程师撰写多个文档）
- cases 1:N case_files
- cases 1:N case_status_history
- cases 1:1 disclosure_documents
- cases 1:N patent_documents
- cases 1:N reviews

### 任务 1.2：编写 schema.sql
产出物：`docs/schema.sql`

包含 14 张表：
users, roles, permissions, role_permissions,
cases, case_files, case_status_history,
disclosure_documents, knowledge_base, terminology,
patent_documents, document_versions, edit_logs,
reviews, review_items

每张表包含：字段定义、主键、外键、索引、注释

### 任务 1.3：搭建数据库连接
产出物：
- `lib/db.ts` — PostgreSQL 连接池（用 pg 或 better-sqlite3）
- `.env.example` — 数据库连接字符串模板

技术选型建议（轻量化，适合学生项目）：
- 主数据库：SQLite（零配置，文件即数据库）或 PostgreSQL
- 向量库：ChromaDB（Python 服务）或 sqlite-vec（纯 JS）

### 验收标准
```bash
npm run db:init    # 一键创建所有表
npm run db:seed    # 插入测试数据
# 预期：14 张表创建成功，无报错
```

---

## Day 1 下午：API 规范 + 响应格式（强阻塞）

### 任务 1.4：统一 API 响应封装
产出物：`lib/api-response.ts`

```typescript
// 成功响应
success<T>(data: T, message?: string)
// 失败响应  
error(message: string, code?: number, statusCode?: number)
// 分页响应
paginate<T>(list: T[], total: number, page: number, pageSize: number)
```

### 任务 1.5：全局错误处理中间件
产出物：`app/api/_middleware/error.ts`

捕获所有未处理异常，统一返回：
```json
{ "code": 500, "data": null, "message": "内部服务器错误" }
```

### 任务 1.6：API 接口规范文档
产出物：`docs/api-spec-v1.md`

每个模块的接口清单（方法、路径、请求参数、响应格式）
基于之前列出的清单细化到字段级别

### 验收标准
```bash
# 任意一个测试接口返回：
GET /api/health
# 预期：{ "code": 200, "data": { "status": "ok" }, "message": "success" }
```

---

## Day 1 晚上：JWT 鉴权框架（强阻塞）

### 任务 1.7：JWT 工具函数
产出物：`lib/jwt.ts`

```typescript
sign(payload: object, expiresIn?: string): string
verify(token: string): object | null
```

### 任务 1.8：鉴权中间件
产出物：`middleware/auth.ts`

```typescript
// 验证 Token，将 user 信息注入请求
requireAuth(req): Promise<User>
// 可选：验证角色权限
requireRole(...roles: string[])
```

### 任务 1.9：登录接口（框架）
产出物：`app/api/auth/login/route.ts`

前端可调用的登录接口：
```
POST /api/auth/login
Body: { username, password }
Response: { code: 200, data: { token, user }, message: "success" }
```

**注意**：密码校验逻辑由 B 后续填充，现在先用 Mock 数据让接口能跑通

### 验收标准
```bash
POST /api/auth/login
Body: { "username": "test", "password": "123456" }
# 预期返回 token，后续请求 Header 带 Bearer <token> 可访问受保护接口
```

---

## Day 2：本地 LLM + 文件上传（中等阻塞）

### 任务 2.1：安装 Ollama + 拉取模型

```bash
# 安装 Ollama（跨平台）
# Windows: 下载安装包 https://ollama.com/download
# 拉取模型（选择轻量级模型）
ollama pull qwen2.5:7b    # 中文效果好，7B 参数，约 4GB
```

### 任务 2.2：封装 AI 服务层
产出物：`lib/ai-service.ts`

```typescript
// 统一 LLM 调用
async generate(prompt: string, options?: GenerateOptions): Promise<string>
// 文本向量化（用于 RAG）
async embed(text: string): Promise<number[]>
// AI 率检测（简化版：基于 perplexity 或本地分类器）
async detectAI(text: string): Promise<{ aiRate: number, flagged: string[] }>
```

内部调用 Ollama HTTP API：
```
POST http://localhost:11434/api/generate
```

### 任务 2.3：文件上传中间件
产出物：`lib/upload.ts`

基于 multer，封装：
```typescript
// 单文件上传
upload.single(fieldName): Middleware
// 多文件上传
upload.array(fieldName, maxCount): Middleware
// 存储路径：/uploads/cases/:caseId/
```

### 任务 2.4：文件解析工具
产出物：`lib/file-parser.ts`

```typescript
// PDF 文本提取
parsePDF(buffer: Buffer): Promise<string>
// Word 文本提取
parseWord(buffer: Buffer): Promise<string>
// 图片 OCR（调用 PaddleOCR 或 LLM 视觉模型）
parseImage(buffer: Buffer): Promise<string>
```

### 验收标准
```bash
# 测试 AI 生成
POST /api/ai/test
Body: { "prompt": "生成一段关于智能温控系统的技术描述" }
# 预期返回生成的文本

# 测试文件上传
POST /api/upload/test
FormData: file=@test.pdf
# 预期返回 { url: "/uploads/xxx.pdf", text: "提取的文本内容" }
```

---

## Day 3：向量数据库 + WebSocket 框架（弱阻塞）

### 任务 3.1：向量数据库封装
产出物：`lib/vector-db.ts`

技术选型：sqlite-vec（纯 JS，零配置）或 ChromaDB Client

```typescript
// 添加文档到知识库
async addDocument(id: string, text: string, metadata: object): Promise<void>
// 语义检索
async search(query: string, topK?: number): Promise<SearchResult[]>
// 术语库查询
async searchTerminology(keyword: string, field?: string): Promise<Term[]>
```

### 任务 3.2：WebSocket 服务框架
产出物：`websocket/collab-server.ts`

技术选型：Socket.io（Next.js 原生支持困难，建议独立 Node 服务）

```typescript
// 事件定义
io.on("connection", (socket) => {
  socket.on("join-document", (docId) => { ... })
  socket.on("edit-paragraph", (data) => { ... })
  socket.on("release-paragraph", (data) => { ... })
})
```

**注意**：WebSocket 服务作为独立进程运行，D 在第 3 周接入

### 任务 3.3：段落锁实现（简化版 OT）
产出物：`websocket/paragraph-lock.ts`

```typescript
// 申请编辑锁
acquireLock(docId: string, paragraphId: string, userId: string): boolean
// 释放锁
releaseLock(docId: string, paragraphId: string, userId: string): void
// 获取某文档的所有锁
getLocks(docId: string): LockInfo[]
```

### 验收标准
```bash
# 向量检索测试
POST /api/m06/test-rag
Body: { "query": "智能温控系统的传感器模块" }
# 预期返回相关知识库片段

# WebSocket 连接测试
node websocket/collab-server.ts
# 用浏览器控制台连接 ws://localhost:3001
# 发送 join-document 事件，预期收到确认
```

---

## 每日交付检查清单

### Day 1 结束前检查
- [ ] `docs/schema.sql` 可执行，14 张表创建成功
- [ ] `lib/db.ts` 连接正常
- [ ] `lib/api-response.ts` 可用
- [ ] `/api/health` 返回正确格式
- [ ] `/api/auth/login` 返回 token
- [ ] 群里通知："Day 1 前置完成，A/B/C/D 可以写后端了"

### Day 2 结束前检查
- [ ] `ollama list` 显示 qwen2.5:7b
- [ ] `lib/ai-service.ts` 的 generate() 可调用
- [ ] 文件上传接口可接收 PDF/Word/图片
- [ ] `lib/file-parser.ts` 能提取文本
- [ ] 群里通知："Day 2 前置完成，C 可联调 AI，A 可联调上传"

### Day 3 结束前检查
- [ ] `lib/vector-db.ts` 可添加和检索文档
- [ ] WebSocket 服务可连接
- [ ] 段落锁逻辑正确（两人同时申请同一锁，第二人失败）
- [ ] 群里通知："Day 3 前置完成，C 可联调 RAG，D 可联调协同"

---

## 风险预案

| 风险 | 影响 | 应对 |
|------|:---:|:---|
| Ollama 在 Windows 装不上 | C/D 被阻塞 | 改用 LM Studio 或改用 Python + transformers |
| ChromaDB 依赖复杂 | C 被阻塞 | 改用 sqlite-vec（纯 JS） |
| WebSocket 和 Next.js 冲突 | D 被阻塞 | WebSocket 作为独立 Node 进程运行 |
| PostgreSQL 装不上 | 全员阻塞 | 降级为 SQLite（文件数据库，零配置） |
| Day 1 没完成 | 全员阻塞 | E 加班完成，A/B/C/D 先写前端静态页面 |
