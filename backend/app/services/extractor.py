import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


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

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
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
        return json.loads(ai_output)
    except Exception:
        return {
            "summary": ai_output,
            "daily_tasks": [],
            "medications": [],
            "warning_signs": [],
            "follow_up": [],
            "disclaimer": "This tool does not provide medical advice. Contact a licensed healthcare professional for medical concerns.",
        }