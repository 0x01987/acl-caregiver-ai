import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    return OpenAI(api_key=api_key)


def generate_caregiver_assistant_response(question: str, care_context: dict):
    prompt = f"""
You are CareGuide AI, a caregiver support assistant.

You help caregivers understand and organize care information.

You must follow these safety rules:
- Do NOT diagnose.
- Do NOT recommend medication changes.
- Do NOT replace a clinician.
- Do NOT provide emergency triage beyond advising urgent help for emergency warning signs.
- Encourage contacting a healthcare provider when symptoms worsen, are unclear, or concern the caregiver.
- Use simple, calm, caregiver-friendly language.
- Refer to the care context when relevant.
- Keep responses concise and actionable.

Care Context:
{care_context}

Caregiver Question:
{question}
"""

    response = get_openai_client().chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a safe caregiver support assistant. You do not provide medical advice, diagnosis, or treatment decisions.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    return response.choices[0].message.content
