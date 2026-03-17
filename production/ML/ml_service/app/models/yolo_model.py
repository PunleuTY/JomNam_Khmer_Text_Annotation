"""YOLO object detection model wrapper."""

import logging
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from ultralytics import YOLO

from app.models.base import BaseModel

logger = logging.getLogger(__name__)


class YOLOModel(BaseModel):
    """YOLO object detection model using Ultralytics."""

    def __init__(
        self,
        model_path: Path,
        confidence: float = 0.5,
        iou_threshold: float = 0.45,
    ):
        """
        Initialize YOLO model.

        Args:
            model_path: Path to the .pt model file.
            confidence: Confidence threshold for detections.
            iou_threshold: IoU threshold for NMS.
        """
        super().__init__(model_path)
        self.confidence = confidence
        self.iou_threshold = iou_threshold
        self._model: YOLO | None = None

    def load(self) -> None:
        """Load the YOLO model into memory."""
        if self._is_loaded:
            logger.warning("YOLO model already loaded")
            return

        try:
            logger.info(f"Loading YOLO model from {self.model_path}")
            self._model = YOLO(str(self.model_path))
            self._is_loaded = True
            logger.info("YOLO model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise

    def predict(self, image_data: np.ndarray) -> list[dict[str, Any]]:
        """
        Run object detection on an image.

        Args:
            image_data: Image as numpy array (BGR format).

        Returns:
            List of detection results with boxes, labels, and confidence.
        """
        if not self._is_loaded:
            raise RuntimeError("YOLO model not loaded. Call load() first.")

        try:
            results = self._model.predict(
                source=image_data,
                conf=self.confidence,
                iou=self.iou_threshold,
                verbose=False,
            )

            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue

                for i in range(len(boxes)):
                    box = boxes[i]
                    detections.append(
                        {
                            "bbox": box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                            "confidence": float(box.conf[0]),
                            "label": result.names[int(box.cls[0])],
                            "class_id": int(box.cls[0]),
                        }
                    )

            return detections

        except Exception as e:
            logger.error(f"YOLO prediction failed: {e}")
            raise

    def predict_with_image(self, image_path: str | Path) -> list[dict[str, Any]]:
        """
        Run object detection on an image file.

        Args:
            image_path: Path to the image file.

        Returns:
            List of detection results.
        """
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")
        return self.predict(image)

    def unload(self) -> None:
        """Unload the YOLO model from memory."""
        self._model = None
        self._is_loaded = False
        logger.info("YOLO model unloaded")
