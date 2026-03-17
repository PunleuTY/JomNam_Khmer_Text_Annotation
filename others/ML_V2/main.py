import asyncio
from config import (
    YOLO_MODEL_PATH,
    OUTPUT_IMAGE_PATH,
    OUTPUT_JSON_PATH,
    OUTPUT_TEXT_PATH,
    RESULTS_JSON_PATH,
    USE_API
)
from detection_utils import run_yolo_detection, send_results_to_backend
if USE_API:
    from api_utils import extract_text_from_detections
else:
    from yolo_ocr_utils import run_yolo_ocr  # fallback OCR


def main():
    image_path = "./image_testing/MPTC2.jpg"  # update your path

    print("🔎 Running YOLO detection...")
    output_img, output_json, detections_data = run_yolo_detection(
        image_path,
        YOLO_MODEL_PATH,
        OUTPUT_IMAGE_PATH,
        OUTPUT_JSON_PATH
    )
    print(f"✅ Detection results saved: {output_img}, {output_json}")

    print("📡 Sending detections to Gemini...")
    extracted_text = extract_text_from_detections(
        image_path,
        output_json,
        OUTPUT_TEXT_PATH,
        RESULTS_JSON_PATH
    )
    print("\nExtracted Khmer Text:")
    print("=" * 50)
    print(extracted_text)
    print("=" * 50)

    # ---- NEW: send full structured results to backend ----
    structured_result = {
        "image_path": image_path,
        "output_image": output_img,
        "output_json": output_json,
        "detections": detections_data["detections"],
        "extracted_text": extracted_text
    }

    print("📤 Sending structured results to backend...")
    response = asyncio.run(send_results_to_backend(structured_result))
    print("✅ Backend response:", response)

if __name__ == "__main__":
    main()
