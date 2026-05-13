import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List, Optional

import oracledb
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from agent.recommendation_agent import CATEGORY_OPTIONS, get_recommendations

load_dotenv()

DB_CONFIG = {
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "dsn": os.getenv("DB_DSN"),
}

DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://localhost:5173"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app = FastAPI(title="HearMe Patient Request Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PatientRequestCreate(BaseModel):
    patient_id: str
    path: List[str]

    @field_validator("path")
    def validate_path(cls, value):
        normalized_path = [
            segment.strip()
            for segment in value
            if isinstance(segment, str) and segment.strip()
        ]
        if not normalized_path:
            raise ValueError("path must contain at least one non-empty segment")
        return normalized_path


class PatientRequest(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    path: List[str]
    status: str
    created_at: datetime
    dismissed_at: Optional[datetime] = None


class RecommendationResponse(BaseModel):
    patient_id: str
    category: str
    recommendations: List[str]
    summary: str = ""


def _normalize_request_type(value: str) -> str:
    return str(value).strip().lower().replace("-", "_")


def _normalize_recommendation_category(value: str) -> str:
    category = _normalize_request_type(value)
    if category not in CATEGORY_OPTIONS:
        valid_categories = ", ".join(CATEGORY_OPTIONS)
        raise HTTPException(
            status_code=400,
            detail=f"Invalid recommendation category. Expected one of: {valid_categories}",
        )
    return category


def get_connection() -> oracledb.Connection:
    missing_config = [name for name, value in DB_CONFIG.items() if not value]
    if missing_config:
        raise HTTPException(
            status_code=500,
            detail=f"Missing database configuration: {', '.join(missing_config)}",
        )

    try:
        return oracledb.connect(**DB_CONFIG)
    except oracledb.Error as exc:
        raise HTTPException(status_code=503, detail="Database connection failed") from exc


def _read_lob(value: Any) -> Any:
    if hasattr(value, "read"):
        return value.read()
    return value


def _as_utc_datetime(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _parse_request_id(request_id: str) -> int:
    try:
        return int(request_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Request not found") from exc


def _parse_path(path_value: Any, request_type: Optional[str], description: Optional[str]) -> List[str]:
    raw_path = _read_lob(path_value)
    if raw_path:
        try:
            parsed_path = json.loads(raw_path)
        except (TypeError, json.JSONDecodeError):
            parsed_path = None

        if isinstance(parsed_path, list):
            normalized_path = [str(segment) for segment in parsed_path if str(segment).strip()]
            if normalized_path:
                return normalized_path

    if request_type:
        return [request_type]
    if description:
        return [description]
    return []


def _format_patient_name(firstname: Optional[str], lastname: Optional[str]) -> Optional[str]:
    name = " ".join(part for part in [firstname, lastname] if part)
    return name or None


def _row_to_request(row: tuple) -> PatientRequest:
    (
        request_id,
        patient_id,
        patient_firstname,
        patient_lastname,
        path,
        status,
        created_at,
        dismissed_at,
        request_type,
        description,
    ) = row
    return PatientRequest(
        id=str(request_id),
        patient_id=patient_id,
        patient_name=_format_patient_name(patient_firstname, patient_lastname),
        path=_parse_path(path, request_type, description),
        status=status,
        created_at=_as_utc_datetime(created_at),
        dismissed_at=_as_utc_datetime(dismissed_at),
    )


def _select_request_by_id(connection: oracledb.Connection, request_id: int) -> Optional[PatientRequest]:
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT
            r.id,
            r.patient_id,
            p.firstname,
            p.lastname,
            r.path,
            r.status,
            r.request_date,
            r.dismissed_at,
            r.request_type,
            r.description
        FROM requests r
        LEFT JOIN patients p ON p.id = r.patient_id
        WHERE r.id = :request_id
        """,
        {"request_id": request_id},
    )
    row = cursor.fetchone()
    if row is None:
        return None
    return _row_to_request(row)


def _returned_id(value: Any) -> int:
    returned_value = value.getvalue()
    if isinstance(returned_value, list):
        returned_value = returned_value[0]
    return int(returned_value)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/recommendations", response_model=RecommendationResponse)
def get_patient_recommendations(
    patient_id: str = Query(..., min_length=1),
    category: str = Query(..., min_length=1),
):
    normalized_patient_id = patient_id.strip()
    normalized_category = _normalize_recommendation_category(category)

    try:
        result = get_recommendations(normalized_patient_id, normalized_category)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to generate recommendations") from exc


@app.post("/requests", response_model=PatientRequest)
def create_request(data: PatientRequestCreate):
    created_at = datetime.now(timezone.utc).replace(tzinfo=None)
    request_type = _normalize_request_type(data.path[0])[:100]
    description = " > ".join(data.path)[:500]
    path_json = json.dumps(data.path)

    connection = get_connection()
    try:
        cursor = connection.cursor()
        request_id = cursor.var(int)
        cursor.execute(
            """
            INSERT INTO requests (
                patient_id,
                request_date,
                request_type,
                description,
                path,
                status,
                dismissed_at
            ) VALUES (
                :patient_id,
                :request_date,
                :request_type,
                :description,
                :path,
                :status,
                :dismissed_at
            )
            RETURNING id INTO :request_id
            """,
            {
                "patient_id": data.patient_id,
                "request_date": created_at,
                "request_type": request_type,
                "description": description,
                "path": path_json,
                "status": "active",
                "dismissed_at": None,
                "request_id": request_id,
            },
        )
        created_request_id = _returned_id(request_id)
        connection.commit()

        created_request = _select_request_by_id(connection, created_request_id)
        if created_request is None:
            raise HTTPException(status_code=500, detail="Created request could not be loaded")
        return created_request
    except oracledb.IntegrityError as exc:
        connection.rollback()
        raise HTTPException(status_code=400, detail="Invalid patient_id") from exc
    except oracledb.DatabaseError as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Failed to create request") from exc
    finally:
        connection.close()


@app.get("/requests", response_model=List[PatientRequest])
def get_requests(status: Optional[str] = Query(default="active")):
    query = """
        SELECT
            r.id,
            r.patient_id,
            p.firstname,
            p.lastname,
            r.path,
            r.status,
            r.request_date,
            r.dismissed_at,
            r.request_type,
            r.description
        FROM requests r
        LEFT JOIN patients p ON p.id = r.patient_id
    """
    params = {}

    normalized_status = status.strip().lower() if status is not None else "active"
    if normalized_status and normalized_status != "all":
        query += " WHERE r.status = :status"
        params["status"] = normalized_status

    query += " ORDER BY r.request_date NULLS LAST, r.id"

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        return [_row_to_request(row) for row in cursor.fetchall()]
    except oracledb.DatabaseError as exc:
        raise HTTPException(status_code=500, detail="Failed to load requests") from exc
    finally:
        connection.close()


@app.get("/requests/{patient_id}", response_model=List[PatientRequest])
def get_patient_requests(patient_id: str, status: Optional[str] = Query(default="active")):
    normalized_patient_id = patient_id.strip()
    if not normalized_patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")

    query = """
        SELECT
            r.id,
            r.patient_id,
            p.firstname,
            p.lastname,
            r.path,
            r.status,
            r.request_date,
            r.dismissed_at,
            r.request_type,
            r.description
        FROM requests r
        LEFT JOIN patients p ON p.id = r.patient_id
        WHERE r.patient_id = :patient_id
    """
    params = {"patient_id": normalized_patient_id}

    normalized_status = status.strip().lower() if status is not None else "active"
    if normalized_status and normalized_status != "all":
        query += " AND r.status = :status"
        params["status"] = normalized_status

    query += " ORDER BY r.request_date NULLS LAST, r.id"

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        return [_row_to_request(row) for row in cursor.fetchall()]
    except oracledb.DatabaseError as exc:
        raise HTTPException(status_code=500, detail="Failed to load patient requests") from exc
    finally:
        connection.close()


@app.patch("/requests/{request_id}/dismiss", response_model=PatientRequest)
def dismiss_request(request_id: str):
    numeric_request_id = _parse_request_id(request_id)
    dismissed_at = datetime.now(timezone.utc).replace(tzinfo=None)

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE requests
            SET status = :status,
                dismissed_at = :dismissed_at
            WHERE id = :request_id
            """,
            {
                "status": "done",
                "dismissed_at": dismissed_at,
                "request_id": numeric_request_id,
            },
        )

        if cursor.rowcount == 0:
            connection.rollback()
            raise HTTPException(status_code=404, detail="Request not found")

        connection.commit()
        updated_request = _select_request_by_id(connection, numeric_request_id)
        if updated_request is None:
            raise HTTPException(status_code=404, detail="Request not found")
        return updated_request
    except HTTPException:
        raise
    except oracledb.DatabaseError as exc:
        connection.rollback()
        raise HTTPException(status_code=500, detail="Failed to dismiss request") from exc
    finally:
        connection.close()
