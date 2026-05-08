import json
import os
import sys
from collections import Counter
from pathlib import Path
from typing import Dict, List, Any

from dotenv import load_dotenv
from openai import OpenAI

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

DEFAULT_MODEL = "gpt-4o-mini"
_client = None


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


def summarize_medical_history(medical_history: Dict, limit: int = 8) -> Dict:
    pain_observations = [
        observation
        for observation in medical_history.get("observations", [])
        if "pain" in str(observation.get("description", "")).lower()
    ]

    return {
        "patient_id": medical_history.get("patient_id"),
        "date_of_birth": medical_history.get("date_of_birth"),
        "gender": medical_history.get("gender"),
        "recent_conditions": medical_history.get("conditions", [])[-limit:],
        "recent_procedures": medical_history.get("procedures", [])[-limit:],
        "recent_pain_observations": pain_observations[-limit:],
        "recent_medications": medical_history.get("medications", [])[-limit:],
        "allergies": medical_history.get("allergies", [])[:limit],
    }


def get_openai_client() -> OpenAI:
    global _client

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is missing. Add it to .env in project root")

    if _client is None:
        _client = OpenAI(api_key=api_key)

    return _client


def get_recommendation_context(patient_id: str, category: str) -> Dict:
    request_history = get_patient_requests(patient_id, category)
    context = {
        "request_history": summarize_requests(request_history),
    }

    if category == "pain":
        context["medical_history"] = summarize_medical_history(
            get_patient_history(patient_id)
        )

    return context


def complete_recommendations(recommendations: List[str], category: str) -> List[str]:
    options = CATEGORY_OPTIONS.get(category, [])
    seen = set()
    completed = []

    for value in [*recommendations, *options]:
        normalized = str(value).strip().lower()
        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        completed.append(normalized)

        if len(completed) == 3:
            break

    return completed


def process_tool_call(tool_name: str, tool_input: Dict[str, Any]) -> str:
    """Process a tool call and return the result as a JSON string."""
    if tool_name == "get_patient_medical_history":
        patient_id = tool_input.get("patient_id")
        result = get_patient_history(patient_id)
        return json.dumps(result)
    elif tool_name == "get_patient_requests_history":
        patient_id = tool_input.get("patient_id")
        request_type = tool_input.get("request_type")
        result = get_patient_requests(patient_id, request_type)
        summary = summarize_requests(result)
        return json.dumps({
            "patient_id": patient_id,
            "request_type": request_type,
            "summary": summary
        })
    else:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})


def get_tool_definitions():
    """Return the tool definitions for OpenAI."""
    return [
        {
            "type": "function",
            "function": {
                "name": "get_patient_medical_history",
                "description": "Retrieve the complete medical history for a patient including date of birth, gender, conditions, procedures, observations, medications, and allergies.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "patient_id": {
                            "type": "string",
                            "description": "The unique identifier (UUID) of the patient"
                        }
                    },
                    "required": ["patient_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_patient_requests_history",
                "description": "Retrieve the request history for a patient filtered by request type (pain, basic_needs, or communication).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "patient_id": {
                            "type": "string",
                            "description": "The unique identifier (UUID) of the patient"
                        },
                        "request_type": {
                            "type": "string",
                            "enum": ["pain", "basic_needs", "communication"],
                            "description": "The type of requests to retrieve"
                        }
                    },
                    "required": ["patient_id", "request_type"]
                }
            }
        }
    ]


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
    client = get_openai_client()
    model = os.getenv("OPENAI_RECOMMENDATION_MODEL", DEFAULT_MODEL)
    options = CATEGORY_OPTIONS.get(category, [])
    options_text = ", ".join(f'"{o}"' for o in options)
    patient_context = get_recommendation_context(patient_id, category)
    
    system_prompt = (
        "You are a clinical support assistant. You are helping a patient ask for what he needs. "
        "After fetching data, return ONLY valid JSON with this exact shape: "
        "{\"recommendations\": [\"rec1\", \"rec2\", \"rec3\"]}. "
        "Keep the recommendations 2-3 words long. "
        "Do not give general stuff like 'ask nurse for help' or 'use call button'. "
        f"For the '{category}' category, the only valid recommendation values are: [{options_text}]. "
        "Pick the 3 most relevant ones based on the patient's data. "
        "Keep basic_needs recommendations distinct from communication recommendations and different from pain-related recommendations. "
        "Don't give recommendations about pain if the category is basic_needs or communication. "
        "Don't give recommendations about basic needs if the category is pain or communication. "
        "Don't give recommendations about communication if the category is pain or basic_needs. "
        "Do not output extra keys or commentary."
    )

    user_message = (
        f"Patient ID: {patient_id}\n"
        f"Category: {category}\n\n"
        "Patient context JSON:\n"
        f"{json.dumps(patient_context, ensure_ascii=False)}\n\n"
        "Provide exactly 3 actionable recommendations."
    )

    response = client.chat.completions.create(
        model=model,
        max_tokens=120,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )

    response_text = response.choices[0].message.content.strip()
    recommendations = complete_recommendations(
        extract_recommendations(response_text),
        category,
    )

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
