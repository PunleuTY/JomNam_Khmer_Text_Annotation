"""
Simple test client to verify ML Server OCR functionality
This script sends a test request to the ML server
"""
import requests
import io
from PIL import Image, ImageDraw, ImageFont

# Create a test image with Khmer text
print("Creating test image...")
img = Image.new('RGB', (800, 200), color='white')
draw = ImageDraw.Draw(img)

# Draw a bounding box
draw.rectangle([50, 50, 750, 150], outline='red', width=3)

# Add some text (you can replace this with actual Khmer text if you have the font)
try:
    # Try to load a font (this may fail if font not available)
    font = ImageFont.truetype("arial.ttf", 40)
except:
    font = ImageFont.load_default()

draw.text((60, 70), "ខ្មែរ សាកល្បង Test 123", fill='black', font=font)

# Save to bytes
img_bytes = io.BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

# Also save to file for inspection
img.save("test_request_image.png")
print("Test image saved as: test_request_image.png")

# Prepare the request
print("\nSending request to ML Server...")
print("URL: http://127.0.0.1:8000/images/")

# Define bounding boxes (coordinates that match our drawn box)
boxes = [[50, 50, 750, 150]]

# Prepare form data
files = {
    'image': ('test_image.png', img_bytes, 'image/png')
}
data = {
    'project_id': 'test_project_123',
    'annotations': str(boxes).replace("'", '"')  # Convert to JSON format
}

try:
    # Send request
    response = requests.post(
        'http://127.0.0.1:8000/images/',
        files=files,
        data=data,
        timeout=30
    )
    
    print(f"\nResponse Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n✓ SUCCESS! Response received:")
        print(f"  Filename: {result.get('filename')}")
        print(f"  Backend Status: {result.get('backend_status')}")
        print(f"  Message: {result.get('message')}")
        print(f"\n  Processing Results:")
        
        for idx, detection in enumerate(result.get('processing_result', []), 1):
            print(f"\n  Box {idx}:")
            print(f"    Coordinates: {detection.get('box_coordinates')}")
            print(f"    Extracted Text: '{detection.get('extracted_text')}'")
            print(f"    Text Length: {len(detection.get('extracted_text', ''))}")
            
    else:
        print(f"\n✗ ERROR: Server returned status code {response.status_code}")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("\n✗ ERROR: Could not connect to ML Server!")
    print("Make sure the ML server is running on http://127.0.0.1:8000")
    print("\nTo start the server, run:")
    print("  cd \"d:\\year 3\\Capstone\\Jomnam text Annotation\\Khmer-Data-Annotation-Project\\ML\\ML_V3_Final\"")
    print("  python main_server.py")
    
except Exception as e:
    print(f"\n✗ ERROR: {type(e).__name__}: {e}")

print("\n" + "="*60)
print("Test completed!")
print("="*60)
