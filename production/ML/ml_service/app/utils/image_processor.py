"""Image processing utilities."""

import logging
from typing import Any

import cv2
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Utility class for image preprocessing and validation."""

    @staticmethod
    def validate_image(image: np.ndarray) -> np.ndarray:
        """
        Validate and preprocess an image for inference.

        Args:
            image: Input image as numpy array.

        Returns:
            Validated image.

        Raises:
            ValueError: If image is invalid or too large.
        """
        if image is None or image.size == 0:
            raise ValueError("Empty or invalid image")

        if len(image.shape) not in (2, 3):
            raise ValueError(f"Invalid image shape: {image.shape}")

        # Check image dimensions
        h, w = image.shape[:2]
        max_size = settings.MAX_IMAGE_SIZE

        if h > max_size or w > max_size:
            logger.warning(
                f"Image too large ({w}x{h}), resizing to max {max_size}"
            )
            image = ImageProcessor.resize_by_max_dimension(
                image, max_size
            )

        return image

    @staticmethod
    def resize_by_max_dimension(
        image: np.ndarray, max_size: int
    ) -> np.ndarray:
        """
        Resize image so the largest dimension fits within max_size.

        Args:
            image: Input image.
            max_size: Maximum dimension size.

        Returns:
            Resized image.
        """
        h, w = image.shape[:2]
        scale = max_size / max(h, w)

        if scale >= 1:
            return image

        new_w = int(w * scale)
        new_h = int(h * scale)

        return cv2.resize(
            image, (new_w, new_h), interpolation=cv2.INTER_AREA
        )

    @staticmethod
    def normalize_image(image: np.ndarray) -> np.ndarray:
        """
        Normalize image to 0-1 range.

        Args:
            image: Input image.

        Returns:
            Normalized image.
        """
        if image.dtype == np.uint8:
            return image.astype(np.float32) / 255.0
        return image

    @staticmethod
    def draw_detections(
        image: np.ndarray, detections: list[dict[str, Any]]
    ) -> np.ndarray:
        """
        Draw detection boxes on an image.

        Args:
            image: Input image (BGR format).
            detections: List of detection results.

        Returns:
            Image with drawn detections.
        """
        output = image.copy()

        for det in detections:
            x1, y1, x2, y2 = map(int, det["bbox"])
            label = det["label"]
            conf = det["confidence"]

            # Draw box
            cv2.rectangle(output, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # Draw label
            text = f"{label}: {conf:.2f}"
            (text_w, text_h), baseline = cv2.getTextSize(
                text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            cv2.rectangle(
                output,
                (x1, y1 - text_h - baseline),
                (x1 + text_w, y1),
                (0, 255, 0),
                -1,
            )
            cv2.putText(
                output,
                text,
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                1,
            )

        return output
