# Khmer Data Annotation Tool

A web-based tool for annotating Khmer text datasets used in AI and machine learning projects.

---

## 📥 Getting Started

### Clone the Repository

```bash
git clone https://github.com/PunleuTY/Khmer-Data-Annotation-Project.git
cd Khmer-Data-Annotation-Project
```

That's it! You now have the codebase on your machine.

For detailed setup and running instructions, see the [`production/QUICK_START.md`](production/QUICK_START.md) guide.

---

## 🏗️ Project Structure

```
Khmer-Data-Annotation-Project/
├── production/     # Production-ready code
│   ├── backend/    # Go API server
│   ├── frontend/   # React web interface
│   └── ML/         # ML OCR services
└── experiment/     # Experimental features
```

---

## 🛠️ Tech Stack

| Component | Technology                       |
| --------- | -------------------------------- |
| Frontend  | React.js, Vite, Tailwind CSS     |
| Backend   | Go, Gin Framework                |
| Database  | MongoDB                          |
| ML/OCR    | Python, FastAPI, Tesseract, YOLO |

---

## 📖 Usage Demo

![GIF_demo](https://github.com/user-attachments/assets/f65da9dc-bc25-4c89-b215-3718e6a779be)

**Quick Workflow:**

1. Upload an image with Khmer text
2. Draw bounding boxes around text regions
3. Click "Extract Text" to run OCR
4. Review and edit extracted text
5. Save annotations to your project

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/your-feature`)
3. **Commit** your changes (`git commit -m "Add your feature"`)
4. **Push** to the branch (`git push origin feature/your-feature`)
5. **Open** a Pull Request

### Guidelines

- Keep commits clean and focused
- Write clear commit messages
- Test your changes before submitting

---

## 📄 License

This project is licensed under the MIT License.
