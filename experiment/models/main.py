from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from doctr.models import ocr_predictor
from doctr.io import DocumentFile
from tqdm import tqdm
import time
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
import io, base64, re, os
from PIL import Image as PILImage
import pytesseract
from pathlib import Path
from dotenv import load_dotenv
import cv2

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

# ---- Configure Tesseract ----
# Windows path (default installation location)
# pytesseract.pytesseract.tesseract_cmd = r"D:\Pytesseract\tesseract.exe"
# os.environ["TESSDATA_PREFIX"] = r"D:\Pytesseract\tessdata"

# Assuming this file is in experiment/models/
SCRIPT_DIR = Path(__file__).resolve().parent
# Try loading from same directory first, then parent directory
dotenv_path = SCRIPT_DIR / ".env"
if not dotenv_path.exists():
    dotenv_path = SCRIPT_DIR.parent.parent / ".env"

# Debug: Print the path being loaded
print(f"[DEBUG] Looking for .env at: {dotenv_path}")
print(f"[DEBUG] .env exists: {dotenv_path.exists()}")

load_dotenv(dotenv_path=dotenv_path)

TESSERACT_CMD = os.getenv("TESSERACT_CMD")
TESSERACT_TESSDATA_PREFIX = os.getenv("TESSERACT_TESSDATA_PREFIX")

if TESSERACT_CMD and TESSERACT_TESSDATA_PREFIX:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
    os.environ["TESSDATA_PREFIX"] = TESSERACT_TESSDATA_PREFIX
    print("Tesseract configured successfully.")
    
    # Check available languages
    try:
        langs = pytesseract.get_languages(config='')
        print(f"Tesseract available languages: {langs}")
        if 'khm' not in langs:
            print("WARNING: Khmer language (khm) not found in Tesseract!")
            print("Please install Khmer language data:")
            print("1. Re-run Tesseract installer")
            print("2. Select 'Additional Language Data'")
            print("3. Check 'Khmer' language pack")
        else:
            print("✓ Khmer language is available in Tesseract")
    except Exception as e:
        print(f"Could not check Tesseract languages: {e}")
else:
    print("Warning: Tesseract environment variables not found. Please set TESSERACT_CMD and TESSERACT_TESSDATA_PREFIX in .env file.")

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
                        "text": "",  # Disabled text extraction
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
                            "text": "",  # Disabled text extraction
                            "confidence": confidence
                        })

    return boxes


def resolve_image_path(image_path: str) -> str:
    """Resolve image path from frontend URL to local file path."""
    if image_path.startswith("/api/upload/images/"):
        filename = image_path.replace("/api/upload/images/", "")
        frontend_upload_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "upload", "images")
        resolved_path = os.path.join(frontend_upload_dir, filename)
        print(f"Resolving path: {resolved_path}")
        return resolved_path
    return image_path


