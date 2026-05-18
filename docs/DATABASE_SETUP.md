# VAST 8.0 数据库初始化指南（异地组员版）

> 由于组员在异地实习，无法局域网共享数据库，每位组员需**本地独立搭建 PostgreSQL + pgvector**，通过统一的 SQL 脚本保证数据一致性。

---

## 一、安装 PostgreSQL 16 + pgvector

### Windows

1. 下载安装 PostgreSQL 16：https://www.postgresql.org/download/windows/
2. 安装时记住设置的 **超级用户密码**
3. 打开 `pgAdmin 4` 或 `psql`
4. 创建数据库和用户：

```sql
-- 以 postgres 超级用户登录
CREATE DATABASE vast_db;
CREATE USER vast_user WITH PASSWORD '你的密码';
GRANT ALL PRIVILEGES ON DATABASE vast_db TO vast_user;

-- 连接 vast_db 后安装扩展
\c vast_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 给 vast_user 授权创建函数（触发器需要）
ALTER USER vast_user WITH SUPERUSER;
```

### macOS

```bash
brew install postgresql@16
brew services start postgresql@16

# 创建用户和数据库
createuser -s vast_user
createdb -O vast_user vast_db

# 安装 pgvector
brew install pgvector
# 然后在 psql 中：
psql -d vast_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Linux (Ubuntu)

```bash
sudo apt update
sudo apt install postgresql-16 postgresql-contrib

# 安装 pgvector
sudo apt install postgresql-16-pgvector

sudo -u postgres psql -c "CREATE DATABASE vast_db;"
sudo -u postgres psql -c "CREATE USER vast_user WITH PASSWORD '你的密码';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vast_db TO vast_user;"
sudo -u postgres psql -d vast_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -d vast_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

## 二、配置项目环境变量

在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`，填写你的数据库密码：

```env
# 数据库连接（修改密码为你设置的）
DATABASE_URL="postgresql://vast_user:你的密码@localhost:5432/vast_db"

# JWT 密钥（开发环境随便填，生产环境需要强密钥）
JWT_SECRET="DEV_SECRET"

# Ollama 配置
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:3b"

# 其他配置
PORT=3000
NODE_ENV=development
```

---

## 三、初始化数据库（三步走）

### 第 1 步：创建表结构 + 基础数据

```bash
npm run db:init
```

这会执行 `docs/schema.sql`，创建所有表、索引、触发器，并插入：
- 4 个角色 + 权限配置
- 4 个测试用户（admin/engineer1/reviewer1/applicant1，密码都是 `123456`）
- 2 条术语库示例数据
- 1 条知识库示例数据

### 第 2 步：导入企业真实数据

```bash
npm run db:seed
```

或者手动执行：

```bash
psql -U vast_user -d vast_db -f docs/seed-data.sql
```

这会导入：
- 8 条案件记录（含 4 个企业真实案例）
- 4 条附件记录
- 5 条状态历史
- 5 条交底书文档
- 5 条专利文档
- 13 条知识库记录（不含向量）

> ⚠️ **Windows 用户注意**：如果 `psql` 命令找不到，把 PostgreSQL 的 `bin` 目录加入系统 PATH，或用 pgAdmin 的 Query Tool 打开 `seed-data.sql` 执行。

### 第 3 步：生成向量 embedding（需要 Ollama）

**先安装 Ollama**：https://ollama.com/download

**拉取模型**（较大，需耐心等待）：

```bash
ollama pull mxbai-embed-large:latest
ollama pull qwen2.5:3b
```

**执行向量化脚本**：

```bash
npm run db:embed
```

这会自动为知识库中的 13 条记录生成 1024 维向量，RAG 功能才能正常工作。

> 如果暂时没有 Ollama，可以跳过此步骤。RAG 问答功能会不可用，但其他功能正常。

---

## 四、验证初始化是否成功

```bash
# 检查表是否全部创建
npx tsx -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const r = await pool.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name\");
  console.log('已创建表:', r.rows.map(x => x.table_name).join(', '));
  await pool.end();
})();
"
```

应该输出 14 张表：
```
case_files, case_status_history, cases, disclosure_documents,
document_versions, edit_logs, knowledge_base, patent_documents,
permissions, review_items, reviews, role_permissions, roles, users
```

---

## 五、一键初始化（推荐）

如果 PostgreSQL 扩展已装好、Ollama 已启动：

```bash
npm run db:full-init
```

这会自动执行：`db:init` → `db:seed` → `db:embed`

---

## 六、常见问题

### Q1: `db:init` 报权限错误
```
权限不足，请用超级用户执行此语句
```
**解决**：以 postgres 超级用户执行 `ALTER USER vast_user WITH SUPERUSER;`

### Q2: `uuid-ossp` 或 `vector` 扩展未找到
```
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

### Q3: seed-data.sql 执行超时
文件较大（约 2000+ 行），在 pgAdmin 中执行时可能需要等待几分钟。

### Q4: embedding 脚本报错
确保 Ollama 已启动（`ollama serve` 或系统服务已运行），且模型已下载。

---

## 七、数据同步策略

| 场景 | 处理方式 |
|------|----------|
| **Schema 变更**（新增表/字段）| 由改动的同学更新 `docs/schema.sql`，全员重新 `db:init` |
| **种子数据更新** | 更新 `docs/seed-data.sql`，全员重新导入 |
| **测试数据**（开发时产生）| 各自本地生成，不共享 |
| **向量数据** | 各自本地运行 `db:embed` 生成 |

**核心原则**：
- `schema.sql` + `seed-data.sql` 是**唯一数据源**，Git 跟踪
- 各自数据库独立，通过统一脚本保持一致
- 非结构变更（测试数据）不需要同步
