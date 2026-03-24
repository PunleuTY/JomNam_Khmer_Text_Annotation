"""
Gemini Vision OCR Module for Khmer Text Recognition
Uses Google's Gemini Vision API to extract text from images.

Requires: pip install google-genai
"""

import os
from pathlib import Path
from typing import Tuple, Dict, Any
from PIL import Image as PILImage
from dotenv import load_dotenv

# Load environment variables
# .env is in ML_V4/models/.env — try models/ first, then ML_V4/, then parent
_base = Path(__file__).resolve().parent.parent  # ML_V4/
for _candidate in [_base / "models" / ".env", _base / ".env", _base.parent / ".env"]:
    if _candidate.exists():
        load_dotenv(dotenv_path=_candidate)
        break

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# GEMINI_API_KEY = ""

# Stable Gemini model name
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
# GEMINI_MODEL = "gemini-2.0-flash"

class GeminiOCR:
    """
    Gemini Vision API wrapper for text extraction and recognition.
    Supports both Khmer and English text detection.
    Uses the new google-genai Client API.
    """

    def __init__(self, api_key: str = None):
        self.api_key = api_key or GEMINI_API_KEY
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY not found in environment variables. "
                "Please set GEMINI_API_KEY in .env file or pass it as argument."
            )

        try:
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
            self.model_name = GEMINI_MODEL
            print(f"✓ Gemini Vision API configured (model: {GEMINI_MODEL})")
        except ImportError:
            raise ImportError(
                "google-genai not installed. "
                "Install with: pip install google-genai"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to configure Gemini API: {e}")

    def _call_gemini(self, pil_image: PILImage.Image) -> str:
        """Send a PIL image to Gemini and return extracted text."""
        from google.genai import types

        prompt = (
            "Extract all visible text from this image. "
            "Focus especially on Khmer script text if present. "
            "Return ONLY the extracted text, nothing else. "
            "Do not add any explanation, formatting, or markdown."
        )

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[prompt, pil_image],
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=1024,
            ),
        )

        if response and response.text:
            return response.text.strip()
        return ""

    def extract_text_from_image(
        self, image_path: str, region_coords: Tuple[int, int, int, int] = None
    ) -> Tuple[str, float]:
        """Extract text from an image file using Gemini Vision."""
        try:
            pil_image = PILImage.open(image_path).convert("RGB")

            if region_coords:
                x1, y1, x2, y2 = region_coords
                pil_image = pil_image.crop((x1, y1, x2, y2))

            extracted_text = self._call_gemini(pil_image)
            confidence = self._estimate_confidence(extracted_text, pil_image)

            if extracted_text:
                preview = extracted_text[:60].replace("\n", " ")
                print(f"  [Gemini] Text: '{preview}' (conf: {confidence:.2f})")

            return extracted_text, confidence

        except Exception as e:
            print(f"Gemini OCR error: {e}")
            return "", 0.0

    def extract_text_from_pil_image(
        self, pil_image: PILImage.Image, region_coords: Tuple[int, int, int, int] = None
    ) -> Tuple[str, float]:
        """Extract text from a PIL Image object directly."""
        try:
            img = pil_image.convert("RGB")
            if region_coords:
                x1, y1, x2, y2 = region_coords
                img = img.crop((x1, y1, x2, y2))

            extracted_text = self._call_gemini(img)
            confidence = self._estimate_confidence(extracted_text, img)

            if extracted_text:
                preview = extracted_text[:60].replace("\n", " ")
                print(f"  [Gemini] Text: '{preview}' (conf: {confidence:.2f})")

            return extracted_text, confidence

        except Exception as e:
            print(f"Gemini OCR error (PIL): {e}")
            return "", 0.0

    def extract_text_batch(
        self, image_regions: list
    ) -> list:
        """
        Extract text from multiple image regions.

        Args:
            image_regions: List of dicts with 'path' and 'coords' keys

        Returns:
            List of dicts with 'text' and 'confidence' keys
        """
        results = []
        for region in image_regions:
            try:
                path = region.get("path")
                coords = region.get("coords")
                text, conf = self.extract_text_from_image(path, coords)
                results.append({
                    "text": text,
                    "confidence": conf,
                    "path": path
                })
            except Exception as e:
                print(f"Error processing region {region.get('path')}: {e}")
                results.append({
                    "text": "",
                    "confidence": 0.0,
                    "path": region.get("path")
                })
        return results

    def detect_and_extract(
        self, image_path: str, detection_boxes: list
    ) -> Dict[str, Any]:
        """
        Extract text from detected regions in an image.

        Args:
            image_path: Path to the image file
            detection_boxes: List of detection box dicts with x, y, width, height keys

        Returns:
            Dict with detected regions and extracted text
        """
        pil_image = PILImage.open(image_path)
        results = []

        for idx, box in enumerate(detection_boxes):
            x = box.get("x", 0)
            y = box.get("y", 0)
            width = box.get("width", 0)
            height = box.get("height", 0)

            if width <= 0 or height <= 0:
                continue

            coords = (x, y, x + width, y + height)
            text, confidence = self.extract_text_from_pil_image(pil_image, coords)

            results.append({
                "box": box,
                "text": text,
                "confidence": confidence,
                "region_id": idx
            })

        return {
            "image_path": image_path,
            "total_regions": len(detection_boxes),
            "recognized_regions": len(results),
            "regions": results
        }

    def _estimate_confidence(self, text: str, image: PILImage.Image) -> float:
        """
        Estimate confidence score based on extracted text quality.

        Args:
            text: Extracted text
            image: PIL Image object

        Returns:
            Confidence score between 0.0 and 1.0
        """
        if not text:
            return 0.0

        # Base confidence: text length ratio
        text_length = len(text)
        confidence = min(text_length / 50, 1.0) * 0.7  # Up to 70%

        # Bonus for special characters (Khmer is more likely to have specific chars)
        khmer_chars = sum(1 for c in text if ord(c) >= 0x1780 and ord(c) <= 0x17FF)
        if text_length > 0:
            khmer_ratio = khmer_chars / text_length
            confidence += khmer_ratio * 0.3  # Up to 30% bonus for Khmer chars

        return min(confidence, 1.0)

    def health_check(self) -> Dict[str, Any]:
        """Check if Gemini API is accessible."""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents="Reply with exactly: OK",
            )
            return {
                "status": "healthy",
                "api_key_valid": True,
                "model": self.model_name,
            }
        except Exception as e:
            return {
                "status": "error",
                "api_key_valid": False,
                "error": str(e),
            }


# Convenience function for single-image processing
def extract_text_gemini(
    image_path: str,
    api_key: str = None,
    region_coords: Tuple[int, int, int, int] = None
) -> Tuple[str, float]:
    """
    Convenience function to extract text using Gemini.

    Args:
        image_path: Path to image file
        api_key: Optional API key (uses env var if not provided)
        region_coords: Optional (x1, y1, x2, y2) coordinates

    Returns:
        Tuple of (text, confidence)
    """
    try:
        ocr = GeminiOCR(api_key=api_key)
        return ocr.extract_text_from_image(image_path, region_coords)
    except Exception as e:
        print(f"Gemini extraction failed: {e}")
        return "", 0.0
