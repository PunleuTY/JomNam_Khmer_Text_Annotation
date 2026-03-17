"""Tesseract OCR model wrapper."""

import logging
import os
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import pytesseract
from PIL import Image

from app.models.base import BaseModel

logger = logging.getLogger(__name__)


class TesseractModel(BaseModel):
    """Tesseract OCR model for text extraction."""

    def __init__(
        self,
        tesseract_data_path: str = "",
        lang: str = "eng",
        psm: int = pytesseract.PSM.AUTO,
    ):
        """
        Initialize Tesseract model.

        Args:
            tesseract_data_path: Path to Tesseract data folder (tessdata).
            lang: Language(s) for OCR (e.g., 'eng', 'khm', 'eng+khm').
            psm: Page segmentation mode.
        """
        super().__init__(Path(tesseract_data_path) if tesseract_data_path else Path())
        self.lang = lang
        self.psm = psm
        self._tesseract_initialized = False

        if tesseract_data_path:
            pytesseract.pytesseract.tesseract_cmd = str(
                Path(tesseract_data_path).parent / "tesseract.exe"
            )
            pytesseract.pytesseract.tesseract_cmd = str(
                Path(tesseract_data_path).parent.parent / "tesseract.exe"
            )

    def load(self) -> None:
        """Initialize Tesseract configuration."""
        if self._is_loaded:
            logger.warning("Tesseract model already loaded")
            return

        try:
            if self.tesseract_data_path and self.tesseract_data_path.exists():
                os.environ["TESSDATA_PREFIX"] = str(self.tesseract_data_path)
                logger.info(
                    f"Tesseract data path set to {self.tesseract_data_path}"
                )

            # Verify Tesseract is available
            pytesseract.get_tesseract_version()
            self._is_loaded = True
            self._tesseract_initialized = True
            logger.info("Tesseract initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Tesseract: {e}")
            raise

    def predict(self, image_data: np.ndarray) -> dict[str, Any]:
        """
        Run OCR on an image.

        Args:
            image_data: Image as numpy array.

        Returns:
            Dictionary with text, confidence, and bounding boxes.
        """
        if not self._is_loaded:
            raise RuntimeError("Tesseract not initialized. Call load() first.")

        try:
            # Convert BGR to RGB for PIL
            image_rgb = cv2.cvtColor(image_data, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(image_rgb)

            # Get OCR data with bounding boxes
            data = pytesseract.image_to_data(
                pil_image,
                lang=self.lang,
                output_type=pytesseract.Output.DICT,
                config=f"--psm {self.psm}",
            )

            # Extract valid detections
            detections = []
            n_boxes = len(data["text"])
            for i in range(n_boxes):
                text = data["text"][i].strip()
                if text and int(data["conf"][i]) > 0:
                    detections.append(
                        {
                            "text": text,
                            "confidence": int(data["conf"][i]),
                            "bbox": [
                                data["left"][i],
                                data["top"][i],
                                data["left"][i] + data["width"][i],
                                data["top"][i] + data["height"][i],
                            ],
                        }
                    )

            # Full text output
            full_text = pytesseract.image_to_string(
                pil_image,
                lang=self.lang,
                config=f"--psm {self.psm}",
            )

            return {
                "text": full_text,
                "detections": detections,
                "language": self.lang,
            }

        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            raise

    def predict_with_image(self, image_path: str | Path) -> dict[str, Any]:
        """
        Run OCR on an image file.

        Args:
            image_path: Path to the image file.

        Returns:
            Dictionary with OCR results.
        """
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")
        return self.predict(image)

    def unload(self) -> None:
        """Unload Tesseract (reset initialization)."""
        self._is_loaded = False
        self._tesseract_initialized = False
        logger.info("Tesseract unloaded")
