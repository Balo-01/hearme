param(
  [int]$Camera = 0,
  [int]$Port = 8765,
  [int]$ApiPort = 8000,
  [string]$ServerHost = "localhost",
  [ValidateSet("kalman", "kalman_ema", "none")]
  [string]$Filter = "kalman",
  [double]$EmaAlpha = 0.25,
  [switch]$SkipPortCleanup
)

$ErrorActionPreference = "Stop"

$originalLocation = Get-Location
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $root "frontend"
$eyetraxPath = Join-Path $root "eyetrax"
$backendPath = $root

if (-not (Test-Path $frontendPath)) {
  throw "Missing frontend folder: $frontendPath"
}
if (-not (Test-Path $eyetraxPath)) {
  throw "Missing eyetrax folder: $eyetraxPath"
}
if (-not (Test-Path (Join-Path $backendPath "backend\server.py"))) {
  throw "Missing backend server: $(Join-Path $backendPath 'backend\server.py')"
}

function Clear-PortIfNeeded {
  param(
    [Parameter(Mandatory = $true)]
    [int]$PortToClear
  )

  $listeners = Get-NetTCPConnection -LocalPort $PortToClear -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -and $_.OwningProcess -ne 0 } |
    Sort-Object OwningProcess -Unique

  if (-not $listeners) {
    Write-Host "[HearMe] Port $PortToClear is free." -ForegroundColor DarkGreen
    return
  }

  foreach ($listener in $listeners) {
    $processId = [int]$listener.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    $name = if ($process) { $process.ProcessName } else { "unknown" }

    Write-Host "[HearMe] Port $PortToClear is occupied by PID $processId ($name). Stopping it..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force
  }

  Start-Sleep -Milliseconds 700

  $stillListening = Get-NetTCPConnection -LocalPort $PortToClear -State Listen -ErrorAction SilentlyContinue
  if ($stillListening) {
    throw "Port $PortToClear is still occupied. Close the process manually or run with another -Port."
  }

  Write-Host "[HearMe] Port $PortToClear is now free." -ForegroundColor DarkGreen
}

function Test-PortListening {
  param(
    [Parameter(Mandatory = $true)]
    [int]$PortToCheck
  )

  $listener = Get-NetTCPConnection -LocalPort $PortToCheck -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  return $null -ne $listener
}

function Wait-ForApi {
  param(
    [Parameter(Mandatory = $true)]
    [int]$ApiPortToCheck,
    [int]$MaxAttempts = 20
  )

  $healthUrl = "http://127.0.0.1:$ApiPortToCheck/health"

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    try {
      $response = Invoke-RestMethod -Method Get -Uri $healthUrl -TimeoutSec 2
      if ($response.status -eq "ok") {
        Write-Host "[HearMe] Backend API is ready at $healthUrl" -ForegroundColor DarkGreen
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  Write-Host "[HearMe] Backend API did not become healthy in time. Frontend will still start, but request submission may fail until the API is ready." -ForegroundColor Yellow
  return $false
}

if (-not $SkipPortCleanup) {
  Clear-PortIfNeeded -PortToClear $Port
}

Write-Host "[HearMe] Starting eyetrax WebSocket server in a new PowerShell window..." -ForegroundColor Cyan

$serverCommand = @"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass;
Set-Location '$eyetraxPath';
if (Test-Path '.venv\Scripts\Activate.ps1') { . '.\.venv\Scripts\Activate.ps1' }
if (Get-Command eyetrax-server -ErrorAction SilentlyContinue) {
  eyetrax-server --camera $Camera --host $ServerHost --port $Port --filter $Filter --ema-alpha $EmaAlpha
} else {
  `$env:PYTHONPATH = 'src'
  python -m eyetrax.server --camera $Camera --host $ServerHost --port $Port --filter $Filter --ema-alpha $EmaAlpha
}
"@

$serverProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $serverCommand -PassThru

$backendProcess = $null
if (Test-PortListening -PortToCheck $ApiPort) {
  Write-Host "[HearMe] Reusing existing backend API on port $ApiPort." -ForegroundColor DarkGreen
} else {
  Write-Host "[HearMe] Starting backend API in a new PowerShell window..." -ForegroundColor Cyan

  $backendCommand = @"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass;
Set-Location '$backendPath';
if (Test-Path '.venv\Scripts\Activate.ps1') { . '.\.venv\Scripts\Activate.ps1' }
python -m uvicorn backend.server:app --host 127.0.0.1 --port $ApiPort --reload
"@

  $backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", $backendCommand -PassThru
  Wait-ForApi -ApiPortToCheck $ApiPort | Out-Null
}

Write-Host "[HearMe] Starting frontend dev server..." -ForegroundColor Cyan

try {
  Push-Location $frontendPath

  if (-not (Test-Path "node_modules")) {
    npm install
  }

  npm run dev
}
finally {
  while ((Get-Location).Path -ne $originalLocation.Path) {
    Pop-Location
  }

  if ($serverProcess -and -not $serverProcess.HasExited) {
    Write-Host "[HearMe] Stopping eyetrax WebSocket server..." -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force
  }

  if ($backendProcess -and -not $backendProcess.HasExited) {
    Write-Host "[HearMe] Stopping backend API..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force
  }
}
