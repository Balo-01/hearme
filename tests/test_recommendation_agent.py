import argparse
import json
import sys
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent

sys.path.insert(0, str(ROOT_DIR))

from agent.recommendation_agent import get_recommendations


def main() -> None:
    parser = argparse.ArgumentParser(description="Test script: Generate 3 patient recommendations using GPT-4o-mini")
    parser.add_argument("patient_id", nargs="?", default="10339b10-3cd1-4ac3-ac13-ec26728cb592", help="Patient ID (UUID)")
    parser.add_argument(
        "category",
        nargs="?",
        default="communication",
        choices=["pain", "basic_needs", "communication"],
        help="Category: pain, basic_needs, or communication",
    )

    args = parser.parse_args()
    result = get_recommendations(args.patient_id, args.category)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
