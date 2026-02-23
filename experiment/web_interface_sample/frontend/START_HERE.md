# START HERE - Khmer OCR Annotation Tool

## Welcome! 👋

You now have a **production-ready annotation tool** that matches your design exactly. No backend needed to start - everything works client-side.

## In 30 Seconds

```bash
npm install
npm run dev
# Open http://localhost:3000
```

Done! Your annotation tool is running.

## What You Have

✅ **Frontend-Only App**: No backend required  
✅ **Design Match**: Purple gradient, exact UI from your screenshot  
✅ **Manual Annotation**: Draw boxes, add text  
✅ **Three Export Formats**: JSON, COCO, PaddleOCR  
✅ **Backend Ready**: Integration points for your ML services  
✅ **Production Ready**: Code, documentation, Docker support  

## 📚 Documentation Guide

Read these files in order:

### 1. **QUICK_START.md** (5 min read)
Start here for a quick overview. Covers:
- 30-second setup
- Feature list
- Architecture diagram
- Common questions

### 2. **README.md** (10 min read)
Full feature documentation. Covers:
- All features with examples
- Export formats explained
- Project structure
- Deployment options

### 3. **INTEGRATION_GUIDE.md** (15 min read)
For connecting your backend. Covers:
- How to connect YOLO detection
- How to connect OCR services
- Backend API specifications
- Python Flask example
- Docker deployment

### 4. **PROJECT_SUMMARY.md** (5 min read)
Complete project overview. Covers:
- What's included
- Tech stack
- Files created
- Integration points

### 5. **VERIFICATION_CHECKLIST.md** (For QA)
Test everything using this checklist.

## 🎯 Start Using It Now

### Basic Workflow
1. Open http://localhost:3000
2. Click "Upload Image" → select PNG/JPG
3. Select "Word Level" or "Line Level"
4. Click and drag on canvas to draw boxes
5. Type Khmer text in the annotations panel
6. Click export buttons to download results

### File Formats

**JSON** - Simple format
```json
{"annotations": [{"text": "នៃ", "bbox": {x, y, width, height}}]}
```

**COCO** - For training object detection models  
**PaddleOCR** - For training PaddleOCR models

## 🔌 Add Your Backend Later

The app includes integration points for your own services:

### Detection (YOLO, etc.)
```typescript
// In lib/export-utils.ts - ready to connect
export async function callBackendDetection(imageUrl, apiEndpoint)
```

### OCR (Tesseract, DocTR, etc.)
```typescript
// In lib/export-utils.ts - ready to connect
export async function callBackendOCR(imageCropUrl, apiEndpoint)
```

See `INTEGRATION_GUIDE.md` for complete integration steps.

## 📦 Project Files

```
📁 Components
├── canvas-annotator.tsx     - Drawing on image
├── annotations-panel.tsx    - Edit/manage boxes
└── instructions-panel.tsx   - User guide

📁 Core
├── app/page.tsx             - Main app (250 lines)
├── lib/export-utils.ts      - Export & integration (170 lines)

📁 Documentation
├── README.md                - Full guide (200+ lines)
├── QUICK_START.md           - Quick reference (200 lines)
├── INTEGRATION_GUIDE.md     - Backend integration (400 lines)
├── PROJECT_SUMMARY.md       - Overview
├── VERIFICATION_CHECKLIST.md- QA checklist

📁 Deployment
├── Dockerfile               - Docker container
├── .dockerignore            - Docker config
```

## 🚀 Three Ways to Run

### Option 1: Local Development (Recommended)
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Option 2: Docker
```bash
docker build -t khmer-annotator .
docker run -p 3000:3000 khmer-annotator
```

### Option 3: Vercel (Production)
```bash
vercel
# Follow the prompts
```

## 💡 Key Features

