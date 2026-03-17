# Khmer Data Annotation Project - Documentation

Complete documentation for the Khmer Data Annotation Tool.

---

## 📚 Documentation Index

### Getting Started
- [Quick Start Guide](getting-started/quick-start.md) - Complete setup guide
- [Installation Prerequisites](getting-started/installation.md) - Required software
- [Environment Configuration](getting-started/configuration.md) - .env setup
- [Tesseract OCR Setup](getting-started/tesseract-setup.md) - Detailed OCR installation

### ML Service
- [ML Service Overview](ml-service/overview.md) - Architecture and components
- [ML Inference Service (New)](ml-service/inference-service.md) - FastAPI YOLO/Tesseract service
- [OCR Text Extraction](ml-service/ocr-extraction.md) - Khmer OCR pipeline
- [Model Training](ml-service/model-training.md) - Training YOLO models

### Backend
- [Backend API](backend/api-reference.md) - Go backend endpoints
- [Database Schema](backend/database.md) - MongoDB schemas
- [Authentication](backend/auth.md) - Firebase auth

### Frontend
- [Frontend Components](frontend/components.md) - React components
- [User Guide](frontend/user-guide.md) - How to use the annotation tool

### Troubleshooting
- [Common Issues](troubleshooting/common-issues.md) - FAQ and solutions
- [OCR Debugging Guide](troubleshooting/ocr-debugging.md) - OCR troubleshooting
- [Debugging Summary](troubleshooting/solution-summary.md) - Past debugging sessions

---

## 🏗 System Architecture

```
┌─────────────┐
│   Frontend  │  (React + Vite - Port 5173)
│   User UI   │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────┐
│   Backend   │  (Go + Gin - Port 3000)
│   API + DB  │──────► MongoDB (Port 27017)
└──────┬──────┘       (Store/Retrieve data)
       │
       │ OCR Requests
       ▼
┌─────────────┐
│  ML Server  │  (Python + FastAPI - Port 8000)
│  OCR + YOLO │──────► Tesseract (Khmer OCR)
└─────────────┘       └──► YOLO (Object Detection)
```

---

## 🚀 Quick Commands

```bash
# Start all services (in separate terminals)

# Terminal 1: MongoDB
net start MongoDB

# Terminal 2: Backend
cd production/backend
go run server.go

# Terminal 3: ML Server
cd production/ML/ml_service
python -m uvicorn app.main:app --reload

# Terminal 4: Frontend
cd production/frontend
npm run dev
```

---

## 📋 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 3000 | http://localhost:3000 |
| ML Service | 8000 | http://localhost:8000/docs |
| MongoDB | 27017 | mongodb://localhost:27017 |

---

## 📞 Support

For issues or questions, refer to the [Troubleshooting](troubleshooting/) section.
