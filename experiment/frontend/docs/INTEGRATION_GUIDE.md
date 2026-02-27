# Backend Integration Guide

This frontend application is designed to be easily integrated with your own backend ML/Detection services. This guide explains how to connect your backend APIs.

## Architecture

```
Frontend (Next.js)
    ↓
API Calls
    ↓
Your Backend (YOLO, Tesseract, DocTR, etc.)
    ↓
ML Model Response
    ↓
Frontend (Display Results)
```

## 1. Text Detection (YOLO / Custom Detection)

### Frontend Setup

The detection function is already prepared in `lib/export-utils.ts`:

```typescript
export async function callBackendDetection(
  imageUrl: string,
  apiEndpoint: string
): Promise<Array<{ x: number; y: number; width: number; height: number }>> {
  // Makes POST request with image
  // Returns array of bounding boxes
}
```

### How to Integrate

**Step 1: Add API endpoint config to your environment**

Create `.env.local`:
```
NEXT_PUBLIC_DETECTION_API=http://your-backend.com/api/detect
NEXT_PUBLIC_OCR_API=http://your-backend.com/api/ocr
```

**Step 2: Modify the detection handler in `app/page.tsx`**

Find `handleAutoDetect` function and replace:

```typescript
const handleAutoDetect = useCallback(async () => {
  setIsDetecting(true)
  try {
    // Call your detection API
    const detections = await callBackendDetection(
      imageUrl,
      process.env.NEXT_PUBLIC_DETECTION_API || ''
    )

    // Convert API response to annotations
    detections.forEach((detection, i) => {
      const newAnnotation: Annotation = {
        id: `auto-${Date.now()}-${i}`,
        text: '', // Will be filled by OCR
        x: Math.round(detection.x),
        y: Math.round(detection.y),
        width: Math.round(detection.width),
        height: Math.round(detection.height),
        mode: annotationMode,
      }
      setAnnotations((prev) => [...prev, newAnnotation])
    })
  } finally {
    setIsDetecting(false)
  }
}, [imageUrl, annotationMode])
```

### Backend API Specification

**Endpoint:** `POST /api/detect`

**Request:**
```json
{
  "image": "base64_image_data or form-data",
  "confidence": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "x": 10,
      "y": 20,
      "width": 100,
      "height": 50,
      "confidence": 0.95
    }
  ]
}
```

## 2. Text Recognition (OCR / DocTR / Tesseract)

### Frontend Setup

The OCR function is prepared in `lib/export-utils.ts`:

```typescript
export async function callBackendOCR(
  imageCropUrl: string,
  apiEndpoint: string
): Promise<{ text: string; confidence: number }>
```

### How to Integrate

**Step 1: Add OCR extraction in annotations panel**

You can add a button in `components/annotations-panel.tsx` to extract text for selected boxes:

```typescript
const handleExtractText = async (annotation: Annotation) => {
  try {
    // Extract region from image
    const canvas = document.createElement('canvas')
    const img = new Image()
    img.src = imageSrc
    
    await new Promise((r) => (img.onload = r))
    
    canvas.width = annotation.width
    canvas.height = annotation.height
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(
      img,
      annotation.x, annotation.y, annotation.width, annotation.height,
      0, 0, annotation.width, annotation.height
    )
    
    // Call backend OCR
    const cropUrl = canvas.toDataURL()
    const result = await callBackendOCR(
      cropUrl,
      process.env.NEXT_PUBLIC_OCR_API || ''
    )
    
    // Update annotation with extracted text
    onUpdateText(annotation.id, result.text)
  } catch (error) {
    console.error('OCR failed:', error)
  }
}
```

### Backend API Specification

**Endpoint:** `POST /api/ocr`

**Request:**
```
Content-Type: multipart/form-data
- image: PNG/JPG file (cropped region)
```

**Response:**
```json
{
  "success": true,
  "text": "ឡើង",
  "confidence": 0.92
}
```

## 3. Export Integration

### Current Export Functions

Three export formats are available in `lib/export-utils.ts`:

