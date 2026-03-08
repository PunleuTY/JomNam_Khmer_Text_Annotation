package routes

import (
	"backend/cloudflare"
	"backend/controllers"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// ImageRoutes sets up all image upload and annotation routes.
// Routes:
//   - POST /images/upload - Upload images to a project (requires R2 client)
//   - POST /images/save-groundtruth - Save ground truth annotations for images
func ImageRoutes(router gin.IRouter, imageCollection *mongo.Collection, r2Client *cloudflare.R2Client) {
    imagesGroup := router.Group("/images")
    {
        // Upload images (requires R2 client)
        imagesGroup.POST("/upload", controllers.UploadImages(imageCollection, r2Client))

        // Save ground truth annotations
        imagesGroup.POST("/save-groundtruth", controllers.SaveGroundTruth(imageCollection))
        // Trigger OCR for an existing image (pulls from Cloudflare and sends to ML)
        imagesGroup.POST("/:id/ocr", controllers.TriggerOCR(imageCollection, r2Client))
    }
}

// DEPRECATED: SetupRoutes is maintained for backwards compatibility.
// Use ImageRoutes instead with proper authentication middleware.
func SetupRoutes(router *gin.Engine, imageCollection *mongo.Collection, r2Client *cloudflare.R2Client) {
    router.POST("/upload", controllers.UploadImages(imageCollection, r2Client))
    router.POST("/save-groundtruth", controllers.SaveGroundTruth(imageCollection))
}