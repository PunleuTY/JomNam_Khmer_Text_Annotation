package controllers

import (
	"log"
	"net/http"
	"os"

	"backend/middleware"

	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
)

type AuthController struct {
	firebaseAuth *auth.Client
}

func NewAuthController(firebaseAuth *auth.Client) *AuthController {
	return &AuthController{
		firebaseAuth: firebaseAuth,
	}
}

// SetAuthCookie exchanges Firebase token for secure HTTP-only cookie
// Request body: { "token": "<firebase_id_token>" }
// Response: { "message": "Authentication successful" }
func (ac *AuthController) SetAuthCookie(c *gin.Context) {
	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ SetAuthCookie: Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Verify the Firebase token
	decodedToken, err := ac.firebaseAuth.VerifyIDToken(c.Request.Context(), req.Token)
	if err != nil {
		log.Printf("❌ SetAuthCookie: Invalid Firebase token - %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Firebase token"})
		return
	}

	// Get cookie domain from environment or use localhost as default
	domain := os.Getenv("COOKIE_DOMAIN")
	if domain == "" {
		domain = "localhost"
	}

	// Set secure HTTP-only cookie
	middleware.SetAuthCookie(c, req.Token, domain)

	log.Printf("✅ SetAuthCookie: User %s authenticated via token", decodedToken.UID)
	c.JSON(http.StatusOK, gin.H{"message": "Authentication successful"})
}

// Logout clears the auth cookie
// Response: { "message": "Logged out successfully" }
func (ac *AuthController) Logout(c *gin.Context) {
	domain := os.Getenv("COOKIE_DOMAIN")
	if domain == "" {
		domain = "localhost"
	}

	middleware.ClearAuthCookie(c, domain)
	log.Printf("✅ Logout: User logged out")
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser returns current user info from context
// Requires authentication middleware
// Response: { "userId": "<uid>", "email": "<email>", "name": "<name>" }
func (ac *AuthController) GetCurrentUser(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		log.Printf("❌ GetCurrentUser: User not authenticated")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	email, _ := middleware.GetUserEmail(c)
	name, _ := c.Get("name")

	log.Printf("✅ GetCurrentUser: Retrieved user %s", userID)
	c.JSON(http.StatusOK, gin.H{
		"userId": userID,
		"email":  email,
		"name":   name,
	})
}