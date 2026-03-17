# Common Issues & Solutions

Frequently encountered problems and their solutions.

---

## Service Not Starting

### MongoDB Won't Start

**Symptoms:**
```
MongoDB failed to start
Address already in use
```

**Solutions:**

1. **Check if MongoDB is already running:**
   ```bash
   net start MongoDB
   ```

2. **Check port 27017:**
   ```bash
   netstat -ano | findstr :27017
   ```

3. **Check data directory:**
   ```bash
   # Ensure data directory exists
   mkdir C:\data\db
   ```

4. **Run manually:**
   ```bash
   mongod --dbpath "C:\data\db"
   ```

---

### Backend Port Already in Use

**Symptoms:**
```
bind: address already in use
```

**Solutions:**

1. **Find process using port 3000:**
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Kill the process:**
   ```bash
   taskkill /PID <PID> /F
   ```

3. **Or change port in `.env`:**
   ```env
   PORT=3001
   ```

---

### ML Service Import Errors

**Symptoms:**
```
ModuleNotFoundError: No module named 'ultralytics'
```

**Solutions:**

1. **Activate virtual environment:**
   ```bash
   cd production/ML/ml_service
   python -m venv venv
   venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify installation:**
   ```bash
   pip list | findstr ultralytics
   ```

---

## Connection Errors

### "Cannot connect to backend"

**Symptoms:**
```
Failed to fetch
Network request failed
```

**Solutions:**

1. **Verify backend is running:**
   ```bash
   cd production/backend
   go run server.go
   ```

2. **Check backend URL in frontend `.env`:**
   ```env
   VITE_BACKEND_URL=http://localhost:3000
   ```

3. **Check CORS settings in backend:**
   ```env
   FRONTEND_URL=http://localhost:5173
   ```

4. **Verify port:**
   ```bash
   netstat -ano | findstr :3000
   ```

---

### "Failed to connect to ML server"

**Symptoms:**
```
Connection refused
ECONNREFUSED
```

**Solutions:**

1. **Start ML service:**
   ```bash
   cd production/ML/ml_service
   python -m uvicorn app.main:app --reload
   ```

2. **Verify ML service is running:**
   - Open: http://localhost:8000/docs
   - Should see Swagger UI

3. **Check frontend `.env`:**
   ```env
   VITE_ML_SERVER_URL=http://localhost:8000
   ```

---

### Firebase Authentication Errors

**Symptoms:**
```
Firebase Admin SDK failed to initialize
Missing service account file
```

**Solutions:**

1. **Place service account file:**
   ```
   production/backend/firebase/jomnam-service-account.json
   ```

2. **Verify file exists:**
   ```bash
   dir backend\firebase\jomnam-service-account.json
   ```

3. **Check `.env` path:**
   ```env
   FIREBASE_CREDENTIALS=firebase/jomnam-service-account.json
   ```

---

## OCR Issues

### "No Text Extracted"

**Symptoms:**
```
OCR result: { text: "", detections: [] }
```

**Solutions:**

1. **Check ML service is running:**
   ```bash
   netstat -ano | findstr :8000
   ```

2. **Verify Tesseract installation:**
   ```bash
   tesseract --version
   tesseract --list-langs
   ```

3. **Check image quality:**
   - Use high-resolution images
   - Ensure good contrast
   - Avoid blurry images

4. **Check bounding boxes:**
   - Boxes should contain text
   - Draw tight boxes around text

5. **Check ML service logs:**
   ```
   Look for: [OCR DEBUG] Starting text extraction...
   ```

---

### "TesseractNotFoundError"

**Symptoms:**
```
TesseractNotFoundError: tesseract is not installed
```

**Solutions:**

1. **Install Tesseract:**
   - Download from: https://github.com/UB-Mannheim/tesseract/wiki
   - Install to: `C:\Program Files\Tesseract-OCR\`

2. **Add to PATH:**
   - System Properties → Environment Variables
   - Add to Path: `C:\Program Files\Tesseract-OCR\`

3. **Restart terminal**

4. **Verify:**
   ```bash
   tesseract --version
   ```

---

### "Khmer Language Not Found"

**Symptoms:**
```
Error reading data file khm.traineddata
```

**Solutions:**

1. **Reinstall Tesseract with Khmer:**
   - Run Tesseract installer
   - Select "Modify"
   - Check "Khmer (khm)" language
   - Complete installation

2. **Verify language files:**
   ```bash
   dir "C:\Program Files\Tesseract-OCR\tessdata\khm.traineddata"
   ```

3. **Check available languages:**
   ```bash
   tesseract --list-langs
   ```

---

### Poor OCR Accuracy

**Symptoms:**
```
Extracted text is garbled or incorrect
```

**Solutions:**

1. **Improve image quality:**
   - Use higher resolution (min 300 DPI)
   - Better lighting/contrast
   - Avoid compression artifacts

2. **Adjust bounding boxes:**
   - Draw tighter boxes
   - Include only text (no graphics)

3. **Tune preprocessing:**
   ```python
   # Stronger denoising
   denoised = cv2.fastNlMeansDenoising(gray, None, 50, 7, 21)
   
   # Different threshold
   _, binary = cv2.threshold(denoised, 200, 255, cv2.THRESH_BINARY)
   ```

4. **Change PSM mode:**
   ```python
   config='--psm 6'  # Uniform block (recommended)
   config='--psm 3'  # Fully automatic
   ```

---

## Frontend Issues

### "Page Not Loading"

**Symptoms:**
```
Blank page
Console errors
```

**Solutions:**

1. **Check frontend is running:**
   ```bash
   npm run dev
   ```

2. **Check browser console:**
   - Press F12
   - Look for errors in Console tab

3. **Check network tab:**
   - Press F12 → Network
   - Look for failed requests

4. **Clear cache:**
   - Hard refresh: Ctrl + Shift + R
   - Clear browser cache

---

### "Images Not Uploading"

**Symptoms:**
```
Upload failed
Network error
```

**Solutions:**

1. **Check backend is running:**
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Check Cloudflare R2 credentials:**
   ```env
   CLOUDFLARE_ACCOUNT_ID=...
   CLOUDFLARE_ACCESS_KEY=...
   CLOUDFLARE_SECRET_KEY=...
   ```

3. **Check file size limits:**
   - Backend may have upload size limits
   - Try with smaller images

---

## Database Issues

### "MongoDB Connection Failed"

**Symptoms:**
```
MongoDB connection error
failed to connect to MongoDB
```

**Solutions:**

1. **Start MongoDB:**
   ```bash
   net start MongoDB
   ```

2. **Check connection string:**
   ```env
   MONGODB_URI=mongodb://localhost:27017
   ```

3. **Verify MongoDB is listening:**
   ```bash
   netstat -ano | findstr :27017
   ```

4. **Check MongoDB logs:**
   ```bash
   # MongoDB logs location
   C:\Program Files\MongoDB\Server\6.0\log\
   ```

---

## Performance Issues

### Slow OCR Processing

**Symptoms:**
```
OCR takes too long
Timeout errors
```

**Solutions:**

1. **Resize images before sending:**
   ```javascript
   // Resize to max 2048px
   const resized = await resizeImage(image, 2048);
   ```

2. **Reduce number of boxes:**
   - Process boxes in batches
   - Limit max boxes per request

3. **Optimize preprocessing:**
   ```python
   # Faster denoising
   denoised = cv2.GaussianBlur(gray, (5, 5), 0)
   ```

---

### Slow Backend Response

**Symptoms:**
```
API requests timeout
Slow database queries
```

**Solutions:**

1. **Check MongoDB indexes:**
   ```javascript
   db.annotations.createIndex({ projectId: 1 })
   db.annotations.createIndex({ createdAt: -1 })
   ```

2. **Enable MongoDB profiling:**
   ```javascript
   db.setProfilingLevel(2)
   ```

3. **Check backend logs:**
   ```
   Look for slow queries in Gin logs
   ```

---

## Debugging Commands

### Check All Services

```bash
# Check running services
netstat -ano | findstr ":3000 :8000 :5173 :27017"

# Should show all four ports listening
```

### Restart All Services

```bash
# Stop all
taskkill /F /IM node.exe
taskkill /F /IM go.exe
taskkill /F /IM python.exe

# Start in order
net start MongoDB
cd production/backend && go run server.go
cd production/ML/ml_service && python -m uvicorn app.main:app --reload
cd production/frontend && npm run dev
```

### View Service Logs

```bash
# MongoDB logs
type "C:\Program Files\MongoDB\Server\6.0\log\mongod.log"

# Check recent errors
Get-EventLog -LogName Application -Source MongoDB -Newest 20
```

---

## Getting Help

If issues persist:

1. **Check logs** - Terminal output often shows the error
2. **Check documentation** - See [Tesseract Setup](../getting-started/tesseract-setup.md)
3. **Check API docs** - http://localhost:8000/docs
4. **Review environment** - Verify all `.env` files are correct

---

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Port in use | `netstat -ano \| findstr :PORT` then `taskkill /PID <PID> /F` |
| Module not found | `pip install -r requirements.txt` |
| Tesseract not found | Reinstall, add to PATH |
| MongoDB won't start | `net start MongoDB` |
| CORS errors | Check URLs in `.env` files |
| No OCR results | Verify ML service running on port 8000 |
