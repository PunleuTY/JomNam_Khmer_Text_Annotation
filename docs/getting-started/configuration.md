# Environment Configuration

This guide covers setting up environment variables for all services.

---

## Backend Environment (`production/backend/.env`)

```env
# Server Configuration
PORT=3000
GIN_MODE=debug

# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=annotation_db

# Firebase Authentication
FIREBASE_CREDENTIALS=firebase/jomnam-service-account.json

# Cloudflare R2 Storage (Optional)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY=your_access_key
CLOUDFLARE_SECRET_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name

# CORS
FRONTEND_URL=http://localhost:5173
```

### Setup

```bash
cd production/backend
copy .env.example .env
```

---

## Frontend Environment (`production/frontend/.env`)

```env
# API Endpoints
VITE_BACKEND_URL=http://localhost:3000
VITE_ML_SERVER_URL=http://localhost:8000

# Firebase (Optional - for client-side auth)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id

# App Configuration
VITE_APP_NAME=Khmer Annotation Tool
```

### Setup

```bash
cd production/frontend
copy .env.example .env
```

---

## ML Service Environment (`production/ML/ml_service/.env`)

```env
# Server
HOST=0.0.0.0
PORT=8000

# YOLO Model
YOLO_MODEL_NAME=best.pt
YOLO_CONFIDENCE=0.5
YOLO_IOU_THRESHOLD=0.45

# Tesseract (Optional)
TESSERACT_DATA_PATH=

# Image Processing
MAX_IMAGE_SIZE=4096

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=INFO
```

### Setup

```bash
cd production/ML/ml_service
copy .env.example .env
```

---

## Sensitive Files

### Firebase Service Account

Place your Firebase service account JSON file at:
```
production/backend/firebase/jomnam-service-account.json
```

This file is gitignored. Get it from your team.

---

## Verification

After configuring environment files:

1. **Backend:**
   ```bash
   cd production/backend
   go run server.go
   # Should show: MongoDB connected successfully
   ```

2. **Frontend:**
   ```bash
   cd production/frontend
   npm run dev
   # Should connect to backend without CORS errors
   ```

3. **ML Service:**
   ```bash
   cd production/ML/ml_service
   python -m uvicorn app.main:app --reload
   # Should show: Uvicorn running on http://0.0.0.0:8000
   ```

---

## Troubleshooting

### "MongoDB connection failed"
- Check `MONGODB_URI` is correct
- Ensure MongoDB is running: `net start MongoDB`

### "CORS error" in browser console
- Verify `FRONTEND_URL` in backend .env matches frontend URL
- Check `CORS_ORIGINS` in ML service .env

### "Firebase initialization failed"
- Ensure `jomnam-service-account.json` exists
- Check file path in `FIREBASE_CREDENTIALS`

---

## Next Steps

- [Quick Start Guide](quick-start.md) - Run all services
