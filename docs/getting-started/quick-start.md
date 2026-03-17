# 🚀 Quick Start Guide

Complete guide to setting up and running the production environment.

---

## 📋 Overview

This project consists of **4 components** that work together:

| Component | Port | Technology | Purpose |
|-----------|------|------------|---------|
| **MongoDB** | 27017 | Database | Data storage |
| **Backend** | 3000 | Go + Gin | API server |
| **ML Server** | 8000 | Python + FastAPI | OCR text extraction, YOLO detection |
| **Frontend** | 5173 | React + Vite | Web interface |

---

## 🔧 Prerequisites

Install these before proceeding:

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | v18+ | https://nodejs.org/ |
| **Go** | v1.19+ | https://go.dev/dl/ |
| **Python** | v3.10+ | https://python.org/ |
| **MongoDB** | v6+ | https://mongodb.com/try/download/community |
| **Tesseract OCR** | v5+ | https://github.com/UB-Mannheim/tesseract/wiki |

---

## 📥 Tesseract OCR Installation (Detailed Guide)

Tesseract is the OCR engine used to extract Khmer text from images. Follow these steps carefully.

### Step 1: Download Tesseract Installer

1. Go to: **https://github.com/UB-Mannheim/tesseract/wiki**
2. Download the latest Windows installer (e.g., `tesseract-ocr-w64-setup-5.x.x.exe`)

### Step 2: Run the Installer

1. **Run** the downloaded `.exe` file as Administrator
2. Click **Next** through the setup wizard
3. **IMPORTANT - Installation Location:**
   - Install to: `C:\Program Files\Tesseract-OCR\`
   - Do NOT change this default path (it's used in the ML config)

### Step 3: Select Language Data (CRITICAL)

During installation, you'll see a **"Select Additional Language Data"** screen:

1. **Scroll down** and find:
   - ☑ **Khmer (khm)** - Required for Khmer text
   - ☑ **English (eng)** - Recommended for mixed text
2. **Check both boxes**
3. Click **Next** and complete installation

### Step 4: Add Tesseract to System PATH

1. Press `Win + R`, type `sysdm.cpl`, press **Enter**
2. Click **Advanced** tab → **Environment Variables**
3. Under **System variables**, find `Path` → Click **Edit**
4. Click **New** → Add: `C:\Program Files\Tesseract-OCR\`
5. Click **OK** on all windows

### Step 5: Verify Installation

Open a **NEW** terminal (to load PATH changes) and run:

```bash
tesseract --version
```

**Expected Output:**
```
tesseract 5.x.x
 leptonica-1.x.x
  khm eng
```

✅ If you see `khm` in the language list, you're ready!

### Step 6: Download Additional Khmer Training Data (Optional)

For improved Khmer OCR accuracy, download trained data:

1. Go to: **https://github.com/tesseract-ocr/tessdata_fast**
2. Download `khm.traineddata`
3. Copy to: `C:\Program Files\Tesseract-OCR\tessdata\`

### Troubleshooting Tesseract

| Issue | Solution |
|-------|----------|
| `'tesseract' is not recognized` | Restart terminal, verify PATH |
| `khm language not found` | Reinstall and select Khmer language |
| `Access denied` | Run installer as Administrator |

---

## 🔧 Other Prerequisites

### Verify All Installations

```bash
node --version      # Should show v18.x.x
go version          # Should show go1.19.x
python --version    # Should show Python 3.10.x
tesseract --version # Should show tesseract 5.x.x with khm
```

---

## 📦 Project Structure

```
production/
├── backend/
│   ├── cloudflare/      # Cloudflare R2 storage integration
│   ├── controllers/     # Request handlers
│   ├── firebase/        # Firebase authentication
│   ├── middleware/      # Auth & request middleware
│   ├── models/          # Database schemas
│   ├── routes/          # API route definitions
│   ├── uploads/         # Uploaded images (temp/final)
│   ├── .env.example     # Backend environment template
│   └── server.go        # Main entry point
│
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Application pages
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilities
│   │   ├── navigations/ # Navigation components
│   │   └── server/      # API client functions
│   ├── .env.example     # Frontend environment template
│   └── package.json     # Dependencies
│
└── ML/
    ├── ml_service/          # New FastAPI inference service
    │   ├── app/
    │   │   ├── main.py      # FastAPI entry point
    │   │   ├── models/      # YOLO, Tesseract model classes
    │   │   ├── services/    # Inference orchestration
    │   │   └── schemas/     # Request/response schemas
    │   ├── models/          # Trained model files (best.pt)
    │   └── requirements.txt
    └── ML_V3_Final/     # Legacy ML implementation
        ├── utils/       # OCR utilities
        ├── main_server.py
        └── ...
