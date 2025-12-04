package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func ProjectRoutes(router *gin.Engine, projectCollection, imageCollection *mongo.Collection) {
	projectGroup := router.Group("/projects")
	{
		projectGroup.POST("", controllers.CreateProject(projectCollection))
		projectGroup.GET("", controllers.GetProjects(projectCollection))
		projectGroup.GET("/:id", controllers.GetProjectByID(projectCollection))
		projectGroup.PUT("/:id", controllers.UpdateProject(projectCollection))
		projectGroup.DELETE("/:id", controllers.DeleteProject(projectCollection))
		//get image by project
		router.GET("/projects/:id/images", controllers.GetImagesByProject(imageCollection, projectCollection))
		// get stats (total/annotated images) for a project
		router.GET("/projects/:id/stats", controllers.GetProjectImageStats(imageCollection))
		// get total images across all projects
		router.GET("/projects/stats/total", controllers.GetTotalImagesAllProjects(imageCollection))

	}
}
