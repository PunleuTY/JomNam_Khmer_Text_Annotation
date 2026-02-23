# ML Server - Khmer Text OCR Extraction

This is the Machine Learning server component for the Khmer Data Annotation Tool. It handles OCR (Optical Character Recognition) for extracting Khmer and English text from user-drawn bounding boxes.

## Prerequisites

1. **Tesseract OCR** must be installed on your system:

   - Download from: https://github.com/UB-Mannheim/tesseract/wiki
   - Install to: `C:\Program Files\Tesseract-OCR\`
   - Make sure to select "Additional Language Data" during installation and include **Khmer (khm)** language pack

2. **Python 3.7+** installed on your system

3. **Python packages** installed (see Installation section)

## Installation

### Step 1: Install Python Dependencies

Navigate to the ML directory and install requirements:

```bash
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\ML"
pip install -r requirements.txt
```

### Step 2: Verify Tesseract Installation

Check if Tesseract is installed correctly:

```bash
tesseract --version
```

You should see version information. If not, make sure Tesseract is added to your PATH or update the path in `utils/ocr_utils.py`.

## Running the ML Server

### Option 1: Using the Batch Script (Easiest)

Simply double-click `start_ml_server.bat` or run from command line:

```bash
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\ML\ML_V3_Final"
start_ml_server.bat
```

### Option 2: Manual Start

```bash
cd "d:\year 3\Capstone\Jomnam text Annotation\Khmer-Data-Annotation-Project\ML\ML_V3_Final"
python main_server.py
```

The server will start on **http://127.0.0.1:8000**

## API Endpoints

### POST /images/

Extract text from user-drawn bounding boxes on an image.

**Request Parameters:**

- `image` (File): Image file (JPG/PNG)
- `annotations` (Form Data): JSON string of bounding box coordinates
- `project_id` (Form Data): Project ID from the backend

**Response:**

```json
{
  "processing_result": [
    {
      "box_coordinates": [x1, y1, x2, y2],
      "extracted_text": "ខ្មែរ text extracted",
      "cropped_image_base64": "base64_encoded_image..."
    }
  ],
  "filename": "image.jpg",
  "backend_status": "success",
  "message": "Results sent to backend"
}
```

## Architecture

```
ML_V3_Final/
├── main_server.py          # FastAPI server entry point
├── utils/
│   ├── ocr_utils.py        # OCR processing logic (Tesseract)
│   └── api_client.py       # Backend communication
├── start_ml_server.bat     # Windows batch script to start server
└── README.md               # This file
```

## OCR Pipeline

1. **Segmentation**: User draws bounding boxes on the frontend
2. **Preprocessing**: Each box is cropped and preprocessed (grayscale, denoising, thresholding)
3. **Text Recognition**: Tesseract OCR extracts Khmer/English text
4. **Post-processing**: Clean whitespace and format results
5. **Output**: Return extracted text with coordinates and cropped image

## Troubleshooting

### Issue: "TesseractNotFoundError"

**Solution**:

- Verify Tesseract is installed at `C:\Program Files\Tesseract-OCR\tesseract.exe`
- If installed elsewhere, update the path in `utils/ocr_utils.py`:
  ```python
  pytesseract.pytesseract.tesseract_cmd = r"YOUR_PATH\tesseract.exe"
  ```

### Issue: "Khmer text not recognized"

**Solution**:

- Make sure you installed the Khmer language pack with Tesseract
- Verify tessdata files exist in `C:\Program Files\Tesseract-OCR\tessdata\`
- You should see files like `khm.traineddata` and `eng.traineddata`

### Issue: Server won't start / Port already in use

**Solution**:

- Check if another process is using port 8000
- Change the port in `main_server.py`:
  ```python
  uvicorn.run(app, host="127.0.0.1", port=8001)  # Use different port
  ```

### Issue: "No text extracted" or empty results

**Solution**:

- Check image quality (low resolution images may not OCR well)
- Ensure bounding boxes tightly fit the text area
- Try preprocessing the image (increase contrast, remove noise)
- Verify the correct language is selected in frontend

## Configuration

### Tesseract Path (Windows)

Edit `utils/ocr_utils.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
os.environ["TESSDATA_PREFIX"] = r"C:\Program Files\Tesseract-OCR\tessdata"
```

### CORS Settings

Edit `main_server.py` to allow frontend origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Backend URL

Edit `main_server.py` to set the backend server URL:

```python
BACKEND_URL = "http://127.0.0.1:3000/images/upload"
```

## Testing the Server

You can test the server is running by visiting:

- http://127.0.0.1:8000/docs - FastAPI auto-generated documentation
- http://127.0.0.1:8000/ - Should return 404 (expected, only /images/ endpoint exists)

## Development

To modify OCR behavior:

1. Edit preprocessing steps in `utils/ocr_utils.py` -> `preprocess_for_ocr()`
2. Adjust Tesseract config parameters:
   ```python
   text = pytesseract.image_to_string(preprocessed, lang="khm+eng", config='--psm 6')
   ```

## Integration with Project

This ML server works with:

- **Frontend** (React): Sends images and bounding boxes for OCR
- **Backend** (Go): Receives and stores OCR results in MongoDB

Make sure all three services are running:

1. MongoDB (port 27017)
2. Backend Server (port 3000)
3. ML Server (port 8000) - **THIS SERVICE**
4. Frontend (port 5173)

## License

Part of the Khmer Data Annotation Project.
