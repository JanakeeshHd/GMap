Write-Host "Starting backend on http://localhost:8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\\backend'; if (Test-Path .venv\\Scripts\\Activate.ps1) { . .venv\\Scripts\\Activate.ps1 }; uvicorn app.main:app --reload --port 8000"

Write-Host "Starting frontend on http://localhost:3000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\\frontend'; npm run dev"

Write-Host "Both services launched in separate terminals."
