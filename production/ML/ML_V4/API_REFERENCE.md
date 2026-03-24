# JomNam ML_V4 - API Quick Reference

## Installation & Setup

### 1. Install Dependencies
```bash
cd production/ML/ML_V4/models
pip install -r requirements.txt
pip install google-generativeai  # For Gemini support
```

### 2. Configuration
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and add your API keys:
# TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
# TESSERACT_TESSDATA_PREFIX=C:\Program Files\Tesseract-OCR\tessdata
# GEMINI_API_KEY=your_api_key_from_https://aistudio.google.com/app/apikey
```

### 3. Start Server
```bash
python main.py
# Server runs on http://localhost:8000
```

---

## API Endpoints

### Detection & Recognition Models
| Model | Type | Use Case |
|-------|------|----------|
| **DocTR** | Detection | General text detection (default) |
| **YOLO** | Detection | Alternative text detection |
| **Tesseract** | Recognition | Fast OCR (default) |
| **KiriOCR** | Recognition | Better Khmer support |
| **Gemini** | Recognition | Best accuracy, requires internet |

---

## Endpoint: `/ocr` (POST)

**Extract text from bounding boxes**

### Request
```bash
curl -X POST http://localhost:8000/ocr \
  -F "image=@path/to/image.jpg" \
  -F "annotations=[[x1,y1,x2,y2],[x1,y1,x2,y2]]" \
  -F "recognition_model=gemini"
```

### Parameters
| Parameter | Type | Required | Default | Values |
|-----------|------|----------|---------|--------|
| `image` | File | ✓ | - | JPG, PNG, GIF, WebP |
| `annotations` | JSON | ✓ | - | `[[x1,y1,x2,y2], ...]` |
| `recognition_model` | String | ✗ | tesseract | tesseract, kiriocr, **gemini** |
| `project_id` | String | ✗ | - | Project identifier |

### Response (Success)
```json
{
  "success": true,
  "processing_result": [
    {"extracted_text": "សូស្វាគមន៍", "confidence": 0.92},
    {"extracted_text": "Welcome", "confidence": 0.88}
  ],
  "inference_speed": 1245.5
}
```

### Response (Error)
```json
{
  "success": false,
  "processing_result": [],
  "error": "GEMINI_API_KEY not found in environment"
}
```

---

## Endpoint: `/auto-detect` (POST)

**Detect text regions and optionally extract text**

### Request
```bash
curl -X POST http://localhost:8000/auto-detect \
  -F "image=@image.jpg" \
  -F "mode=word" \
  -F "extract_text=true" \
  -F "detection_model=doctr" \
  -F "recognition_model=gemini"
```

### Parameters
| Parameter | Type | Default | Values |
|-----------|------|---------|--------|
| `image` | File | - | JPG, PNG, etc |
| `mode` | String | word | word, line |
| `extract_text` | Boolean | false | true, false |
| `detection_model` | String | doctr | doctr, yolo |
| `recognition_model` | String | tesseract | tesseract, kiriocr, **gemini** |

### Response (Success)
```json
{
  "success": true,
  "image_width": 800,
  "image_height": 600,
  "boxes": [
    {
      "x": 10,
      "y": 20,
      "width": 150,
      "height": 50,
      "text": "សូស្វាគមន៍",
      "confidence": 0.92
    }
  ]
}
```

---

## Endpoint: `/detect` (POST)

**Full DocTR detection + Tesseract extraction**

### Request
```json
{
  "path": "path/to/image.jpg",
  "mode": "word"
}
```

### Response
```json
{
  "success": true,
  "image_width": 800,
  "image_height": 600,
  "boxes": [...]
}
```

---

## Endpoint: `/detect-only` (POST)

**Detection only (no text extraction)**

### Request
```json
{
  "path": "path/to/image.jpg",
  "mode": "word"
}
```

---

## Endpoint: `/evaluate` (POST)

**Calculate Character Error Rate (CER) and Word Error Rate (WER)**

### Request
```json
{
  "extracted_text": "សូស្វាគមន៍ Welcome",
  "ground_truth": "សូស្វាគមន៍ Welcome",
  "model_name": "Gemini"
}
```

### Response
```json
{
  "success": true,
  "cer": 0.0,
  "wer": 0.0,
  "inference_speed": 45.3
}
```

---

## Python Usage Examples

### Basic Gemini OCR
```python
from utils.GeminiOCR import GeminiOCR

