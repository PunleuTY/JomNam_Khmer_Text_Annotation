import io
import os
import base64
import re
from fastapi import HTTPException
from PIL import Image
import numpy as np
from ultralytics import YOLO

# Load YOLO model once
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, "../best.pt")
try:
    yolo_model = YOLO(model_path)
    print(f"[YOLO] Successfully loaded model: {model_path}")
except Exception as e:
    raise RuntimeError(f"Failed to load YOLO model: {e}")

def run_yolo_ocr(image_bytes: bytes, filename: str = "uploaded_image"):
    """
    Fallback OCR using YOLO detection + bounding box crops.
    No Gemini API used here.
    """
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise ValueError("Invalid image file provided.")

    np_image = np.array(pil_image)
    results = yolo_model(np_image)
    boxes = results[0].boxes

    detections = []

    if len(boxes) > 0:
        for box in boxes.xyxy:
            x1, y1, x2, y2 = map(int, box)

            cropped_pil_image = pil_image.crop((x1, y1, x2, y2))

            # Encode cropped image as Base64
            buffered = io.BytesIO()
            cropped_pil_image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

            detections.append({
                "box_coordinates": [x1, y1, x2, y2],
                "cropped_image_base64": img_base64
            })
    else:
        # If no detection, return the whole image
        buffered = io.BytesIO()
        pil_image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        width, height = pil_image.size
        detections.append({
            "box_coordinates": [0, 0, width, height],
            "cropped_image_base64": img_base64
        })

    return {
        "filename": filename,
        "size": pil_image.size,
        "detections": detections
    }


                                    # Bro Rath Version

# import io
# import os
# import base64
# import re
# from fastapi import HTTPException
# from PIL import Image
# import numpy as np
# from ultralytics import YOLO
# import google.generativeai as genai
# from dotenv import load_dotenv

# # --- SETUP ---

# # 1. Load environment variables from the .env file
# load_dotenv()

# # 2. Configure the Gemini API
# # This securely fetches your API key from the .env file
# api_key = os.getenv("GEMINI_API_KEY")
# if not api_key:
#     raise ValueError("GEMINI_API_KEY not found. Please create a .env file and add your key.")
# genai.configure(api_key=api_key)

# # 3. Load the Gemini Model (once, for efficiency)
# # We use 'gemini-1.5-flash' as it's fast and excellent for this kind of task.
# try:
#     gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
#     print("Successfully loaded Gemini 1.5 Flash model.")
# except Exception as e:
#     print(f"Error loading Gemini model: {e}")
#     # You might want to handle this more gracefully depending on your application's needs
#     gemini_model = None

# # 4. Load the YOLO model (your existing code)
# script_dir = os.path.dirname(os.path.abspath(__file__))
# model_path = os.path.join(script_dir, "best.pt")
# try:
#     yolo_model = YOLO(model_path)
#     print(f"Successfully loaded custom YOLO model: {model_path}")
# except Exception as e:
#     raise RuntimeError(f"Failed to load YOLO model at {model_path}: {e}")

# # --- PROCESSING FUNCTION ---

# def process_image_with_gemini(image_bytes: bytes, filename: str = "uploaded_image"):
#     """
#     Complete pipeline using YOLO for detection and Gemini Pro for OCR.
#     """
#     if not gemini_model:
#         raise HTTPException(status_code=500, detail="Gemini model is not available.")

#     try:
#         pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#     except Exception:
#         raise ValueError("Invalid image file provided.")

#     np_image = np.array(pil_image)
    
#     # Run YOLO detection
#     results = yolo_model(np_image)
#     boxes = results[0].boxes

#     detections = []

#     if len(boxes) > 0:
#         # Loop through each box detected by YOLO
#         for box in boxes.xyxy:
#             x1, y1, x2, y2 = map(int, box)
            
#             # Crop the original image using PIL. No preprocessing needed for Gemini.
#             cropped_pil_image = pil_image.crop((x1, y1, x2, y2))
            
#             # --- GEMINI OCR ---
#             extracted_text = "OCR failed" # Default text
#             try:
#                 # The prompt is simple and direct.
#                 prompt = "Extract the Khmer text from this image."
#                 response = gemini_model.generate_content([prompt, cropped_pil_image], stream=False)
                
#                 # Clean up the response text
#                 cleaned_text = re.sub(r'\s+', ' ', response.text).strip()
#                 extracted_text = cleaned_text if cleaned_text else "No text found"

#             except Exception as e:
#                 print(f"Error calling Gemini API for a crop: {e}")
#                 extracted_text = f"API Error: {e}"
#             # --- END GEMINI OCR ---

#             # Convert the ORIGINAL cropped image to Base64 to send back to the frontend
#             buffered = io.BytesIO()
#             cropped_pil_image.save(buffered, format="PNG")
#             img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
#             detections.append({
#                 "box_coordinates": [x1, y1, x2, y2],
#                 "extracted_text": extracted_text,
#                 "cropped_image_base64": img_base64
#             })
#     else:
#         # Fallback: If YOLO finds no boxes, run Gemini on the whole image
#         print("No boxes detected by YOLO. Running Gemini on the full image.")
#         extracted_text = "OCR failed"
#         try:
#             prompt = "Extract all Khmer text from this image."
#             response = gemini_model.generate_content([prompt, pil_image], stream=False)
#             extracted_text = re.sub(r'\s+', ' ', response.text).strip()
#         except Exception as e:
#             print(f"Error calling Gemini API for the full image: {e}")
#             extracted_text = f"API Error: {e}"

#         buffered = io.BytesIO()
#         pil_image.save(buffered, format="PNG")
#         img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
#         width, height = pil_image.size
#         detections.append({
#             "box_coordinates": [0, 0, width, height],
#             "extracted_text": extracted_text,
#             "cropped_image_base64": img_base64
#         })

#     return {
#         "filename": filename,
#         "size": pil_image.size,
#         "detections": detections
#     }
