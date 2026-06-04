# VAST 8.0 API 接口规范 v1.0

## 通用约定

### 基础路径
```
所有 API 前缀：/api/v1/
（当前版本未加 /v1，后续迭代时添加）
```

### 统一响应格式
```json
// 成功
{
  "code": 200,
  "data": { ... },
  "message": "success"
}

// 失败
{
  "code": 400,
  "data": null,
  "message": "错误信息"
}

// 分页
{
  "code": 200,
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  },
  "message": "success"
}
```

### 认证方式
```
Header: Authorization: Bearer <token>
```

### 错误码
| 错误码 | 含义 |
|:---:|:---|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录/Token 无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |
| 503 | AI 服务不可用 |

---

## 1. 系统接口（E 维护）

### 1.1 健康检查
```
GET /api/health
响应：{ status, timestamp, checks: { server, database, ollama, env } }
```

---

## 2. 认证接口（B 负责，E 搭框架）

### 2.1 登录
```
POST /api/auth/login
请求：{ username: string, password: string }
响应：{ token: string, user: { id, username, name, role, email } }
```

### 2.2 获取当前用户
```
GET /api/auth/me
Header: Authorization: Bearer <token>
响应：{ id, username, name, role, email, permissions: [{ module, action }] }
```

### 2.3 登出（可选）
```
POST /api/auth/logout
Header: Authorization: Bearer <token>
响应：{ success: true }
```

---

## 3. 用户管理（B 负责）

### 3.1 用户列表
```
GET /api/users?page=1&pageSize=20&keyword=xxx
Header: Authorization: Bearer <token>
响应：PaginatedData<User>
```

### 3.2 创建用户
```
POST /api/users
Header: Authorization: Bearer <token>
请求：{ username, password, name, email, role, department }
响应：{ userId }
```

### 3.3 更新用户
```
PUT /api/users/:id
Header: Authorization: Bearer <token>
请求：{ name, email, role, status, department }
响应：{ success: true }
```

### 3.4 删除用户
```
DELETE /api/users/:id
Header: Authorization: Bearer <token>
响应：{ success: true }
```

---

## 4. 案件管理（A 负责：M05 + M09）

### 4.1 创建案件
```
POST /api/cases
Header: Authorization: Bearer <token>
请求：{ title, type: 'invention'|'utility'|'design', description, priority? }
响应：{ caseId, id }
```

### 4.2 案件列表
```
GET /api/cases?status=xxx&page=1&pageSize=20&keyword=xxx
Header: Authorization: Bearer <token>
响应：PaginatedData<Case>
```

### 4.3 案件详情
```
GET /api/cases/:id
Header: Authorization: Bearer <token>
响应：Case + files[] + history[]
```

### 4.4 更新案件
```
PUT /api/cases/:id
Header: Authorization: Bearer <token>
请求：{ status, engineerId, reviewerId, description, priority }
响应：{ success: true }
```

### 4.5 上传案件附件
```
POST /api/cases/:id/files
Header: Authorization: Bearer <token>
Content-Type: multipart/form-data
请求：FormData { file: File }
响应：{ fileId, filename, url }
```

### 4.6 案件状态历史
```
GET /api/cases/:id/history
Header: Authorization: Bearer <token>
响应：{ events: [{ from, to, operator, remark, createdAt }] }
```

---

## 5. 交底书引擎（C 负责：M06）

### 5.1 上传多模态输入
```
POST /api/m06/upload
Header: Authorization: Bearer <token>
Content-Type: multipart/form-data
请求：FormData { file: File, type: 'text'|'image'|'document' }
响应：{ fileId, extractedText, type }
```

### 5.2 AI 生成交底书
```
POST /api/m06/generate
Header: Authorization: Bearer <token>
请求：{ caseId, inputs: [{ type, content }], template? }
响应：{ documentId, status: 'pending'|'generating'|'done' }
```

### 5.3 查询生成进度
```
GET /api/m06/generate/:id/status
Header: Authorization: Bearer <token>
响应：{ status, progress: 0-100, result? }
```

