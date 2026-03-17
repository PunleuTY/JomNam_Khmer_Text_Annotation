from ultralytics import YOLO
import cv2
import pytesseract
import os
import numpy as np
from matplotlib import pyplot as plt

# --- Paths ---
# ROOT_DIR = "/content/gdrive/MyDrive/Computer_Vision-1/Computer_Vision-1"
best_path = 'best.pt'
# image_path = os.path.join(ROOT_DIR, "test/images/img20_ls_g3_18_jpg.rf.54c197ac6efb90f4b1e45ea100927d89.jpg")
# image_path = os.path.join(ROOT_DIR, "TeacherHongly/pri.jpg")
image_path = r"scanDoc.png"
# --- Configure pytesseract ---
# pytesseract.pytesseract.tesseract_cmd =r'/opt/homebrew/bin/tesseract'
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
os.environ["TESSDATA_PREFIX"] = r"C:\Program Files\Tesseract-OCR\tessdata"

# --- Load trained YOLOv8 model ---
model = YOLO(best_path)

# --- Read image ---
# img = cv2.imread(image_path)
# if img is None:
#     print(f"Error: Could not read image at {image_path}. Please check the file path and try again.")
#     exit(1)
# img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # Convert BGR to RGB for matplotlib

# # --- Run detection ---
# results = model.predict(source=image_path, conf=0.25)

# # --- Loop through detections ---
# for r in results:
#     for box in r.boxes.xyxy.cpu().numpy():
#         x1, y1, x2, y2 = map(int, box)
#         cropped_img = img[y1:y2, x1:x2]

#         # OCR with Khmer language
#         text = pytesseract.image_to_string(cropped_img, lang='khm')
#         print("Detected Khmer text:", text.strip())

#         # Draw bounding box
#         cv2.rectangle(img_rgb, (x1, y1), (x2, y2), (0,255,0), 2)
    
# # --- Display the image in Colab ---
# plt.figure(figsize=(10,10))
# plt.imshow(img_rgb)
# plt.axis('off')
# plt.show()

# # --- Save output ---
# output_path = r"scanDoc.png"
# cv2.imwrite(output_path, cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
# print(f"✅ Output saved to: {output_path}")


def run_yolo(image_bytes: bytes):
    """Run YOLO on an image (bytes) and return cropped images + bounding boxes"""
    import numpy as np
    from PIL import Image

    # Decode image bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Error: Could not decode image bytes")

    # 🔑 Use stricter thresholds to reduce redundant boxes
    results = model.predict(source=img, conf=0.5, iou=0.4)

    detections = []
    for r in results:
        for box in r.boxes.xyxy.cpu().numpy():
            x1, y1, x2, y2 = map(int, box)
            cropped_img = img[y1:y2, x1:x2]
            cropped_pil = Image.fromarray(cv2.cvtColor(cropped_img, cv2.COLOR_BGR2RGB))
            detections.append({
                "bbox": [x1, y1, x2, y2],
                "image": cropped_pil
            })

    return detections


if __name__ == "__main__":
    # --- Test mode for terminal ---
    image_path = "scanDoc.png"
    img = cv2.imread(image_path)
    if img is None:
        print(f"❌ Error: Could not read {image_path}")
        exit(1)

    with open(image_path, "rb") as f:
        detections = run_yolo(f.read())

    # Draw detections + OCR text
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        cropped_pil = det["image"]

        # Convert back to OpenCV for Tesseract
        cropped_cv = cv2.cvtColor(np.array(cropped_pil), cv2.COLOR_RGB2BGR)

        # OCR using Tesseract
        text = pytesseract.image_to_string(cropped_cv, lang="khm").strip()
        print(f"📍 BBox {det['bbox']} → Text: {text}")

        # Draw bbox + label
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img, text[:10], (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Show image with text labels
    plt.figure(figsize=(10, 10))
    plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    plt.axis("off")
    plt.show()

    # Overwrite instead of saving a new file
    output_path = "scanDoc.png"
    cv2.imwrite(output_path, img)
    print(f"✅ Image overwritten at {output_path}")
