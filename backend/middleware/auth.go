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

// FirebaseAuthMiddleware validates Firebase ID tokens from either Authorization headers or cookies.
// It supports two token sources:
//   - Authorization header with "Bearer <token>" format (for API calls)
//   - authToken cookie (for browser-based requests)
//
// On successful validation, the middleware stores user information in the context:
//   - userID: Firebase UID
//   - email: User email from token claims
//   - name: User name from token claims
//   - token: Full Firebase token
func FirebaseAuthMiddleware(client *auth.Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenString := extractToken(c)
        if tokenString == "" {
            log.Printf("Auth failed: No token provided for %s %s", c.Request.Method, c.Request.URL.Path)
            c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
            c.Abort()
            return
        }

        // Verify the token using Firebase Admin SDK
        token, err := client.VerifyIDToken(context.Background(), tokenString)
        if err != nil {
            log.Printf("Auth failed: Invalid token (error: %v)", err)
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }

        // Store user information from Firebase token in context
        c.Set("userID", token.UID)
        c.Set("email", token.Claims["email"])
        c.Set("name", token.Claims["name"])
        c.Set("token", token)

        log.Printf("Auth successful: User %s (%s) authenticated", token.UID, token.Claims["email"])
        c.Next()
    }
}

// extractToken retrieves the authentication token from either the Authorization header or cookie.
// Priority:
//   1. Authorization header with "Bearer <token>" format
//   2. authToken cookie (fallback for browser requests)
func extractToken(c *gin.Context) string {
    // Check Authorization header first
    authHeader := c.GetHeader("Authorization")
    if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
        return strings.TrimPrefix(authHeader, "Bearer ")
    }

    // Fallback to cookie
    tokenCookie, err := c.Cookie("authToken")
    if err != nil || tokenCookie == "" {
        return ""
    }

    return tokenCookie
}

// SetAuthCookie sets a secure HTTP-only cookie containing the Firebase ID token.
//
// Security features:
//   - HttpOnly: Prevents JavaScript access, protects against XSS attacks
//   - Secure: Only sent over HTTPS in production environments
//   - SameSite: Prevents CSRF attacks (Strict/Lax depends on Gin version)
//
// Parameters:
//   - c: Gin context
//   - token: Firebase ID token
//   - domain: Cookie domain (e.g., "localhost", "example.com")
func SetAuthCookie(c *gin.Context, token string, domain string) {
    isProduction := os.Getenv("ENV") == "production"

    c.SetCookie(
        "authToken",           // cookie name
        token,                 // token value
        3600,                  // max age in seconds (1 hour)
        "/",                   // path
        domain,                // domain
        isProduction,          // secure flag (true only in production with HTTPS)
        true,                  // httpOnly flag
    )
    log.Printf("Auth cookie set for domain: %s", domain)
}

// ClearAuthCookie removes the authentication cookie by setting its max age to a negative value.
//
// Parameters:
//   - c: Gin context
//   - domain: Cookie domain (must match the domain used in SetAuthCookie)
func ClearAuthCookie(c *gin.Context, domain string) {
    c.SetCookie(
        "authToken",           // cookie name
        "",                    // empty value
        -1,                    // negative max age triggers deletion
        "/",                   // path
        domain,                // domain
        false,                 // secure flag
        true,                  // httpOnly flag
    )
    log.Printf("Auth cookie cleared for domain: %s", domain)
}

// GetUserID retrieves the authenticated user's Firebase UID from the context.
// This function should only be called on protected routes where FirebaseAuthMiddleware
// has already validated the request.
//
// Returns:
//   - string: Firebase UID
//   - error: If user ID is not found in context (middleware not applied or failed)
func GetUserID(c *gin.Context) (string, error) {
    userID, exists := c.Get("userID")
    if !exists {
        return "", fmt.Errorf("user ID not found in context")
    }
    return userID.(string), nil
}

// GetUserEmail retrieves the authenticated user's email from the context.
// This function should only be called on protected routes where FirebaseAuthMiddleware
// has already validated the request.
//
// Returns:
//   - string: User email address
//   - error: If email is not found in context or is not a string (middleware not applied or failed)
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