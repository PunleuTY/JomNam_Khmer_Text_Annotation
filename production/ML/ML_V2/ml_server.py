from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
import os
import asyncio
from utils.detection_utils import run_yolo_detection
from backend_client import send_results_to_backend

# ----> Setup Tesseract
pytesseract.pytesseract.tesseract_cmd = r"/opt/homebrew/bin/tesseract"
os.environ["TESSDATA_PREFIX"] = r"/opt/homebrew/share/tessdata"

app = FastAPI(title="Khmer Data Annotation ML") 

# ----> CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/images/")
async def process_image(image: UploadFile = File(...)):
    image_bytes = await image.read()
    filename = image.filename

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_yolo_detection, image_bytes, filename)

        if not result:
            result = {"detections": []}

        backend_response = await send_results_to_backend(filename, result)

        return {
            "processing_result": backend_response["structured_result"],
            "filename": filename,
            "backend_status": backend_response["status"],
            "message": backend_response["message"]
        }

    except pytesseract.TesseractNotFoundError:
        raise HTTPException(status_code=500, detail="Tesseract not found. Check installation and path.")
    except Exception as e:
        return {
            "processing_result": {"detections": []},
            "filename": filename,
            "backend_status": "failed",
            "message": f"Processing error: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
