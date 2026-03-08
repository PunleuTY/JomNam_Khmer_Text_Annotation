package routes

import (
	"backend/cloudflare"
	"backend/controllers"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// UserRoutes sets up all user-related routes.
// Routes:
//   - GET /users/profile (protected) - Get current user profile
//   - PUT /users/profile (protected) - Update current user profile
//   - POST /users/upload-photo (protected) - Upload profile or cover photo
func UserRoutes(router gin.IRouter, userCollection *mongo.Collection, r2Client *cloudflare.R2Client) {
	userController := controllers.NewUserController(userCollection, r2Client)

	userGroup := router.Group("/users")
	{
		userGroup.GET("/profile", userController.GetCurrentUserProfile)
		userGroup.PUT("/profile", userController.UpdateCurrentUserProfile)
		// Upload profile or cover photo
		userGroup.POST("/upload-photo", userController.UploadProfilePhoto)
	}
}
