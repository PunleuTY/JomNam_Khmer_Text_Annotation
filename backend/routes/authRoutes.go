package routes

import (
	"backend/controllers"
	"backend/middleware"

	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
)

func AuthRoutes(router gin.IRouter, firebaseAuth *auth.Client) {
	authController := controllers.NewAuthController(firebaseAuth)

	authGroup := router.Group("/auth")
	{
		// Public endpoints
		authGroup.POST("/set-cookie", authController.SetAuthCookie)
		authGroup.POST("/logout", authController.Logout)

		// Protected endpoint - requires authentication
		authGroup.GET("/me", middleware.FirebaseAuthMiddleware(firebaseAuth), authController.GetCurrentUser)
	}
}