### 5.4 获取结构化交底书
```
GET /api/m06/documents/:id
Header: Authorization: Bearer <token>
响应：{ id, caseId, sections: [{ title, content, status }], aiSuggestions: [] }
```

### 5.5 保存编辑后的交底书
```
PUT /api/m06/documents/:id
Header: Authorization: Bearer <token>
请求：{ sections: [{ title, content }] }
响应：{ success: true, version }
```

### 5.6 AI 推荐创新思路
```
POST /api/m06/suggestions
Header: Authorization: Bearer <token>
请求：{ caseId, field, currentContent }
响应：{ ideas: [{ title, description, noveltyScore }] }
```

### 5.7 术语库查询
```
GET /api/m06/terminology?keyword=xxx&field=xxx
Header: Authorization: Bearer <token>
响应：{ terms: [{ term, definition, synonyms, usageExample }] }
```

### 5.8 术语一致性检查
```
POST /api/m06/terminology/check
Header: Authorization: Bearer <token>
请求：{ text }
响应：{ inconsistentTerms: [{ term, suggestedTerm, occurrences }] }
```

---

## 6. 专利创作（D 负责：M07）

### 6.1 创建专利文档
```
POST /api/m07/documents/creation
Header: Authorization: Bearer <token>
请求：{ caseId, type: 'spec'|'claims'|'abstract'|'drawings' }
响应：{ documentId }
```

### 6.2 获取文档内容
```
GET /api/m07/documents/:id
Header: Authorization: Bearer <token>
响应：{ id, caseId, type, content, version, status, aiRate }
```

### 6.3 保存文档
```
PUT /api/m07/documents/:id
Header: Authorization: Bearer <token>
请求：{ content }
响应：{ success: true, version }
```

### 6.4 版本历史
```
GET /api/m07/documents/:id/versions
Header: Authorization: Bearer <token>
响应：{ versions: [{ version, operator, changeSummary, createdAt }] }
```

### 6.5 版本对比
```
GET /api/m07/documents/:id/diff?v1=1&v2=2
Header: Authorization: Bearer <token>
响应：{ diff: [{ type: 'added'|'removed', content }] }
```

### 6.6 AI 率检测
```
POST /api/m07/ai-detect
Header: Authorization: Bearer <token>
请求：{ content }
响应：{ aiRate: 0-100, flaggedSections: [{ start, end, suggestion }] }
```

### 6.7 生成权利要求书
```
POST /api/m07/generate
Header: Authorization: Bearer <token>
请求：{ specDocumentId }
响应：{ claimsContent }
```

---

## 7. 质检审核（D 负责：M08）

### 7.1 审核任务列表
```
GET /api/m08/reviews?status=xxx&page=1&pageSize=20
Header: Authorization: Bearer <token>
响应：PaginatedData<Review>
```

### 7.2 审核任务详情
```
GET /api/m08/reviews/:id
Header: Authorization: Bearer <token>
响应：Review + case + documents + aiSuggestions[]
```

### 7.3 触发 AI 五书审查
```
POST /api/m08/reviews/:id/ai-check
Header: Authorization: Bearer <token>
响应：{ suggestions: [{ type, content, severity, location }] }
```

### 7.4 提交审核意见
```
PUT /api/m08/reviews/:id
Header: Authorization: Bearer <token>
请求：{ result: 'pass'|'reject'|'pending', comments, modifiedSuggestions: [] }
响应：{ success: true }
```

### 7.5 生成审核报告
```
GET /api/m08/reviews/:id/report
Header: Authorization: Bearer <token>
响应：{ reportUrl }
```

---

## 8. AI 服务接口（E 维护，C/D 调用）

### 8.1 LLM 生成
```
POST /api/ai/generate
请求：{ prompt: string, temperature?: 0.7, maxTokens?: 2048 }
响应：{ text: string }
```

### 8.2 文本向量化
```
POST /api/ai/embed
请求：{ text: string }
响应：{ embedding: number[] }
```

### 8.3 AI 率检测
```
POST /api/ai/detect
请求：{ text: string }
响应：{ aiRate: number, flagged: string[], perplexity: number }
```
