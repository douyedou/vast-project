# VAST 8.0 新人入职手册

> 本文档面向**第一次参与项目**的组员。按顺序操作，30 分钟内可以开始写代码。

---

## 一、安装前置软件（3 个）

| 软件 | 下载地址 | 用途 |
|------|----------|------|
| **Git** | https://git-scm.com/download | 代码版本管理 |
| **Docker Desktop** | https://www.docker.com/products/docker-desktop | 一键启动开发环境 |
| **VS Code** | https://code.visualstudio.com/ | 代码编辑器（推荐） |

### Windows 特别重要的一步

安装完 Docker Desktop 后，**必须检查这个设置**，否则后续会出各种奇怪问题：

1. 打开 Docker Desktop
2. 点击右上角 **⚙️ Settings（设置）**
3. 左侧选择 **General**
4. 勾选 ✅ **"Use the WSL 2 based engine"**
5. 点击右下角 **Apply & Restart**

> 如果没有 WSL2，Docker Desktop 会提示你安装，按提示操作即可。

---

## 二、项目初始化（只做一次）

### 1. 打开终端

- **Windows**：按 `Win + R`，输入 `cmd`，回车
- **macOS**：按 `Cmd + 空格`，输入 `terminal`，回车

### 2. 克隆代码

```bash
# 进入你想放代码的文件夹（示例：文档目录）
cd C:\Users\你的用户名\Documents

# 拉取代码（会自动创建 vast-project 文件夹）
git clone https://github.com/douyedou/vast-project.git

# 进入项目目录
cd vast-project
```

> 拉取完成后，代码在 `C:\Users\你的用户名\Documents\vast-project` 里。

### 3. 启动开发环境

确保 Docker Desktop 正在运行（右下角托盘有鲸鱼图标），然后执行：

```bash
docker-compose up -d
```

**首次启动需要 10-20 分钟**，因为：
- 下载 PostgreSQL、OnlyOffice、Ollama 等镜像（约 3-5GB）
- 自动拉取 AI 模型 `qwen2.5:3b` 和 `mxbai-embed-large`（约 2-3GB）

**怎么看进度？**

```bash
docker-compose logs -f ollama
```

当看到以下输出时，说明模型拉完了：
```
✅ 模型 qwen2.5:3b 拉取完成
✅ 模型 mxbai-embed-large 拉取完成
📦 已安装模型列表：...
```

按 `Ctrl + C` 退出日志查看。

### 4. 初始化知识库向量（仅需一次）

```bash
docker-compose exec nextjs npx tsx scripts/embed-knowledge-base.ts
```

等待显示 `🎉 完成！成功: 13, 失败: 0` 即可。

### 5. 打开项目

浏览器访问：http://localhost:3000

用 VS Code 打开 `vast-project` 文件夹，开始写代码。

默认测试账号：

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | 123456 | 管理员 |
| engineer1 | 123456 | 专利工程师 |
| reviewer1 | 123456 | 专利审核员 |
| applicant1 | 123456 | 交案人 |

---

## 三、每日工作流（每次开工）

```bash
# 1. 进入项目目录
cd C:\Users\你的用户名\Documents\vast-project

# 2. 拉取最新代码（把别人昨天推的代码同步下来）
git pull origin main

# 3. 启动环境（如果昨晚关了电脑）
docker-compose up -d

# 4. 用 VS Code 写代码，保存后浏览器自动刷新
```

---

## 四、提交代码（写完功能后）

```bash
# 1. 查看自己改了哪些文件
git status

# 2. 把所有改动加入暂存区
git add -A

# 3. 提交到本地（写清楚你改了什么）
git commit -m "feat: M05 咨询列表添加搜索功能"

# 4. 再次拉取最新代码（防止别人在你写的时候又推了）
git pull origin main

# 5. 推到 GitHub
git push origin main
```

### Commit 消息规范

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat:` | 新功能 | `feat: M05 咨询列表接入真实API` |
| `fix:` | 修复 bug | `fix: 案件状态流转按钮不显示` |
| `docs:` | 文档修改 | `docs: 更新使用说明` |
| `style:` | 样式调整 | `style: 调整表格列宽` |

---

## 五、冲突解决（如果 `git pull` 报红字）

### 症状

```
CONFLICT (content): Merge conflict in components/xxx.tsx
Automatic merge failed; fix conflicts and then commit the result.
```

### 解决步骤

**1. 打开报错的文件**（VS Code 里文件名会变红）

找到这种标记：
```tsx
<<<<<<< HEAD
你写的代码
=======
别人写的代码
>>>>>>> branch 'main'
```

**2. 手动决定保留哪边**（或两边合并），删掉 `<<<<<<<` `=======` `>>>>>>>` 这些标记

例如你想保留自己的：
```tsx
你写的代码
```

**3. 保存文件，然后：**

```bash
git add -A
git commit -m "fix: 解决冲突"
git push origin main
```

---

## 六、常用命令速查

```bash
# 查看服务状态
docker-compose ps

# 看所有日志
docker-compose logs -f

# 看 Next.js 日志（热重载、报错）
docker-compose logs -f nextjs

# 重启某个服务
docker-compose restart nextjs

# 停止所有服务（下班关机前）
docker-compose down

# 彻底重置（清空数据库，慎用！）
docker-compose down -v
```

---

## 七、常见问题

### Q1: `docker-compose` 命令找不到
**解决**：确保 Docker Desktop 已安装并启动。Windows 用户安装时会自动加入 PATH，可能需要**重启终端**或**重启电脑**。

### Q2: `git clone` 特别慢或失败
**解决**：GitHub 国内访问不稳定，多试几次，或者让组长把代码压缩发你。

### Q3: 浏览器打开 `localhost:3000` 显示拒绝连接
**解决**：
```bash
# 看 Next.js 是否启动成功
docker-compose logs --tail=50 nextjs

# 如果没启动成功，重启
docker-compose restart nextjs
```

### Q4: 改代码后浏览器没刷新（热重载失效）
**解决**：
1. 确认 Docker Desktop 使用 **WSL2 backend**
2. 尝试手动刷新浏览器
3. 重启服务：`docker-compose restart nextjs`

### Q5: 不小心 `docker-compose down -v` 了，数据全没了
**解决**：没关系，重新执行初始化步骤 3-4 即可（`docker-compose up -d` + `embed-knowledge-base.ts`）。

---

## 八、你的开发目录结构

```
vast-project/                    ← 项目根目录
├── docker-compose.yml           ← Docker 编排文件
├── docs/                        ← 文档
│   ├── ONBOARDING.md            ← 本手册
│   ├── DOCKER.md                ← Docker 详细指南
│   └── DATABASE_SETUP.md        ← 数据库手动初始化（备用）
├── app/                         ← Next.js 页面路由
├── components/                  ← React 组件
│   └── vast/
│       ├── m05/                 ← 你的模块代码在这里
│       ├── m06/
│       ├── m07/
│       ├── m08/
│       ├── m09/
│       └── m10/
├── lib/                         ← 工具函数
└── ...
```

**你只需要关心 `components/vast/` 下对应模块的文件夹**，其他不用动。

---

> 有问题随时在群里 @组长，或者看 `docs/DOCKER.md` 排错。
