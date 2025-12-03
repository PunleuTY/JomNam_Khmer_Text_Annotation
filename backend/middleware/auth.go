package middleware

import (
	"context"
	"net/http"
	"strings"

	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
)

func FirebaseAuthMiddleware(client *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try Authorization header first (for API calls)
		authHeader := c.GetHeader("Authorization")
		var tokenString string

		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// Fallback to cookie
			tokenCookie, err := c.Cookie("authToken")
			if err != nil || tokenCookie == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
				c.Abort()
				return
			}
			tokenString = tokenCookie
		}

		token, err := client.VerifyIDToken(context.Background(), tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Add user info to context
		c.Set("userID", token.UID)
		c.Set("email", token.Claims["email"])
		c.Next()
	}
}

// SetAuthCookie sets a secure HTTP-only cookie with the JWT token
func SetAuthCookie(c *gin.Context, token string) {
	c.SetCookie(
		"authToken",     // name
		token,           // value
		3600,            // max age (1 hour)
		"/",             // path
		"localhost",     // domain (change for production)
		false,           // secure (set to true in production with HTTPS)
		true,            // httpOnly
	)
}

// ClearAuthCookie removes the auth token cookie
func ClearAuthCookie(c *gin.Context) {
	c.SetCookie(
		"authToken",
		"",
		-1,              // negative max age to delete
		"/",
		"localhost",
		false,
		true,
	)
}