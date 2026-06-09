@echo off
echo.
echo  9ja Furniture Hub — Dev Server
echo  ================================
echo  Starting browser-sync in background...
echo  Open: http://localhost:3000
echo.

REM Run browser-sync in a new window so your current terminal stays free
start "9jaFurniture Dev Server" /MIN cmd /k "cd /d "%~dp0" && npm run start"

echo  Server launched in background window.
echo  Your terminal is now free to use.
echo.
