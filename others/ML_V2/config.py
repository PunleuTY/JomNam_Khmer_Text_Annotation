import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Absolute root directory of ML_V3
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths
YOLO_MODEL_PATH = os.path.join(ROOT_DIR, "../best.pt")
OUTPUT_IMAGE_PATH = os.path.join(ROOT_DIR, "../detected_khmer_text_model.jpg")
OUTPUT_JSON_PATH = os.path.join(ROOT_DIR, "../detected_khmer_text_model_coordinates.json")
OUTPUT_TEXT_PATH = os.path.join(ROOT_DIR, "../extracted_khmer_text_results.txt")
RESULTS_JSON_PATH = os.path.join(ROOT_DIR, "../extraction_results.json")

# Tesseract settings
TESSERACT_CMD = r"/opt/homebrew/bin/tesseract"
TESSERACT_LANG = "khm"
TESSERACT_CONFIG = r"--psm 6 --oem 3"

# API Key
API_KEY = os.getenv("API_KEY")
USE_API = API_KEY
if not API_KEY:
    raise ValueError("❌ API_KEY is not set. Please check your .env file.")
