@echo off
cd /d "%~dp0"
cd nids
IF NOT EXIST "node_modules" (
    echo Installing dependencies...
    call npm install
)
echo Starting development server...
call npm run dev
pause