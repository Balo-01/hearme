# HearMe - Database Setup and Usage

## Project Overview

This project uses an Oracle database to store patient-related data for:

- demographics (patients)
- clinical history (conditions, procedures, observations, medications, allergies)
- patient support requests (requests)

The Python scripts in the repository query these tables and return structured dictionaries for:

- complete medical history: patient_medical_history.py
- request history by request type: patient_requests_history.py

## Database Schema

The schema is created from database/create_database.sql and includes the following tables:

- patients: patient master data
- procedures: procedures performed for a patient
- observations: measured or reported observations
- medications: medication intervals and reasons
- conditions: diagnosis/history conditions
- allergies: allergy records
- requests: patient requests with type and timestamp

All child tables are linked to patients using foreign keys.

## Prerequisites

- Docker Desktop (or Docker Engine)
- Python 3.10+
- Access to SQLcl or another Oracle SQL client

## Step 1 - Start Oracle with Docker

From the repository root, run:

```powershell
docker compose up -d
```

This starts Oracle Free using docker-compose.yml and exposes:

- port 1521 for SQL connections
- port 5500 for Oracle management

Wait until the container health check reports healthy.

## Step 2 - Create Tables

Create a user, connect to the database and run:

- database/create_database.sql

This creates all tables and constraints required by the ETL and query scripts.

If the database already existed before the FastAPI request server was added, also run:

- database/alter_requests_for_server.sql

This adds the request fields used by the server: path, status, and dismissed_at.

## Step 3 - Configure Environment Variables

Create a .env file in the repository root with values like:

```dotenv
DB_USER=your_username
DB_PASSWORD=your_password
DB_DSN=localhost:1521/FREEPDB1
CSV_PATH=database/csv/
```

## Step 4 - Install Python Dependencies

From the repository root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r database/requirements.txt
```

## Step 5 - Load Data into the Database

Run the ETL script:

```powershell
py .\database\etl_script.py
```

What ETL does:

- inserts up to 15 patients (MAX_NUMBER_OF_PATIENTS)
- inserts related procedures, observations, medications, conditions, and allergies
- applies a +5 year offset to source dates (DATE_YEAR_OFFSET)
- skips procedure rows whose description contains medication reconciliation

## Step 6 - Run Query Scripts

Medical history example:

```powershell
py .\patient_medical_history.py
```

Patient requests example:

```powershell
py .\patient_requests_history.py
```

You can also run database/populate_requests.sql if you want to add test data into the requests table.

## Step 7 - Run the FastAPI Request Server

The frontend should be added separately and call this backend over HTTP.

Start the API from the repository root:

```powershell
uvicorn server:app --reload
```

The backend runs at:

- http://localhost:8000
- http://localhost:8000/docs for Swagger UI

Request API examples:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8000/requests -ContentType "application/json" -Body '{"patient_id":"10339b10-3cd1-4ac3-ac13-ec26728cb592","path":["pain","severe"]}'
Invoke-RestMethod -Uri "http://localhost:8000/requests?status=active"
Invoke-RestMethod -Method Patch -Uri http://localhost:8000/requests/1/dismiss
```

For local frontend development, CORS is enabled for:

- http://localhost:3000
- http://localhost:5173

Override this with a comma-separated CORS_ORIGINS value in .env if needed.
