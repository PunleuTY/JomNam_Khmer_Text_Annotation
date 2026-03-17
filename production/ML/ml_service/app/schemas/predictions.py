"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel, Field


class DetectionResult(BaseModel):
    """Single object detection result."""

    bbox: list[float] = Field(..., description="Bounding box [x1, y1, x2, y2]")
    confidence: float = Field(..., description="Confidence score")
    label: str = Field(..., description="Class label")
    class_id: int = Field(..., description="Class ID")


class DetectionResponse(BaseModel):
    """Response for object detection endpoint."""

    success: bool = True
    detections: list[DetectionResult] = []
    message: str = "Detection completed successfully"


class OCRDetection(BaseModel):
    """Single OCR text detection."""

    text: str = Field(..., description="Detected text")
    confidence: int = Field(..., description="Confidence percentage")
    bbox: list[int] = Field(..., description="Bounding box [x1, y1, x2, y2]")


class OCRResponse(BaseModel):
    """Response for OCR endpoint."""

    success: bool = True
    text: str = ""
    detections: list[OCRDetection] = []
    language: str = ""
    message: str = "OCR completed successfully"


class CombinedResponse(BaseModel):
    """Response for combined detection + OCR endpoint."""

    success: bool = True
    detections: list[DetectionResult] = []
    ocr: OCRResponse | None = None
    message: str = "Combined inference completed successfully"


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    models_loaded: list[str] = []
    message: str = "Service is running"


class ErrorResponse(BaseModel):
    """Error response."""

    success: bool = False
    error: str
    detail: str | None = None
