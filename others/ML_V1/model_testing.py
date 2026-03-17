import os
from ultralytics import YOLO

print("Current working directory:", os.getcwd())
print("Files in current directory:", os.listdir('.'))

# Check if best.pt exists
if os.path.exists('best.pt'):
    print("✅ best.pt file found!")
    file_size = os.path.getsize('best.pt')
    print(f"File size: {file_size} bytes")
    
    try:
        print("Attempting to load best.pt...")
        model = YOLO('best.pt')
        print("✅ Successfully loaded best.pt!")
        
        # Check model properties
        print(f"Model type: {type(model)}")
        if hasattr(model, 'names'):
            print(f"Model classes: {model.names}")
        if hasattr(model, 'model'):
            print(f"Model info: {model.model}")
            
    except Exception as e:
        print(f"❌ Error loading best.pt: {e}")
        print(f"Error type: {type(e)}")
        
        # Try loading a pre-trained model for comparison
        try:
            print("Trying to load yolov8n.pt as comparison...")
            backup_model = YOLO('yolov8n.pt')
            print("✅ yolov8n.pt loaded successfully!")
        except Exception as e2:
            print(f"❌ Even yolov8n.pt failed: {e2}")
            
else:
    print("❌ best.pt file not found!")
    print("Available .pt files:", [f for f in os.listdir('.') if f.endswith('.pt')])
