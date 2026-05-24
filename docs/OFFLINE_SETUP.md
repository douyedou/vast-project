# VAST 8.0 离线部署指南

> 适用于无法直接访问 Docker Hub 的网络环境（如校园网限制、公司防火墙等）。

---

## 方案一：Docker 国内镜像源（最简单，优先尝试）

如果你能打开 Docker Desktop，但 `docker-compose up` 下载很慢或超时，**先试试国内镜像加速器**，可能不需要离线打包。

### Windows / macOS

1. 打开 Docker Desktop → **Settings（设置）** ⚙️
2. 左侧选择 **Docker Engine**
3. 在 JSON 配置中添加 `registry-mirrors`：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

4. 点击 **Apply & Restart**
5. 重新执行 `docker-compose up -d`

如果还是不行，再考虑下面的离线方案。

---

## 方案二：离线导入 Docker 镜像（推荐）

找一台**能正常访问 Docker Hub 的电脑**（朋友电脑、网吧、手机热点），打包镜像后拷贝过来。

### 步骤 1：在能上网的电脑上打包镜像

```bash
# 1. 确认 Docker 正常运行
docker info

# 2. 拉取所有需要的镜像
docker pull node:20-alpine
docker pull onlyoffice/documentserver:8.1
docker pull pgvector/pgvector:pg16
docker pull ollama/ollama:latest
docker pull python:3.11-slim

# 3. 打包成一个文件（约 4-6GB，耐心等待）
docker save -o vast-images.tar \
  node:20-alpine \
  onlyoffice/documentserver:8.1 \
  pgvector/pgvector:pg16 \
  ollama/ollama:latest \
  python:3.11-slim
```

执行完后，当前目录会生成 `vast-images.tar`。

### 步骤 2：传输到目标电脑

用 U 盘 / 移动硬盘 / 微信 / QQ / 网盘等方式，把 `vast-images.tar` 复制到项目电脑。

### 步骤 3：在目标电脑导入镜像

```bash
# 进入项目目录
cd vast-project

# 导入镜像（约 5-10 分钟）
docker load -i vast-images.tar

# 确认镜像已导入
docker images
```

### 步骤 4：启动项目

```bash
docker-compose up -d
```

> ⚠️ **注意**：Ollama 模型（qwen2.5:3b + mxbai-embed-large，约 2-3GB）**不在镜像里**，容器启动后会自动下载。如果容器内也无法联网下载模型，请看**方案三**。

---

## 方案三：完全离线（镜像 + Ollama 模型一并打包）

如果目标电脑**完全无法联网**（连 Ollama 模型都下载不了），需要把模型数据也一并导出。

### 在能上网的电脑上执行：

```bash
# 1. 进入项目目录
cd vast-project

# 2. 启动项目（会自动下载镜像和模型）
docker-compose up -d

# 3. 等待模型下载完成（看 ollama 日志）
docker-compose logs -f ollama
# 当看到 "✅ 模型 qwen2.5:3b 拉取完成" 即可按 Ctrl+C 退出

# 4. 导出 Ollama 模型数据卷
docker run --rm \
  -v vast-project_ollama_models:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/ollama-models.tar.gz -C /data .

# 5. 打包 Docker 镜像（如果还没打包）
docker save -o vast-images.tar \
  node:20-alpine \
  onlyoffice/documentserver:8.1 \
  pgvector/pgvector:pg16 \
  ollama/ollama:latest \
  python:3.11-slim
```

执行完后，你会得到两个文件：
- `vast-images.tar`（Docker 镜像，4-6GB）
- `ollama-models.tar.gz`（Ollama 模型数据，2-3GB）

### 在目标电脑导入：

```bash
cd vast-project

# 1. 导入 Docker 镜像
docker load -i vast-images.tar

# 2. 创建 Ollama 数据卷并导入模型数据
docker run --rm \
  -v vast-project_ollama_models:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/ollama-models.tar.gz -C /data

# 3. 启动项目（模型已存在，不会再下载）
docker-compose up -d
```

---

## 方案对比

| 方案 | 适用场景 | 操作复杂度 | 文件大小 |
|------|----------|-----------|----------|
| 国内镜像源 | Docker Hub 慢但还能访问 | ⭐ | 无 |
| 离线镜像 | Docker Hub 完全无法访问 | ⭐⭐ | ~4-6GB |
| 完全离线 | 目标电脑完全断网 | ⭐⭐⭐ | ~6-9GB |

---

## 常见问题

### Q: `docker save` 提示 "no space left on device"
**解决**：确保磁盘剩余空间大于 10GB。`vast-images.tar` 本身就要 4-6GB，还需要临时空间。

### Q: `docker load` 提示 "Error processing tar file"
**解决**：传输过程中文件损坏了，重新拷贝一次。推荐用 U 盘或网盘（比微信传大文件稳定）。

### Q: 导入后 `docker-compose up` 还是去下载镜像
**解决**：检查 `docker-compose.yml` 里的镜像标签是否和 `docker save` 时一致。比如 `ollama/ollama:latest` 如果导出时拉的是 `latest`，导入后标签也是 `latest`，compose 里写的也是 `latest`，就不会重复下载。

### Q: Ollama 模型导入后，`ollama list` 显示为空
**解决**：可能是数据卷名称不对。查看当前项目的数据卷名：
```bash
docker volume ls | grep ollama
```
确保导入时使用的卷名和 `docker-compose.yml` 里定义的一致（默认是 `vast-project_ollama_models`，如果项目目录名不同，前缀也会不同）。
