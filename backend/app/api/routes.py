import os
import io
import fitz
import pytesseract
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.extractor import generate_care_plan
from app.services.assistant import generate_caregiver_assistant_response

router = APIRouter()

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


class AssistantRequest(BaseModel):
    question: str
    care_context: dict


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""

    with fitz.open(stream=file_bytes, filetype="pdf") as pdf:
        for page in pdf:
            text += page.get_text()

    return text.strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore").strip()


def extract_text_from_image(file_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(image)
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

    care_plan = generate_care_plan(document_text)

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

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )