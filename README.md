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

## Step 7 - Configure the Recommendation Agent

Add your OpenAI API key to the `.env` file:

```dotenv
OPENAI_API_KEY=your_openai_api_key
```

Install agent dependencies:

```powershell
pip install -r requirements.txt
```

## Agent Logic

The recommendation agent is in `agent/recommendation_agent.py` and exposes a single function:

```python
get_recommendations(patient_id: str, category: str) -> dict
```

It returns exactly 3 recommendations for the given patient and category.

### Categories

| Category | Valid options |
|---|---|
| `pain` | head pain, back pain, stomach pain |
| `basic_needs` | water, food, toilet, blanket, temperature, lighting, body position |
| `communication` | call nurse, call family, call doctor, call cleaning |

### How it works

1. The agent sends the patient ID and category to `gpt-4o-mini` with two tool definitions:
   - `get_patient_medical_history` — fetches conditions, procedures, observations, medications, allergies
   - `get_patient_requests_history` — fetches the summarized request history for the given category
2. For `pain`, the model calls both tools. For `basic_needs` and `communication`, it calls request history only.
3. The model uses the fetched data and the predefined option list for the category to pick the 3 most relevant recommendations.
4. The response is parsed from JSON and validated to contain exactly 3 items.

### Output shape

```json
{
  "patient_id": "...",
  "category": "pain",
  "recommendations": ["head pain", "back pain", "stomach pain"]
}
```

### Test the agent

```powershell
py tests/test_recommendation_agent.py
py tests/test_recommendation_agent.py <patient_uuid> <category>
```

## Step 8 - Run the FastAPI Backend

The frontend calls this backend over HTTP for request submission, nurse dashboard polling, and AI recommendations.

Start the API from the repository root:

```powershell
python -m uvicorn backend.server:app --reload
```

The backend runs at:

- http://localhost:8000
- http://localhost:8000/docs for Swagger UI

Request API examples:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8000/requests -ContentType "application/json" -Body '{"patient_id":"10339b10-3cd1-4ac3-ac13-ec26728cb592","path":["pain","severe"]}'
Invoke-RestMethod -Uri "http://localhost:8000/requests?status=active"
Invoke-RestMethod -Method Patch -Uri http://localhost:8000/requests/1/dismiss
Invoke-RestMethod -Uri "http://localhost:8000/recommendations?patient_id=10339b10-3cd1-4ac3-ac13-ec26728cb592&category=basic_needs"
```

For local frontend development, CORS is enabled for:

- http://localhost:3000
- http://localhost:5173

Override this with a comma-separated CORS_ORIGINS value in .env if needed.
# HearMe Eye Tracking Frontend

HearMe combines a React patient/nurse communication frontend with EyeTrax webcam gaze tracking. Patients calibrate eye tracking, then navigate large menu options by holding gaze on the relevant direction/button.

## Project Structure

```text
hearme/
  frontend/          React/Vite app
  eyetrax/           Python EyeTrax package plus WebSocket bridge
  start-hearme.ps1   One-command local startup script
  how to run.txt     Detailed local setup notes
  PROGRESS.md        Integration summary and current implementation notes
```

## Quick Start

Open PowerShell in this folder and run:

```powershell
.\start-hearme.ps1
```

The script:
- clears port `8765` if another gaze server is already listening
- starts the Python EyeTrax WebSocket server
- starts the Vite frontend
- defaults to plain Kalman mode, matching `eyetrax-demo --filter kalman`

## First-Time Setup

Install frontend dependencies:

```powershell
cd frontend
npm install
cd ..
```

Install Python dependencies:

```powershell
cd eyetrax
py -3.12 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
cd ..
```

Then run:

```powershell
.\start-hearme.ps1
```

## Calibration Tips

- Keep your eyes inside the blue webcam-level band.
- Aim for the blue eye-level band; it is intentionally more forgiving than a single line.
- Keep your face centered in the oval.
- Keep lighting stable and mostly from the front.
- Calibrate in the posture you will actually use.
- Watch the calibration quality readout after the 9-point pass; weak corner separation means your eye movement did not produce enough distinct gaze data.
- Do not resize or move the browser window after calibration.

## Useful Options

```powershell
.\start-hearme.ps1 -Camera 1
.\start-hearme.ps1 -Port 8766
.\start-hearme.ps1 -Filter kalman_ema -EmaAlpha 0.25
.\start-hearme.ps1 -SkipPortCleanup
```

## Verification

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Python syntax smoke check:

```powershell
python -c "import ast, pathlib; ast.parse(pathlib.Path('eyetrax/src/eyetrax/server.py').read_text(encoding='utf-8'))"
```
