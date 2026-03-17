@echo off
REM ============================================
REM Check System Status - Khmer OCR Project
REM ============================================

echo.
echo ========================================
echo Khmer OCR System Status Check
echo ========================================
echo.

REM Check Tesseract
echo [1/7] Checking Tesseract Installation...
if exist "D:\Pytesseract\tesseract.exe" (
    echo   [OK] Tesseract found at D:\Pytesseract\tesseract.exe
) else (
    echo   [FAIL] Tesseract NOT found!
    echo   Please install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
)

REM Check Khmer Language Pack
echo [2/7] Checking Khmer Language Pack...
if exist "D:\Pytesseract\tessdata\khm.traineddata" (
    echo   [OK] Khmer language pack found
) else (
    echo   [FAIL] Khmer language pack NOT found!
)

REM Check English Language Pack
echo [3/7] Checking English Language Pack...
if exist "D:\Pytesseract\tessdata\eng.traineddata" (
    echo   [OK] English language pack found
) else (
    echo   [WARN] English language pack NOT found
)

REM Check Python
echo [4/7] Checking Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    python --version
    echo   [OK] Python installed
) else (
    echo   [FAIL] Python NOT found!
)

REM Check Python Packages
echo [5/7] Checking Python packages...
python -c "import pytesseract, cv2, PIL, fastapi, uvicorn" >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] All required Python packages installed
) else (
    echo   [WARN] Some Python packages may be missing
    echo   Run: pip install -r requirements.txt
)

REM Check Running Servers
echo [6/7] Checking running servers...
netstat -ano | findstr ":8000" >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] ML Server running on port 8000
) else (
    echo   [INFO] ML Server NOT running on port 8000
    echo         Start with: start_ml_server.bat
)

netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] Backend Server running on port 3000
) else (
    echo   [INFO] Backend Server NOT running on port 3000
)

netstat -ano | findstr ":5173" >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] Frontend running on port 5173
) else (
    echo   [INFO] Frontend NOT running on port 5173
)

REM Check MongoDB
echo [7/7] Checking MongoDB...
netstat -ano | findstr ":27017" >nul 2>&1
if %errorlevel% == 0 (
    echo   [OK] MongoDB running on port 27017
) else (
    echo   [WARN] MongoDB NOT detected on port 27017
)

echo.
echo ========================================
echo Status Check Complete!
echo ========================================
echo.
echo QUICK START COMMANDS:
echo   Start ML Server:  start_ml_server.bat
echo   Test OCR:         python test_ocr.py
echo   Test ML Server:   python test_ml_server.py
echo   View API Docs:    http://127.0.0.1:8000/docs
echo.

pause
