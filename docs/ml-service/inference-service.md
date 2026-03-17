# ML Inference Service (FastAPI)

Documentation for the new FastAPI-based ML inference service supporting YOLO detection and Tesseract OCR.

---

## Overview

This is a modern, OOP-structured ML inference service built with FastAPI. It provides:

- **YOLO Object Detection** - Custom-trained YOLO models
- **Tesseract OCR** - Khmer and English text extraction
- **Combined Inference** - Run both models in one request
- **Clean Architecture** - Modular, extensible design
- **Auto-generated API Docs** - Swagger UI at `/docs`

---

## Quick Start

### 1. Install Dependencies

```bash
cd production/ML/ml_service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
copy .env.example .env
```

Edit `.env`:
```env
YOLO_MODEL_NAME=best.pt
YOLO_CONFIDENCE=0.5
PORT=8000
```

### 3. Place Your Model

Copy your trained YOLO model to:
```
production/ML/ml_service/models/best.pt
```

### 4. Run the Service

```bash
python -m uvicorn app.main:app --reload
```

Access API docs: http://localhost:8000/docs

---

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": ["yolo", "tesseract"],
  "message": "Service is running"
}
```

---

### Object Detection

```http
POST /predict/detect
Content-Type: multipart/form-data

image: <file>
```

**Request:**
- `image` (file): Image file (JPG/PNG)

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "bbox": [100.5, 200.3, 300.2, 400.1],
      "confidence": 0.95,
      "label": "text_region",
      "class_id": 0
    }
  ],
  "message": "Detected 1 objects"
}
```

---

### OCR (Text Extraction)

```http
POST /predict/ocr
Content-Type: multipart/form-data

image: <file>
```

**Request:**
- `image` (file): Image file

**Response:**
```json
{
  "success": true,
  "text": "ខ្មែរ text extracted",
  "detections": [
    {
      "text": "ខ្មែរ",
      "confidence": 95,
      "bbox": [10, 20, 50, 40]
    }
  ],
  "language": "eng+khm",
  "message": "OCR completed"
}
```

---

### Combined Inference

```http
POST /predict/combined
Content-Type: multipart/form-data

image: <file>
```

**Response:**
```json
{
  "success": true,
  "detections": [
    {
      "bbox": [100, 150, 300, 200],
      "confidence": 0.92,
      "label": "text_region",
      "class_id": 0
    }
  ],
  "ocr": {
    "success": true,
    "text": "ខ្មែរ text",
    "detections": [...],
    "language": "eng+khm"
  },
  "message": "Combined inference completed"
}
```

---

## Architecture

```
ml_service/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── models/
│   │   ├── base.py          # Abstract base class
│   │   ├── yolo_model.py    # YOLO wrapper
│   │   └── tesseract_model.py # Tesseract wrapper
│   ├── services/
│   │   ├── inference_service.py  # Orchestrator
│   │   └── model_registry.py     # Registry
│   ├── schemas/
│   │   └── predictions.py   # Pydantic schemas
│   └── utils/
│       └── image_processor.py # Utilities
├── models/                   # Model files
├── .env.example
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## OOP Design

### Base Model Class

```python
from abc import ABC, abstractmethod

class BaseModel(ABC):
    def __init__(self, model_path: Path):
        self.model_path = model_path
        self._is_loaded = False

    @abstractmethod
    def load(self) -> None:
        pass

    @abstractmethod
    def predict(self, input_data) -> Any:
        pass

    @abstractmethod
    def unload(self) -> None:
        pass
```

### YOLO Model

```python
class YOLOModel(BaseModel):
    def __init__(self, model_path: Path, confidence: float = 0.5):
        super().__init__(model_path)
        self.confidence = confidence

    def load(self) -> None:
        from ultralytics import YOLO
        self._model = YOLO(str(self.model_path))
        self._is_loaded = True

    def predict(self, image: np.ndarray) -> list[dict]:
        results = self._model.predict(image, conf=self.confidence)
        return self._parse_results(results)
```

### Model Registry

```python
class ModelRegistry:
    def __init__(self):
        self._models: dict[str, BaseModel] = {}

    def register(self, name: str, model: BaseModel) -> None:
        self._models[name] = model

    def get(self, name: str) -> BaseModel | None:
        return self._models.get(name)

    def load_all(self) -> None:
        for model in self._models.values():
            if not model.is_loaded:
                model.load()
```

---

## Testing with cURL

### Test Detection

```bash
curl -X POST http://localhost:8000/predict/detect \
  -F "image=@path/to/image.jpg"
```

### Test OCR

```bash
curl -X POST http://localhost:8000/predict/ocr \
  -F "image=@path/to/image.jpg"
```

### Test Combined

```bash
curl -X POST http://localhost:8000/predict/combined \
  -F "image=@path/to/image.jpg"
```

---

## Docker Deployment

### Build Image

```bash
docker build -t ml-inference-service .
```

### Run Container

```bash
docker run -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  ml-inference-service
```

### Docker Compose

```yaml
version: '3.8'
services:
  ml-service:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models
    environment:
      - YOLO_MODEL_NAME=best.pt
      - YOLO_CONFIDENCE=0.5
```

---

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `YOLO_MODEL_NAME` | `best.pt` | YOLO model filename |
| `YOLO_CONFIDENCE` | `0.5` | Detection threshold |
| `YOLO_IOU_THRESHOLD` | `0.45` | NMS threshold |
| `TESSERACT_DATA_PATH` | `` | Tesseract data folder |
| `MAX_IMAGE_SIZE` | `4096` | Max image dimension |
| `CORS_ORIGINS` | `localhost:3000,localhost:5173` | CORS allowed origins |
| `LOG_LEVEL` | `INFO` | Logging level |

---

## Adding New Models

### Step 1: Create Model Class

```python
# app/models/custom_model.py
from app.models.base import BaseModel

class CustomModel(BaseModel):
    def load(self) -> None:
        # Load your model
        self._model = load_model(self.model_path)
        self._is_loaded = True

    def predict(self, input_data) -> Any:
        # Run inference
        return self._model(input_data)

    def unload(self) -> None:
        self._model = None
        self._is_loaded = False
```

### Step 2: Register in Main App

```python
# app/main.py
from app.models.custom_model import CustomModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    custom_model = CustomModel(model_path=Path("models/custom.pt"))
    inference_service = InferenceService(
        yolo_model=yolo_model,
        tesseract_model=tesseract_model,
        custom_model=custom_model,
    )
    inference_service.load_models()
    yield
    inference_service.unload_models()
```

### Step 3: Add Endpoint

```python
@app.post("/predict/custom")
async def predict_custom(image: UploadFile = File(...)):
    contents = await image.read()
    results = inference_service.run_custom(contents)
    return {"success": True, "results": results}
```

---

## Troubleshooting

### "Model not found"

Ensure `best.pt` is in `production/ML/ml_service/models/`

### "Tesseract not initialized"

Install Tesseract OCR and set `TESSERACT_DATA_PATH` in `.env`

### "Port already in use"

Change `PORT` in `.env` or kill the process using port 8000

---

## Next Steps

- [OCR Extraction](ocr-extraction.md) - Khmer OCR details
- [Model Training](model-training.md) - Train YOLO models
- [Troubleshooting](../troubleshooting/common-issues.md) - Common issues
