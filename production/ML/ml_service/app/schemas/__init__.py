"""Schema definitions."""

from app.schemas.predictions import (
    CombinedResponse,
    DetectionResponse,
    DetectionResult,
    ErrorResponse,
    HealthResponse,
    OCRDetection,
    OCRResponse,
)

__all__ = [
    "DetectionResult",
    "DetectionResponse",
    "OCRDetection",
    "OCRResponse",
    "CombinedResponse",
    "HealthResponse",
    "ErrorResponse",
]
