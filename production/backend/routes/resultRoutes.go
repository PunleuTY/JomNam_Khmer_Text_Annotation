package routes

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// ResultRoutes sets up all result/annotation routes.
// These routes should be protected by authentication in production.
// Routes:
//   - POST /results - Create a new annotation result
//   - GET /results - Retrieve all annotation results
func ResultRoutes(router gin.IRouter, collection *mongo.Collection) {
    resultsGroup := router.Group("/results")
    {
        // Create new annotation result
        resultsGroup.POST("", createResult(collection))

        // Retrieve all annotation results
        resultsGroup.GET("", getAllResults(collection))
    }
}

// createResult handles POST /results - Create a new annotation result
func createResult(collection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        const timeout = 5 * time.Second
        var result map[string]interface{}

        // Parse request body
        if err := c.BindJSON(&result); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // Insert result into database with timeout
        ctx, cancel := context.WithTimeout(context.Background(), timeout)
        defer cancel()

        _, err := collection.InsertOne(ctx, result)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save result"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"status": "success", "result": result})
    }
}

// getAllResults handles GET /results - Retrieve all annotation results
func getAllResults(collection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        const timeout = 5 * time.Second
        var results []bson.M

        // Query all results from database with timeout
        ctx, cancel := context.WithTimeout(context.Background(), timeout)
        defer cancel()

        cursor, err := collection.Find(ctx, bson.M{})
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch results"})
            return
        }
        defer cursor.Close(ctx)

        // Decode results
        if err = cursor.All(ctx, &results); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse results"})
            return
        }

        c.JSON(http.StatusOK, results)
    }
}

// DEPRECATED: SetupResultRoutes is maintained for backwards compatibility.
// Use ResultRoutes instead with proper authentication middleware.
func SetupResultRoutes(router *gin.Engine, collection *mongo.Collection) {
    router.POST("/api/results", createResult(collection))
    router.GET("/api/results", getAllResults(collection))
}