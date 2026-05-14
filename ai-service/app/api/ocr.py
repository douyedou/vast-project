"""OCR 识别接口"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter()

# 注意：OCR 需要 paddleocr，Windows 安装可能较复杂
# 如果未安装，返回降级提示

try:
    from paddleocr import PaddleOCR
    ocr_engine = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
    OCR_AVAILABLE = True
except ImportError:
    ocr_engine = None
    OCR_AVAILABLE = False


class OCRResponse(BaseModel):
    text: str
    engine: str


@router.post("/ocr", response_model=OCRResponse)
async def ocr_recognize(file: UploadFile = File(...)):
    """图片 OCR 识别"""
    if not OCR_AVAILABLE:
        return OCRResponse(
            text="[OCR 引擎未安装。请在 Python 环境执行: pip install paddleocr]",
            engine="none",
        )

    try:
        import tempfile
        import os

        # 保存上传的文件到临时目录
        suffix = os.path.splitext(file.filename or ".jpg")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # OCR 识别
        result = ocr_engine.ocr(tmp_path, cls=True)
        
        # 提取文本
        texts = []
        if result and result[0]:
            for line in result[0]:
                if line:
                    texts.append(line[1][0])

        # 清理临时文件
        os.unlink(tmp_path)

        return OCRResponse(
            text="\n".join(texts),
            engine="paddleocr",
        )
    except Exception as e:
        raise HTTPException(500, f"OCR 识别失败: {str(e)}")
