package controllers

import (
	"context"
	"log"
	"net/http"
	"time"

	"backend/middleware"
	"backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// UserController handles user-related operations
type UserController struct {
	userCollection *mongo.Collection
}

// NewUserController creates a new instance of UserController
func NewUserController(userCollection *mongo.Collection) *UserController {
	return &UserController{
		userCollection: userCollection,
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
