import os
import json
from datetime import datetime

import oracledb
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dsn": os.getenv("DB_DSN"),
}


def _split_datetime(value):
    """Split datetime into date and time components."""
    if value is None:
        return None, None
    if isinstance(value, datetime):
        return value.date().isoformat(), value.time().strftime("%H:%M:%S")
    return None, None


def get_patient_requests(patient_id, request_type, connection=None):
    """
    Return a dictionary with a patient's requests of a specific type.
    
    Args:
        patient_id: The patient ID to filter by
        request_type: The request type to filter by
        connection: Optional existing database connection
        
    Returns:
        A dictionary containing date, time, and requests list with the patient's 
        requests of the specified type
    """
    owns_connection = connection is None
    if owns_connection:
        connection = oracledb.connect(**DB_CONFIG)

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT request_date, request_type, description
            FROM requests
            WHERE patient_id = :patient_id AND request_type = :request_type
            ORDER BY request_date DESC
            """,
            {"patient_id": patient_id, "request_type": request_type},
        )

        requests = cursor.fetchall()

        result = {
            "request_type": request_type,
            "requests": []
        }

        if not requests:
            return result

        for request_date, req_type, description in requests:
            date_component, time_component = _split_datetime(request_date)
            result["requests"].append(
                {
                    "date": date_component,
                    "time": time_component,
                    "request": description,
                }
            )

        return result

    finally:
        if owns_connection:
            connection.close()


def main():
    """Example usage."""
    patient_id = "1d604da9-9a81-4ba9-80c2-de3375d59b40"
    request_type = "pain"
    result = get_patient_requests(patient_id, request_type)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    request_type = "basic_needs"
    result = get_patient_requests(patient_id, request_type)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    request_type = "communication"
    result = get_patient_requests(patient_id, request_type)
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
