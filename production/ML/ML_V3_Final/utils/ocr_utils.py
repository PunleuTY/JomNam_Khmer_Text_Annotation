import io, base64, re, numpy as np, cv2
from PIL import Image
import pytesseract
import os
from pathlib import Path
from dotenv import load_dotenv


# ---- Configure Tesseract ----
# Windows path (default installation location)
# pytesseract.pytesseract.tesseract_cmd = r"D:\Pytesseract\tesseract.exe"
# os.environ["TESSDATA_PREFIX"] = r"D:\Pytesseract\tessdata"

# Assuming this file is in root/ML/ml_v3_final/utils/
SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent.parent  
dotenv_path = ML_DIR / ".env"
load_dotenv(dotenv_path=dotenv_path)
# # ---- Configure Tesseract ----
TESSERACT_CMD = os.getenv("TESSERACT_CMD")
TESSERACT_TESSDATA_PREFIX = os.getenv("TESSERACT_TESSDATA_PREFIX")

if not TESSERACT_CMD or not TESSERACT_TESSDATA_PREFIX:
    raise RuntimeError(
        f"Missing Tesseract environment variables. "
        f"TESSERACT_CMD={TESSERACT_CMD!r}, TESSERACT_TESSDATA_PREFIX={TESSERACT_TESSDATA_PREFIX!r}"
    )

pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
os.environ["TESSDATA_PREFIX"] = TESSERACT_TESSDATA_PREFIX 


# ---- PreProcessing for OCR ----
'''This first function for cleaning image before sending to OCR engine
    1. Convert to Grayscale -> reduce noise from color channels
    2. Denoise image using Non-local Means Denoising --> smoothing background, sharpening text
    3. Apply Otsu's thresholding ---> to get binary image and make text more distinct in black/white 
'''
def preprocess_for_ocr(pil_image):
    gray = np.array(pil_image.convert("L"))
    denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return Image.fromarray(thresh)

'''Processing User-defined Boxes : Align with Segmentation step in OCR Pipeline
    - Instead of sending whole image to OCR engine, we will crop each box
    and send to OCR engine based on the users drawing text box region on image
    - This helps to improve accuracy, reduce noise from irrelevant areas, and handle complex layouts like tables signs,..
'''
def process_user_boxes(image_bytes, boxes):
    print(f"\n[OCR DEBUG] Starting text extraction...")
    print(f"[OCR DEBUG] Number of boxes to process: {len(boxes)}")
    
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    print(f"[OCR DEBUG] Image loaded - Size: {pil_image.size}, Mode: {pil_image.mode}")
    
    detections = []

    for idx, box in enumerate(boxes):
        print(f"\n[OCR DEBUG] Processing box {idx + 1}/{len(boxes)}: {box}")
        if not (isinstance(box, list) and len(box) == 4):
            print(f"[OCR DEBUG] ✗ Box {idx + 1} skipped - Invalid format (not a list of 4 values)")
            continue
        
        # Ensure coordinates are valid integers
        try:
            x1, y1, x2, y2 = map(int, box)
            print(f"[OCR DEBUG] Box coordinates: x1={x1}, y1={y1}, x2={x2}, y2={y2}")
            
            # Validate coordinates are within image bounds
            img_width, img_height = pil_image.size
            x1 = max(0, min(x1, img_width))
            y1 = max(0, min(y1, img_height))
            x2 = max(0, min(x2, img_width))
            y2 = max(0, min(y2, img_height))
            
            # Ensure box has valid dimensions
            if x2 <= x1 or y2 <= y1:
                print(f"[OCR DEBUG] ✗ Box {idx + 1} skipped - Invalid dimensions (width or height <= 0)")
                continue
                
        except (ValueError, TypeError) as e:
            print(f"[OCR DEBUG] ✗ Box {idx + 1} skipped - Coordinate conversion error: {e}")
            continue
        
        cropped = pil_image.crop((x1, y1, x2, y2))
        cropped_size = cropped.size
        print(f"[OCR DEBUG] Cropped region size: {cropped_size}")
        
        preprocessed = preprocess_for_ocr(cropped)
        print(f"[OCR DEBUG] Image preprocessed successfully")
        
        try:
            # Text Recognition and Extraction Stages using Tesseract OCR with Khmer language
            # Using regex to clean up whitespace characters after passing the cleaned cropping image into Tesseract
            raw_text = pytesseract.image_to_string(preprocessed, lang="khm")
            text = re.sub(r"\s+", " ", raw_text).strip()
            print(f"[OCR DEBUG] ✓ Text extracted: '{text}' (length: {len(text)})")
        except Exception as e:
            print(f"[OCR DEBUG] ✗ OCR Error for box {idx + 1}: {str(e)}")
            text = ""

        buffer = io.BytesIO()
        preprocessed.save(buffer, format="PNG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        ''' Post-Processing & Output Packaging steps of OCR pipeline 
            - Each detected text box is represented as a dictionary with:
                - box_coordinates: The coordinates of the bounding box
                - extracted_text: The text extracted from the cropped image
                - cropped_image_base64: The base64-encoded string of the cropped image
        '''
        detections.append({
            "box_coordinates": [x1, y1, x2, y2],
            "extracted_text": text,
            "cropped_image_base64": img_base64
        })
    
    print(f"\n[OCR DEBUG] ===== EXTRACTION COMPLETE =====")
    print(f"[OCR DEBUG] Total boxes processed: {len(detections)}/{len(boxes)}")
    print(f"[OCR DEBUG] Boxes with text: {sum(1 for d in detections if d['extracted_text'])}")
    print(f"[OCR DEBUG] Empty results: {sum(1 for d in detections if not d['extracted_text'])}")
    
    return detections

