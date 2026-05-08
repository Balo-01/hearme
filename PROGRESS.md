# HearMe Eye-Tracking Integration

## What This Project Does
- Combines the React HearMe frontend with the Python EyeTrax eye tracker.
- Starts with a webcam setup screen.
- Runs 9-point gaze calibration.
- Runs 3-point Kalman fine tuning.
- Lets the patient navigate menus by holding gaze on large directional button zones.
- Sends confirmed patient requests to the nurse dashboard.

## Current Run Command
```powershell
.\start-hearme.ps1
```

The startup script:
- clears port `8765` if another gaze server is listening
- starts `eyetrax-server`
- starts the Vite frontend
- restores your original terminal directory when it exits
- defaults to plain Kalman mode

## Setup Screen
- Shows the webcam feed from the Python gaze server.
- Uses a mirrored preview so positioning feels natural.
- Shows a face oval and center line.
- Shows a blue eye-level band around the horizontal guide.
- The screenshot-tested target position is:
  - face horizontally centered
  - eyes inside the blue eye-level band
  - eyes roughly level with the webcam
  - head naturally upright
  - face filling most of the oval

## Setup Checks
- Face visible
- Eyes level with webcam
- Horizontally centered
- Facing webcam
- Head tilt
- Good distance
- Lighting
- Eyes open

These checks are guidance only. They do not block calibration.

## Calibration Flow
- Press `Space`, `Enter`, or `Start Calibration`.
- Step 1: browser-rendered 9-point calibration.
- After step 1: quick quality readout checks whether corner looks produced separated gaze data.
- Step 2: browser-rendered 3-point Kalman fine tuning.
- After calibration, the patient flow opens.
- Press `R` to recalibrate.

## EyeTrax Alignment
- Checked upstream EyeTrax GitHub/PyPI behavior.
- Upstream example uses `eyetrax-demo --filter kalman`.
- The integrated server now defaults to plain `kalman`.
- Kalman tuning uses the upstream point layout:
  - center top
  - lower left
  - lower right
- Kalman tuning uses upstream timing:
  - proximity threshold: `screen_width / 5`
  - initial delay: `0.5s`
  - capture duration: `0.5s`
- No upstream Kalman formulas were changed.
- No regression model formula was changed.

## Frontend Integration
- Added `EyeTrackingContext` for WebSocket state.
- Added setup and calibration screens.
- Added `GazeCursor` overlay.
- Added `RecalibrateButton`.
- Updated `App.jsx` so the patient flow is gated behind calibration.
- Updated patient menu buttons to expose real click/navigation handlers.
- Replaced synthetic mouse-hover activation with direct gaze dwell activation.
- Added invisible directional gaze zones over quadrant buttons.
- A 3-second dwell activates the real button.

## Backend Integration
- Added `eyetrax/src/eyetrax/server.py`.
- WebSocket endpoint: `ws://localhost:8765`.
- Sends:
  - gaze coordinates
  - blink/valid flags
- calibration status
- calibration quality summary
- calibration point positions
  - camera preview frames
  - setup checks
- Receives:
  - screen size
  - face check requests
  - calibration start
  - recalibration/reset requests

## Accuracy Notes
- Best current setup is eyes level with the webcam and on the horizontal guide.
- The blue eye band is intentionally forgiving; being natural is better than forcing a rigid pose.
- If the quality readout reports weak corner separation, recalibrate with the same posture and make sure your eyes move clearly to each dot.
- Adjust chair, screen, or webcam height before forcing your head posture.
- Calibrate in the same posture you will use afterward.
- Keep lighting stable and mostly from the front.
- Avoid bright backlight.
- Keep the browser window size and position stable after calibration.

## GitHub Hygiene
- Added `.gitignore` for:
  - Python virtual environments
  - Python caches
  - Node dependencies
  - Vite build output
  - logs
  - local models/recordings
  - editor and OS files

## Verification
- `start-hearme.ps1` parses successfully as PowerShell.
- `frontend`: `npm run lint` passes.
- `frontend`: `npm run build` passes.
- `eyetrax`: `server.py` and `gaze.py` parse successfully with Python `ast`.

## Remaining Work
- Live end-to-end testing should still be done on the target machine.
- If tracking feels worse than upstream, compare against:

```powershell
eyetrax-demo --filter kalman
```

Use the same webcam position, lighting, screen size, and posture.
