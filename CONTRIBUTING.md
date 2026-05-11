# VAST 8.0 团队协作指南

## 一、分支策略

```
main                    ← 稳定分支，只接受 PR，随时可演示
  ↑
dev                     ← 日常集成，每天合并一次个人分支
  ↑
feature/a-m05           ← 成员 A：立案(M05) + 交案库(M09)
feature/b-system        ← 成员 B：系统设置(权限/用户/角色)
feature/c-m06           ← 成员 C：交底书补全(M06) + AI 知识库
feature/d-m07           ← 成员 D：撰写中心(M07) + 质检审核(M08)
feature/e-infra         ← 成员 E：架构 + 数据库 + 部署
```

### 分支规则
- `main`：受保护，不能直接 push，只能通过 PR 合并
- `dev`：受保护，每天下班前每个人把 feature 分支合并到 dev（通过 PR）
- `feature/成员-模块`：个人开发分支，随时 commit/push

---

## 二、目录隔离约定

| 成员 | 负责目录 | 说明 |
|:---:|---------|------|
| A | `components/vast/m05/` `components/vast/m09/` | 立案 + 交案库 |
| B | `components/vast/system/` `app/api/auth/` | 系统设置 + 登录鉴权 |
| C | `components/vast/m06/` | 交底书补全 |
| D | `components/vast/m07/` `components/vast/m08/` | 撰写 + 审核 |
| E | `lib/db/` `app/api/common/` `docker/` | 数据库、公共 API、部署 |

### 公共文件修改规则
- `app/page.tsx`（路由分发器）：**E 统一维护**，其他人只在自己的 feature 分支里添加 case，由 E 合并时统一插入
- `app/layout.tsx`：**E 维护**
- `app/globals.css` / `tailwind.config`：**E 维护**
- `lib/utils.ts`：所有人可读，**修改需群里告知**
- `components/ui/`（shadcn 组件）：新增组件随意，**修改已有组件需告知**
- `package.json` 加依赖：**统一由 E 管理**，其他人需要新依赖时在群里说

---

## 三、提交规范（Conventional Commits）

格式：`<type>(<scope>): <description>`

示例：
```
feat(m05): 添加案件创建表单
fix(m06): 修复 AI 生成按钮点击无响应
refactor(system): 权限校验中间件提取到公共层
docs(readme): 更新开发环境搭建说明
chore(deps): 添加 lucide-react 依赖
```

| type | 含义 |
|:---:|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `refactor` | 重构（不改功能） |
| `docs` | 文档 |
| `chore` | 构建/工具链/依赖改动 |

scope 建议直接用模块名：`m05` `m06` `m07` `m08` `m09` `system` `infra`

---

## 四、每日工作流

### 1. 开始工作前：同步 dev 最新代码

```bash
git checkout feature/a-m05
git pull origin dev
```

### 2. 写代码，小步提交

```bash
git add .
git commit -m "feat(m05): 添加案件文件上传组件"
git push origin feature/a-m05
```

### 3. 下班前：合并到 dev

```bash
git checkout feature/a-m05
git pull origin dev

# 如果有冲突，解决后提交
git add .
git commit -m "merge(dev): 同步 dev 分支"
git push origin feature/a-m05
```

然后在 GitHub/GitLab 上提 PR：`feature/a-m05` → `dev`

### 4. 里程碑/演示前：dev → main

由 E 统一操作，所有人确认后合并。

---

## 五、冲突解决指南

如果 `git pull origin dev` 出现冲突：

```bash
# 1. 看哪些文件冲突了
git status

# 2. 打开冲突文件，找到 <<<<<<< HEAD 标记
#    保留自己的代码 + 保留对方的代码（如果是公共文件）
#    或只保留自己的代码（如果是自己的模块文件，对方不该改）

# 3. 解决后
git add .
git commit -m "merge(dev): 解决与 dev 分支的冲突"

# 4. 推送
git push origin feature/a-m05
```

如果冲突复杂（比如 `page.tsx` 路由分发器冲突），**不要自己硬解**，@E 帮你处理。

---

## 六、PR 审查规则

| 提交者 | 审查者 |
|:---:|------|
| A（实习） | E |
| B（实习） | E |
| C | D |
| D | C |
| E | D |

审查 checklist：
- [ ] 只修改了自己负责的目录
- [ ] 没有改 `package.json`（除非说明理由）
- [ ] 提交信息符合规范
- [ ] dev 分支已同步，无冲突

紧急情况下可以自我合并，但需在 PR 描述里写理由。

---

## 七、减少冲突的 5 个技巧

1. **不要同时改同一个文件**：`page.tsx`、`layout.tsx`、`package.json` 由 E 统一管理
2. **CSS/样式隔离**：每个模块的样式写在组件内部（Tailwind className），不要改 `globals.css`
3. **Mock 数据独立存放**：`components/vast/m05/_data/mock-cases.ts`
4. **API 接口先定义后开发**：E 第 1 周出《API 接口文档》，各自在 `app/api/自己的模块/` 下实现
5. **数据库 Schema 一次性定稿**：E 第 1 周出 `schema.sql`，开发期间不改字段名

---

## 八、实习成员特殊便利

- **可以晚 1 天同步 dev**：如果某天很忙，可以跳过 sync，第二天再补
- **Mock 数据可以硬编码**：不需要等后端 API，先把 UI 写完，接口对接放到最后 1 周
- **冲突可以让 E 代解决**：在 PR 描述里写"有冲突请 E 帮忙处理"

---

## 九、里程碑节奏

| 时间 | Git 操作 |
|:---:|---------|
| 第 1 天 | E 初始化仓库，所有人创建 feature 分支 |
| 第 1 周末 | 第一次 dev 合并，检查是否有大面积冲突 |
| 第 2 周中 | 第二次 dev 合并，A/B 的独立模块应基本完成 |
| 第 3 周末 | 第三次 dev 合并，所有前端联调 |
| 第 4 周 | dev → main，最终演示版本 |
