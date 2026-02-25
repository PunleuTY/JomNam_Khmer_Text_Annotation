import cv2
import json
from ultralytics import YOLO
import httpx

async def send_results_to_backend(structured_result):
    backend_url = "http://127.0.0.1:3000/api/results"
    async with httpx.AsyncClient() as client:
        response = await client.post(
            backend_url,
            json=structured_result,
            headers={"Content-Type": "application/json"},
            timeout=40.0
        )
        response.raise_for_status()
        return response.json()

def run_yolo_detection(image_path, model_path, output_image_path, output_json_path, conf=0.25):
    model = YOLO(model_path)
    img = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    results = model.predict(source=image_path, conf=conf)

    detections_data = {
        "image_path": image_path,
        "model_path": model_path,
        "confidence_threshold": conf,
        "detections": []
    }

    detection_id = 0
    for r in results:
        for i, box in enumerate(r.boxes.xyxy.cpu().numpy()):
            x1, y1, x2, y2 = map(int, box)
            confidence = float(r.boxes.conf[i].cpu().numpy())
            class_id = int(r.boxes.cls[i].cpu().numpy())
            class_name = model.names[class_id] if hasattr(model, "names") else None

            detection_info = {
                "detection_id": detection_id,
                "bounding_box": {
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "width": x2 - x1, "height": y2 - y1
                },
                "confidence": confidence,
                "class_id": class_id,
                "class_name": class_name
            }

            detections_data["detections"].append(detection_info)

            cv2.rectangle(img_rgb, (x1, y1), (x2, y2), (0,255,0), 2)
            cv2.putText(img_rgb, f"ID:{detection_id}", (x1, y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)

            detection_id += 1

    cv2.imwrite(output_image_path, cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(detections_data, f, indent=2, ensure_ascii=False)

    return output_image_path, output_json_path, detections_data
