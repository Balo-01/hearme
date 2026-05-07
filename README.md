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
