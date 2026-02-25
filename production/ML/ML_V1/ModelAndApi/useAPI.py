import google.generativeai as genai
from PIL import Image
import os
from dotenv import load_dotenv

# Configure API (consider using environment variables for security)
load_dotenv()
API_KEY = os.getenv('../../GEMINI_API_KEY')
genai.configure(api_key=API_KEY)

# Initialize model
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Your local image path (update this to your actual path)
image_path = r"C:\Users\menge\Desktop\Computer_Vision-1\Computer_Vision-1\Computer_Vision-1\TeacherHongly\img1.jpg"  # Update this path

# Check if file exists
if not os.path.exists(image_path):
    print(f"Error: Image file not found at {image_path}")
    print("Please update the image_path variable with the correct path to your image.")
    exit(1)

try:
    # Load image
    image = Image.open(image_path)
    print(f"Image loaded successfully: {image.size}")
    
    # Simple prompt for text extraction
    prompt = "Extract all Khmer text in bbox from this image"
    
    # Extract text
    print("Processing image...")
    response = model.generate_content([prompt, image])
    
    # Print extracted text
    print("Extracted Khmer Text:")
    print("=" * 40)
    print(response.text)
    print("=" * 40)
    
except FileNotFoundError:
    print(f"Error: Could not find the image file at {image_path}")
except Exception as e:
    print(f"An error occurred: {e}")