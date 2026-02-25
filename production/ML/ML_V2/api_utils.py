import google.generativeai as genai
from PIL import Image
import json
from config import API_KEY

def extract_text_from_detections(image_path, json_path, results_text_path, results_json_path):
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash-exp")

    image = Image.open(image_path)

    with open(json_path, "r", encoding="utf-8") as f:
        coordinates_data = json.load(f)

    coordinates_info = ""
    for detection in coordinates_data["detections"]:
        bbox = detection["bounding_box"]
        coordinates_info += f"- Detection {detection['detection_id']}: ({bbox['x1']}, {bbox['y1']}) to ({bbox['x2']}, {bbox['y2']})\n"

    prompt = f"""Extract Khmer text only inside these bounding boxes:

{coordinates_info}

Return results as:
Detection 0: [text]
Detection 1: [text]
..."""

    response = model.generate_content([prompt, image])

    with open(results_text_path, "w", encoding="utf-8") as f:
        f.write("GEMINI KHMER TEXT EXTRACTION RESULTS\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Image: {image_path}\n")
        f.write(f"JSON: {json_path}\n")
        f.write(f"Total detections: {len(coordinates_data['detections'])}\n\n")
        f.write("COORDINATE REFERENCE:\n")
        f.write(coordinates_info)
        f.write("\nEXTRACTED TEXT:\n")
        f.write("-" * 30 + "\n")
        f.write(response.text)

    results_data = {
        "source_image": image_path,
        "source_json": json_path,
        "model_used": "gemini-2.0-flash-exp",
        "prompt": prompt,
        "extracted_text": response.text,
        "detections_processed": len(coordinates_data['detections']),
        "coordinate_reference": coordinates_data['detections']
    }

    with open(results_json_path, "w", encoding="utf-8") as f:
        json.dump(results_data, f, indent=2, ensure_ascii=False)

    return response.text