ocr = GeminiOCR(api_key="your_key")
text, confidence = ocr.extract_text_from_image("image.jpg")
print(f"Text: {text}")
print(f"Confidence: {confidence:.2f}")
```

### Detect and Extract
```python
ocr = GeminiOCR()
result = ocr.detect_and_extract(
    "image.jpg",
    detection_boxes=[
        {"x": 10, "y": 20, "width": 100, "height": 50},
        {"x": 120, "y": 20, "width": 100, "height": 50}
    ]
)
for region in result["regions"]:
    print(f"Box {region['region_id']}: {region['text']}")
```

### Batch Processing
```python
regions = [
    {"path": "img1.jpg", "coords": (10, 20, 100, 100)},
    {"path": "img2.jpg", "coords": (5, 15, 95, 95)},
]
results = ocr.extract_text_batch(regions)
```

---

## Frontend Integration

### Select Gemini in UI
1. Open annotation tool
2. Click Settings (⚙️ icon)
3. Under "Model" → "Recognition"
4. Select "Google Gemini"
5. Click "Apply Configuration"

### API Call Example
```javascript
// Using fetch API
const response = await fetch('http://localhost:8000/ocr', {
  method: 'POST',
  body: formData,  // File + annotations + model
});

const result = await response.json();
console.log(result.processing_result);
```

---

## Environment Variables

### Required
```env
GEMINI_API_KEY=your_api_key_here
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_TESSDATA_PREFIX=C:\Program Files\Tesseract-OCR\tessdata
```

### Optional
```env
ENABLE_GEMINI=True
ENABLE_TESSERACT=True
ENABLE_KIRIOCR=False
ENABLE_YOLO=False
DEBUG_MODE=True
LOG_LEVEL=INFO
```

---

## Performance Benchmarks

### Speed (per region, ~100x100px)
| Model | Speed | Notes |
|-------|-------|-------|
| Tesseract | 50-100ms | Local, fast |
| KiriOCR | 200-500ms | Local, accurate |
| Gemini | 1000-2000ms | Network latency |

### Accuracy (Khmer text)
| Model | Accuracy | Notes |
|-------|----------|-------|
| Tesseract | 70-80% | Good for clean text |
| KiriOCR | 85-95% | Excellent |
| Gemini | 85-95% | Excellent, handles varied styles |

---

## Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| GEMINI_API_KEY not found | Missing env var | Add to .env file |
| google-generativeai not installed | Missing package | `pip install google-generativeai` |
| API key is invalid | Wrong/expired key | Get new key from Google AI |
| Model not initialized | Startup failure | Check logs, restart server |
| Timeout | Image too large/API slow | Reduce image size or increase timeout |

---

## Troubleshooting

### Check Server Status
```bash
curl http://localhost:8000/
# Should return: {"message": "Server is running"}
```

### Verify Gemini
```python
from utils.GeminiOCR import GeminiOCR
ocr = GeminiOCR()
health = ocr.health_check()
print(health)
# Should show: {"status": "healthy", "api_key_valid": true}
```

### View Logs
```bash
# Logs are printed to console by default
# For debugging, check:
# - .env file is correct
# - Google API key is valid
# - Internet connection is active
# - API quota not exceeded
```

---

## Useful Links

- **Get API Key**: https://aistudio.google.com/app/apikey
- **Gemini Docs**: https://ai.google.dev/docs
- **Pricing**: https://ai.google.dev/pricing
- **ML_V4 Setup**: See `GEMINI_SETUP_GUIDE.md`

---

**Quick Start**: 
1. Set GEMINI_API_KEY in .env
2. Run `python main.py`
3. Call `/ocr` with `recognition_model=gemini`
