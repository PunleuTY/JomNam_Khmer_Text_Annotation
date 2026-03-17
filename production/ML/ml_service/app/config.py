"""Application configuration settings."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"


class Settings:
    """Application settings loaded from environment variables."""

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Model paths
    YOLO_MODEL_PATH: Path = MODELS_DIR / os.getenv("YOLO_MODEL_NAME", "best.pt")
    TESSERACT_DATA_PATH: str = os.getenv("TESSERACT_DATA_PATH", "")

    # Inference settings
    YOLO_CONFIDENCE: float = float(os.getenv("YOLO_CONFIDENCE", "0.5"))
    YOLO_IOU_THRESHOLD: float = float(os.getenv("YOLO_IOU_THRESHOLD", "0.45"))
    MAX_IMAGE_SIZE: int = int(os.getenv("MAX_IMAGE_SIZE", "4096"))

    # CORS
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
    ).split(",")

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
