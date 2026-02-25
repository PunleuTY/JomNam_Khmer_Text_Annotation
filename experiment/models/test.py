from doctr.models import ocr_predictor
from doctr.io import DocumentFile
from tqdm import tqdm
import time

# Load model
print("Loading OCR model...")
model = ocr_predictor(pretrained=True)
print("Model loaded successfully.")

# Load local image
print("Reading image...")
doc = DocumentFile.from_images("demo_scene_text.jpeg")

# Simulate a progress bar (just visual feedback)
print("Running OCR...")
for _ in tqdm(range(5), desc="Processing", ncols=100):
    time.sleep(0.3)

# Run OCR
result = model(doc)

# Visualize the result
result.show()
