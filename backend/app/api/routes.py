import os
import io
import shutil
import fitz
import pytesseract
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.extractor import generate_care_plan
from app.services.assistant import generate_caregiver_assistant_response

router = APIRouter()
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

tesseract_cmd = os.getenv("TESSERACT_CMD") or shutil.which("tesseract")
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd


class AssistantRequest(BaseModel):
    question: str
    care_context: dict


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""

    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as pdf:
            for page in pdf:
                text += page.get_text()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to read this PDF.") from exc

    return text.strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore").strip()


def extract_text_from_image(file_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()
        image = Image.open(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Unable to read this image.") from exc

    try:
        text = pytesseract.image_to_string(image)
    except pytesseract.TesseractNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail="OCR is not configured on this server. Set TESSERACT_CMD or install Tesseract.",
        ) from exc
    return text.strip()


@router.get("/health")
def health_check():
    return {"status": "healthy"}


@router.post("/extract")
async def extract_care_plan(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    _, ext = os.path.splitext(file.filename.lower())
    file_bytes = await file.read()

    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File is too large. Upload a file under 10 MB.",
        )

    if ext == ".pdf":
        document_text = extract_text_from_pdf(file_bytes)

        if not document_text:
            raise HTTPException(
                status_code=400,
                detail="No readable text found. This may be a scanned PDF. Try uploading a clearer image or text-based PDF.",
            )

    elif ext == ".txt":
        document_text = extract_text_from_txt(file_bytes)

    elif ext in [".jpg", ".jpeg", ".png"]:
        document_text = extract_text_from_image(file_bytes)

    else:
        raise HTTPException(
            status_code=400,
            detail="Supported files: PDF, TXT, JPG, JPEG, PNG",
        )

    if not document_text:
        raise HTTPException(
            status_code=400,
            detail="No readable text found in uploaded document.",
        )

    try:
        care_plan = generate_care_plan(document_text)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return care_plan


@router.post("/assistant")
async def caregiver_assistant(request: AssistantRequest):
    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:
        answer = generate_caregiver_assistant_response(
            request.question,
            request.care_context,
        )

        return {"answer": answer}

    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
