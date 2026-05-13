import json
import os
import sys
from collections import Counter
from pathlib import Path
from typing import Dict, List

from dotenv import load_dotenv
from openai import OpenAI
from pandas import options

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent

load_dotenv(ROOT_DIR / ".env")

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from tools.patient_medical_history import get_patient_history
from tools.patient_requests_history import get_patient_requests

CATEGORY_OPTIONS = {
    "pain": [
        "head pain", "back pain", "stomach pain"
    ],
    "basic_needs": [
        "water", "food", "toilet", "blanket",
        "temperature", "lighting", "body position"
    ],
    "communication": [
        "call nurse", "call family", "call doctor", "call cleaning"
    ],
}


def summarize_requests(request_history: Dict, recent_limit: int = 5, frequent_limit: int = 5) -> Dict:
    requests = request_history.get("requests", [])

    recent_requests = requests[:recent_limit]

    descriptions = [
        (entry.get("request") or "").strip()
        for entry in requests
        if (entry.get("request") or "").strip()
    ]

    frequencies = Counter(descriptions)
    frequent_requests = [
        {"request": request_text, "count": count}
        for request_text, count in frequencies.most_common(frequent_limit)
    ]

    return {
        "total_requests_in_category": len(requests),
        "most_recent_requests": recent_requests,
        "most_frequent_requests": frequent_requests,
    }


def extract_recommendations(response_text: str) -> List[str]:
    try:
        parsed = json.loads(response_text)
        recommendations = parsed.get("recommendations", [])
        if isinstance(recommendations, list):
            cleaned = [str(item).strip() for item in recommendations if str(item).strip()]
            return cleaned[:3]
    except json.JSONDecodeError:
        pass

    lines = [line.strip("-• \t") for line in response_text.splitlines() if line.strip()]
    return lines[:3]


def get_recommendations(patient_id: str, category: str) -> Dict:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing. Add it to .env in project root")

    client = OpenAI(api_key=api_key)

    # Pre-fetch data in Python — no need for the model to decide which tools to call
    patient_data_sections = []

    if category == "pain":
        medical_history = get_patient_history(patient_id)
        patient_data_sections.append(f"Medical history:\n{json.dumps(medical_history, indent=2)}")

    requests_history = get_patient_requests(patient_id, category)
    summary = summarize_requests(requests_history)
    patient_data_sections.append(f"Past {category} requests summary:\n{json.dumps(summary, indent=2)}")

    patient_data = "\n\n".join(patient_data_sections)

    options = CATEGORY_OPTIONS.get(category, [])
    options_text = ", ".join(f'"{o}"' for o in options)

    system_prompt = (
        "You are a clinical support assistant helping a patient communicate their needs. "
        "Based on the patient data provided, return exactly 3 recommendations for what the patient may need. "
        "Return ONLY valid JSON with this exact shape: "
        "{\"recommendations\": [\"rec1\", \"rec2\", \"rec3\"]}. "
        "Keep each recommendation 2-3 words long. "
        "Do not suggest generic actions like 'ask nurse for help' or 'use call button' or 'ask for medication'."
        f"Only recommend items relevant to the '{category}' category. "
        f"Preferred options for this category are: [{options_text}]. "
        "Pick the 3 most relevant ones based on the patient data. You may suggest similar specific alternatives not in the list. "
        "Do not output extra keys or commentary."
    )

    user_message = (
        f"Category: {category}\n\n"
        f"{patient_data}\n\n"
        "Provide exactly 3 recommendations."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=256,
        messages=messages,
    )

    response_text = response.choices[0].message.content.strip()
    recommendations = extract_recommendations(response_text)

    if len(recommendations) < 3:
        raise ValueError(
            "Model response did not contain 3 recommendations. "
            f"Raw response: {response_text}"
        )

    return {
        "patient_id": patient_id,
        "category": category,
        "recommendations": recommendations[:3],
    }
