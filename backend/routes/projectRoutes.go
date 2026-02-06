package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// ProjectRoutes sets up all project management routes.
// Routes:
//   - POST /projects - Create a new project
//   - GET /projects - List all projects
//   - GET /projects/stats/total - Get total images across all projects
//   - GET /projects/:id - Get project details by ID
//   - PUT /projects/:id - Update project by ID
//   - DELETE /projects/:id - Delete project by ID
//   - GET /projects/:id/images - Get images in a specific project
//   - GET /projects/:id/stats - Get image statistics for a project
func ProjectRoutes(router gin.IRouter, projectCollection, imageCollection *mongo.Collection) {
    projectGroup := router.Group("/projects")
    {
        // Create new project
        projectGroup.POST("", controllers.CreateProject(projectCollection))

        // List all projects
        projectGroup.GET("", controllers.GetProjects(projectCollection))

        // Get total images across all projects
        projectGroup.GET("/stats/total", controllers.GetTotalImagesAllProjects(imageCollection))

        // Get project by ID
        projectGroup.GET("/:id", controllers.GetProjectByID(projectCollection))

        // Update project by ID
        projectGroup.PUT("/:id", controllers.UpdateProject(projectCollection))

        // Delete project by ID
        projectGroup.DELETE("/:id", controllers.DeleteProject(projectCollection))

        // Get images in a specific project
        projectGroup.GET("/:id/images", controllers.GetImagesByProject(imageCollection, projectCollection))

        // Get image statistics for a project
        projectGroup.GET("/:id/stats", controllers.GetProjectImageStats(imageCollection))
    }
}