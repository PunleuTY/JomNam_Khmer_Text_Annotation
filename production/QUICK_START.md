# 🚀 Quick Start Guide - Khmer Data Annotation Project

## ⚠️ IMPORTANT: Read This First!

Your project has **4 components** that must all be running for text annotation to work:

1. ✅ **MongoDB Database** (port 27017)
2. ✅ **Backend Server (Go)** (port 3000)
3. ✅ **ML OCR Server (Python)** (port 8000)
4. ✅ **Frontend (React)** (port 5173)

## 🔧 Prerequisites Installation

### 1. Install MongoDB

**Download & Install:**

- Go to: https://www.mongodb.com/try/download/community
- Download MongoDB Community Server for Windows
- Install with default settings
- **IMPORTANT**: During installation, check "Install MongoDB as a Service"

**Add to PATH:**

1. Open System Environment Variables
2. Add to PATH: `C:\Program Files\MongoDB\Server\7.0\bin\` (adjust version number)
3. Restart your terminal

**Start MongoDB:**

```powershell
# Start MongoDB service
net start MongoDB
```

### 2. Install Tesseract OCR

**Download & Install:**

- Go to: https://github.com/UB-Mannheim/tesseract/wiki
- Download the latest installer
- Install to: `C:\Program Files\Tesseract-OCR\`
- **CRITICAL**: During installation, select "Additional Language Data" and check **Khmer (khm)**

**Verify Installation:**

```powershell
tesseract --version
```

### 3. Verify Go Installation

```powershell
go version
```

### 4. Verify Python Installation

```powershell
python --version
```

## 📦 Project Setup (One-Time)

### Step 1: Install Python Dependencies

```powershell
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\ML"
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```powershell
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\frontend"
npm install
```

### Step 3: Install Go Dependencies

```powershell
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\backend"
go mod download
```

## 🏃 Running the Project

### Option 1: Start All Services Manually

**Terminal 1 - Start MongoDB (if not running as service):**

```powershell
mongod --dbpath "C:\data\db"
```

**Terminal 2 - Start Backend Server:**

```powershell
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\backend"
go run server.go
```

**Terminal 3 - Start ML OCR Server:**

```powershell
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\ML\ML_V3_Final"
python main_server.py
```

**Terminal 4 - Start Frontend:**

```powershell
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\frontend"
npm run dev
```

### Option 2: Use Batch Scripts (Easiest!)

1. **Start ML Server**: Double-click `ML\ML_V3_Final\start_ml_server.bat`
2. **Start Backend**: Open terminal in `backend` folder and run `go run server.go`
3. **Start Frontend**: Open terminal in `frontend` folder and run `npm run dev`

## ✅ Verify Everything is Running

Check these URLs in your browser:

1. **Frontend**: http://localhost:5173 ✅
2. **Backend**: http://localhost:3000 (should return 404, that's OK) ✅
3. **ML Server**: http://localhost:8000/docs (should show FastAPI docs) ✅
4. **MongoDB**: Run `mongo` in terminal (should connect) ✅

## 🎯 Testing Text Annotation

1. Open http://localhost:5173
2. Create a new project
3. Upload an image with Khmer text
4. Draw bounding boxes around text
5. Click "Extract Text" or "Run OCR"
6. **Text should now appear!** 🎉

## 🐛 Troubleshooting

### Problem: "No text extracted" / Empty results

**Root Cause:** ML server (port 8000) is not running

**Solution:**

```powershell
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\ML\ML_V3_Final"
python main_server.py
```

Verify at: http://localhost:8000/docs

---

### Problem: "Cannot connect to backend"

**Root Cause:** Backend server (port 3000) is not running

**Solution:**

```powershell
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\backend"
go run server.go
```

---

### Problem: "MongoDB connection failed"

**Root Cause:** MongoDB is not running

**Solution 1 (Windows Service):**

```powershell
net start MongoDB
```

**Solution 2 (Manual Start):**

```powershell
# First create data directory if it doesn't exist
mkdir C:\data\db

# Start MongoDB
mongod --dbpath "C:\data\db"
```

---

### Problem: "TesseractNotFoundError"

**Root Cause:** Tesseract OCR is not installed or not in PATH

**Solution:**

1. Install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki
2. Make sure Khmer language pack is selected during installation
3. Verify installation: `tesseract --version`

---

### Problem: Port already in use

**Solution:** Stop the process using that port or change the port number

Find process using port:

```powershell
netstat -ano | findstr :8000
```

Kill process:

```powershell
taskkill /PID <process_id> /F
```

---

## 📊 Service Status Checklist

Before starting annotation, verify:

- [ ] MongoDB is running (port 27017)
- [ ] Backend server shows: "✅ MongoDB connected successfully"
- [ ] ML server shows: "Uvicorn running on http://127.0.0.1:8000"
- [ ] Frontend shows: "Local: http://localhost:5173"

## 🔗 Service URLs

| Service     | URL                        | Purpose               |
| ----------- | -------------------------- | --------------------- |
| Frontend    | http://localhost:5173      | User interface        |
| Backend     | http://localhost:3000      | API & Database        |
| ML Server   | http://localhost:8000      | Text extraction (OCR) |
| ML API Docs | http://localhost:8000/docs | API documentation     |
| MongoDB     | mongodb://localhost:27017  | Database              |

## 📁 Important Files

- `ML/ML_V3_Final/utils/ocr_utils.py` - Tesseract configuration
- `backend/server.go` - Backend server configuration
- `frontend/src/server/sendImageAPI.js` - API endpoints
- `ML/ML_V3_Final/main_server.py` - ML server configuration

## 💡 Tips

1. **Always start services in this order:**

   - MongoDB → Backend → ML Server → Frontend

2. **Keep all 4 terminal windows open** to see logs and errors

3. **If text extraction doesn't work**, check ML server terminal for errors

4. **Use high-quality images** with clear text for best OCR results

5. **Draw tight bounding boxes** around text for better extraction accuracy

## 🆘 Still Having Issues?

1. Check all 4 services are running (see checklist above)
2. Look at terminal logs for error messages
3. Verify Tesseract installed with Khmer language pack
4. Restart all services in the correct order
5. Clear browser cache and reload frontend

## 📝 Quick Commands Reference

```powershell
# Start MongoDB (if not service)
net start MongoDB

# Backend
cd backend
go run server.go

# ML Server
cd ML\ML_V3_Final
python main_server.py

# Frontend
cd frontend
npm run dev

# Check what's running on ports
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5173
```

---

**Need help?** Check the logs in each terminal window for detailed error messages.
