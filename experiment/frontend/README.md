# Khmer OCR Annotation Tool

A lightweight, frontend-only web application for annotating Khmer text regions in images. Export annotations in JSON, COCO, or PaddleOCR format for training DocTR and other OCR models.

## Features

- **Image Upload**: Support for PNG/JPG formats
- **Annotation Modes**: Line-level or word-level annotation
- **Manual Drawing**: Click and drag to create bounding boxes around text regions
- **Text Input**: Enter extracted or manual Khmer text for each bounding box
- **Multiple Export Formats**:
  - **JSON**: Simple JSON format with coordinates and text
  - **COCO**: COCO format for object detection training
  - **PaddleOCR**: PaddleOCR format for OCR model training
- **Statistics**: View total annotations, lines, and words count
- **Clean UI**: Intuitive interface with clear instructions

## Tech Stack

- **Frontend**: Next.js 16 + React 19
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Canvas**: HTML5 Canvas for image annotation
- **No Backend Required**: 100% frontend-based solution

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone or extract the project**
   ```bash
   cd khmer-ocr-annotator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
├── app/
│   ├── page.tsx                    # Main annotation interface
│   └── layout.tsx                  # Root layout
├── components/
│   ├── canvas-annotator.tsx        # Canvas with drawing tools
│   ├── annotations-panel.tsx       # Annotations list & editor
│   ├── instructions-panel.tsx      # User instructions
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── export-utils.ts             # Export functions (JSON, COCO, PaddleOCR)
│   └── utils.ts                    # Utility functions
└── public/                         # Static assets
```

## Core Components

### Canvas Annotator (`components/canvas-annotator.tsx`)
- Renders images with overlay for drawing
- Handles mouse events for bounding box creation
- Displays boxes with yellow borders and text labels
- Real-time preview of box being drawn (orange dashed border)

### Annotations Panel (`components/annotations-panel.tsx`)
- View all annotations with editable text fields
- Delete individual annotations
- Statistics (total, lines, words count)
- Organized by annotation mode

### Export Utilities (`lib/export-utils.ts`)
- **JSON Export**: Simple format with bbox coordinates and text
- **COCO Export**: Industry-standard format for object detection
- **PaddleOCR Export**: Format for PaddleOCR model training
- **API Integration Points**: Functions ready for backend calls

## Workflow

1. **Upload Image**
   - Click "Upload Image" or drag PNG/JPG file
   - Image displays on canvas

2. **Select Mode**
   - Choose "Word Level" or "Line Level" annotation
   - Affects annotation categorization

3. **Draw Bounding Boxes**
   - Click and drag on canvas to create boxes
   - Boxes appear with yellow borders
   - Enter Khmer text in the annotations panel

4. **Export Results**
   - Choose export format (JSON, COCO, or PaddleOCR)
   - File downloads automatically
   - Use for training OCR models

## Export Formats

### JSON Format
```json
{
  "version": "1.0",
  "format": "khmer-ocr-annotation",
  "exportDate": "2026-02-09T...",
  "annotations": [
    {
      "id": "anno-1234",
      "text": "នៃ",
      "bbox": {"x": 10, "y": 20, "width": 50, "height": 40},
      "mode": "word"
    }
  ]
}
```

### COCO Format
Standard COCO format with image and annotation objects, perfect for training detection models.

### PaddleOCR Format
Line-based format with image path, character polygons, and transcription - ready for PaddleOCR training.

## Backend Integration

The app includes clean API integration points for connecting to your backend services:

### Detect Regions (YOLO or similar)
```typescript
// In lib/export-utils.ts
export async function callBackendDetection(
  imageUrl: string,
  apiEndpoint: string
)
```

### Extract Text (Tesseract, DocTR, etc.)
```typescript
// In lib/export-utils.ts
export async function callBackendOCR(
  imageCropUrl: string,
  apiEndpoint: string
)
```

You can modify these functions to call your own backend ML services.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern mobile browsers

## Performance

- Handles images up to 4000x4000px
- Smooth drawing and canvas rendering
- No external API calls required (fully client-side)
- Export operations are instant

## Tips

1. **Drawing**: Start from top-left and drag to bottom-right for boxes
2. **Text Entry**: Use Khmer input method on your OS
3. **Editing**: Click annotation in panel to edit text
4. **Statistics**: Check stats to verify annotation count
5. **Export**: Keep backups of exported files

## Extending the Application

### Connect to Detection API
Modify `handleAutoDetect` in `app/page.tsx` to call your YOLO backend.

### Connect to OCR API
Add a function to send cropped images to your Tesseract/DocTR server.

### Add Database
Integrate Supabase, Firebase, or your own backend to persist annotations.

### Add Authentication
Add user auth to enable multi-user projects and cloud storage.

## Technology

- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Lucide Icons** - Icons
- **HTML5 Canvas** - Drawing

## License

Created with [v0](https://v0.app) - Vercel's AI code generation platform.

---

**Ready to annotate Khmer text!** 🎉

Frontend-first, backend-ready annotation tool for training OCR models.