def run_detection(image_path: str, mode: str, extract_text: bool = False) -> Dict[str, Any]:
    """Run DocTR detection and optionally extract text with Tesseract.

    Args:
        image_path: Path to the image file
        mode: "word" or "line" detection mode
        extract_text: If True, extract text using Tesseract; if False, return empty text

    Returns:
        Dictionary with success status, image dimensions, and detected boxes
    """
    # Resolve path
    resolved_path = resolve_image_path(image_path)

    # Load image using PIL to get original dimensions
    pil_img = PILImage.open(resolved_path)
    original_width, original_height = pil_img.size
    print(f"Original image size: {original_width} x {original_height}")

    # Load image - DocumentFile.from_images returns a list of numpy arrays
    doc = DocumentFile.from_images(resolved_path)

    # Get image shapes from the loaded document (may be resized by DocTR)
    image_shapes = [img.shape[:2] for img in doc]
    doc_height, doc_width = image_shapes[0]
    print(f"DocTR loaded size: {doc_width} x {doc_height}")

    # Calculate scale factors
    scale_x = original_width / doc_width
    scale_y = original_height / doc_height
    print(f"Scale factors: x={scale_x:.2f}, y={scale_y:.2f}")

    # Simulate a progress bar (just visual feedback)
    print("Running DocTR OCR for detection...")
    for _ in tqdm(range(5), desc="Processing", ncols=100):
        time.sleep(0.3)

    # Run OCR - result is a Document object with .pages
    result = model(doc)
    print(f"OCR result type: {type(result)}, number of pages: {len(result.pages)}")

    # Convert bounding boxes to absolute coordinates using original image size
    boxes = convert_to_absolute_boxes(result, image_shapes, original_width, original_height, mode)
    print(f"Detected {len(boxes)} boxes from DocTR (mode: {mode})")

    # Optionally extract text from each box using Tesseract
    if extract_text:
        print(f"Extracting text from {len(boxes)} boxes using Tesseract...")
        for idx, box in enumerate(boxes):
            box_coords = (
                box["x"],
                box["y"],
                box["x"] + box["width"],
                box["y"] + box["height"]
            )
            extracted_text, confidence = extract_text_with_tesseract(pil_img, box_coords)
            box["text"] = extracted_text
            box["confidence"] = confidence

            if extracted_text:
                print(f"  Box {idx + 1}: '{extracted_text}' (confidence: {confidence:.2f})")
            else:
                print(f"  Box {idx + 1}: [no text extracted]")
        print(f"Text extraction completed for all {len(boxes)} boxes")
    else:
        print("Skipping text extraction (detection only)")

    return {
        "success": True,
        "image_width": original_width,
        "image_height": original_height,
        "boxes": boxes
    }

def preprocess_for_ocr(pil_image):
    """Preprocess image for OCR - optimized for Khmer script.
    
    Khmer script has complex stacked characters that need careful preprocessing.
    
    Args:
        pil_image: PIL Image object
        
    Returns:
        Preprocessed PIL Image
    """
    # Convert to grayscale
    gray = np.array(pil_image.convert("L"))
    
    # Apply light denoising - too much will destroy Khmer subscript characters
    denoised = cv2.fastNlMeansDenoising(gray, h=5, templateWindowSize=7, searchWindowSize=21)
    
    # Use Otsu's thresholding but with inversion check
    # Some images have white text on dark background
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Check if we need to invert (text should be black on white for Tesseract)
    # Count white vs black pixels
    white_pixels = np.sum(thresh == 255)
    total_pixels = thresh.size
    if white_pixels / total_pixels < 0.5:
        # More than half is dark - likely inverted, so invert back
        thresh = cv2.bitwise_not(thresh)
    
    return PILImage.fromarray(thresh)

