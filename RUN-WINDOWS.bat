@echo off
setlocal
title BMC Walkable Theatre
cd /d "%~dp0"

echo Starting BMC Walkable Theatre...
echo.
echo Keep this window open while you walk around the theatre.
echo.

where py >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 1 >nul && start http://localhost:8000"
  py -m http.server 8000
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 1 >nul && start http://localhost:8000"
  python -m http.server 8000
  goto :eof
)

echo Python was not found.
echo Install Python or publish this folder through GitHub Pages.
pause
