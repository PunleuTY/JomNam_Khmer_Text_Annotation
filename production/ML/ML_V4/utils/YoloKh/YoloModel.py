from ultralytics import YOLO
import cv2

class YOLODetector:
    def __init__(self, model_path="best.pt"):
        # Load model once
        self.model = YOLO(model_path)

    def predict_image(self, image_path):
        results = self.model(image_path)
        return results

    def predict_frame(self, frame):
        results = self.model(frame)
        return results

    def get_detections(self, results):
        detections = []

        for result in results:
            for box in result.boxes:
                detections.append({
                    "class": int(box.cls),
                    "confidence": float(box.conf),
                    "bbox": box.xyxy.tolist()
                })

        return detections

    def show_results(self, results):
        annotated = results[0].plot()
        cv2.imshow("YOLO Detection", annotated)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

if __name__ == "__main__":
    detector = YOLODetector("best.pt")
    results = detector.predict_image("../demo_scene_text.jpeg")

    detections = detector.get_detections(results)
    print(detections)

    detector.show_results(results)