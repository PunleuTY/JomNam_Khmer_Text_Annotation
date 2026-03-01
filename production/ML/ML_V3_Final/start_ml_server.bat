@echo off
echo ========================================
echo Starting Khmer OCR ML Server
echo ========================================
echo.

REM Navigate to ML_V3_Final directory
cd /d "%~dp0"

echo Starting FastAPI server on http://127.0.0.1:8000
echo Press Ctrl+C to stop the server
echo.

python main_server.py

pause
