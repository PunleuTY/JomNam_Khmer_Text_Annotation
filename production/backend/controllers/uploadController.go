package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"image"
	"io"
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
	FileName         string
	Annotations      json.RawMessage
	ObjectKey        string // R2 object key
	PublicURL        string // Public URL for the image
	ProcessingResult json.RawMessage
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

		// Parse annotations if provided. Accept flexible formats: try models.Annotation, otherwise ignore for upload.
		annotationsStr := c.PostForm("annotations")
		var annotations []models.Annotation
		if annotationsStr != "" {
			if err := json.Unmarshal([]byte(annotationsStr), &annotations); err != nil {
				// Not a models.Annotation array (could be array of boxes). Log and continue without failing upload.
				log.Printf("UploadImages: Annotations not in models.Annotation format, skipping DB save: %v", err)
				annotations = nil
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
			imgMap := map[string]interface{}{
				"file_name":  r.FileName,
				"object_key": r.ObjectKey,
				"url":        r.PublicURL,
			}
			// Attach OCR result if present per-image
			if len(r.ProcessingResult) > 0 {
				var pr interface{}
				if err := json.Unmarshal(r.ProcessingResult, &pr); err == nil {
					imgMap["processing_result"] = pr
				}
			}
			imagesList = append(imagesList, imgMap)
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

	// No automatic OCR during upload. OCR is triggered via separate endpoint.

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

// TriggerOCR pulls an existing image from Cloudflare R2, sends it to the ML server
// with provided annotation boxes, and returns the ML processing_result.
// Request: POST /images/:id/ocr
// Body: { "annotations": [ [x1,y1,x2,y2], ... ] }
func TriggerOCR(imageCollection *mongo.Collection, r2Client *cloudflare.R2Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		imageIDStr := c.Param("id")
		if imageIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing image id"})
			return
		}

		imageID, err := primitive.ObjectIDFromHex(imageIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image id"})
			return
		}

		// Find image doc
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var img models.Image
		if err := imageCollection.FindOne(ctx, bson.M{"_id": imageID}).Decode(&img); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
			return
		}

		// Read annotations from request body (allow generic JSON)
		var body struct {
			Annotations      interface{} `json:"annotations"`
			RecognitionModel string      `json:"recognition_model"`
		}
		if err := c.BindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// Get public URL of the image
		publicURL := cloudflare.GetPublicURL(img.Path)
		if publicURL == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cloudflare public endpoint not configured"})
			return
		}

		// Fetch image bytes from public URL
		resp, err := http.Get(publicURL)
		if err != nil || resp.StatusCode != 200 {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to fetch image from Cloudflare"})
			return
		}
		defer resp.Body.Close()
		imgBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read image bytes"})
			return
		}

		// Call ML server
		mlURL := "http://127.0.0.1:8000/ocr"
		bodyBuf := &bytes.Buffer{}
		writer := multipart.NewWriter(bodyBuf)
		part, err := writer.CreateFormFile("image", img.Name)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare ML request"})
			return
		}
		if _, err := part.Write(imgBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write image to ML request"})
			return
		}
		// annotations JSON
		annsJson, _ := json.Marshal(body.Annotations)
		_ = writer.WriteField("annotations", string(annsJson))
		_ = writer.WriteField("project_id", img.ProjectID.Hex())
		if body.RecognitionModel == "" {
			body.RecognitionModel = "tesseract"
		}
		_ = writer.WriteField("recognition_model", body.RecognitionModel)
		writer.Close()

		req, err := http.NewRequest("POST", mlURL, bodyBuf)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ML request"})
			return
		}
		req.Header.Set("Content-Type", writer.FormDataContentType())
		client := &http.Client{Timeout: 60 * time.Second}
		resp2, err := client.Do(req)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to call ML server", "details": err.Error()})
			return
		}
		defer resp2.Body.Close()
		var mlResp map[string]interface{}
		if err := json.NewDecoder(resp2.Body).Decode(&mlResp); err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid ML response"})
			return
		}

		// Return ML processing result to caller. Caller can then persist annotations via /images/save-groundtruth
		c.JSON(http.StatusOK, mlResp)
	}
}

// AutoDetect uses ML_V4 to automatically detect text regions in an image.
// It fetches the image from Cloudflare R2 and sends it to the ML_V4 /auto-detect endpoint.
// Request: POST /images/:id/auto-detect
// Body: { "mode": "word"|"line", "extract_text": true|false, "detection_model": "doctr"|"yolo", "recognition_model": "tesseract"|"kiriocr" }
func AutoDetect(imageCollection *mongo.Collection, r2Client *cloudflare.R2Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		imageIDStr := c.Param("id")
		if imageIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing image id"})
			return
		}

		imageID, err := primitive.ObjectIDFromHex(imageIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image id"})
			return
		}

		// Find image doc
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var img models.Image
		if err := imageCollection.FindOne(ctx, bson.M{"_id": imageID}).Decode(&img); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
			return
		}

		// Parse request body
		var body struct {
			Mode             string `json:"mode"`
			ExtractText      bool   `json:"extract_text"`
			DetectionModel   string `json:"detection_model"`
			RecognitionModel string `json:"recognition_model"`
		}
		if err := c.BindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// Default mode to "word"
		if body.Mode == "" {
			body.Mode = "word"
		}

		// Validate mode
		if body.Mode != "word" && body.Mode != "line" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid mode. Must be 'word' or 'line'"})
			return
		}

		// Get public URL of the image
		publicURL := cloudflare.GetPublicURL(img.Path)
		if publicURL == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cloudflare public endpoint not configured"})
			return
		}

		// Fetch image bytes from public URL
		resp, err := http.Get(publicURL)
		if err != nil || resp.StatusCode != 200 {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to fetch image from Cloudflare"})
			return
		}
		defer resp.Body.Close()
		imgBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read image bytes"})
			return
		}

		// Call ML_V4 auto-detect endpoint
		mlURL := "http://127.0.0.1:8000/auto-detect"
		bodyBuf := &bytes.Buffer{}
		writer := multipart.NewWriter(bodyBuf)

		// Add image file
		part, err := writer.CreateFormFile("image", img.Name)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare ML request"})
			return
		}
		if _, err := part.Write(imgBytes); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write image to ML request"})
			return
		}

		// Add form fields
		_ = writer.WriteField("mode", body.Mode)
		extractStr := "false"
		if body.ExtractText {
			extractStr = "true"
		}
		_ = writer.WriteField("extract_text", extractStr)

		// Forward model selections
		if body.DetectionModel == "" {
			body.DetectionModel = "doctr"
		}
		if body.RecognitionModel == "" {
			body.RecognitionModel = "tesseract"
		}
		_ = writer.WriteField("detection_model", body.DetectionModel)
		_ = writer.WriteField("recognition_model", body.RecognitionModel)
		writer.Close()

		req, err := http.NewRequest("POST", mlURL, bodyBuf)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ML request"})
			return
		}
		req.Header.Set("Content-Type", writer.FormDataContentType())
		client := &http.Client{Timeout: 120 * time.Second}
		resp2, err := client.Do(req)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to call ML_V4 server", "details": err.Error()})
			return
		}
		defer resp2.Body.Close()

		var mlResp map[string]interface{}
		if err := json.NewDecoder(resp2.Body).Decode(&mlResp); err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Invalid ML response"})
			return
		}

		c.JSON(http.StatusOK, mlResp)
	}
}
