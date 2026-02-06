package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// UserRoutes sets up all user-related routes.
// Routes:
//   - GET /users/profile (protected) - Get current user profile
//   - PUT /users/profile (protected) - Update current user profile
func UserRoutes(router gin.IRouter, userCollection *mongo.Collection) {
	userController := controllers.NewUserController(userCollection)

	userGroup := router.Group("/users")
	{
		userGroup.GET("/profile", userController.GetCurrentUserProfile)
		userGroup.PUT("/profile", userController.UpdateCurrentUserProfile)
	}
}
