# backend_client.py
import httpx
from datetime import datetime

BACKEND_URL = "http://127.0.0.1:3000/api/results"

async def send_results_to_backend(filename: str, result: dict):
    """
    Send structured detection results to Go backend.
    Args:
        filename (str): Name of the processed image.
        result (dict): Detection result from YOLO + OCR.
    Returns:
        dict: Status and message of the backend call.
    """
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
                "path": f"/uploads/{filename}",
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

    backend_status = "skipped"
    backend_message = "Backend call skipped or failed"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                BACKEND_URL,
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

    return {"status": backend_status, "message": backend_message, "structured_result": structured_result}