```

---

## 🔐 Environment Configuration

### 1. Backend Environment (`backend/.env`)

Copy `.env.example` to `.env`:

```bash
cd production/backend
copy .env.example .env
```

**Example `.env`:**
```env
# Server
PORT=3000
GIN_MODE=debug

# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=annotation_db

# Firebase (for authentication)
FIREBASE_CREDENTIALS=firebase/jomnam-service-account.json

# Cloudflare R2 (for image storage)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY=your_access_key
CLOUDFLARE_SECRET_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name

# CORS
FRONTEND_URL=http://localhost:5173
```

---

### 2. Frontend Environment (`frontend/.env`)

Copy `.env.example` to `.env`:

```bash
cd production/frontend
copy .env.example .env
```

**Example `.env`:**
```env
# API Endpoints
VITE_BACKEND_URL=http://localhost:3000
VITE_ML_SERVER_URL=http://localhost:8000

# Firebase (if using client-side auth)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id

# App Configuration
VITE_APP_NAME=Khmer Annotation Tool
```

---

### 3. ML Environment (`ML/ml_service/.env`)

```bash
cd production/ML/ml_service
copy .env.example .env
```

**Example `.env`:**
```env
# Server
HOST=0.0.0.0
PORT=8000

# YOLO Model
YOLO_MODEL_NAME=best.pt
YOLO_CONFIDENCE=0.5
YOLO_IOU_THRESHOLD=0.45

# Tesseract Configuration (optional)
TESSERACT_DATA_PATH=

# Image Processing
MAX_IMAGE_SIZE=4096

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 📥 Installation

### Step 1: Install Backend Dependencies

```bash
cd production/backend
go mod download
```

### Step 2: Install Frontend Dependencies

```bash
cd production/frontend
npm install
```

### Step 3: Install ML Dependencies

```bash
cd production/ML/ml_service
pip install -r requirements.txt
```

---

## ▶️ Running the Project

### Start Order: MongoDB → Backend → ML → Frontend

---

### Terminal 1: MongoDB

```bash
# If installed as Windows service:
net start MongoDB

# Or run manually:
mongod --dbpath "C:\data\db"
```

**Expected Output:**
```
MongoDB starting...
listening on 127.0.0.1:27017
```

---

### Terminal 2: Backend Server (Go)

```bash
cd production/backend
go run server.go
```

**Expected Output:**
```
✅ MongoDB connected successfully
[GIN-debug] Listening and serving HTTP on :3000
```

**What's Running:**
- REST API on port 3000
- Firebase authentication
- Cloudflare R2 storage (if configured)
- MongoDB connection

---

### Terminal 3: ML Service (Python - FastAPI)

```bash
cd production/ML/ml_service
python -m uvicorn app.main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**What's Running:**
- FastAPI server on port 8000
- YOLO detection endpoint: `POST /predict/detect`
- OCR endpoint: `POST /predict/ocr`
- Combined endpoint: `POST /predict/combined`
- API docs at `http://localhost:8000/docs`

---

### Terminal 4: Frontend (React)

