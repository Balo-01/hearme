# HearMe

HearMe is an eye-tracking-powered communication aid for non-verbal hospital patients. Patients use webcam gaze to navigate menus and submit requests (pain, basic needs, communication). The nurse dashboard shows incoming requests with AI-generated context about why those options were recommended for the patient.

---

## Architecture

| Component | Location | Description |
|---|---|---|
| Oracle DB | Docker | Stores patients, medical history, requests |
| FastAPI backend | `backend/server.py` | REST API for requests and AI recommendations |
| Recommendation agent | `agent/recommendation_agent.py` | GPT-4o-mini integration |
| React frontend | `frontend/` | Patient menus + nurse dashboard |
| EyeTrax gaze server | `eyetrax/` | WebSocket webcam eye-tracking |

---

## Prerequisites

- Docker Desktop
- Python 3.10+
- Node.js 18+
- OpenAI API key

---

## Step 1 — Start Oracle with Docker

```powershell
docker compose up -d
```

Exposes port `1521` for SQL connections. Wait until the container is healthy.

---

## Step 2 — Create the Database Schema

Connect to Oracle and run:

```sql
database/create_database.sql
```

Tables created: `patients`, `conditions`, `procedures`, `medications`, `allergies`, `requests`.

The `requests` table includes an `ai_summary CLOB` column that stores the AI-generated context at request creation time.

---

## Step 3 — Configure Environment Variables

Create a `.env` file in the repository root:

```dotenv
DB_USER=your_username
DB_PASSWORD=your_password
DB_DSN=localhost:1521/FREEPDB1
CSV_PATH=database/csv/
OPENAI_API_KEY=your_openai_api_key
```

---

## Step 4 — Install Python Dependencies

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## Step 5 — Load Patient Data

```powershell
py .\database\etl_script.py
```

Inserts up to 15 patients with their conditions, procedures, medications, and allergies from the CSV files in `database/csv/`.

---

## Step 6 — Run Everything

```powershell
.\start-hearme.ps1
```

This script starts:
1. The EyeTrax gaze WebSocket server (`ws://localhost:8765`)
2. The Vite React frontend (`http://localhost:5173`)

Start the FastAPI backend separately:

```powershell
cd backend
uvicorn server:app --reload
```

Backend runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

---

## Recommendation Agent

The agent (`agent/recommendation_agent.py`) is called once when a patient submits a request. It uses the patient's medical history and past request patterns to recommend the 3 most relevant options and generate a summary explaining the reasoning.

### Function

```python
get_recommendations(patient_id: str, category: str) -> dict
```

### Categories

| Category | Options |
|---|---|
| `pain` | head pain, back pain, stomach pain |
| `basic_needs` | water, food, toilet, blanket, temperature, lighting, body position |
| `communication` | call nurse, call family, call doctor, call cleaning |

### How it works

1. For `pain`: fetches the patient's full medical history (conditions, procedures, medications, allergies) and their past pain request history.
2. For `basic_needs` / `communication`: fetches past request history for that category only.
3. Sends data to `gpt-4o-mini` and asks for exactly 3 recommendations plus a summary explaining the reasoning.
4. Returns JSON with shape:

```json
{
  "patient_id": "...",
  "category": "pain",
  "recommendations": ["head pain", "stomach pain", "back pain"],
  "summary": "The patient has a history of sinusitis and has previously reported head pain most frequently..."
}
```

### LLM call lifecycle

- Called once via `GET /recommendations` when the patient page loads (to populate the button options).
- The frontend stores the returned `summary` in context.
- When the patient confirms and submits a request, the summary is passed in the `POST /requests` body and stored in the `ai_summary` DB column — **no second LLM call**.
- The nurse dashboard reads `ai_summary` directly from the stored request.

### Test the agent

```powershell
py tests/test_recommendation_agent.py
py tests/test_recommendation_agent.py <patient_uuid> <category>
```

---

## Backend API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/recommendations` | Get 3 AI recommendations + summary for a patient/category |
| `GET` | `/requests` | List requests (query: `status=active\|done\|all`, `cnp=...`) |
| `POST` | `/requests` | Submit a new patient request |
| `PATCH` | `/requests/{id}/dismiss` | Resolve a request |

Example calls:

```powershell
# Submit a request
Invoke-RestMethod -Method Post -Uri http://localhost:8000/requests `
  -ContentType "application/json" `
  -Body '{"patient_id":"10339b10-3cd1-4ac3-ac13-ec26728cb592","path":["pain","head","mild"]}'

# Get recommendations
Invoke-RestMethod -Uri "http://localhost:8000/recommendations?patient_id=10339b10-3cd1-4ac3-ac13-ec26728cb592&category=basic_needs"

# List active requests
Invoke-RestMethod -Uri "http://localhost:8000/requests?status=active"

# Dismiss a request
Invoke-RestMethod -Method Patch -Uri http://localhost:8000/requests/1/dismiss
```

CORS is enabled for `http://localhost:3000` and `http://localhost:5173`. Override with a comma-separated `CORS_ORIGINS` value in `.env`.

---

## Frontend

The React frontend (`frontend/`) has two sides:

**Patient flow** (gaze-navigated):
1. Calibration screen (9-point + 3-point Kalman fine tuning)
2. Home → category selection (Pain / Basic Needs / Communication / Emergency)
3. Sub-options populated by AI recommendations, with fallbacks
4. Confirmation screen → request submitted

**Nurse dashboard** (`/nurse`):
- Lists incoming requests, filterable by status and patient CNP
- Detail panel shows the original request, AI-rephrased version, and the **AI context** (the stored summary explaining why those options were recommended for this patient)

---

## Eye Tracking

EyeTrax (`eyetrax/`) provides webcam gaze tracking over a WebSocket:

- Setup screen validates face position, lighting, and head alignment
- 9-point calibration followed by 3-point Kalman filter tuning
- Gaze cursor overlay on patient menus
- 3-second dwell on a button activates it
- Press `R` to recalibrate


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