1. **exportToJSON()** - Simple JSON format
2. **exportToCOCO()** - COCO object detection format
3. **exportToPaddleOCR()** - PaddleOCR training format

### Modify Exports to Send to Backend

Example: Save annotations to your backend database:

```typescript
const handleSaveAnnotations = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/annotations/save`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl,
          annotations: annotations,
          mode: annotationMode,
          exportDate: new Date().toISOString(),
        }),
      }
    )
    
    const result = await response.json()
    if (result.success) {
      alert('Annotations saved to backend!')
    }
  } catch (error) {
    console.error('Save failed:', error)
  }
}
```

## Complete Backend Example (Python Flask)

Here's a simple backend example that demonstrates all three endpoints:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import pytesseract
import yolov5

app = Flask(__name__)
CORS(app)

# Load YOLO model (or your detection model)
model = yolov5.load('yolov5s.pt')

@app.route('/api/detect', methods=['POST'])
def detect():
    """Text detection endpoint"""
    try:
        # Get image from request
        if 'image' in request.files:
            image_file = request.files['image']
            image = Image.open(image_file)
        else:
            # Handle base64 image
            data = request.json['image']
            image_data = base64.b64decode(data.split(',')[1])
            image = Image.open(BytesIO(image_data))
        
        # Convert to numpy array
        image_np = np.array(image)
        
        # Run YOLO detection
        results = model(image_np)
        detections = results.xyxy[0].numpy()
        
        # Format response
        formatted_detections = [
            {
                'x': int(det[0]),
                'y': int(det[1]),
                'width': int(det[2] - det[0]),
                'height': int(det[3] - det[1]),
                'confidence': float(det[4])
            }
            for det in detections
        ]
        
        return jsonify({
            'success': True,
            'detections': formatted_detections
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/ocr', methods=['POST'])
def ocr():
    """OCR extraction endpoint"""
    try:
        image_file = request.files['image']
        image = Image.open(image_file)
        
        # Run Tesseract OCR
        text = pytesseract.image_to_string(image, lang='khm+eng')
        confidence = 0.85  # You can calculate actual confidence
        
        return jsonify({
            'success': True,
            'text': text.strip(),
            'confidence': confidence
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/annotations/save', methods=['POST'])
def save_annotations():
    """Save annotations endpoint"""
    try:
        data = request.json
        # Save to database
        # ... your database code ...
        
        return jsonify({'success': True, 'id': 'anno-123'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## Docker Deployment (Backend)

```dockerfile
FROM python:3.10
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

## Frontend CORS Configuration

If your backend is on a different domain, ensure CORS is properly configured:

**Backend (Flask example):**
```python
from flask_cors import CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "https://yourdomain.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

## Error Handling

Add proper error handling in your integration:

```typescript
try {
  const result = await callBackendDetection(imageUrl, apiEndpoint)
} catch (error) {
  if (error instanceof TypeError) {
    alert('Backend unreachable - check your API endpoint')
  } else {
    alert(`Detection failed: ${error.message}`)
  }
}
```

## Testing Integration

1. **Test Detection**
   - Upload test image
   - Click "Auto Detect"
   - Check browser DevTools Network tab for API call
   - Verify detection boxes appear

2. **Test OCR**
   - Add button to annotations panel
   - Click to extract text from a box
   - Check API response
   - Verify text appears in annotation

3. **Test Export**
   - Export and verify JSON/COCO/PaddleOCR format
   - Check if data matches expected schema
   - Test in your training pipeline

## Performance Optimization

- **Batch Processing**: Send multiple images to detect endpoint
- **Caching**: Cache detection results for same images
- **Async Loading**: Show loading spinner during API calls
- **Compression**: Compress images before sending to backend

## Security Considerations

- Use HTTPS in production
- Validate file types on both frontend and backend
- Implement rate limiting on backend APIs
- Use authentication tokens if needed
- Sanitize user input

## Support

For issues with backend integration:
1. Check browser console for JavaScript errors
2. Check backend server logs for API errors
3. Verify CORS settings
4. Test API endpoints with curl or Postman
5. Use browser DevTools Network tab to inspect requests/responses

---

Ready to integrate your ML backend! 🚀