def extract_text_with_tesseract(pil_image, box_coords):
    """Extract text from a cropped image region using Tesseract.
    Optimized for Khmer script with multiple PSM modes.
    
    Args:
        pil_image: PIL Image object (full image)
        box_coords: Tuple of (x1, y1, x2, y2) coordinates
        
    Returns:
        Tuple of (extracted_text, confidence)
    """
    x1, y1, x2, y2 = box_coords
    
    # Validate coordinates
    img_width, img_height = pil_image.size
    x1 = max(0, min(x1, img_width))
    y1 = max(0, min(y1, img_height))
    x2 = max(0, min(x2, img_width))
    y2 = max(0, min(y2, img_height))
    
    if x2 <= x1 or y2 <= y1:
        return "", 0.0
    
    # Crop the region
    cropped = pil_image.crop((x1, y1, x2, y2))
    
    # Skip if too small
    if cropped.size[0] < 8 or cropped.size[1] < 8:
        return "", 0.0
    
    # Preprocess for OCR
    preprocessed = preprocess_for_ocr(cropped)
    
    # DEBUG: Save cropped and preprocessed images for debugging
    # Uncomment these lines to debug OCR issues:
    DEBUG_SAVE = True  # Set to False in production
    if DEBUG_SAVE:
        import os
        debug_dir = "D:/debug_ocr"
        os.makedirs(debug_dir, exist_ok=True)
        debug_idx = int(time.time() * 1000) % 100000
        box_num = int(time.time() * 1000) % 1000
        try:
            cropped.save(f"{debug_dir}/cropped_{box_num:03d}_{debug_idx}.png")
            preprocessed.save(f"{debug_dir}/preprocessed_{box_num:03d}_{debug_idx}.png")
            print(f"  [DEBUG] Saved images: cropped_{box_num:03d}_{debug_idx}.png")
        except Exception as e:
            print(f"  [DEBUG] Failed to save debug images: {e}")
    
    try:
        best_text = ""
        best_confidence = 0.0
        
        # Try different PSM modes and pick the best result
        # PSM 6: Assume a single uniform block of text
        # PSM 7: Assume a single text line
        # PSM 10: Assume a single character
        # PSM 13: Raw line (treat as a single text line, ignoring any code that is specific to the Latin script)
        psm_modes = [
            ('--psm 7 --oem 3', "Single line"),
            ('--psm 6 --oem 3', "Uniform block"),
            ('--psm 13 --oem 1', "Raw line LSTM"),
        ]
        
        for config, mode_name in psm_modes:
            try:
                raw_text = pytesseract.image_to_string(preprocessed, lang="khm", config=config)
                text = re.sub(r"\s+", " ", raw_text).strip()
                
                # Skip if result is mostly non-Khmer characters (likely garbage)
                if text:
                    khmer_chars = sum(1 for c in text if '\u1780' <= c <= '\u17FF')
                    total_chars = len(text.replace(' ', ''))
                    
                    # If less than 30% Khmer characters and has random symbols, skip
                    if total_chars > 0 and khmer_chars / total_chars < 0.3:
                        if any(c in text for c in ['=', '/', '-', '_', '|']):
                            continue
                    
                    # Get confidence
                    try:
                        data = pytesseract.image_to_data(
                            preprocessed, 
                            lang="khm",
                            config=config,
                            output_type=pytesseract.Output.DICT
                        )
                        confs = [int(c) for c in data['conf'] if int(c) > 0]
                        confidence = sum(confs) / len(confs) / 100.0 if confs else 0.5
                    except:
                        confidence = 0.5
                    
                    # Keep the result with highest confidence
                    if confidence > best_confidence:
                        best_text = text
                        best_confidence = confidence
                        
            except Exception as e:
                continue
        
        if best_text:
            print(f"  [Tesseract Khmer] Text: '{best_text}' (conf: {best_confidence:.2f})")
            return best_text, best_confidence
            
        return "", 0.0
        
    except Exception as e:
        print(f"Tesseract OCR error: {e}")
        return "", 0.0

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
        print("Running DocTR OCR for detection...")
        for _ in tqdm(range(5), desc="Processing", ncols=100):
            time.sleep(0.3)

        # Run OCR - result is a Document object with .pages
        result = model(doc)
        print(f"OCR result type: {type(result)}, number of pages: {len(result.pages)}")

        # Convert bounding boxes to absolute coordinates using original image size
        boxes = convert_to_absolute_boxes(result, image_shapes, original_width, original_height, image.mode)
        print(f"Detected {len(boxes)} boxes from DocTR (mode: {image.mode})")

        # Extract text from each box using Tesseract
        print(f"Extracting text from {len(boxes)} boxes using Tesseract...")
        for idx, box in enumerate(boxes):
            box_coords = (
                box["x"],
                box["y"],
                box["x"] + box["width"],
                box["y"] + box["height"]
            )
            extracted_text, confidence = extract_text_with_tesseract(pil_img, box_coords)
            box["text"] = extracted_text
            box["confidence"] = confidence
            
            if extracted_text:
                print(f"  Box {idx + 1}: '{extracted_text}' (confidence: {confidence:.2f})")
            else:
                print(f"  Box {idx + 1}: [no text extracted]")
        
        print(f"Text extraction completed for all {len(boxes)} boxes")

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


@app.post("/detect-only")
def detect_only(image: Image):
    """Detect text regions using DocTR only (no Tesseract extraction)."""
    try:
        result = run_detection(image.path, image.mode, extract_text=False)
        return result
    except Exception as e:
        print(f"Error during detection: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "boxes": []
        }


