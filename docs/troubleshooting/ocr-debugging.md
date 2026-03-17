# OCR Debugging Guide

Comprehensive guide for debugging Khmer OCR text extraction issues.

---

## Quick Diagnostic Checklist

Before deep debugging, verify:

- [ ] ML Server running on port 8000
- [ ] Tesseract installed with Khmer language
- [ ] All Python dependencies installed
- [ ] Image has good quality/contrast
- [ ] Bounding boxes drawn correctly

---

## Step 1: Verify ML Server is Running

### Check Port

```bash
netstat -ano | findstr :8000
```

**Expected:** Process listening on `127.0.0.1:8000`

### Check API Docs

Open browser: http://localhost:8000/docs

**Expected:** FastAPI Swagger UI loads

### Check Health Endpoint

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "models_loaded": ["yolo", "tesseract"]
}
```

---

## Step 2: Verify Tesseract Installation

### Check Version

```bash
tesseract --version
```

**Expected:**
```
tesseract 5.x.x
 leptonica-1.x.x
```

### Check Languages

```bash
tesseract --list-langs
```

**Expected:**
```
List of available languages (2):
eng
khm
```

**If `khm` is missing:**
- Reinstall Tesseract
- Select Khmer language pack during installation

### Check Tesseract Path

```bash
where tesseract
```

**Expected:**
```
C:\Program Files\Tesseract-OCR\tesseract.exe
```

---

## Step 3: Test OCR Components

### Test Tesseract Directly

```bash
tesseract test_image.png output --lang khm+eng
type output.txt
```

**Expected:** Extracted text in `output.txt`

### Test Python OCR

```python
import pytesseract
from PIL import Image

# Test Tesseract connection
print(pytesseract.get_tesseract_version())

# Test OCR
img = Image.open("test_image.png")
text = pytesseract.image_to_string(img, lang="khm+eng")
print(text)
```

---

## Step 4: Check ML Service Logs

### Start ML Service with Debug Logs

```bash
cd production/ML/ml_service
python -m uvicorn app.main:app --reload --log-level debug
```

### Look for These Log Messages

**On Startup:**
```
INFO: Loading YOLO model from ...
INFO: YOLO model loaded successfully
INFO: Tesseract initialized successfully
INFO: Application startup complete.
```

**On OCR Request:**
```
INFO: New OCR request received
INFO: Starting text extraction...
INFO: ✓ Text extracted: '...'
INFO: Request completed successfully
```

**Error Messages:**
```
ERROR: TesseractNotFoundError
ERROR: Failed to load image
ERROR: OCR failed: ...
```

---

## Step 5: Check Frontend Requests

### Open Browser DevTools

1. Press `F12`
2. Go to **Network** tab
3. Perform OCR action

### Check Request

**Request should show:**
- URL: `http://localhost:8000/predict/ocr`
- Method: `POST`
- Status: `200 OK`
- Payload: Image file

### Check Response

**Response should show:**
```json
{
  "success": true,
  "text": "ខ្មែរ text",
  "detections": [...]
}
```

### Common Frontend Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to fetch` | ML server not running | Start ML service |
| `413 Payload Too Large` | Image too big | Resize image |
| `500 Internal Error` | OCR failed | Check ML logs |
| `CORS error` | Wrong origin | Check CORS config |

---

## Step 6: Debug Image Quality

### Check Image Properties

```python
from PIL import Image

img = Image.open("test_image.png")
print(f"Size: {img.size}")
print(f"Mode: {img.mode}")
print(f"Format: {img.format}")
```

**Good properties:**
- Size: At least 1024x768
- Mode: RGB or L (grayscale)
- Format: PNG or high-quality JPEG

### Visualize Preprocessing

```python
import cv2
import matplotlib.pyplot as plt

# Load image
img = cv2.imread("test_image.png")

# Show original
plt.subplot(1, 4, 1)
plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
plt.title("Original")

# Show grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
plt.subplot(1, 4, 2)
plt.imshow(gray, cmap='gray')
plt.title("Grayscale")

# Show denoised
denoised = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
plt.subplot(1, 4, 3)
plt.imshow(denoised, cmap='gray')
plt.title("Denoised")

# Show thresholded
_, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
plt.subplot(1, 4, 4)
plt.imshow(binary, cmap='gray')
plt.title("Binary")

plt.tight_layout()
plt.show()
```

---

## Step 7: Tune OCR Parameters

### Adjust PSM Mode

```python
import pytesseract

# Try different PSM modes
configs = [
    '--psm 3',  # Fully automatic
    '--psm 6',  # Uniform block (recommended)
    '--psm 7',  # Single text line
    '--psm 10', # Single character
]

for config in configs:
    text = pytesseract.image_to_string(img, lang='khm+eng', config=config)
    print(f"{config}: {text}")
```

