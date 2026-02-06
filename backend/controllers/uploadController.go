package controllers

import (
	"context"
	"encoding/json"
	"image"
	"log"
	"mime/multipart"
	"net/http"
	"time"

	_ "image/jpeg"
	_ "image/png"

	"backend/cloudflare"
	"backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// uploadResult holds the result of a single file upload operation
type uploadResult struct {
    FileName    string
    Annotations json.RawMessage
    ObjectKey   string // R2 object key
    PublicURL   string // Public URL for the image
}

// UploadImages handles multiple image uploads for a project.
// Images are uploaded to Cloudflare R2 storage instead of local filesystem.
// Uses authentication middleware to get user email for file naming.
//
// Request parameters:
//   - project_id (required): MongoDB ObjectID of the target project
//   - images (required): Multiple image files
//   - annotations (optional): JSON string of annotations
//
// Auth context (from middleware):
//   - email: User email address
//
// Response:
//   - Success: { "meta": {...}, "images": [...], "annotations": {...} }
//   - Error: { "error": "<error message>" }
func UploadImages(imageCollection *mongo.Collection, r2Client *cloudflare.R2Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract user email from auth context
        emailInterface, exists := c.Get("email")
        if !exists {
            log.Printf("UploadImages: User email not found in context")
            c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
            return
        }
        
        userEmail, ok := emailInterface.(string)
        if !ok || userEmail == "" {
            log.Printf("UploadImages: Invalid email in context")
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user email"})
            return
        }

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

        // Process files concurrently
        resultChan := make(chan uploadResult, len(files))

        for _, file := range files {
            go processImageUpload(c, file, projectID, userEmail, annotations, imageCollection, r2Client, resultChan)
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
                "file_name":  r.FileName,
                "object_key": r.ObjectKey,
                "url":        r.PublicURL,
            })
            annotationsMap[r.FileName] = r.Annotations
        }

        log.Printf("UploadImages: Processed %d files for project %s by user %s", len(files), projectID.Hex(), userEmail)
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

// processImageUpload handles the upload of a single image file to Cloudflare R2.
// This function runs in a goroutine and processes the file concurrently.
func processImageUpload(
    c *gin.Context,
    file *multipart.FileHeader,
    projectID primitive.ObjectID,
    userEmail string,
    annotations []models.Annotation,
    imageCollection *mongo.Collection,
    r2Client *cloudflare.R2Client,
    resultChan chan uploadResult,
) {
    ctx := context.Background()

    // Generate R2 object key: datasets/email_projectid_filename.jpg
    objectKey := cloudflare.GenerateObjectKey(userEmail, projectID.Hex(), file.Filename)

    // Upload to Cloudflare R2
    uploadedKey, err := r2Client.UploadFile(ctx, file, objectKey)
    if err != nil {
        log.Printf("processImageUpload: Failed to upload %s to R2 - %v", file.Filename, err)
        resultChan <- uploadResult{
            FileName:    file.Filename,
            Annotations: json.RawMessage("[]"),
            ObjectKey:   "",
            PublicURL:   "",
        }
        return
    }

    // Get public URL
    publicURL := cloudflare.GetPublicURL(uploadedKey)

    // Read file to get image dimensions
    src, err := file.Open()
    if err != nil {
        log.Printf("processImageUpload: Failed to open file %s - %v", file.Filename, err)
        resultChan <- uploadResult{
            FileName:    file.Filename,
            Annotations: annotationsToJSON(annotations),
            ObjectKey:   uploadedKey,
            PublicURL:   publicURL,
        }
        return
    }
    defer src.Close()

    // Decode image dimensions
    imgConfig, _, err := image.DecodeConfig(src)
    if err != nil {
        log.Printf("processImageUpload: Failed to decode image %s, using defaults - %v", file.Filename, err)
        imgConfig.Width = 0
        imgConfig.Height = 0
    }

    // Save or update image in database using upsert
    ctxDB, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    filter := bson.M{"project_id": projectID, "name": file.Filename}
    update := bson.M{
        "$set": bson.M{
            "path":        uploadedKey, // R2 object key
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
    _, err = imageCollection.UpdateOne(ctxDB, filter, update, opts)
    if err != nil {
        log.Printf("processImageUpload: Failed to save image %s to database - %v", file.Filename, err)
    }

    log.Printf("processImageUpload: Successfully processed %s - URL: %s", file.Filename, publicURL)
    resultChan <- uploadResult{
        FileName:    file.Filename,
        Annotations: annotationsToJSON(annotations),
        ObjectKey:   uploadedKey,
        PublicURL:   publicURL,
    }
}

// annotationsToJSON converts an annotations slice to JSON RawMessage format
func annotationsToJSON(annotations []models.Annotation) json.RawMessage {
    data, _ := json.Marshal(annotations)
    return data
}

// SaveGroundTruth saves final annotations for an image.
// Since images are already in R2, this only updates the database with final annotations.
//
// Request body:
//   - filename (required): Name of the uploaded file
//   - project_id (required): MongoDB ObjectID of the project
//   - annotations (required): Array of annotation objects
//   - meta (optional): Metadata about the annotation
//
// Response:
//   - Success: { "message": "Ground truth saved successfully", "filename": "...", "url": "..." }
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

        // Update image document in database with final status
        update := bson.M{
            "$set": bson.M{
                "annotations":  req.Annotations,
                "status":       "final",
                "meta":         req.Meta,
                "finalized_at": time.Now(),
                "updated_at":   time.Now(),
            },
        }

        _, err = imageCollection.UpdateByID(ctx, image.ID, update)
        if err != nil {
            log.Printf("SaveGroundTruth: Failed to update image in database - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update image in DB", "details": err.Error()})
            return
        }

        // Get public URL for response
        publicURL := cloudflare.GetPublicURL(image.Path)

        log.Printf("SaveGroundTruth: Ground truth saved for %s", req.Filename)
        c.JSON(http.StatusOK, gin.H{
            "message":  "Ground truth saved successfully",
            "filename": req.Filename,
            "url":      publicURL,
        })
    }
}