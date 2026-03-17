# Tesseract OCR Setup Guide

Detailed guide for installing and configuring Tesseract OCR for Khmer text extraction.

---

## What is Tesseract?

Tesseract is an open-source OCR (Optical Character Recognition) engine used to extract text from images. This project uses it to extract Khmer and English text from user-drawn bounding boxes.

---

## Installation Steps

### Step 1: Download Tesseract Installer

1. Go to: **https://github.com/UB-Mannheim/tesseract/wiki**
2. Download the latest Windows installer (e.g., `tesseract-ocr-w64-setup-5.x.x.exe`)

---

### Step 2: Run the Installer

1. **Run** the downloaded `.exe` file as Administrator
2. Click **Next** through the setup wizard
3. **IMPORTANT - Installation Location:**
   - Install to: `C:\Program Files\Tesseract-OCR\`
   - Do NOT change this default path

---

### Step 3: Select Language Data (CRITICAL)

During installation, you'll see a **"Select Additional Language Data"** screen:

1. **Scroll down** and find:
   - ☑ **Khmer (khm)** - Required for Khmer text
   - ☑ **English (eng)** - Required for mixed text
2. **Check both boxes**
3. Click **Next** and complete installation

---

### Step 4: Add Tesseract to System PATH

1. Press `Win + R`, type `sysdm.cpl`, press **Enter**
2. Click **Advanced** tab → **Environment Variables**
3. Under **System variables**, find `Path` → Click **Edit**
4. Click **New** → Add: `C:\Program Files\Tesseract-OCR\`
5. Click **OK** on all windows

---

### Step 5: Verify Installation

Open a **NEW** terminal (to load PATH changes) and run:

```bash
tesseract --version
```

**Expected Output:**
```
tesseract 5.x.x
 leptonica-1.x.x
  khm eng
```

✅ If you see `khm` in the language list, installation is successful!

---

### Step 6: Additional Khmer Training Data (Optional)

For improved Khmer OCR accuracy:

1. Go to: https://github.com/tesseract-ocr/tessdata_fast
2. Download `khm.traineddata`
3. Copy to: `C:\Program Files\Tesseract-OCR\tessdata\`

---

## Configuration

### ML Service Configuration

Edit `production/ML/ml_service/.env`:

```env
# For the new FastAPI ML service
TESSERACT_DATA_PATH=C:\Program Files\Tesseract-OCR\tessdata
```

### Tesseract Path in Code

The ML service automatically detects Tesseract if installed at the default location. If installed elsewhere, update the path in the model class.

---

## Testing Tesseract

### Test 1: Version Check

```bash
tesseract --version
```

### Test 2: Language List

```bash
tesseract --list-langs
```

**Expected Output:**
```
List of available languages (2):
eng
khm
```

### Test 3: Quick OCR Test

```bash
tesseract test_image.png output --lang khm+eng
type output.txt
```

---

## Troubleshooting

### Issue: "TesseractNotFoundError"

**Cause:** Tesseract not in PATH

**Solution:**
1. Verify installation at `C:\Program Files\Tesseract-OCR\tesseract.exe`
2. Add to PATH (see Step 4)
3. Restart terminal

---

### Issue: "khm language not found"

**Cause:** Khmer language pack not installed

**Solution:**
1. Re-run Tesseract installer
2. Select "Modify" installation
3. Check Khmer language pack
4. Complete installation

---

### Issue: Poor Khmer OCR Accuracy

**Solutions:**

1. **Use high-quality images:**
   - Minimum 300 DPI
   - Good contrast between text and background
   - Avoid heavily compressed images

2. **Draw tight bounding boxes:**
   - Boxes should fit text closely
   - Don't include too much empty space

3. **Adjust Tesseract config:**
   ```python
   # In ML service, change PSM mode
   config='--psm 6'  # Uniform block of text
   config='--psm 3'  # Fully automatic (default)
   config='--psm 7'  # Single text line
   ```

---

## Tesseract PSM Modes

| PSM | Description | Use Case |
|-----|-------------|----------|
| 3 | Fully automatic | Default, general purpose |
| 6 | Uniform block of text | Faster, consistent text blocks |
| 7 | Single text line | Individual lines |
| 10 | Single character | Single characters |

---

## Integration with ML Service

The ML service uses Tesseract through the `pytesseract` Python library:

```python
import pytesseract

# Extract text
text = pytesseract.image_to_string(image, lang='khm+eng')

# Get bounding boxes
data = pytesseract.image_to_data(image, lang='khm+eng', output_type=pytesseract.Output.DICT)
```

---

## Next Steps

- [Quick Start Guide](quick-start.md) - Run the full project
- [OCR Extraction](../ml-service/ocr-extraction.md) - How OCR works in this project
