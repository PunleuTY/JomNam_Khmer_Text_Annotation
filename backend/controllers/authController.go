package controllers

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"backend/middleware"
	"backend/models"

	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// AuthController handles authentication operations
type AuthController struct {
    firebaseAuth   *auth.Client
    userCollection *mongo.Collection
}

// NewAuthController creates a new instance of AuthController
func NewAuthController(firebaseAuth *auth.Client, userCollection *mongo.Collection) *AuthController {
    return &AuthController{
        firebaseAuth:   firebaseAuth,
        userCollection: userCollection,
    }
}

// SetAuthCookie exchanges a Firebase ID token for a secure HTTP-only cookie.
// This enables cookie-based authentication for subsequent requests.
// Also creates or updates the user record in MongoDB if it's a new user.
//
// Request body:
//   - token (required): Firebase ID token from client
//
// Response:
//   - Success: { "message": "Authentication successful", "user": {...} }
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

    // Get or create user in MongoDB
    user, err := ac.getOrCreateUser(c.Request.Context(), decodedToken)
    if err != nil {
        log.Printf("SetAuthCookie: Failed to get/create user - %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user record"})
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
    c.JSON(http.StatusOK, gin.H{
        "message": "Authentication successful",
        "user":    user,
    })
}

// getOrCreateUser retrieves an existing user or creates a new one in MongoDB
func (ac *AuthController) getOrCreateUser(ctx context.Context, token *auth.Token) (*models.User, error) {
    // Try to find existing user by email
    var existingUser models.User
    err := ac.userCollection.FindOne(ctx, bson.M{"email": token.Claims["email"]}).Decode(&existingUser)
    
    if err == nil {
        // User exists, update last login time
        update := bson.M{
            "$set": bson.M{
                "updated_at": time.Now(),
            },
        }
        _, err = ac.userCollection.UpdateOne(ctx, bson.M{"email": token.Claims["email"]}, update)
        if err != nil {
            log.Printf("Failed to update user last login: %v", err)
        }
        return &existingUser, nil
    }
    
    if err != mongo.ErrNoDocuments {
        // Some other error occurred
        return nil, err
    }

    // User doesn't exist, create new user
    name := ""
    if nameVal, ok := token.Claims["name"]; ok {
        name = nameVal.(string)
    }
    
    email := ""
    if emailVal, ok := token.Claims["email"]; ok {
        email = emailVal.(string)
    }

    newUser := models.NewUser(token.UID, name, email)
    
    result, err := ac.userCollection.InsertOne(ctx, newUser)
    if err != nil {
        return nil, err
    }

    newUser.ID = result.InsertedID.(primitive.ObjectID)
    log.Printf("Created new user: %s (%s)", newUser.Email, newUser.FirebaseUID)
    
    return newUser, nil
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