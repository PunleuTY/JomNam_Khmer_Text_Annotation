# OCR Text Extraction

How the Khmer OCR text extraction works in this project.

---

## Overview

The OCR (Optical Character Recognition) system extracts Khmer and English text from user-drawn bounding boxes on images.

---

## Architecture

```
┌─────────────┐
│   Frontend  │  (React)
│             │
│ 1. User     │
│    draws    │
│    boxes    │
└──────┬──────┘
       │
       │ 2. Send image + boxes
       ▼
┌─────────────────┐
│   ML Server     │  (FastAPI - Port 8000)
│                 │
│ 3. For each box:│
│    - Crop       │
│    - Preprocess │
│    - OCR        │
└──────┬──────────┘
       │
       │ 4. Return extracted text
       ▼
┌─────────────┐
│   Frontend  │
│             │
│ 5. Display  │
│    text     │
└─────────────┘
```

---

## OCR Pipeline

### Step 1: User Draws Bounding Boxes

- User opens an image in the frontend
- Draws rectangles around text regions
- Each box has coordinates: `[x1, y1, x2, y2]`

---

### Step 2: Frontend Sends Request

```javascript
const formData = new FormData();
formData.append("image", imageFile);

const response = await fetch("http://localhost:8000/predict/ocr", {
  method: "POST",
  body: formData,
});

const result = await response.json();
```

---

### Step 3: ML Server Processes Image

For each bounding box:

1. **Crop** the region from the full image
2. **Preprocess** the cropped image:
   - Convert to grayscale
   - Apply denoising
   - Threshold to binary
3. **Run Tesseract OCR**:
   ```python
   text = pytesseract.image_to_string(
       preprocessed,
       lang="khm+eng",
       config='--psm 6'
   )
   ```
4. **Post-process** the text:
   - Clean whitespace
   - Remove special characters
   - Format output

---

### Step 4: Return Results

```json
{
  "success": true,
  "text": "ខ្មែរ text extracted",
  "detections": [
    {
      "text": "ខ្មែរ",
      "confidence": 95,
      "bbox": [100, 150, 300, 200]
    },
    {
      "text": "ភាសា",
      "confidence": 92,
      "bbox": [350, 200, 500, 250]
    }
  ],
  "language": "eng+khm"
}
```

---

## Preprocessing Steps

### Grayscale Conversion

```python
gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
```

### Denoising

```python
denoised = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
```

### Thresholding

```python
# Otsu's thresholding
_, binary = cv2.threshold(
    denoised, 0, 255,
    cv2.THRESH_BINARY | cv2.THRESH_OTSU
)
```

---

## Tesseract Configuration

### Language Selection

```python
lang="khm+eng"  # Khmer + English
```

### PSM (Page Segmentation Mode)

| PSM | Mode | Use Case |
|-----|------|----------|
| 3 | Fully automatic | Default |
| 6 | Uniform block | Text blocks (recommended) |
| 7 | Single text line | Individual lines |
| 10 | Single character | Single chars |

**Recommended for Khmer:** PSM 6

```python
config='--psm 6'
```

---

## Code Example

### Full OCR Function

```python
import cv2
import pytesseract
import numpy as np

def extract_text_from_box(image: np.ndarray, bbox: list[int]) -> str:
    """
    Extract text from a bounding box region.
    
    Args:
        image: Full image (BGR format)
        bbox: [x1, y1, x2, y2] coordinates
    
    Returns:
        Extracted text string
    """
    x1, y1, x2, y2 = bbox
    
    # 1. Crop region
    crop = image[y1:y2, x1:x2]
    
    # 2. Preprocess
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)
    _, binary = cv2.threshold(
        denoised, 0, 255,
        cv2.THRESH_BINARY | cv2.THRESH_OTSU
    )
    
    # 3. OCR
    text = pytesseract.image_to_string(
        binary,
        lang="khm+eng",
        config='--psm 6'
    )
    
    # 4. Post-process
    text = text.strip()
    
    return text
```

---

## Improving OCR Accuracy

### 1. High-Quality Images

- Use images with minimum 300 DPI
- Avoid heavily compressed JPEGs
- Ensure good lighting/contrast

### 2. Tight Bounding Boxes

- Draw boxes close to text edges
- Don't include too much empty space
- Box should contain only text (no graphics)

### 3. Preprocessing Tuning

Adjust preprocessing parameters:

```python
# Stronger denoising
denoised = cv2.fastNlMeansDenoising(gray, None, 50, 7, 21)

# Different thresholding
_, binary = cv2.threshold(denoised, 200, 255, cv2.THRESH_BINARY)
```

### 4. Language Configuration

For mixed Khmer/English:
```python
lang="khm+eng"
```

For Khmer only:
```python
lang="khm"
```

---

## Troubleshooting

### Issue: No Text Extracted

**Possible Causes:**
- ML server not running
- Bounding boxes don't contain text
- Image quality too poor

**Solutions:**
1. Verify ML server: http://localhost:8000/docs
2. Check browser console for errors
3. Try with a clearer image

---

### Issue: Garbage Text Output

**Possible Causes:**
- Wrong language configured
- Poor preprocessing
- Low image resolution

**Solutions:**
1. Verify Khmer language pack installed: `tesseract --list-langs`
2. Adjust preprocessing parameters
3. Use higher resolution images

---

### Issue: Slow OCR Performance

**Possible Causes:**
- Large images
- Too many bounding boxes
- Slow preprocessing

**Solutions:**
1. Resize images before sending
2. Batch process boxes
3. Optimize preprocessing pipeline

---

## Testing OCR

### Test with Sample Image

```bash
cd production/ML/ml_service

# Using curl
curl -X POST http://localhost:8000/predict/ocr \
  -F "image=@test_image.jpg"
```

### Test Tesseract Directly

```bash
tesseract test_image.png output --lang khm+eng
type output.txt
```

---

## Integration

### Frontend Integration

```javascript
async function extractText(imageFile, boundingBoxes) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("http://localhost:8000/predict/ocr", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  
  // Map extracted text to bounding boxes
  return result.detections.map((det, i) => ({
    ...boundingBoxes[i],
    text: det.text,
    confidence: det.confidence,
  }));
}
```

### Backend Integration (Go)

```go
type OCRResponse struct {
    Success    bool   `json:"success"`
    Text       string `json:"text"`
    Detections []struct {
        Text       string `json:"text"`
        Confidence int    `json:"confidence"`
        Bbox       []int  `json:"bbox"`
    } `json:"detections"`
}

func callOCR(imagePath string) (*OCRResponse, error) {
    // Implementation
}
```

---

## Next Steps

- [Inference Service](inference-service.md) - FastAPI service docs
- [Troubleshooting](../troubleshooting/ocr-debugging.md) - OCR debugging guide
- [Tesseract Setup](../getting-started/tesseract-setup.md) - Install Tesseract
