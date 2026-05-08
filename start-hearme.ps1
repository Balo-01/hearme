param(
  [int]$Camera = 0,
  [int]$Port = 8765,
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

if (-not (Test-Path $frontendPath)) {
  throw "Missing frontend folder: $frontendPath"
}
if (-not (Test-Path $eyetraxPath)) {
  throw "Missing eyetrax folder: $eyetraxPath"
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
}
