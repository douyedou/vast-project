"""LLM 生成接口"""

import httpx
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")


class GenerateRequest(BaseModel):
    prompt: str
    temperature: float = 0.7
    max_tokens: int = 2048
    model: str = DEFAULT_MODEL


class GenerateResponse(BaseModel):
    text: str
    model: str


@router.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """调用本地 Ollama 生成文本"""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": request.model,
                    "prompt": request.prompt,
                    "stream": False,
                    "options": {
                        "temperature": request.temperature,
                        "num_predict": request.max_tokens,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            
            return GenerateResponse(
                text=data.get("response", "").strip(),
                model=data.get("model", request.model),
            )
    except httpx.ConnectError:
        raise HTTPException(503, "Ollama 服务未启动，请运行: ollama serve")
    except Exception as e:
        raise HTTPException(500, f"生成失败: {str(e)}")
