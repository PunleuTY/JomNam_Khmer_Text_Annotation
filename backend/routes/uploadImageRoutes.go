package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// ImageRoutes sets up all image upload and annotation routes.
// Routes:
//   - POST /images/upload - Upload images to a project
//   - POST /images/save-groundtruth - Save ground truth annotations for images
func ImageRoutes(router gin.IRouter, imageCollection *mongo.Collection) {
    imagesGroup := router.Group("/images")
    {
        // Upload images
        imagesGroup.POST("/upload", controllers.UploadImages(imageCollection))

        // Save ground truth annotations
        imagesGroup.POST("/save-groundtruth", controllers.SaveGroundTruth(imageCollection))
    }
}

// DEPRECATED: SetupRoutes is maintained for backwards compatibility.
// Use ImageRoutes instead with proper authentication middleware.
func SetupRoutes(router *gin.Engine, imageCollection *mongo.Collection) {
    router.POST("/upload", controllers.UploadImages(imageCollection))
    router.POST("/save-groundtruth", controllers.SaveGroundTruth(imageCollection))
}