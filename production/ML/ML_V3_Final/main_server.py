import io, json, asyncio
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from utils.ocr_utils import process_user_boxes
from utils.api_client import send_to_backend
import uvicorn

app = FastAPI(title="User Box OCR API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_URL = "http://127.0.0.1:3000/images/upload" 

@app.post("/images/")
async def ocr_user_boxes(
    image: UploadFile = File(...),
    annotations: str = Form(...),
    project_id: str = Form(...)
):
    print(f"\n{'='*60}")
    print(f"[ML SERVER] New OCR request received")
    print(f"[ML SERVER] Project ID: {project_id}")
    print(f"[ML SERVER] Image filename: {image.filename}")
    print(f"[ML SERVER] Image content type: {image.content_type}")
    print(f"{'='*60}")
    
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID is required")

    try:
        boxes = json.loads(annotations)
        if not isinstance(boxes, list):
            raise ValueError("Annotations must be a list of boxes")
        print(f"[ML SERVER] Parsed {len(boxes)} bounding boxes")
    except Exception as e:
        print(f"[ML SERVER] ✗ Error parsing annotations: {e}")
        raise HTTPException(status_code=400, detail="Invalid annotations JSON")

    image_bytes = await image.read()
    print(f"[ML SERVER] Image loaded: {len(image_bytes)} bytes")
    
    loop = asyncio.get_event_loop()
    print(f"[ML SERVER] Starting OCR processing...")
    detections = await loop.run_in_executor(None, process_user_boxes, image_bytes, boxes)
    print(f"[ML SERVER] OCR processing completed - {len(detections)} results")

    print(f"[ML SERVER] Sending results to backend: {BACKEND_URL}")
    backend_status, backend_message = await send_to_backend(
        BACKEND_URL, project_id, image.filename, image_bytes, detections, image.content_type
    )
    print(f"[ML SERVER] Backend response: {backend_status} - {backend_message}")

    response_data = {
        "processing_result": detections,
        "filename": image.filename,
        "backend_status": backend_status,
        "message": backend_message
    }
    print(f"[ML SERVER] ✓ Request completed successfully\n")
    
    return response_data

if __name__ == "__main__":
    uvicorn.run("main_server:app", host="127.0.0.1", port=8000, reload=True)
