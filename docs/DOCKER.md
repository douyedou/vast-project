# VAST 8.0 Docker 开发环境指南

> **目标**：异地组员只需 `docker-compose up -d`，整个开发环境就绪。

---

## 前置要求

1. **Docker Desktop**（Win/Mac）或 **Docker Engine + Docker Compose**（Linux）
   - 下载：https://www.docker.com/products/docker-desktop
2. **Git**（拉取代码）

---

## 一键启动（首次）

```bash
# 1. 克隆代码
git clone https://github.com/douyedou/vast-project.git
cd vast-project

# 2. 启动所有服务（-d 后台运行）
docker-compose up -d
```

**首次启动需要 5-15 分钟**，因为：
- 需要下载 PostgreSQL、OnlyOffice、Ollama 等镜像（约 3-5GB）
- Ollama 会自动拉取 `qwen2.5:3b` 和 `mxbai-embed-large` 模型（约 2-3GB）

### 查看启动进度

```bash
# 看所有服务日志
docker-compose logs -f

# 只看 Ollama 模型拉取进度（最慢的部分）
docker-compose logs -f ollama
```

当 Ollama 日志显示 `✅ 模型 xxx 拉取完成` 且 `📦 已安装模型列表` 时，就可以用了。

### 第 4 步：生成知识库向量（仅需一次）

```bash
# 在 nextjs 容器内运行向量化脚本
docker-compose exec nextjs npx tsx scripts/embed-knowledge-base.ts
```

这会自动为知识库中的 13 条记录生成 1024 维向量，RAG 问答功能才能正常工作。

---

## 验证服务状态

```bash
# 查看所有容器状态
docker-compose ps
```

应该看到 5 个容器都是 `healthy` 或 `Up`：

| 容器名 | 服务 | 端口 |
|--------|------|------|
| vast-postgres | PostgreSQL 16 + pgvector | 5432 |
| vast-onlyoffice | OnlyOffice 文档服务器 | 8080 |
| vast-ollama | Ollama LLM 服务 | 11434 |
| vast-ai-service | Python FastAPI 微服务 | 8000 |
| vast-nextjs | Next.js 开发服务器 | 3000 |

### 快速测试

```bash
# 测试数据库
curl http://localhost:3000/api/health 2>/dev/null || echo "Next.js 未就绪"

# 测试 Ollama
curl http://localhost:11434/api/tags

# 测试 OnlyOffice
open http://localhost:8080  # 或浏览器访问
```

---

## 访问应用

服务启动后，在浏览器打开：

- **主应用**：http://localhost:3000
- **API 文档**：http://localhost:8000/docs （AI 微服务）
- **OnlyOffice**：http://localhost:8080

默认测试账号：

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | 123456 | 管理员 |
| engineer1 | 123456 | 专利工程师 |
| reviewer1 | 123456 | 专利审核员 |
| applicant1 | 123456 | 交案人 |

---

## 开发工作流

### 修改代码

项目源码通过 **bind mount** 挂载到容器内，**宿主机改代码，容器内即时生效**。

```
宿主机文件 ←→ 容器内文件
vast-project/app/         ←→  nextjs:/app/app/
vast-project/components/  ←→  nextjs:/app/components/
vast-project/ai-service/  ←→  ai-service:/app/
```

Next.js 启用了 Turbopack 热重载，保存文件后浏览器自动刷新。

> **Windows 用户注意**：如果热重载不生效，在 `.env.docker` 中已设置 `CHOKIDAR_USEPOLLING=true`，一般无需额外配置。如果仍有问题，请确保 Docker Desktop 使用 WSL2 backend（设置 → General → Use the WSL 2 based engine）。

### 安装新依赖

```bash
# 前端依赖（在 nextjs 容器内执行）
docker-compose exec nextjs pnpm add <package>

# AI 服务依赖（修改 ai-service/requirements.txt 后重启）
docker-compose restart ai-service
```

### 查看日志

```bash
# 所有服务
docker-compose logs -f

# 只看 Next.js
docker-compose logs -f nextjs

# 只看 AI 服务
docker-compose logs -f ai-service

# 只看最近 50 行
docker-compose logs --tail=50 nextjs
```

### 进入容器执行命令

```bash
# 进入 Next.js 容器
docker-compose exec nextjs sh

# 进入数据库
docker-compose exec postgres psql -U vast_user -d vast_db

# 手动执行数据库脚本
docker-compose exec postgres psql -U vast_user -d vast_db -f /docker-entrypoint-initdb.d/01-schema.sql
```

---

## 常用命令

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（⚠️ 数据库数据会清空）
docker-compose down -v

# 重启单个服务
docker-compose restart nextjs

# 重新构建 AI 服务镜像（修改 Dockerfile 后）
docker-compose up -d --build ai-service

# 查看资源占用
docker stats
```

---

## 数据库管理

PostgreSQL 数据存储在 Docker Volume 中，**容器重启不会丢失**。

如果需要重置数据库（清空所有数据）：

```bash
docker-compose down -v   # 删除数据卷
docker-compose up -d     # 重新初始化
```

---

## 故障排查

### Q1: `docker-compose up` 报端口冲突
```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```
**原因**：宿主机已安装 PostgreSQL 并占用了 5432 端口。

**解决**：停止宿主机的 PostgreSQL 服务，或修改 `docker-compose.yml` 中的端口映射（如 `5433:5432`）。

### Q2: Ollama 模型拉取卡住或失败
```bash
# 手动进入容器拉取
docker-compose exec ollama ollama pull qwen2.5:3b
docker-compose exec ollama ollama pull mxbai-embed-large

# 查看模型是否成功
docker-compose exec ollama ollama list
```

### Q3: Next.js 热重载不生效（Windows）
1. 确保 Docker Desktop 使用 **WSL2 backend**
2. 检查项目路径是否在 WSL2 文件系统内（推荐）
3. 尝试重启容器：`docker-compose restart nextjs`

### Q4: `pnpm install` 报网络错误
可能是容器内 DNS 问题，尝试：
```bash
docker-compose down
docker-compose up -d nextjs
```

### Q5: OnlyOffice 回调失败
确保 `.env.docker` 中的 `ONLYOFFICE_SERVER=http://onlyoffice:80` 配置正确。OnlyOffice 回调地址需要能被 Next.js 容器访问（通过 Docker 网络），外部浏览器通过 `localhost:8080` 访问。

---

## 架构说明

```
┌─────────────────────────────────────────────────────────┐
│                      Docker Network                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ postgres │  │onlyoffice│  │  ollama  │              │
│  │  :5432   │  │  :80     │  │  :11434  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       └─────────────┴─────────────┘                     │
│                     │                                   │
│              ┌──────┴──────┐                           │
│              │   nextjs    │                           │
│              │   :3000     │ ← 浏览器访问 localhost:3000│
│              └──────┬──────┘                           │
│                     │                                   │
│              ┌──────┴──────┐                           │
│              │ ai-service  │                           │
│              │   :8000     │                           │
│              └─────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

容器间通过服务名通信（如 `postgres`、`ollama`），无需关心 IP 地址。