### Adjust Preprocessing

```python
# Different denoising strengths
denoised_weak = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
denoised_strong = cv2.fastNlMeansDenoising(gray, None, 50, 7, 21)

# Different thresholding
_, binary1 = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
_, binary2 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
_, binary3 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
```

---

## Step 8: Test with Known Good Image

### Create Test Image

1. Create a simple image with clear Khmer text
2. High contrast (black text on white background)
3. Large font size (24pt+)
4. Save as PNG

### Test with Known Image

```bash
# Use a test image that's known to work
curl -X POST http://localhost:8000/predict/ocr \
  -F "image=@known_good_test.png"
```

**Expected:** Text should be extracted correctly

---

## Common Issues & Solutions

### Issue 1: Empty Results

**Symptoms:**
```json
{
  "success": true,
  "text": "",
  "detections": []
}
```

**Possible Causes:**
1. ML server not running
2. Tesseract not initialized
3. Image too dark/blurry
4. Bounding boxes don't contain text

**Solutions:**
1. Start ML service: `python -m uvicorn app.main:app --reload`
2. Check Tesseract: `tesseract --version`
3. Improve image quality
4. Redraw bounding boxes

---

### Issue 2: Garbage Text

**Symptoms:**
```
Extracted: "àž¢àžà§€àžà§€àžà§€àž"  (garbled)
```

**Possible Causes:**
1. Wrong language encoding
2. Poor preprocessing
3. Low image quality

**Solutions:**
1. Verify Khmer language: `tesseract --list-langs`
2. Adjust preprocessing parameters
3. Use higher resolution images

---

### Issue 3: Connection Refused

**Symptoms:**
```
Failed to fetch
ECONNREFUSED
```

**Possible Causes:**
1. ML server not running
2. Wrong port
3. Firewall blocking

**Solutions:**
1. Start ML service
2. Check port: `netstat -ano | findstr :8000`
3. Disable firewall temporarily

---

### Issue 4: Slow OCR

**Symptoms:**
```
OCR takes 5+ seconds per box
```

**Possible Causes:**
1. Large images
2. Too many boxes
3. Slow preprocessing

**Solutions:**
1. Resize images to max 2048px
2. Process boxes in batches
3. Use faster preprocessing:
   ```python
   # Faster Gaussian blur instead of NL means
   denoised = cv2.GaussianBlur(gray, (5, 5), 0)
   ```

---

## Debugging Script

Create `debug_ocr.py`:

```python
import cv2
import pytesseract
from PIL import Image
import sys

def debug_ocr(image_path):
    print("=" * 60)
    print("OCR DEBUGGING TOOL")
    print("=" * 60)
    
    # 1. Check Tesseract
    print("\n1. Tesseract Version:")
    print(pytesseract.get_tesseract_version())
    
    # 2. Check languages
    print("\n2. Available Languages:")
    langs = pytesseract.get_languages(config='')
    print(langs)
    
    # 3. Load image
    print("\n3. Loading Image:")
    img = Image.open(image_path)
    print(f"Size: {img.size}")
    print(f"Mode: {img.mode}")
    
    # 4. Run OCR
    print("\n4. Running OCR:")
    text = pytesseract.image_to_string(img, lang='khm+eng')
    print(f"Extracted Text: {repr(text)}")
    
    # 5. Get detailed data
    print("\n5. Detailed OCR Data:")
    data = pytesseract.image_to_data(img, lang='khm+eng', output_type=pytesseract.Output.DICT)
    
    for i in range(len(data['text'])):
        if int(data['conf'][i]) > 0:
            print(f"  Box {i}: '{data['text'][i]}' (conf: {data['conf'][i]}%)")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        debug_ocr(sys.argv[1])
    else:
        print("Usage: python debug_ocr.py <image_path>")
```

**Run:**
```bash
python debug_ocr.py test_image.png
```

---

## Quick Fix Commands

```bash
# Restart ML service
taskkill /F /IM python.exe
cd production/ML/ml_service
python -m uvicorn app.main:app --reload

# Verify Tesseract
tesseract --version
tesseract --list-langs

# Check port
netstat -ano | findstr :8000

# Test OCR directly
tesseract test.png output --lang khm+eng
type output.txt
```

---

## Next Steps

- [Common Issues](common-issues.md) - General troubleshooting
- [Solution Summary](solution-summary.md) - Past debugging sessions
- [Tesseract Setup](../getting-started/tesseract-setup.md) - Reinstall Tesseract
