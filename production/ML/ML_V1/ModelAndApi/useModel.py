from ultralytics import YOLO
import cv2
import pytesseract
import os
from matplotlib import pyplot as plt

# --- Paths ---
# ROOT_DIR = "/content/gdrive/MyDrive/Computer_Vision-1/Computer_Vision-1"
best_path = '../best.pt'
# image_path = os.path.join(ROOT_DIR, "test/images/img20_ls_g3_18_jpg.rf.54c197ac6efb90f4b1e45ea100927d89.jpg")
# image_path = os.path.join(ROOT_DIR, "TeacherHongly/pri.jpg")
image_path = r"C:\Users\menge\Desktop\Computer_Vision-1\Computer_Vision-1\Computer_Vision-1\TeacherHongly\img1.jpg"
# --- Configure pytesseract ---
pytesseract.pytesseract.tesseract_cmd =r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# --- Load trained YOLOv8 model ---
model = YOLO(best_path)

# --- Read image ---
img = cv2.imread(image_path)
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # Convert BGR to RGB for matplotlib

# --- Run detection ---
results = model.predict(source=image_path, conf=0.25)

# --- Loop through detections ---
for r in results:
    for box in r.boxes.xyxy.cpu().numpy():
        x1, y1, x2, y2 = map(int, box)
        cropped_img = img[y1:y2, x1:x2]

        # OCR with Khmer language
        text = pytesseract.image_to_string(cropped_img, lang='khm')
        print("Detected Khmer text:", text.strip())

        # Draw bounding box
        cv2.rectangle(img_rgb, (x1, y1), (x2, y2), (0,255,0), 2)

# --- Display the image in Colab ---
plt.figure(figsize=(10,10))
plt.imshow(img_rgb)
plt.axis('off')
plt.show()

# --- Save output ---
output_path = r"C:\Users\menge\Desktop\Computer_Vision-1\Computer_Vision-1\Computer_Vision-1\TeacherHongly\img1.jpg"
cv2.imwrite(output_path, cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
print(f"✅ Output saved to: {output_path}")


