package controllers

import (
	"log"
	"net/http"
	"os"

	"backend/middleware"

	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
)

// AuthController handles authentication operations
type AuthController struct {
    firebaseAuth *auth.Client
}

// NewAuthController creates a new instance of AuthController
func NewAuthController(firebaseAuth *auth.Client) *AuthController {
    return &AuthController{
        firebaseAuth: firebaseAuth,
    }
}

// SetAuthCookie exchanges a Firebase ID token for a secure HTTP-only cookie.
// This enables cookie-based authentication for subsequent requests.
//
// Request body:
//   - token (required): Firebase ID token from client
//
// Response:
//   - Success: { "message": "Authentication successful" }
//   - Error: { "error": "<error message>" }
func (ac *AuthController) SetAuthCookie(c *gin.Context) {
    var req struct {
        Token string `json:"token" binding:"required"`
    }

    // Parse and validate request body
    if err := c.ShouldBindJSON(&req); err != nil {
        log.Printf("SetAuthCookie: Invalid request body - %v", err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
        return
    }

    // Verify the Firebase token
    decodedToken, err := ac.firebaseAuth.VerifyIDToken(c.Request.Context(), req.Token)
    if err != nil {
        log.Printf("SetAuthCookie: Invalid Firebase token - %v", err)
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Firebase token"})
        return
    }

    // Get cookie domain from environment or default to localhost
    domain := os.Getenv("COOKIE_DOMAIN")
    if domain == "" {
        domain = "localhost"
    }

    // Set secure HTTP-only cookie
    middleware.SetAuthCookie(c, req.Token, domain)

    log.Printf("SetAuthCookie: User %s authenticated successfully", decodedToken.UID)
    c.JSON(http.StatusOK, gin.H{"message": "Authentication successful"})
}

// Logout clears the authentication cookie, logging out the user.
//
// Response:
//   - Success: { "message": "Logged out successfully" }
func (ac *AuthController) Logout(c *gin.Context) {
    // Get cookie domain from environment or default to localhost
    domain := os.Getenv("COOKIE_DOMAIN")
    if domain == "" {
        domain = "localhost"
    }

    // Clear the authentication cookie
    middleware.ClearAuthCookie(c, domain)

    log.Printf("Logout: User logged out successfully")
    c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser returns the current authenticated user's information.
// This endpoint requires authentication middleware to have validated the request.
//
// Response:
//   - Success: { "userId": "<uid>", "email": "<email>", "name": "<name>" }
//   - Error: { "error": "Not authenticated" }
func (ac *AuthController) GetCurrentUser(c *gin.Context) {
    // Retrieve user ID from context (set by authentication middleware)
    userID, err := middleware.GetUserID(c)
    if err != nil {
        log.Printf("GetCurrentUser: User not authenticated")
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
        return
    }

    // Retrieve email and name from context
    email, _ := middleware.GetUserEmail(c)
    name, _ := c.Get("name")

    log.Printf("GetCurrentUser: Retrieved user info for %s", userID)
    c.JSON(http.StatusOK, gin.H{
        "userId": userID,
        "email":  email,
        "name":   name,
    })
}