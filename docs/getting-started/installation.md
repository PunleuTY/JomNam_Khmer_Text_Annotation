# Installation Prerequisites

This guide covers installing all required software for the Khmer Data Annotation Project.

---

## Required Software

| Software | Version | Purpose | Download |
|----------|---------|---------|----------|
| Node.js | v18+ | Frontend runtime | https://nodejs.org/ |
| Go | v1.19+ | Backend runtime | https://go.dev/dl/ |
| Python | v3.10+ | ML service runtime | https://python.org/ |
| MongoDB | v6+ | Database | https://mongodb.com/try/download/community |
| Tesseract OCR | v5+ | Text extraction | https://github.com/UB-Mannheim/tesseract/wiki |

---

## Node.js Installation

### Windows

1. Download LTS version from https://nodejs.org/
2. Run the installer
3. Follow the installation wizard
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

---

## Go Installation

### Windows

1. Download from https://go.dev/dl/
2. Run the installer
3. Add to PATH (installer usually does this automatically)
4. Verify:
   ```bash
   go version
   ```

---

## Python Installation

### Windows

1. Download Python 3.10+ from https://python.org/
2. **IMPORTANT:** Check "Add Python to PATH" during installation
3. Verify:
   ```bash
   python --version
   pip --version
   ```

---

## MongoDB Installation

### Windows

1. Download MongoDB Community Server from https://mongodb.com/try/download/community
2. Run installer, choose "Complete" installation
3. Install as Windows Service (recommended)
4. Verify:
   ```bash
   net start MongoDB
   ```

### Create Data Directory

```bash
mkdir C:\data\db
```

---

## Tesseract OCR Installation

See [Tesseract Setup Guide](tesseract-setup.md) for detailed instructions.

### Quick Install

1. Download from https://github.com/UB-Mannheim/tesseract/wiki
2. Install to `C:\Program Files\Tesseract-OCR\`
3. Select **Khmer (khm)** and **English (eng)** language packs
4. Add to PATH
5. Verify:
   ```bash
   tesseract --version
   ```

---

## Verification Checklist

After installing all prerequisites:

```bash
node --version      # v18.x.x
go version          # go1.19.x
python --version    # Python 3.10.x
mongod --version    # db version v6.x.x
tesseract --version # tesseract 5.x.x
```

---

## Next Steps

- [Quick Start Guide](quick-start.md) - Run the project
- [Environment Configuration](configuration.md) - Set up .env files
