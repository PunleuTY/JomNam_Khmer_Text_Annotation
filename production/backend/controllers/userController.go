package controllers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"backend/cloudflare"
	"backend/middleware"
	"backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// UserController handles user-related operations
type UserController struct {
	userCollection *mongo.Collection
	r2Client       *cloudflare.R2Client
}

// NewUserController creates a new instance of UserController
func NewUserController(userCollection *mongo.Collection, r2Client *cloudflare.R2Client) *UserController {
	return &UserController{
		userCollection: userCollection,
		r2Client:       r2Client,
	}
}

// GetCurrentUserProfile retrieves the current user's profile from MongoDB
// Response:
//   - Success: { "user": {...} }
//   - Error: { "error": "<error message>" }
func (uc *UserController) GetCurrentUserProfile(c *gin.Context) {
	// Get user email from context (set by auth middleware)
	email, err := middleware.GetUserEmail(c)
	if err != nil {
		log.Printf("GetCurrentUserProfile: User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Find user by email
	var user models.User
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = uc.userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			log.Printf("GetCurrentUserProfile: User not found for email %s", email)
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		log.Printf("GetCurrentUserProfile: Database error - %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user profile"})
		return
	}

	log.Printf("GetCurrentUserProfile: Retrieved profile for %s", email)
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateCurrentUserProfile updates the current user's profile in MongoDB
// Allowed fields: name, bio, phoneNumber, role, organization, profilePhoto, coverPhoto
// Request body example:
//   {
//     "name": "John Doe",
//     "bio": "Data scientist",
//     "phoneNumber": "+1234567890",
//     "role": "Researcher",
//     "organization": "CADT",
//     "profilePhoto": "url",
//     "coverPhoto": "url"
//   }
// Response:
//   - Success: { "message": "Profile updated successfully", "user": {...} }
//   - Error: { "error": "<error message>" }
func (uc *UserController) UpdateCurrentUserProfile(c *gin.Context) {
	// Get user email from context (set by auth middleware)
	email, err := middleware.GetUserEmail(c)
	if err != nil {
		log.Printf("UpdateCurrentUserProfile: User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Parse request body
	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		log.Printf("UpdateCurrentUserProfile: Invalid request body - %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Only allow updating specific fields
	allowedFields := map[string]bool{
		"name":         true,
		"bio":          true,
		"phoneNumber":  true,
		"phone_number": true, // support snake_case
		"role":         true,
		"organization": true,
		"profilePhoto": true,
		"profile_photo": true, // support snake_case
		"coverPhoto":   true,
		"cover_photo":  true, // support snake_case
	}

	// Build update document with only allowed fields
	updateFields := bson.M{}
	for key, value := range updateData {
		if allowedFields[key] {
			// Convert camelCase to snake_case for database
			dbKey := key
			switch key {
			case "phoneNumber":
				dbKey = "phone_number"
			case "profilePhoto":
				dbKey = "profile_photo"
			case "coverPhoto":
				dbKey = "cover_photo"
			}
			updateFields[dbKey] = value
		}
	}

	// Add updated_at timestamp
	updateFields["updated_at"] = time.Now()

	// Update user in database
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{"$set": updateFields}
	result, err := uc.userCollection.UpdateOne(ctx, bson.M{"email": email}, update)
	
	if err != nil {
		log.Printf("UpdateCurrentUserProfile: Failed to update user - %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	if result.MatchedCount == 0 {
		log.Printf("UpdateCurrentUserProfile: User not found for email %s", email)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Retrieve updated user
	var updatedUser models.User
	err = uc.userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&updatedUser)
	if err != nil {
		log.Printf("UpdateCurrentUserProfile: Failed to retrieve updated user - %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Profile updated but failed to retrieve"})
		return
	}

	log.Printf("UpdateCurrentUserProfile: Profile updated for %s", email)
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    updatedUser,
	})
}

// UploadProfilePhoto handles profile photo or cover photo upload
// Uploads to Cloudflare R2 under user_photos/{email}/{type}/{filename}
// Updates the user's profile_photo or cover_photo field in MongoDB
// Request: POST /users/upload-photo with multipart form:
//   - photo: image file
//   - type: "profile" or "cover"
// Response:
//   - Success: { "message": "Photo uploaded successfully", "url": "...", "user": {...} }
//   - Error: { "error": "<error message>" }
func (uc *UserController) UploadProfilePhoto(c *gin.Context) {
	// Get user email from context
	email, err := middleware.GetUserEmail(c)
	if err != nil {
		log.Printf("UploadProfilePhoto: User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Parse multipart form
	file, err := c.FormFile("photo")
	if err != nil {
		log.Printf("UploadProfilePhoto: Missing photo file - %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing photo file"})
		return
	}

	// Get photo type (profile or cover)
	photoType := c.PostForm("type")
	if photoType != "profile" && photoType != "cover" {
		log.Printf("UploadProfilePhoto: Invalid photo type - %s", photoType)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Photo type must be 'profile' or 'cover'"})
		return
	}

	// Validate file type
	if !isValidImageType(file.Filename) {
		log.Printf("UploadProfilePhoto: Invalid file type - %s", file.Filename)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only image files are allowed (jpg, jpeg, png, webp)"})
		return
	}

	// Generate object key: user_photos/email/type/filename
	// Sanitize email for use in path (replace @ with _at_)
	sanitizedEmail := sanitizeEmailForPath(email)
	objectKey := fmt.Sprintf("user_photos/%s/%s/%s", sanitizedEmail, photoType, file.Filename)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Upload to R2
	uploadedKey, err := uc.r2Client.UploadFile(ctx, file, objectKey)
	if err != nil {
		log.Printf("UploadProfilePhoto: Failed to upload to R2 - %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload photo"})
		return
	}

	// Get public URL
	publicURL := cloudflare.GetPublicURL(uploadedKey)
	if publicURL == "" {
		log.Printf("UploadProfilePhoto: Failed to get public URL")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get photo URL"})
		return
	}

	// Update user document in MongoDB
	updateField := "profile_photo"
	if photoType == "cover" {
		updateField = "cover_photo"
	}

	update := bson.M{
		"$set": bson.M{
			updateField:  publicURL,
			"updated_at": time.Now(),
		},
	}

	result, err := uc.userCollection.UpdateOne(ctx, bson.M{"email": email}, update)
	if err != nil {
		log.Printf("UploadProfilePhoto: Failed to update user in database - %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	if result.MatchedCount == 0 {
		log.Printf("UploadProfilePhoto: User not found for email %s", email)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Retrieve updated user
	var updatedUser models.User
	err = uc.userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&updatedUser)
	if err != nil {
		log.Printf("UploadProfilePhoto: Failed to retrieve updated user - %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Photo uploaded but failed to retrieve user"})
		return
	}

	log.Printf("UploadProfilePhoto: %s photo uploaded for %s - URL: %s", photoType, email, publicURL)
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("%s photo uploaded successfully", photoType),
		"url":     publicURL,
		"user":    updatedUser,
	})
}

// isValidImageType checks if the filename has a valid image extension
func isValidImageType(filename string) bool {
	validExtensions := []string{".jpg", ".jpeg", ".png", ".webp"}
	filename = strings.ToLower(filename)
	for _, ext := range validExtensions {
		if strings.HasSuffix(filename, ext) {
			return true
		}
	}
	return false
}

// sanitizeEmailForPath replaces @ with _at_ for safe use in file paths
func sanitizeEmailForPath(email string) string {
	return strings.ReplaceAll(email, "@", "_at_")
}
