"""Model classes for inference."""

from app.models.base import BaseModel
from app.models.yolo_model import YOLOModel
from app.models.tesseract_model import TesseractModel

__all__ = ["BaseModel", "YOLOModel", "TesseractModel"]
