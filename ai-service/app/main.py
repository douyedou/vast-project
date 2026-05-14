"""
VAST AI 微服务
基于 FastAPI，提供 LLM 生成、OCR、文本向量化等 AI 能力

启动方式:
    cd ai-service
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

API 文档:
    http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import generate, ocr, embed

app = FastAPI(
    title="VAST AI Service",
    description="VAST 8.0 专利智能生产系统 - AI 微服务",
    version="1.0.0",
)

# 允许跨域（Next.js 前端调用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(generate.router, prefix="/api", tags=["LLM 生成"])
app.include_router(ocr.router, prefix="/api", tags=["OCR 识别"])
app.include_router(embed.router, prefix="/api", tags=["文本向量化"])


@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "ok", "service": "vast-ai"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
