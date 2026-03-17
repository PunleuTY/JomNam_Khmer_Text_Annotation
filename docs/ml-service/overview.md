# ML Service Overview

Architecture and components of the Machine Learning service.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ML Inference Service                   │
│                     (FastAPI - Port 8000)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐              │
│  │  YOLO Model  │         │  Tesseract   │              │
│  │  (Object     │         │  (OCR)       │              │
│  │  Detection)  │         │              │              │
│  └──────┬───────┘         └──────┬───────┘              │
│         │                        │                       │
│         └──────────┬─────────────┘                       │
│                    │                                     │
│           ┌────────▼────────┐                            │
│           │ Inference       │                            │
│           │ Service         │                            │
│           └────────┬────────┘                            │
│                    │                                     │
│           ┌────────▼────────┐                            │
│           │ API Endpoints   │                            │
│           └────────┬────────┘                            │
└────────────────────┼─────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     ▼
            ┌────────────────┐
            │   Frontend     │
            │   (React)      │
            └────────────────┘
```

---

## Components

### 1. YOLO Model (Object Detection)

**Purpose:** Detect and localize objects in images

**Implementation:**
- Uses Ultralytics YOLOv8
- Custom-trained on Khmer-specific objects
- Returns bounding boxes with labels and confidence scores

**API Endpoint:** `POST /predict/detect`

**Response:**
```json
{
  "detections": [
    {
      "bbox": [100.5, 200.3, 300.2, 400.1],
      "confidence": 0.95,
      "label": "text_region",
      "class_id": 0
    }
  ]
}
```

---

### 2. Tesseract Model (OCR)

**Purpose:** Extract Khmer and English text from images

**Implementation:**
- Uses Tesseract OCR v5
- Supports Khmer (khm) and English (eng)
- Returns text with bounding boxes and confidence

**API Endpoint:** `POST /predict/ocr`

**Response:**
```json
{
  "text": "ខ្មែរ text extracted",
  "detections": [
    {
      "text": "ខ្មែរ",
      "confidence": 95,
      "bbox": [10, 20, 50, 40]
    }
  ],
  "language": "eng+khm"
}
```

---

### 3. Combined Inference

**Purpose:** Run both detection and OCR in a single request

**API Endpoint:** `POST /predict/combined`

**Response:**
```json
{
  "detections": [...],
  "ocr": {
    "text": "...",
    "detections": [...]
  }
}
```

---

## Folder Structure

```
production/ML/ml_service/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Configuration
│   ├── models/
│   │   ├── base.py          # Abstract model class
│   │   ├── yolo_model.py    # YOLO wrapper
│   │   └── tesseract_model.py # Tesseract wrapper
│   ├── services/
│   │   ├── inference_service.py  # Orchestration
│   │   └── model_registry.py     # Model management
│   ├── schemas/
│   │   └── predictions.py   # Pydantic schemas
│   └── utils/
│       └── image_processor.py # Image utilities
├── models/                   # Trained models (best.pt)
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## OOP Design

### Base Model Class

All models inherit from `BaseModel`:

```python
from abc import ABC, abstractmethod

class BaseModel(ABC):
    @abstractmethod
    def load(self) -> None:
        """Load model into memory"""
        pass

    @abstractmethod
    def predict(self, input_data) -> Any:
        """Run inference"""
        pass

    @abstractmethod
    def unload(self) -> None:
        """Unload model from memory"""
        pass
```

### Model Registry

Centralized model management:

```python
registry = ModelRegistry()
registry.register("yolo", yolo_model)
registry.register("tesseract", tesseract_model)
registry.load_all()
```

---

## Running the ML Service

### Development

```bash
cd production/ML/ml_service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env

# Place your best.pt in models/
python -m uvicorn app.main:app --reload
```

### Docker

```bash
docker build -t ml-inference-service .
docker run -p 8000:8000 -v $(pwd)/models:/app/models ml-inference-service
```

---

## API Documentation

Access interactive API docs at: http://localhost:8000/docs

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |
| POST | `/predict/detect` | YOLO detection |
| POST | `/predict/ocr` | Tesseract OCR |
| POST | `/predict/combined` | Both detection + OCR |

---

## Integration

### From Frontend (React)

```javascript
async function detectObjects(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("http://localhost:8000/predict/detect", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result.detections;
}
```

### From Backend (Go)

```go
func callMLService(imagePath string) (*DetectionResponse, error) {
    // Read file
    file, _ := os.Open(imagePath)
    defer file.Close()

    // Create multipart form
    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)
    part, _ := writer.CreateFormFile("image", imagePath)
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

---

## Adding New Models

1. Create model class in `app/models/`:

```python
from app.models.base import BaseModel

class MyCustomModel(BaseModel):
    def load(self) -> None:
        # Load model logic
        self._model = load_my_model(self.model_path)
        self._is_loaded = True

    def predict(self, input_data) -> Any:
        # Inference logic
        return self._model.predict(input_data)

    def unload(self) -> None:
        self._model = None
        self._is_loaded = False
```

2. Register in `app/main.py`:

```python
from app.models.my_custom_model import MyCustomModel

custom_model = MyCustomModel(model_path=Path("models/my_model.pth"))
inference_service = InferenceService(
    yolo_model=yolo_model,
    tesseract_model=tesseract_model,
    custom_model=custom_model,
)
```

3. Add new endpoint in `app/main.py`

---

## Configuration

Edit `production/ML/ml_service/.env`:

```env
# Server
HOST=0.0.0.0
PORT=8000

# YOLO
YOLO_MODEL_NAME=best.pt
YOLO_CONFIDENCE=0.5
YOLO_IOU_THRESHOLD=0.45

# Tesseract
TESSERACT_DATA_PATH=C:\Program Files\Tesseract-OCR\tessdata

# Image Processing
MAX_IMAGE_SIZE=4096

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=INFO
```

---

## Next Steps

- [Inference Service Setup](inference-service.md) - New FastAPI service
- [OCR Extraction](ocr-extraction.md) - Khmer OCR pipeline
- [Model Training](model-training.md) - Train YOLO models
