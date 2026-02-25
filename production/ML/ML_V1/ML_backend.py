# # ----->>>>> *** Clean API server *** <<<<<-----
# from fastapi import FastAPI, UploadFile, File, HTTPException
# import httpx
# import uvicorn
# import pytesseract
# from Yolo_OCR import process_complete_image_pipeline


# app = FastAPI(title="Khmer Data Annotation ML") 


# # full url : http://127.0.0.1:8000/images/ (receive)
# @app.post("/images/")
# async def process_image_and_send_to_backend(image: UploadFile = File(...), ocr_engine: str = "tesseract"):
#     """
#     API endpoint to receive an image, process it, and send results to backend.
#     """
#     # Read the uploaded file bytes
#     image_bytes = await image.read()

#     if ocr_engine != "tesseract":
#         raise HTTPException(status_code=400, detail="Invalid OCR engine. Use 'tesseract'.")

#     try:
#         # Call the complete processing pipeline from YOLO_OCR.py
#         # make sure process_complete_image_pipeline supports `ocr_engine` argument
#         result = process_complete_image_pipeline(image_bytes, image.filename, ocr_engine=ocr_engine)
        
#         # Send results to backend automatically
#         try:
#             backend_url = "http://127.0.0.1:8001/api/results"        
#             async with httpx.AsyncClient() as client:
#                 response = await client.post(
#                     backend_url,
#                     json=result,
#                     headers={"Content-Type": "application/json"},
#                     timeout=30.0
#                 )
#                 response.raise_for_status()
                
#                 # Return combined response
#                 return {
#                     "ocr_engine": ocr_engine,
#                     "processing_result": result,
#                     "backend_status": "success",
#                     "message": "Image processed and results sent to backend successfully"
#                 }
                
#         except httpx.RequestError:
#             # If backend fails, still return processing results
#             return {
#                 "ocr_engine": ocr_engine,
#                 "processing_result": result,
#                 "backend_status": "failed",
#                 "message": "Image processed successfully, but failed to send to backend"
#             }
        
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except pytesseract.TesseractNotFoundError:
#         raise HTTPException(status_code=500, detail="Tesseract is not installed or not in your PATH.")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

# if __name__ == "__main__":
#     uvicorn.run(app, host="127.0.0.1", port=8000)
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import uvicorn
import pytesseract
import os
import asyncio
from Yolo_OCR import process_image_with_gemini as process_complete_image_pipeline
from datetime import datetime


# ----> Setup Tesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
os.environ["TESSDATA_PREFIX"] = r"C:\Program Files\Tesseract-OCR\tessdata"

app = FastAPI(title="Khmer Data Annotation ML") 

# ----> CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to frontend URL in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/images/")
async def process_image_and_send_to_backend(image: UploadFile = File(...)):
    image_bytes = await image.read()
    filename = image.filename  

    try:

        # Run YOLO + OCR in thread executor (non-blocking)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, process_complete_image_pipeline, image_bytes, filename)

        if not result:
            result = {"detections": []}

        # Build structure expected by Go backend
        structured_result = {
            "meta": {
                "tool": "Khmer Data Annotation Tool",
                "lang": "khm",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            },
            "images": [
                {
                    "id": f"{filename}-1",
                    "name": filename,
                    "path": f"/uploads/{filename}",  # adjust if needed
                    "width": result.get("width", 640),
                    "height": result.get("height", 480),
                    "status": "pending",
                    "annotations": result.get("detections", [])
                }
            ],
            "annotations": {
                f"{filename}-1": result.get("detections", [])
            }
        }

        backend_url = "http://127.0.0.1:5000/api/results"
        backend_status = "skipped"
        backend_message = "Backend call skipped or failed"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    backend_url,
                    json=structured_result,
                    headers={"Content-Type": "application/json"},
                    timeout=40.0
                )
                response.raise_for_status()
                backend_status = "success"
                backend_message = "Results sent to backend successfully"
                print("Backend response:", response.text)
        except Exception as e:
            backend_status = "failed"
            backend_message = f"Failed to send to backend: {str(e)}"

        return {
            "processing_result": structured_result,
            "filename": filename,
            "backend_status": backend_status,
            "message": backend_message
        }

    except pytesseract.TesseractNotFoundError:
        raise HTTPException(status_code=500, detail="Tesseract not found. Check installation and path.")
    except Exception as e:
        print("Processing error:", str(e))
        return {
            "processing_result": {"detections": []},
            "filename": filename,
            "backend_status": "failed",
            "message": f"Processing error: {str(e)}"
        }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
