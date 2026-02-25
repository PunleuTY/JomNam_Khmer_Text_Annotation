# Image Annotation Backend

A Go-based backend service for image annotation and object detection using YOLO. This system handles image uploads, processes them through a FastAPI service for object detection, and manages ground truth annotations with MongoDB storage.

## Features

- 📤 **Image Upload**: Upload images for processing
- 🤖 **YOLO Integration**: Automatic object detection via FastAPI
- 📝 **Annotation Management**: Save and retrieve ground truth annotations
- 🗄️ **MongoDB Storage**: Persistent storage for images and metadata
- 🔍 **Result Retrieval**: Query processed images and annotations

## Architecture

```
Frontend → Go Backend → FastAPI (YOLO) → MongoDB
```

## Prerequisites

Before running this project, ensure you have the following installed:

- **Go** (version 1.19 or higher)
- **MongoDB** (version 4.4 or higher)
- **FastAPI Service** (running on `http://127.0.0.1:8000`)

## Installation

### 1. Clone the Repository

Clone the repository:
```bash
git clone https://github.com/PunleuTY/Khmer-Data-Annotation-Tool.git
```

### 2. Install Go Dependencies

```
go mod init backend
go get github.com/gin-gonic/gin
go get go.mongodb.org/mongo-driver/mongo
go get go.mongodb.org/mongo-driver/bson
go get go.mongodb.org/mongo-driver/bson/primitive
go get go.mongodb.org/mongo-driver/mongo/options
```

### 3. Set Up MongoDB

Make sure MongoDB is running on your system:

```
# Start MongoDB service (varies by OS)
# Ubuntu/Debian:
sudo systemctl start mongod

# macOS (with Homebrew):
brew services start mongodb-community

# Windows:
net start MongoDB
```

### 4. Set Up FastAPI YOLO Service

Ensure your FastAPI service is running on `http://127.0.0.1:8000` with the following endpoint:
- `POST /images/` - Accepts multipart form data with image file

### 5. Create Required Directories

\`\`\`bash
mkdir -p uploads/temp uploads/final
\`\`\`

## Configuration

The application uses the following default configurations:

- **MongoDB URI**: `mongodb://localhost:27017`
- **Database Name**: `image_db`
- **Collection Name**: `images`
- **Server Port**: `:5000`
- **FastAPI URL**: `http://127.0.0.1:8000/images/`

To modify these settings, update the values in `main.go`.

## Running the Application

\`\`\`bash
go run main.go
\`\`\`

The server will start on `http://localhost:5000`

You should see:
\`\`\`
✅ MongoDB connected successfully
[GIN-debug] Listening and serving HTTP on :5000
\`\`\`

## API Endpoints

### 1. Upload Image

**Endpoint**: `POST /upload`

**Description**: Upload an image for processing through YOLO

**Request**: 
- Content-Type: `multipart/form-data`
- Field: `image` (file)

**Response**:
```
{
  "message": "Preview ready",
  "filename": "1640995200_example.jpg",
  "annotations": [
    {
      "class": "person",
      "confidence": 0.95,
      "bbox": [100, 150, 200, 300]
    }
  ]
}
```

**cURL Example**:
```
curl -X POST http://localhost:5000/upload \
  -F "image=@/path/to/your/image.jpg"
```

### 2. Save Ground Truth

**Endpoint**: `POST /save-groundtruth`

**Description**: Save verified annotations as ground truth

**Request Body**:
```
{
  "filename": "1640995200_example.jpg",
  "annotations": [
     {
      "box_coordinates": [
        301,
        29,
        423,
        62
      ],
      "extracted_text": "message",
      "cropped_image_base64": "message"
    },
  ],
  "meta": {
    "tool": "manual_annotation",
    "lang": "en",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Response**:
```
{
  "message": "Ground truth saved successfully",
  "filename": "1640995200_example.jpg"
}
```

**cURL Example**:
```
curl -X POST http://localhost:5000/save-groundtruth \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "1640995200_example.jpg",
    "annotations": [...],
    "meta": {...}
  }'
```

### 3. Get Result

**Endpoint**: `GET /results?filename=<filename>`

**Description**: Retrieve processed image data and annotations

**Query Parameters**:
- `filename` (required): Name of the image file

**Response**:
```
{
  "filename": "1640995200_example.jpg",
  "path": "uploads/final/1640995200_example.jpg",
  "status": "final",
  "annotations": [...],
  "meta": {
    "tool": "manual_annotation",
    "lang": "en",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**cURL Example**:
```
curl "http://localhost:5000/results?filename=1640995200_example.jpg"
```

## Project Structure

```
backend/
├── main.go                 # Application entry point
├── controllers/
│   ├── upload.go          # Image upload and processing
│   └── result.go          # Result retrieval
├── models/
│   └── image.go           # Data models
├── routes/
│   ├── routes.go          # Upload and save routes
│   └── result_routes.go   # Result routes
└── uploads/
    ├── temp/              # Temporary uploaded files
    └── final/             # Processed and verified files
```

## Data Models

### Image Model
```
type Image struct {
    ID          primitive.ObjectID `bson:"_id,omitempty"`
    Name        string            `bson:"name"`
    Path        string            `bson:"path"`
    Width       int               `bson:"width,omitempty"`
    Height      int               `bson:"height,omitempty"`
    Status      string            `bson:"status"`
    Annotations []interface{}     `bson:"annotations"`
    Meta        Meta              `bson:"meta,omitempty"`
}
```

### Meta Model
```
type Meta struct {
    Tool      string `bson:"tool,omitempty" json:"tool"`
    Lang      string `bson:"lang,omitempty" json:"lang"`
    Timestamp string `bson:"timestamp,omitempty" json:"timestamp"`
}
```

## Workflow

1. **Upload**: Client uploads an image via `/upload`
2. **Processing**: Image is sent to FastAPI YOLO service for object detection
3. **Preview**: YOLO results are returned to client for review
4. **Verification**: User reviews and potentially modifies annotations
5. **Save**: Verified annotations are saved via `/save-groundtruth`
6. **Retrieval**: Processed images can be queried via `/results`

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Successful operation
- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side errors

## Development

### Adding New Features

1. Create new controller functions in `controllers/`
2. Define routes in `routes/`
3. Update models in `models/` if needed
4. Register routes in `main.go`

### Testing

```bash
# Run tests (when available)
go test ./...

# Build the application
go build -o backend server.go

# Run the built binary
./backend
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `server.go`

2. **FastAPI Service Unavailable**
   - Verify FastAPI service is running on `http://127.0.0.1:8000`
   - Check network connectivity

3. **File Upload Errors**
   - Ensure `uploads/temp/` directory exists
   - Check file permissions

4. **Port Already in Use**
   - Change port in `server.go` or stop conflicting service

