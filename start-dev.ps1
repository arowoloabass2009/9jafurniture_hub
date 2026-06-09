# 9ja Furniture Hub — Start Dev Server (background, terminal stays free)
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  9ja Furniture Hub — Dev Server" -ForegroundColor Yellow
Write-Host "  ================================" -ForegroundColor Yellow
Write-Host "  Launching browser-sync in background..." -ForegroundColor Cyan
Write-Host ""

# Start browser-sync in a minimised background window
Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/k", "cd /d `"$projectDir`" && npm run start" `
  -WindowStyle Minimized `
  -WorkingDirectory $projectDir

Write-Host "  Server running at: http://localhost:3000" -ForegroundColor Green
Write-Host "  Your terminal is free. Press Ctrl+C anytime." -ForegroundColor Green
Write-Host ""
