"""Main inference service orchestrating model predictions."""

import logging
from io import BytesIO
from typing import Any

import cv2
import numpy as np
from PIL import Image

from app.models.yolo_model import YOLOModel
from app.models.tesseract_model import TesseractModel
from app.utils.image_processor import ImageProcessor

logger = logging.getLogger(__name__)


class InferenceService:
    """Service for running inference on images using registered models."""

    def __init__(
        self,
        yolo_model: YOLOModel | None = None,
        tesseract_model: TesseractModel | None = None,
    ):
        """
        Initialize the inference service.

        Args:
            yolo_model: YOLO detection model.
            tesseract_model: Tesseract OCR model.
        """
        self.yolo_model = yolo_model
        self.tesseract_model = tesseract_model
        self.image_processor = ImageProcessor()

    def load_models(self) -> None:
        """Load all available models."""
        if self.yolo_model and not self.yolo_model.is_loaded:
            logger.info("Loading YOLO model...")
            self.yolo_model.load()

        if self.tesseract_model and not self.tesseract_model.is_loaded:
            logger.info("Loading Tesseract model...")
            self.tesseract_model.load()

    def run_detection(
        self, image_data: bytes | np.ndarray
    ) -> list[dict[str, Any]]:
        """
        Run object detection on an image.

        Args:
            image_data: Image as bytes or numpy array.

        Returns:
            List of detection results.
        """
        if not self.yolo_model:
            raise RuntimeError("YOLO model not configured")

        if not self.yolo_model.is_loaded:
            raise RuntimeError("YOLO model not loaded")

        image = self._load_image(image_data)
        image = self.image_processor.validate_image(image)
        return self.yolo_model.predict(image)

    def run_ocr(self, image_data: bytes | np.ndarray) -> dict[str, Any]:
        """
        Run OCR on an image.

        Args:
            image_data: Image as bytes or numpy array.

        Returns:
            Dictionary with OCR results.
        """
        if not self.tesseract_model:
            raise RuntimeError("Tesseract model not configured")

        if not self.tesseract_model.is_loaded:
            raise RuntimeError("Tesseract model not loaded")

        image = self._load_image(image_data)
        image = self.image_processor.validate_image(image)
        return self.tesseract_model.predict(image)

    def run_combined(
        self, image_data: bytes | np.ndarray
    ) -> dict[str, Any]:
        """
        Run both detection and OCR on an image.

        Args:
            image_data: Image as bytes or numpy array.

        Returns:
            Dictionary with both detection and OCR results.
        """
        results = {
            "detections": [],
            "ocr": {},
        }

        if self.yolo_model and self.yolo_model.is_loaded:
            image = self._load_image(image_data)
            image = self.image_processor.validate_image(image)
            results["detections"] = self.yolo_model.predict(image)

        if self.tesseract_model and self.tesseract_model.is_loaded:
            image = self._load_image(image_data)
            image = self.image_processor.validate_image(image)
            results["ocr"] = self.tesseract_model.predict(image)

        return results

    def _load_image(self, image_data: bytes | np.ndarray) -> np.ndarray:
        """
        Load image from bytes or return numpy array.

        Args:
            image_data: Image as bytes or numpy array.

        Returns:
            Image as numpy array (BGR format).
        """
        if isinstance(image_data, np.ndarray):
            return image_data

        # Load from bytes
        image = Image.open(BytesIO(image_data))
        image_np = np.array(image)
        # Convert RGB to BGR for OpenCV
        return cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