@app.post("/detect-and-extract")
def detect_and_extract(image: Image):
    """Detect text regions using DocTR and extract text using Tesseract."""
    try:
        result = run_detection(image.path, image.mode, extract_text=True)
        return result
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


# === POST: Extract text from uploaded image ===
@app.post("/extract-text")
async def extract_text_endpoint(
    image: UploadFile = File(...),
    model_name: str = Form("Tesseract"),
    font: str = Form("Khmer"),
):
    """Accept an uploaded image, run DocTR detection + Tesseract OCR, return full text."""
    start_time = time.time()
    try:
        # Read uploaded file into memory
        contents = await image.read()
        pil_img = PILImage.open(io.BytesIO(contents)).convert("RGB")
        original_width, original_height = pil_img.size
        print(f"[extract-text] Image: {image.filename}, size: {original_width}x{original_height}, model: {model_name}")

        # Save to a temp file for DocTR (it needs a file path)
        import tempfile
        suffix = os.path.splitext(image.filename or "img.jpg")[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            # Run DocTR detection
            doc = DocumentFile.from_images(tmp_path)
            image_shapes = [img.shape[:2] for img in doc]
            result = model(doc)

            # Convert to absolute boxes (line mode for full text extraction)
            boxes = convert_to_absolute_boxes(result, image_shapes, original_width, original_height, "line")
            print(f"[extract-text] Detected {len(boxes)} text regions")

            # Extract text from each box using Tesseract
            all_texts = []
            for idx, box in enumerate(boxes):
                box_coords = (
                    box["x"],
                    box["y"],
                    box["x"] + box["width"],
                    box["y"] + box["height"]
                )
                extracted, confidence = extract_text_with_tesseract(pil_img, box_coords)
                if extracted:
                    all_texts.append(extracted)
                    print(f"  Region {idx+1}: '{extracted}' (conf: {confidence:.2f})")

            full_text = "\n".join(all_texts) if all_texts else ""
            elapsed = (time.time() - start_time) * 1000  # ms
            print(f"[extract-text] Done in {elapsed:.0f}ms, extracted {len(all_texts)} text lines")

            return {
                "success": True,
                "text": full_text,
                "inference_speed": round(elapsed, 2),
                "regions": len(boxes),
            }
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        print(f"[extract-text] Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "text": "",
            "error": str(e),
            "inference_speed": 0,
        }


# === POST: Evaluate extracted text against ground truth ===
class EvaluateRequest(BaseModel):
    extracted_text: str
    ground_truth: str
    model_name: str = "Tesseract"

@app.post("/evaluate")
def evaluate_endpoint(req: EvaluateRequest):
    """Compute CER and WER between extracted text and ground truth."""
    start_time = time.time()
    try:
        extracted = req.extracted_text
        ground_truth = req.ground_truth

        # Character Error Rate (CER)
        cer = _edit_distance(list(extracted), list(ground_truth)) / max(len(ground_truth), 1)

        # Word Error Rate (WER)
        ext_words = extracted.split()
        gt_words = ground_truth.split()
        wer = _edit_distance(ext_words, gt_words) / max(len(gt_words), 1)

        elapsed = (time.time() - start_time) * 1000
        return {
            "success": True,
            "cer": round(min(cer, 1.0), 4),
            "wer": round(min(wer, 1.0), 4),
            "inference_speed": round(elapsed, 2),
        }
    except Exception as e:
        print(f"[evaluate] Error: {e}")
        return {"success": False, "cer": 0, "wer": 0, "inference_speed": 0, "error": str(e)}


def _edit_distance(seq1, seq2) -> int:
    """Compute Levenshtein edit distance between two sequences."""
    m, n = len(seq1), len(seq2)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            temp = dp[j]
            if seq1[i - 1] == seq2[j - 1]:
                dp[j] = prev
            else:
                dp[j] = 1 + min(prev, dp[j], dp[j - 1])
            prev = temp
    return dp[n]


# ============= Run Server =============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

