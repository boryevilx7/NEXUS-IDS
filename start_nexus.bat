@echo off
title NEXUS IDS - Development Server
cd /d "%~dp0"

echo ================================================
echo           NEXUS IDS - Starting Services
echo ================================================
echo.

REM Check if Python is available
where python >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node is available
where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Install backend dependencies if needed
IF NOT EXIST "backend\venv" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
) ELSE (
    echo Backend dependencies already installed.
)

REM Install frontend dependencies if needed
IF NOT EXIST "nids\node_modules" (
    echo Installing frontend dependencies...
    cd nids
    call npm install
    cd ..
) ELSE (
    echo Frontend dependencies already installed.
)

echo.
echo ================================================
echo Starting Backend (Flask on port 5000)...
echo ================================================
start "NEXUS Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && python app.py"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

echo.
echo ================================================
echo Starting Frontend (Vite on port 5173)...
echo ================================================
start "NEXUS Frontend" cmd /k "cd /d %~dp0nids && npm run dev"

echo.
echo ================================================
echo NEXUS IDS is starting...
echo.
echo Backend API:    http://localhost:5000
echo Dashboard:      http://localhost:5173
echo Health Check:   http://localhost:5000/health
echo.
echo Press any key to open the dashboard in browser...
echo ================================================
pause >nul

start http://localhost:5173
