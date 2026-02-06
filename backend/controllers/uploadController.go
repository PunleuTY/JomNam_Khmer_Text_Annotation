package controllers

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	_ "image/jpeg"
	_ "image/png"

	"backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
    tempDir  = "uploads/temp/"
    finalDir = "uploads/final/"
)

// uploadResult holds the result of a single file upload operation
type uploadResult struct {
    FileName    string
    Annotations json.RawMessage
    Base64      string
}

// UploadImages handles multiple image uploads for a project.
// Images are saved to temporary storage and can be moved to final storage later.
// Uses goroutines for concurrent file processing.
//
// Request parameters:
//   - project_id (required): MongoDB ObjectID of the target project
//   - images (required): Multiple image files
//   - annotations (optional): JSON string of annotations
//
// Response:
//   - Success: { "meta": {...}, "images": [...], "annotations": {...} }
//   - Error: { "error": "<error message>" }
func UploadImages(imageCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract and validate project ID
        projectIDStr := c.PostForm("project_id")
        if projectIDStr == "" {
            log.Printf("UploadImages: Missing project_id")
            c.JSON(http.StatusBadRequest, gin.H{"error": "Missing project_id"})
            return
        }

        projectID, err := primitive.ObjectIDFromHex(projectIDStr)
        if err != nil {
            log.Printf("UploadImages: Invalid project_id format - %s", projectIDStr)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
            return
        }

        // Parse multipart form
        form, err := c.MultipartForm()
        if err != nil {
            log.Printf("UploadImages: Invalid form - %v", err)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form"})
            return
        }

        // Extract image files
        files := form.File["images"]
        if len(files) == 0 {
            log.Printf("UploadImages: No files uploaded")
            c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
            return
        }

        // Parse annotations if provided
        annotationsStr := c.PostForm("annotations")
        var annotations []models.Annotation
        if annotationsStr != "" {
            if err := json.Unmarshal([]byte(annotationsStr), &annotations); err != nil {
                log.Printf("UploadImages: Invalid annotations JSON - %v", err)
                c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid annotations JSON"})
                return
            }
        }

        // Ensure temp directory exists
        if err := os.MkdirAll(tempDir, os.ModePerm); err != nil {
            log.Printf("UploadImages: Failed to create temp directory - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create temp directory"})
            return
        }

        // Process files concurrently
        resultChan := make(chan uploadResult, len(files))

        for _, file := range files {
            go processImageUpload(c, file, projectID, annotations, imageCollection, resultChan)
        }

        // Collect results
        results := make([]uploadResult, 0, len(files))
        for i := 0; i < len(files); i++ {
            results = append(results, <-resultChan)
        }

        // Format response
        imagesList := make([]map[string]interface{}, 0, len(results))
        annotationsMap := make(map[string]json.RawMessage)

        for _, r := range results {
            imagesList = append(imagesList, map[string]interface{}{
                "file_name": r.FileName,
                "base64":    r.Base64,
            })
            annotationsMap[r.FileName] = r.Annotations
        }

        log.Printf("UploadImages: Processed %d files for project %s", len(files), projectID.Hex())
        c.JSON(http.StatusOK, gin.H{
            "meta": models.Meta{
                Tool:      "Khmer Data Annotation Tool",
                Lang:      "khm",
                Timestamp: time.Now().Format(time.RFC3339),
            },
            "images":      imagesList,
            "annotations": annotationsMap,
        })
    }
}

// processImageUpload handles the upload of a single image file.
// This function runs in a goroutine and processes the file concurrently.
func processImageUpload(
    c *gin.Context,
    file *multipart.FileHeader,
    projectID primitive.ObjectID,
    annotations []models.Annotation,
    imageCollection *mongo.Collection,
    resultChan chan uploadResult,
) {
    // Generate unique path with timestamp
    timestamp := time.Now().UnixNano()
    tempPath := filepath.Join(tempDir, fmt.Sprintf("%d_%s", timestamp, file.Filename))

    // Save uploaded file
    if err := c.SaveUploadedFile(file, tempPath); err != nil {
        log.Printf("processImageUpload: Failed to save file %s - %v", file.Filename, err)
        resultChan <- uploadResult{
            FileName:    file.Filename,
            Annotations: json.RawMessage("[]"),
        }
        return
    }

    // Read file data
    data, err := os.ReadFile(tempPath)
    if err != nil {
        log.Printf("processImageUpload: Failed to read file %s - %v", file.Filename, err)
        resultChan <- uploadResult{
            FileName:    file.Filename,
            Annotations: json.RawMessage("[]"),
        }
        return
    }

    // Decode image dimensions
    imgConfig, _, err := image.DecodeConfig(bytes.NewReader(data))
    if err != nil {
        log.Printf("processImageUpload: Failed to decode image %s, using defaults - %v", file.Filename, err)
        imgConfig.Width = 0
        imgConfig.Height = 0
    }

    // Convert to Base64
    base64Str := "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(data)

    // Save or update image in database using upsert
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    filter := bson.M{"project_id": projectID, "name": file.Filename}
    update := bson.M{
        "$set": bson.M{
            "path":        tempPath,
            "base64":      base64Str,
            "width":       imgConfig.Width,
            "height":      imgConfig.Height,
            "annotations": annotations,
            "status":      "pending",
            "updated_at":  time.Now(),
        },
        "$setOnInsert": bson.M{
            "project_id": projectID,
            "name":       file.Filename,
            "created_at": time.Now(),
        },
    }

    opts := options.Update().SetUpsert(true)
    _, err = imageCollection.UpdateOne(ctx, filter, update, opts)
    if err != nil {
        log.Printf("processImageUpload: Failed to save image %s to database - %v", file.Filename, err)
    }

    log.Printf("processImageUpload: Successfully processed %s", file.Filename)
    resultChan <- uploadResult{
        FileName:    file.Filename,
        Annotations: annotationsToJSON(annotations),
        Base64:      base64Str,
    }
}

