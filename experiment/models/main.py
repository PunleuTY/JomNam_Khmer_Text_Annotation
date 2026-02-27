from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from doctr.models import ocr_predictor
from doctr.io import DocumentFile
from tqdm import tqdm
import time
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np

# ============= Initial Classes =============
class Image(BaseModel):
    path: str
    mode: str = "word"  # "word" or "line"

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    text: str
    confidence: float

# ============= Setup FastAPI and Load Model =============
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading OCR model...")
model = ocr_predictor(pretrained=True)
print("Model loaded successfully.")

# ============= Helper Functions =============
def convert_to_absolute_boxes(result, image_shapes: list, original_width: int, original_height: int, detection_mode: str = "word") -> List[Dict[str, Any]]:
    """Convert DocTR relative coordinates to absolute pixel coordinates.

    Args:
        result: OCR result from DocTR
        image_shapes: List of (height, width) tuples for each page as loaded by DocTR
        original_width: Original image width
        original_height: Original image height
        detection_mode: "word" for word-level boxes, "line" for line-level boxes
    """
    boxes = []

    # Iterate through pages
    for page_idx, page in enumerate(result.pages):
        doc_height, doc_width = image_shapes[page_idx]

        # Iterate through blocks
        for block in page.blocks:
            # Iterate through lines
            for line in block.lines:
                if detection_mode == "line":
                    # Merge all words in the line into one box
                    all_word_geometries = [word.geometry for word in line.words]
                    if not all_word_geometries:
                        continue
                    
                    # Find min/max coordinates across all words
                    xmin_rel = min(g[0][0] for g in all_word_geometries)
                    ymin_rel = min(g[0][1] for g in all_word_geometries)
                    xmax_rel = max(g[1][0] for g in all_word_geometries)
                    ymax_rel = max(g[1][1] for g in all_word_geometries)
                    
                    # Combine text from all words
                    line_text = " ".join(word.value for word in line.words if word.value)
                    
                    # Average confidence
                    avg_confidence = sum(word.confidence for word in line.words) / len(line.words) if line.words else 0.0
                    
                    # Convert to absolute coordinates
                    xmin = int(xmin_rel * original_width)
                    ymin = int(ymin_rel * original_height)
                    xmax = int(xmax_rel * original_width)
                    ymax = int(ymax_rel * original_height)
                    
                    boxes.append({
                        "x": xmin,
                        "y": ymin,
                        "width": xmax - xmin,
                        "height": ymax - ymin,
                        "text": line_text,
                        "confidence": float(avg_confidence)
                    })
                else:
                    # Word-level detection
                    for word in line.words:
                        geometry = word.geometry
                        (xmin_rel, ymin_rel), (xmax_rel, ymax_rel) = geometry

                        xmin = int(xmin_rel * original_width)
                        ymin = int(ymin_rel * original_height)
                        xmax = int(xmax_rel * original_width)
                        ymax = int(ymax_rel * original_height)

                        text = word.value if word.value else ""
                        confidence = float(word.confidence) if word.confidence else 0.0

                        boxes.append({
                            "x": xmin,
                            "y": ymin,
                            "width": xmax - xmin,
                            "height": ymax - ymin,
                            "text": text,
                            "confidence": confidence
                        })

    return boxes

# === POST ===
@app.post("/detect")
def detect_text(image: Image):
    try:
        # Resolve the image path
        # If path starts with /api/upload/images/, it's from the frontend
        image_path = image.path
        if image.path.startswith("/api/upload/images/"):
            # Get filename and look in frontend upload directory
            filename = image.path.replace("/api/upload/images/", "")
            # Try relative path from models directory to frontend upload
            import os
            frontend_upload_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "upload", "images")
            image_path = os.path.join(frontend_upload_dir, filename)
            print(f"Loading image from: {image_path}")

        # Load image using PIL to get original dimensions
        from PIL import Image as PILImage
        pil_img = PILImage.open(image_path)
        original_width, original_height = pil_img.size
        print(f"Original image size: {original_width} x {original_height}")

        # Load image - DocumentFile.from_images returns a list of numpy arrays
        doc = DocumentFile.from_images(image_path)

        # Get image shapes from the loaded document (may be resized by DocTR)
        image_shapes = [img.shape[:2] for img in doc]
        doc_height, doc_width = image_shapes[0]
        print(f"DocTR loaded size: {doc_width} x {doc_height}")

        # Calculate scale factors
        scale_x = original_width / doc_width
        scale_y = original_height / doc_height
        print(f"Scale factors: x={scale_x:.2f}, y={scale_y:.2f}")

        # Simulate a progress bar (just visual feedback)
        print("Running OCR...")
        for _ in tqdm(range(5), desc="Processing", ncols=100):
            time.sleep(0.3)

        # Run OCR - result is a Document object with .pages
        result = model(doc)
        print(f"OCR result type: {type(result)}, number of pages: {len(result.pages)}")

        # Convert bounding boxes to absolute coordinates using original image size
        boxes = convert_to_absolute_boxes(result, image_shapes, original_width, original_height, image.mode)
        print(f"Detected {len(boxes)} boxes (mode: {image.mode})")

        return {
            "success": True,
            "image_width": original_width,
            "image_height": original_height,
            "boxes": boxes
        }
    except Exception as e:
        print(f"Error during detection: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "boxes": []
        }
        
# ============= Method =============
# === GET === 
@app.get("/")
def read_root():
    return {"message": "Server is running"}
        
# === POST ===
@app.post("/test-detect")
def detect_text(image: Image):
    doc = DocumentFile.from_images(image.path)

    # Simulate a progress bar (just visual feedback)
    print("Running OCR...")
    for _ in tqdm(range(5), desc="Processing", ncols=100):
        time.sleep(0.3)

    # Run OCR
    result = model(doc)

    # Visualize the result
    result.show()

