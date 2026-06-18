import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

DEFAULT_DISCLAIMER = (
    "This tool does not provide medical advice. Contact a licensed healthcare "
    "professional for medical concerns."
)

CARE_PLAN_DEFAULTS = {
    "summary": "Not specified",
    "daily_tasks": [],
    "medications": [],
    "warning_signs": [],
    "follow_up": [],
    "disclaimer": DEFAULT_DISCLAIMER,
}


def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    return OpenAI(api_key=api_key)


def normalize_care_plan(raw_plan: dict) -> dict:
    if not isinstance(raw_plan, dict):
        raw_plan = {}
    plan = {**CARE_PLAN_DEFAULTS, **raw_plan}
    for key in ["daily_tasks", "medications", "warning_signs", "follow_up"]:
        if not isinstance(plan.get(key), list):
            plan[key] = []
    if not isinstance(plan.get("summary"), str):
        plan["summary"] = "Not specified"
    if not isinstance(plan.get("disclaimer"), str) or not plan["disclaimer"].strip():
        plan["disclaimer"] = DEFAULT_DISCLAIMER
    return plan


def generate_care_plan(document_text: str):
    if not document_text.strip():
        return {"error": "No readable text found in document."}

    prompt = f"""
You are an expert caregiver support assistant.

Analyze the following medical, discharge, medication, or caregiver document.

Return ONLY valid JSON using this exact schema:

{{
  "summary": "string",
  "daily_tasks": ["string"],
  "medications": [
    {{
      "name": "string",
      "dosage": "string",
      "frequency": "string",
      "instructions": "string"
    }}
  ],
  "warning_signs": ["string"],
  "follow_up": ["string"],
  "disclaimer": "string"
}}

Rules:
- Return JSON only.
- Do not use markdown.
- Do not use code fences.
- Use simple caregiver-friendly language.
- Do not provide a diagnosis.
- Do not invent medication details.
- If information is missing, use "Not specified".
- Include a clear medical disclaimer.

Document:
{document_text}
"""

    response = get_openai_client().chat.completions.create(
        model="gpt-4.1-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": "You help caregivers understand care documents. You do not provide medical advice. Return only valid JSON.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    ai_output = response.choices[0].message.content

    try:
        return normalize_care_plan(json.loads(ai_output))
    except Exception:
        return {
            "summary": ai_output,
            "daily_tasks": [],
            "medications": [],
            "warning_signs": [],
            "follow_up": [],
            "disclaimer": DEFAULT_DISCLAIMER,
        }
