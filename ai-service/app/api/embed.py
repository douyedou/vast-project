"""文本向量化接口"""

import httpx
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "mxbai-embed-large:latest")


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: List[float]
    model: str


@router.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    """文本向量化"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/embeddings",
                json={
                    "model": EMBED_MODEL,
                    "prompt": request.text,
                },
            )
            response.raise_for_status()
            data = response.json()
            
            return EmbedResponse(
                embedding=data.get("embedding", []),
                model=EMBED_MODEL,
            )
    except httpx.ConnectError:
        raise HTTPException(503, "Ollama 服务未启动")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(503, f"嵌入模型未安装，请运行: ollama pull {EMBED_MODEL}")
        raise HTTPException(500, f"向量化失败: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"向量化失败: {str(e)}")