// annotationsToJSON converts an annotations slice to JSON RawMessage format
func annotationsToJSON(annotations []models.Annotation) json.RawMessage {
    data, _ := json.Marshal(annotations)
    return data
}

// SaveGroundTruth saves final annotations for an image and moves it from temp to final storage.
// This endpoint marks an image as complete with its ground truth annotations.
//
// Request body:
//   - filename (required): Name of the uploaded file
//   - project_id (required): MongoDB ObjectID of the project
//   - annotations (required): Array of annotation objects
//   - meta (optional): Metadata about the annotation
//
// Response:
//   - Success: { "message": "Ground truth saved successfully", "filename": "...", "path": "..." }
//   - Error: { "error": "<error message>", "details": "<details>" }
func SaveGroundTruth(imageCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req struct {
            Filename    string              `json:"filename" binding:"required"`
            ProjectID   string              `json:"project_id" binding:"required"`
            Annotations []models.Annotation `json:"annotations"`
            Meta        models.Meta         `json:"meta"`
        }

        // Parse request body
        if err := c.ShouldBindJSON(&req); err != nil {
            log.Printf("SaveGroundTruth: Invalid request body - %v", err)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "details": err.Error()})
            return
        }

        // Parse project ID
        projectID, err := primitive.ObjectIDFromHex(req.ProjectID)
        if err != nil {
            log.Printf("SaveGroundTruth: Invalid project_id format - %s", req.ProjectID)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
            return
        }

        ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer cancel()

        // Find the image by project and filename
        var image models.Image
        err = imageCollection.FindOne(ctx, bson.M{
            "project_id": projectID,
            "name":       req.Filename,
        }).Decode(&image)
        if err != nil {
            log.Printf("SaveGroundTruth: Image not found - project: %s, filename: %s", req.ProjectID, req.Filename)
            c.JSON(http.StatusNotFound, gin.H{"error": "Image not found", "details": err.Error()})
            return
        }

        // Ensure final directory exists
        if err := os.MkdirAll(finalDir, os.ModePerm); err != nil {
            log.Printf("SaveGroundTruth: Failed to create final directory - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create final directory", "details": err.Error()})
            return
        }

        // Move file from temp to final directory
        tempPath := filepath.Clean(image.Path)
        finalPath := filepath.Join(finalDir, filepath.Base(tempPath))

        if err := os.Rename(tempPath, finalPath); err != nil {
            log.Printf("SaveGroundTruth: Failed to move file - from: %s, to: %s, error: %v", tempPath, finalPath, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to move file", "details": err.Error()})
            return
        }

        // Re-read file and regenerate Base64 after moving
        data, err := os.ReadFile(finalPath)
        if err != nil {
            log.Printf("SaveGroundTruth: Failed to read file for Base64 - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file for Base64", "details": err.Error()})
            return
        }
        base64Str := "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(data)

        // Update image document in database with final status
        update := bson.M{
            "$set": bson.M{
                "annotations": req.Annotations,
                "status":      "final",
                "path":        finalPath,
                "base64":      base64Str,
                "meta":        req.Meta,
                "finalized_at": time.Now(),
            },
        }

        _, err = imageCollection.UpdateByID(ctx, image.ID, update)
        if err != nil {
            log.Printf("SaveGroundTruth: Failed to update image in database - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update image in DB", "details": err.Error()})
            return
        }

        log.Printf("SaveGroundTruth: Ground truth saved for %s, moved to %s", req.Filename, finalPath)
        c.JSON(http.StatusOK, gin.H{
            "message":  "Ground truth saved successfully",
            "filename": req.Filename,
            "path":     finalPath,
        })
    }
}