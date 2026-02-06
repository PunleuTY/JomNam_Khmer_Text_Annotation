package routes

import (
	"backend/controllers"
	"backend/middleware"

	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
)

// AuthRoutes sets up all authentication-related routes.
// Routes:
//   - POST /auth/set-cookie (public) - Set authentication cookie
//   - POST /auth/logout (public) - Logout and clear authentication
//   - GET /auth/me (protected) - Get current authenticated user information
func AuthRoutes(router gin.IRouter, firebaseAuth *auth.Client) {
    authController := controllers.NewAuthController(firebaseAuth)

    authGroup := router.Group("/auth")
    {
        // Public endpoints
        authGroup.POST("/set-cookie", authController.SetAuthCookie)
        authGroup.POST("/logout", authController.Logout)

        // Protected endpoints - require valid Firebase authentication
        authGroup.GET("/me", middleware.FirebaseAuthMiddleware(firebaseAuth), authController.GetCurrentUser)
    }
}