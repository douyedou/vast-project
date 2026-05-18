#!/bin/sh
# ============================================================
# Ollama 容器 Entrypoint
# 启动 Ollama 服务，并自动拉取所需模型
# ============================================================

set -e

MODELS="qwen2.5:3b mxbai-embed-large"

# 后台启动 Ollama 服务
ollama serve &
OLLAMA_PID=$!

# 等待服务就绪
echo "⏳ 等待 Ollama 服务启动..."
for i in $(seq 1 60); do
    if curl -fs http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "✅ Ollama 服务已就绪"
        break
    fi
    sleep 1
done

# 检查并拉取模型
for model in $MODELS; do
    echo "🔍 检查模型: $model"
    if curl -fs http://localhost:11434/api/tags | grep -q "\"$model\""; then
        echo "   ✅ 模型 $model 已存在，跳过"
    else
        echo "   ⬇️  正在拉取模型 $model（首次较慢，请耐心等待）..."
        ollama pull "$model"
        echo "   ✅ 模型 $model 拉取完成"
    fi
done

# 列出已安装模型
echo ""
echo "📦 已安装模型列表："
ollama list

# 保持前台运行
wait $OLLAMA_PID
