import os
import json
from datetime import date, datetime

import oracledb
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dsn": os.getenv("DB_DSN"),
}


def _to_iso_date(value):
    """Convert Oracle/Python date-like objects to ISO date strings."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return str(value)


def get_patient_history(patient_id, connection=None):
    """Return a patient's demographics and full medical history as a dictionary."""
    owns_connection = connection is None
    if owns_connection:
        connection = oracledb.connect(**DB_CONFIG)

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT birthdate, gender
            FROM patients
            WHERE id = :patient_id
            """,
            {"patient_id": patient_id},
        )
        patient_row = cursor.fetchone()

        medical_history = {
            "date_of_birth": _to_iso_date(patient_row[0]) if patient_row else None,
            "gender": patient_row[1] if patient_row else None,
            "conditions": [],
            "procedures": [],
            "medications": [],
            "allergies": [],
        }

        if not patient_row:
            return medical_history

        cursor.execute(
            """
            SELECT start_date, stop_date, description
            FROM conditions
            WHERE patient = :patient_id
            ORDER BY start_date, id
            """,
            {"patient_id": patient_id},
        )
        for start_date, stop_date, description in cursor.fetchall():
            medical_history["conditions"].append(
                {
                    "start_date": _to_iso_date(start_date),
                    "stop_date": _to_iso_date(stop_date),
                    "status": "resolved" if stop_date else "active",
                    "description": description,
                }
            )

        cursor.execute(
            """
            SELECT procedure_date, description, reason
            FROM procedures
            WHERE patient = :patient_id
            ORDER BY procedure_date DESC, id DESC
            FETCH FIRST 5 ROWS ONLY
            """,
            {"patient_id": patient_id},
        )
        for procedure_date, description, reason in cursor.fetchall():
            medical_history["procedures"].append(
                {
                    "procedure_date": _to_iso_date(procedure_date),
                    "description": description,
                    "reason": reason,
                }
            )

        cursor.execute(
            """
            SELECT start_date, stop_date, description, reason
            FROM medications
            WHERE patient = :patient_id
            AND (stop_date IS NULL OR stop_date >= TRUNC(SYSDATE) - 30)
            ORDER BY start_date, id
            """,
            {"patient_id": patient_id},
        )
        for start_date, stop_date, description, reason in cursor.fetchall():
            medical_history["medications"].append(
                {
                    "start_date": _to_iso_date(start_date),
                    "stop_date": _to_iso_date(stop_date),
                    "status": "active" if stop_date is None else "recently stopped",
                    "description": description,
                    "reason": reason,
                }
            )

        cursor.execute(
            """
            SELECT description
            FROM allergies
            WHERE patient = :patient_id
            ORDER BY id
            """,
            {"patient_id": patient_id},
        )
        for (description,) in cursor.fetchall():
            medical_history["allergies"].append(description)

        return medical_history
    finally:
        if owns_connection:
            connection.close()

def main():
    """Example usage."""
    patient_id = '1d604da9-9a81-4ba9-80c2-de3375d59b40' 
    medical_history = get_patient_history(patient_id)
    print(json.dumps(medical_history, indent=2, ensure_ascii=False))

if __name__ == "__main__":    
    main()
