package routes

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// ResultRoutes sets up all result/annotation routes (protected by authentication)
func ResultRoutes(router gin.IRouter, collection *mongo.Collection) {
	resultsGroup := router.Group("/results")
	{
		// POST /results - Create result/annotation
		resultsGroup.POST("", func(c *gin.Context) {
		var result map[string]interface{}
		if err := c.BindJSON(&result); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err := collection.InsertOne(ctx, result)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save result"})
			return
		}

			c.JSON(http.StatusOK, gin.H{"status": "success", "result": result})
		})
		// GET /results - Fetch all results
		resultsGroup.GET("", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch results"})
			return
		}
		defer cursor.Close(ctx)

		var results []bson.M
		if err = cursor.All(ctx, &results); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse results"})
			return
		}

			c.JSON(http.StatusOK, results)
		})
	}
}

// SetupResultRoutes is deprecated - use ResultRoutes instead with proper authentication
func SetupResultRoutes(router *gin.Engine, collection *mongo.Collection) {
	router.POST("/api/results", func(c *gin.Context) {
		var result map[string]interface{}
		if err := c.BindJSON(&result); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		_, err := collection.InsertOne(ctx, result)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save result"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "success", "result": result})
	})
	router.GET("/api/results", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		cursor, err := collection.Find(ctx, bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch results"})
			return
		}
		defer cursor.Close(ctx)

		var results []bson.M
		if err = cursor.All(ctx, &results); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse results"})
			return
		}

		c.JSON(http.StatusOK, results)
	})
}

// Yanghai's version

// package routes

// import (
// 	"backend/controllers"
// 	"github.com/gin-gonic/gin"
// 	"go.mongodb.org/mongo-driver/mongo"
// )

// func SetupResultRoutes(router *gin.Engine, imageCollection *mongo.Collection) {
// 	resultGroup := router.Group("/results")
// 	{
// 		resultGroup.GET("", controllers.GetResult(imageCollection)) // use query
// 	}
// }
