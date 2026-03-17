"""FastAPI ML Inference Service main entry point."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.tesseract_model import TesseractModel
from app.models.yolo_model import YOLOModel
from app.schemas.predictions import (
    CombinedResponse,
    DetectionResponse,
    DetectionResult,
    ErrorResponse,
    HealthResponse,
    OCRDetection,
    OCRResponse,
)
from app.services.inference_service import InferenceService

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# Global inference service
inference_service: InferenceService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown."""
    global inference_service

    # Startup: Load models
    logger.info("Starting ML Inference Service...")

    yolo_model = None
    tesseract_model = None

    # Initialize YOLO model
    if settings.YOLO_MODEL_PATH.exists():
        yolo_model = YOLOModel(
            model_path=settings.YOLO_MODEL_PATH,
            confidence=settings.YOLO_CONFIDENCE,
            iou_threshold=settings.YOLO_IOU_THRESHOLD,
        )
        logger.info(f"YOLO model configured: {settings.YOLO_MODEL_PATH}")
    else:
        logger.warning(
            f"YOLO model not found at {settings.YOLO_MODEL_PATH}"
        )

    # Initialize Tesseract model
    if settings.TESSERACT_DATA_PATH:
        tesseract_model = TesseractModel(
            tesseract_data_path=settings.TESSERACT_DATA_PATH,
            lang="eng+khm",  # Support English and Khmer
        )
        logger.info(
            f"Tesseract configured with data path: {settings.TESSERACT_DATA_PATH}"
        )

    # Create inference service
    inference_service = InferenceService(
        yolo_model=yolo_model,
        tesseract_model=tesseract_model,
    )
    inference_service.load_models()

    logger.info(
        f"Service started on {settings.HOST}:{settings.PORT}"
    )

    yield

    # Shutdown: Unload models
    logger.info("Shutting down ML Inference Service...")
    if inference_service:
        if inference_service.yolo_model:
            inference_service.yolo_model.unload()
        if inference_service.tesseract_model:
            inference_service.tesseract_model.unload()
    logger.info("Service stopped")


# Create FastAPI app
app = FastAPI(
    title="ML Inference Service",
    description="API for YOLO detection and Tesseract OCR inference",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """Root endpoint with service info."""
    return {
        "service": "ML Inference Service",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    models_loaded = []
    if inference_service:
        if (
            inference_service.yolo_model
            and inference_service.yolo_model.is_loaded
        ):
            models_loaded.append("yolo")
        if (
            inference_service.tesseract_model
            and inference_service.tesseract_model.is_loaded
        ):
            models_loaded.append("tesseract")

    return HealthResponse(
        status="healthy",
        models_loaded=models_loaded,
        message="Service is running",
    )


@app.post(
    "/predict/detect",
    response_model=DetectionResponse,
    tags=["Inference"],
)
async def predict_detection(
    image: UploadFile = File(..., description="Image file for detection"),
) -> DetectionResponse:
    """
    Run object detection on an uploaded image.

    Returns bounding boxes, labels, and confidence scores.
    """
    if not inference_service:
        return JSONResponse(
            status_code=503,
            content=ErrorResponse(
                error="Service not initialized",
                detail="Inference service is not available",
            ).model_dump(),
        )

    try:
        contents = await image.read()
        detections = inference_service.run_detection(contents)

        return DetectionResponse(
            success=True,
            detections=[
                DetectionResult(**det) for det in detections
            ],
            message=f"Detected {len(detections)} objects",
        )

    except Exception as e:
        logger.error(f"Detection failed: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="Detection failed", detail=str(e)
            ).model_dump(),
        )


@app.post(
    "/predict/ocr",
    response_model=OCRResponse,
    tags=["Inference"],
)
async def predict_ocr(
    image: UploadFile = File(..., description="Image file for OCR"),
) -> OCRResponse:
    """
    Run OCR on an uploaded image.

    Returns extracted text with bounding boxes.
    """
    if not inference_service:
        return JSONResponse(
            status_code=503,
            content=ErrorResponse(
                error="Service not initialized",
                detail="Inference service is not available",
            ).model_dump(),
        )

    try:
        contents = await image.read()
        ocr_result = inference_service.run_ocr(contents)

        return OCRResponse(
            success=True,
            text=ocr_result.get("text", ""),
            detections=[
                OCRDetection(**det)
                for det in ocr_result.get("detections", [])
            ],
            language=ocr_result.get("language", ""),
            message="OCR completed",
        )

    except Exception as e:
        logger.error(f"OCR failed: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="OCR failed", detail=str(e)
            ).model_dump(),
        )


@app.post(
    "/predict/combined",
    response_model=CombinedResponse,
    tags=["Inference"],
)
async def predict_combined(
    image: UploadFile = File(
        ..., description="Image file for combined inference"
    ),
) -> CombinedResponse:
    """
    Run both detection and OCR on an uploaded image.

    Returns combined results from both models.
    """
    if not inference_service:
        return JSONResponse(
            status_code=503,
            content=ErrorResponse(
                error="Service not initialized",
                detail="Inference service is not available",
            ).model_dump(),
        )

    try:
        contents = await image.read()
        results = inference_service.run_combined(contents)

        ocr_response = None
        if results.get("ocr"):
            ocr = results["ocr"]
            ocr_response = OCRResponse(
                success=True,
                text=ocr.get("text", ""),
                detections=[
                    OCRDetection(**det)
                    for det in ocr.get("detections", [])
                ],
                language=ocr.get("language", ""),
                message="OCR completed",
            )

        return CombinedResponse(
            success=True,
            detections=[
                DetectionResult(**det)
                for det in results.get("detections", [])
            ],
            ocr=ocr_response,
            message="Combined inference completed",
        )

    except Exception as e:
        logger.error(f"Combined inference failed: {e}")
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="Combined inference failed", detail=str(e)
            ).model_dump(),
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
