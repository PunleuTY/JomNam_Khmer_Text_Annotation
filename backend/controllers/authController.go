package controllers

import (
	"net/http"

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
func (ac *AuthController) SetAuthCookie(c *gin.Context) {
	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Verify the Firebase token
	_, err := ac.firebaseAuth.VerifyIDToken(c.Request.Context(), req.Token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Firebase token"})
		return
	}

	// Set secure HTTP-only cookie
	middleware.SetAuthCookie(c, req.Token)

	c.JSON(http.StatusOK, gin.H{"message": "Authentication successful"})
}

// Logout clears the auth cookie
func (ac *AuthController) Logout(c *gin.Context) {
	middleware.ClearAuthCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser returns current user info from cookie
func (ac *AuthController) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	email, _ := c.Get("email")

	c.JSON(http.StatusOK, gin.H{
		"userId": userID,
		"email":  email,
	})
}