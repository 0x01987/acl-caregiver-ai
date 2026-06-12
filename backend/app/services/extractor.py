import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_care_plan(document_text: str):
    if not document_text.strip():
        return {"error": "No readable text found in document."}

    prompt = f"""
You are an expert caregiver assistant.

Analyze the following medical, discharge, medication, or caregiver document.

Create a caregiver-friendly care plan.

Return the response in this exact format:

1. Summary
Briefly explain the patient's care situation in simple language.

2. Daily Tasks
List clear daily caregiver tasks.

3. Medications
List medication name, dosage, frequency, and special instructions if available.

4. Warning Signs
List symptoms or changes that require contacting a provider or seeking urgent care.

5. Follow-Up Actions
List appointments, calls, lab work, or next steps.

Important:
- Use simple caregiver-friendly language.
- Do not provide diagnosis.
- Do not invent medication details.
- If information is missing, say "Not specified."
- Include a medical disclaimer.

Document:
{document_text}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You help caregivers understand care documents. You do not provide medical advice.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    return {
        "care_plan": response.choices[0].message.content
    }