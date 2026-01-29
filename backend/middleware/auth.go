package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
)

func FirebaseAuthMiddleware(client *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try Authorization header first (for API calls from frontend)
		authHeader := c.GetHeader("Authorization")
		var tokenString string

		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// Fallback to cookie (for browser-based requests)
			tokenCookie, err := c.Cookie("authToken")
			if err != nil || tokenCookie == "" {
				log.Printf("❌ Auth failed: No token provided for %s %s", c.Request.Method, c.Request.URL.Path)
				c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
				c.Abort()
				return
			}
			tokenString = tokenCookie
		}

		// Verify the token using Firebase Admin SDK
		token, err := client.VerifyIDToken(context.Background(), tokenString)
		if err != nil {
			log.Printf("❌ Auth failed: Invalid token for user (error: %v)", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract and store user info from Firebase token
		c.Set("userID", token.UID)
		c.Set("email", token.Claims["email"])
		c.Set("name", token.Claims["name"])
		c.Set("token", token)

		log.Printf("✅ Auth successful: User %s (%s) authenticated", token.UID, token.Claims["email"])
		c.Next()
	}
}

// SetAuthCookie sets a secure HTTP-only cookie with the Firebase ID token
// Security considerations:
// - HttpOnly: prevents JavaScript access (protects against XSS)
// - Secure: only sent over HTTPS in production
// - SameSite: prevents CSRF attacks
func SetAuthCookie(c *gin.Context, token string, domain string) {
	isProduction := os.Getenv("ENV") == "production"

	c.SetCookie(
		"authToken",           // name
		token,                 // value
		3600,                  // max age (1 hour)
		"/",                   // path
		domain,                // domain
		isProduction,          // secure (true only in production with HTTPS)
		true,                  // httpOnly
	)
	log.Printf("✅ Auth cookie set for domain: %s", domain)
}

// ClearAuthCookie removes the auth token cookie
func ClearAuthCookie(c *gin.Context, domain string) {
	c.SetCookie(
		"authToken",
		"",
		-1,    // negative max age to delete
		"/",
		domain,
		false,
		true,
	)
	log.Printf("✅ Auth cookie cleared for domain: %s", domain)
}

// GetUserID retrieves the authenticated user ID from context
func GetUserID(c *gin.Context) (string, error) {
	userID, exists := c.Get("userID")
	if !exists {
		return "", fmt.Errorf("user ID not found in context")
	}
	return userID.(string), nil
}

// GetUserEmail retrieves the authenticated user's email from context
func GetUserEmail(c *gin.Context) (string, error) {
	email, exists := c.Get("email")
	if !exists {
		return "", fmt.Errorf("email not found in context")
	}
	emailStr, ok := email.(string)
	if !ok {
		return "", fmt.Errorf("email is not a string")
	}
	return emailStr, nil
}