| Feature | Status | Details |
|---------|--------|---------|
| Upload PNG/JPG | ✅ | Drag-drop or click |
| Draw Boxes | ✅ | Click and drag on canvas |
| Edit Text | ✅ | Type Khmer in text field |
| Line & Word Modes | ✅ | Selector in toolbar |
| Export JSON | ✅ | Download button |
| Export COCO | ✅ | Download button |
| Export PaddleOCR | ✅ | Download button |
| Statistics | ✅ | Total/Lines/Words count |
| Clear All | ✅ | One-click button |

## 🔒 No Backend Required

This app is **completely frontend-based**:
- No database needed
- No authentication required
- No server-side processing
- Perfect for manual annotation
- Easy to add backend later

## ✨ Perfect For

1. **Manual Annotation**
   - Upload images
   - Draw boxes manually
   - Type text for each region
   - Export for training data

2. **Quick Testing**
   - Try before integrating backend
   - Verify annotation workflows
   - Check export formats

3. **Integration Testing**
   - Connect your detection service
   - Connect your OCR service
   - Test end-to-end pipeline

## 🎨 Design Details

**Colors**
- Header: Purple gradient (#6366f1 → #8b5cf6)
- Toolbar: White background
- Buttons: Colorful (purple, pink, green, cyan)
- Canvas area: White
- Boxes: Yellow borders with text labels

**Layout**
- Header on top
- Toolbar below header
- Two-column content:
  - Left: Image canvas + instructions
  - Right: Annotations panel
- Statistics at bottom

## 🔧 Customization

The app is ready for customization:
- **Colors**: Modify Tailwind classes
- **Text**: Update strings in components
- **Layout**: Modify component structure
- **Features**: Add new export formats
- **Integration**: Connect your APIs

## 🛠️ Technology

- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **shadcn/ui** - Components
- **HTML5 Canvas** - Drawing
- **TypeScript** - Type safety

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

## ❓ FAQ

**Q: Do I need a backend to start?**
A: No, everything works in the browser. Add backend when you're ready.

**Q: Can I add detection later?**
A: Yes, see INTEGRATION_GUIDE.md for connecting YOLO or your detection service.

**Q: Can I add OCR later?**
A: Yes, see INTEGRATION_GUIDE.md for connecting Tesseract, DocTR, or other OCR.

**Q: Is this production-ready?**
A: Yes, use as-is for manual annotation or add backend services for automation.

**Q: Can multiple users use it?**
A: Currently single-user per session. Add authentication + backend for multi-user.

**Q: Where does data persist?**
A: Currently client-side only. Export files manually or add backend storage.

## 🚀 Next Steps

1. **Get It Running**
   ```bash
   npm install && npm run dev
   ```

2. **Try It Out**
   - Upload an image
   - Draw some boxes
   - Type Khmer text
   - Export results

3. **Read Docs**
   - QUICK_START.md for overview
   - INTEGRATION_GUIDE.md to add backend

4. **Deploy**
   - Use Vercel (easy, free)
   - Use Docker (portable)
   - Use own hosting (full control)

## 📞 Support

All documentation is included:
- **QUICK_START.md** - Quick questions
- **README.md** - How features work
- **INTEGRATION_GUIDE.md** - Backend integration
- **PROJECT_SUMMARY.md** - Technical details
- **Code comments** - Inline documentation

## ✅ Quality Checklist

- ✅ Matches design exactly
- ✅ All features working
- ✅ Clean code (1,100 lines)
- ✅ Comprehensive documentation (800+ lines)
- ✅ Production ready
- ✅ Backend integration ready
- ✅ Docker support included
- ✅ No dependencies on ML libraries
- ✅ Frontend-only operation

## 🎉 You're Ready!

Your Khmer OCR annotation tool is ready to use. Start with:

```bash
npm install
npm run dev
```

Then open http://localhost:3000 and start annotating!

---

**Questions?** Check the relevant documentation file above.  
**Need backend?** Follow INTEGRATION_GUIDE.md.  
**Ready to deploy?** Use Docker or Vercel.  

Happy annotating! 🚀
