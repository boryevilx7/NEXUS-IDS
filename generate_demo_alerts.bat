@echo off
title NEXUS IDS - Test Alert Generator
cd /d "%~dp0"

echo ================================================
echo      NEXUS IDS - Test Alert Generator
echo ================================================
echo.
echo This will generate test alerts for your demo.
echo.

IF NOT EXIST "backend\venv" (
    echo Setting up Python environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

cd backend
call venv\Scripts\activate

echo Choose an option:
echo   1. Generate 50 alerts instantly (for quick demo)
echo   2. Generate 100 alerts instantly
echo   3. Continuous mode (10 alerts/minute)
echo   4. Continuous mode (30 alerts/minute - high activity)
echo.

set /p choice="Enter choice (1-4): "

IF "%choice%"=="1" (
    python generate_test_alerts.py --count 50
) ELSE IF "%choice%"=="2" (
    python generate_test_alerts.py --count 100
) ELSE IF "%choice%"=="3" (
    python generate_test_alerts.py --continuous 10
) ELSE IF "%choice%"=="4" (
    python generate_test_alerts.py --continuous 30
) ELSE (
    echo Invalid choice. Running default (50 alerts).
    python generate_test_alerts.py --count 50
)

echo.
pause
