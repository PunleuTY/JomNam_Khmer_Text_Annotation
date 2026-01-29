package routes

import (
    "log"

    "backend/controllers"

    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/mongo"
)

func ProjectRoutes(router gin.IRouter, projectCollection, imageCollection *mongo.Collection) {
    projectGroup := router.Group("/projects")
    {
        // POST /projects - Create new project
        projectGroup.POST("", controllers.CreateProject(projectCollection))
        log.Println("✅ Route: POST /api/projects")

        // GET /projects - List all projects
        projectGroup.GET("", controllers.GetProjects(projectCollection))
        log.Println("✅ Route: GET /api/projects")

        // GET /projects/stats/total - Get total images across all projects
        projectGroup.GET("/stats/total", controllers.GetTotalImagesAllProjects(imageCollection))
        log.Println("✅ Route: GET /api/projects/stats/total")

        // GET /projects/:id - Get project details
        projectGroup.GET("/:id", controllers.GetProjectByID(projectCollection))
        log.Println("✅ Route: GET /api/projects/:id")

        // PUT /projects/:id - Update project
        projectGroup.PUT("/:id", controllers.UpdateProject(projectCollection))
        log.Println("✅ Route: PUT /api/projects/:id")

        // DELETE /projects/:id - Delete project
        projectGroup.DELETE("/:id", controllers.DeleteProject(projectCollection))
        log.Println("✅ Route: DELETE /api/projects/:id")

        // GET /projects/:id/images - Get images in project
        projectGroup.GET("/:id/images", controllers.GetImagesByProject(imageCollection, projectCollection))
        log.Println("✅ Route: GET /api/projects/:id/images")

        // GET /projects/:id/stats - Get stats (total/annotated images) for a project
        projectGroup.GET("/:id/stats", controllers.GetProjectImageStats(imageCollection))
        log.Println("✅ Route: GET /api/projects/:id/stats")
    }
}