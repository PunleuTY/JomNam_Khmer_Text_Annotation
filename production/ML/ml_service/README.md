# ML Inference Service

FastAPI-based inference service for YOLO object detection and Tesseract OCR.

## 📁 Folder Structure

```
ml_service/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── models/
│   │   ├── base.py          # Abstract base model class
│   │   ├── yolo_model.py    # YOLO detection model
│   │   └── tesseract_model.py # Tesseract OCR model
│   ├── services/
│   │   ├── inference_service.py  # Main inference orchestrator
│   │   └── model_registry.py     # Model registration/management
│   ├── schemas/
│   │   └── predictions.py   # Pydantic request/response schemas
│   └── utils/
│       └── image_processor.py # Image preprocessing utilities
├── models/                   # Trained model files (place best.pt here)
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
```

## 🚀 Quick Start

### 1. Place Your Model

Copy your trained YOLO model to the models folder:

```
production/ML/ml_service/models/best.pt
```

### 2. Setup Environment

```bash
cd production/ML/ml_service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env    # Windows
cp .env.example .env      # Linux/Mac
```

### 3. Configure Environment

Edit `.env` file:

```env
# YOLO Model
YOLO_MODEL_NAME=best.pt
YOLO_CONFIDENCE=0.5

# Tesseract (optional - leave empty if not using)
TESSERACT_DATA_PATH=

# Server
PORT=8000
```

### 4. Run the Service

```bash
# Development mode (with auto-reload)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or simply
python app/main.py
```

### 5. Access API

- **Service**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Object Detection
```
POST /predict/detect
Content-Type: multipart/form-data

Image: <file>
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "bbox": [100.5, 200.3, 300.2, 400.1],
      "confidence": 0.95,
      "label": "person",
      "class_id": 0
    }
  ],
  "message": "Detected 1 objects"
}
```

### OCR (Text Extraction)
```
POST /predict/ocr
Content-Type: multipart/form-data

Image: <file>
```

**Response:**
```json
{
  "success": true,
  "text": "Extracted text content...",
  "detections": [
    {
      "text": "Hello",
      "confidence": 95,
      "bbox": [10, 20, 50, 40]
    }
  ],
  "language": "eng+khm"
}
```

### Combined (Detection + OCR)
```
POST /predict/combined
Content-Type: multipart/form-data

Image: <file>
```

## 🔌 Integration with Backend (Go)

Example Go code to call the ML service:

```go
func callMLService(imagePath string) (*DetectionResponse, error) {
    // Read image file
    file, _ := os.Open(imagePath)
    defer file.Close()

    // Create multipart form
    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)
    part, _ := writer.CreateFormFile("image", filepath.Base(imagePath))
    io.Copy(part, file)
    writer.Close()

    // Send request
    resp, _ := http.Post(
        "http://localhost:8000/predict/detect",
        writer.FormDataContentType(),
        body,
    )
    defer resp.Body.Close()

    // Parse response
    var result DetectionResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return &result, nil
}
```

## 🔌 Integration with Frontend (React)

```javascript
async function detectObjects(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("http://localhost:8000/predict/detect", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result.detections; // Array of bounding boxes
}

// Usage
const imageInput = document.querySelector('input[type="file"]');
imageInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const detections = await detectObjects(file);
  console.log("Detected:", detections);
});
```

## 🐳 Docker Deployment

```bash
# Build image
docker build -t ml-inference-service .

# Run container
docker run -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  ml-inference-service
```

## 🧪 Testing with cURL

```bash
# Health check
curl http://localhost:8000/health

# Object detection
curl -X POST http://localhost:8000/predict/detect \
  -F "image=@path/to/image.jpg"

# OCR
curl -X POST http://localhost:8000/predict/ocr \
  -F "image=@path/to/image.jpg"

# Combined
curl -X POST http://localhost:8000/predict/combined \
  -F "image=@path/to/image.jpg"
```

## 📝 Adding New Models

1. Create model class in `app/models/`:
```python
from app.models.base import BaseModel

class MyCustomModel(BaseModel):
    def load(self) -> None:
        # Load model logic
        pass

    def predict(self, input_data) -> Any:
        # Inference logic
        pass

    def unload(self) -> None:
        # Cleanup logic
        pass
```

2. Register in `app/main.py`:
```python
from app.models.my_custom_model import MyCustomModel

# In lifespan function
my_model = MyCustomModel(model_path=Path("models/my_model.pth"))
inference_service = InferenceService(
    yolo_model=yolo_model,
    tesseract_model=tesseract_model,
    # Add your model
)
```

3. Add new endpoint in `app/main.py`

## ⚙️ Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `YOLO_MODEL_NAME` | `best.pt` | YOLO model filename |
| `YOLO_CONFIDENCE` | `0.5` | Detection confidence threshold |
| `YOLO_IOU_THRESHOLD` | `0.45` | NMS IoU threshold |
| `TESSERACT_DATA_PATH` | `` | Tesseract data folder path |
| `MAX_IMAGE_SIZE` | `4096` | Maximum image dimension |
| `CORS_ORIGINS` | `localhost:3000,localhost:5173` | Allowed CORS origins |
| `LOG_LEVEL` | `INFO` | Logging level |

## 📄 License

Internal project - Khmer Data Annotation Project