```bash
cd production/frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

**What's Running:**
- Development server with hot reload
- React application

---

## ✅ Verify Everything is Running

Open your browser and check:

| Service | URL | Expected Result |
|---------|-----|-----------------|
| Frontend | http://localhost:5173 | Web app loads |
| Backend API | http://localhost:3000 | 404 (normal - no route at /) |
| ML API Docs | http://localhost:8000/docs | FastAPI Swagger UI |
| MongoDB | `mongo` in terminal | Connection successful |

---

## 🔄 Workflow

Here's how the components interact:

```
┌─────────────┐
│   Frontend  │  (React - Port 5173)
│   User UI   │
└──────┬──────┘
       │ HTTP Requests
       ▼
┌─────────────┐
│   Backend   │  (Go - Port 3000)
│   API + DB  │──────► MongoDB (Port 27017)
└──────┬──────┘       (Store/Retrieve data)
       │
       │ OCR Requests
       ▼
┌─────────────┐
│  ML Server  │  (Python - Port 8000)
│  OCR + YOLO │──────► Tesseract (Khmer text)
└─────────────┘       └──► YOLO (Object Detection)
```

### Typical User Flow:

1. **User** opens frontend → Creates a project
2. **User** uploads an image → Backend stores it
3. **User** draws bounding boxes → Frontend sends coordinates
4. **Frontend** calls ML server → OCR extracts Khmer text
5. **ML Server** returns extracted text → Displayed in UI
6. **User** saves annotations → Backend stores in MongoDB

---

## 🐛 Troubleshooting

### "No text extracted" / Empty OCR results

**Cause:** ML server not running

```bash
cd production/ML/ml_service
python -m uvicorn app.main:app --reload
```

Verify: http://localhost:8000/docs

---

### "Cannot connect to backend"

**Cause:** Backend server not running

```bash
cd production/backend
go run server.go
```

---

### "MongoDB connection failed"

**Cause:** MongoDB not running

```bash
# Windows service
net start MongoDB

# Or manual
mongod --dbpath "C:\data\db"
```

---

### "TesseractNotFoundError"

**Cause:** Tesseract not installed or not in PATH

**Solution:**
1. Install from https://github.com/UB-Mannheim/tesseract/wiki
2. Add to PATH: `C:\Program Files\Tesseract-OCR\`
3. Verify: `tesseract --version`

---

### "Port already in use"

Find and kill the process:

```bash
# Find process
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

### Firebase Authentication Errors

**Cause:** Missing service account file

**Solution:**
1. Place `jomnam-service-account.json` in `backend/firebase/`
2. This file is gitignored - get it from your team

---

### Cloudflare R2 Upload Errors

**Cause:** Missing R2 credentials

**Solution:**
1. Get credentials from Cloudflare dashboard
2. Add to `backend/.env`:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_ACCESS_KEY`
   - `CLOUDFLARE_SECRET_KEY`
   - `R2_BUCKET_NAME`

---

## 📝 Quick Commands Reference

```bash
# MongoDB
net start MongoDB

# Backend
cd production/backend
go run server.go

# ML Service
cd production/ML/ml_service
python -m uvicorn app.main:app --reload

# Frontend
cd production/frontend
npm run dev

# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Kill process by port
taskkill /PID <PID> /F
```

---

## 📊 Service Checklist

Before testing annotation:

- [ ] MongoDB running on port 27017
- [ ] Backend shows "MongoDB connected" on port 3000
- [ ] ML shows "Uvicorn running" on port 8000
- [ ] Frontend shows "Local: http://localhost:5173"
- [ ] All 4 terminals are open and visible

---

## 💡 Tips

1. **Start services in order:** MongoDB → Backend → ML → Frontend
2. **Keep terminals open** to see logs and debug errors
3. **Check ML logs first** if OCR fails
4. **Use high-quality images** for better OCR accuracy
5. **Draw tight bounding boxes** around text

---

**Need help?** Check the [Troubleshooting](../troubleshooting/) section for detailed guides.
