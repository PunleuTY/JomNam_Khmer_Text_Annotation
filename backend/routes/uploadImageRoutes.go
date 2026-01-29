package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// ImageRoutes sets up all image upload routes (protected by authentication)
func ImageRoutes(router gin.IRouter, imageCollection *mongo.Collection) {
	imagesGroup := router.Group("/images")
	{
		// POST /images/upload - Upload images
		imagesGroup.POST("/upload", controllers.UploadImages(imageCollection))
		// POST /images/save-groundtruth - Save ground truth annotations
		imagesGroup.POST("/save-groundtruth", controllers.SaveGroundTruth(imageCollection))
	}
}

// SetupRoutes is deprecated - use ImageRoutes instead with proper authentication
func SetupRoutes(router *gin.Engine, imageCollection *mongo.Collection) {
	router.POST("/upload", controllers.UploadImages(imageCollection))
	router.POST("/save-groundtruth", controllers.SaveGroundTruth(imageCollection))
}
