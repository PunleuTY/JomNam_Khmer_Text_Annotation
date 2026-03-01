package controllers

import (
	"context"
	"log"
	"net/http"
	"time"

	"backend/cloudflare"
	"backend/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const dbTimeout = 10 * time.Second

// CreateProject creates a new project in the database.
//
// Request body:
//   - name (required): Project name
//   - description (optional): Project description
//   - lang (optional): Language code (e.g., "khm" for Khmer)
//
// Response:
//   - Success: { "project": <project object> }
//   - Error: { "error": "<error message>" }
func CreateProject(projectCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req struct {
            Name        string `json:"name" binding:"required"`
            Description string `json:"description"`
            Lang        string `json:"lang"`
        }

        if err := c.ShouldBindJSON(&req); err != nil {
            log.Printf("CreateProject: Invalid request body - %v", err)
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // Create new project document
        project := models.Project{
            Name:        req.Name,
            Description: req.Description,
            Status:      "active",
            Lang:        req.Lang,
            TS:          time.Now().Unix(),
            CreatedAt:   time.Now(),
        }

        ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
        defer cancel()

        // Insert project into database
        res, err := projectCollection.InsertOne(ctx, project)
        if err != nil {
            log.Printf("CreateProject: Failed to insert project - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
            return
        }

        // Set the inserted ID
        project.ID = res.InsertedID.(primitive.ObjectID)

        log.Printf("CreateProject: Project created with ID %s", project.ID.Hex())
        c.JSON(http.StatusOK, gin.H{"project": project})
    }
}

// GetProjects retrieves all projects from the database.
//
// Response:
//   - Success: { "projects": [<project objects>] }
//   - Error: { "error": "<error message>" }
func GetProjects(projectCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
        defer cancel()

        // Query all projects
        cursor, err := projectCollection.Find(ctx, bson.M{})
        if err != nil {
            log.Printf("GetProjects: Failed to fetch projects - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
            return
        }
        defer cursor.Close(ctx)

        // Decode all projects
        projects := []models.Project{}
        if err := cursor.All(ctx, &projects); err != nil {
            log.Printf("GetProjects: Failed to decode projects - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode projects"})
            return
        }

        log.Printf("GetProjects: Retrieved %d projects", len(projects))
        c.JSON(http.StatusOK, gin.H{"projects": projects})
    }
}

// GetProjectByID retrieves a single project by its ID.
//
// Path parameters:
//   - id: MongoDB ObjectID of the project
//
// Response:
//   - Success: { "project": <project object> }
//   - Error: { "error": "<error message>" }
func GetProjectByID(projectCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        idStr := c.Param("id")

        // Parse the project ID
        projectID, err := primitive.ObjectIDFromHex(idStr)
        if err != nil {
            log.Printf("GetProjectByID: Invalid project ID format - %s", idStr)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
            return
        }

        ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
        defer cancel()

        // Query project by ID
        var project models.Project
        err = projectCollection.FindOne(ctx, bson.M{"_id": projectID}).Decode(&project)
        if err != nil {
            log.Printf("GetProjectByID: Project not found - %s", idStr)
            c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
            return
        }

        log.Printf("GetProjectByID: Retrieved project %s", projectID.Hex())
        c.JSON(http.StatusOK, gin.H{"project": project})
    }
}

// UpdateProject updates project information.
//
// Path parameters:
//   - id: MongoDB ObjectID of the project
//
// Request body:
//   - name (optional): New project name
//   - description (optional): New description
//   - status (optional): Project status (active/archived/deleted)
//   - lang (optional): Language code
//
// Response:
//   - Success: { "message": "Project updated successfully" }
//   - Error: { "error": "<error message>" }
func UpdateProject(projectCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        idStr := c.Param("id")

        // Parse the project ID
        projectID, err := primitive.ObjectIDFromHex(idStr)
        if err != nil {
            log.Printf("UpdateProject: Invalid project ID format - %s", idStr)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
            return
        }

        var req struct {
            Name        string `json:"name"`
            Description string `json:"description"`
            Status      string `json:"status"`
            Lang        string `json:"lang"`
        }

        if err := c.ShouldBindJSON(&req); err != nil {
            log.Printf("UpdateProject: Invalid request body - %v", err)
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
        defer cancel()

        // Build update document with only provided fields
        update := bson.M{
            "$set": bson.M{
                "name":       req.Name,
                "description": req.Description,
                "status":     req.Status,
                "lang":       req.Lang,
                "updated_at": time.Now(),
            },
        }

        // Update project
        _, err = projectCollection.UpdateByID(ctx, projectID, update)
        if err != nil {
            log.Printf("UpdateProject: Failed to update project %s - %v", idStr, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
            return
        }

        log.Printf("UpdateProject: Project %s updated successfully", projectID.Hex())
        c.JSON(http.StatusOK, gin.H{"message": "Project updated successfully"})
    }
}

// DeleteProject deletes a project from the database.
//
// Path parameters:
//   - id: MongoDB ObjectID of the project
//
// Response:
//   - Success: { "message": "Project deleted successfully" }
//   - Error: { "error": "<error message>" }
func DeleteProject(projectCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        idStr := c.Param("id")

        // Parse the project ID
        projectID, err := primitive.ObjectIDFromHex(idStr)
        if err != nil {
            log.Printf("DeleteProject: Invalid project ID format - %s", idStr)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
            return
        }

        ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
        defer cancel()

        // Delete project
        _, err = projectCollection.DeleteOne(ctx, bson.M{"_id": projectID})
        if err != nil {
            log.Printf("DeleteProject: Failed to delete project %s - %v", idStr, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
            return
        }

        log.Printf("DeleteProject: Project %s deleted successfully", projectID.Hex())
        c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
    }
}

// GetImagesByProject retrieves all images associated with a specific project
// and updates the project's last accessed timestamp.
//
// Path parameters:
//   - id: MongoDB ObjectID of the project
//
// Response:
//   - Success: [<image objects>]
//   - Error: { "error": "<error message>" }
func GetImagesByProject(imageCollection *mongo.Collection, projectCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        projectIDStr := c.Param("id")

        // Parse the project ID
        projectID, err := primitive.ObjectIDFromHex(projectIDStr)
        if err != nil {
            log.Printf("GetImagesByProject: Invalid project ID format - %s", projectIDStr)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
            return
        }

        ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
        defer cancel()

        // Update project's last accessed timestamp
        _, err = projectCollection.UpdateByID(
            ctx,
            projectID,
            bson.M{"$set": bson.M{"updated_at": time.Now()}},
        )
        if err != nil {
            log.Printf("GetImagesByProject: Failed to update project timestamp - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project timestamp"})
            return
        }

        // Fetch images linked to this project
        filter := bson.M{"project_id": projectID}
        cursor, err := imageCollection.Find(ctx, filter)
        if err != nil {
            log.Printf("GetImagesByProject: Failed to fetch images - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
            return
        }
        defer cursor.Close(ctx)

        // Decode all images
        var images []models.Image
        if err := cursor.All(ctx, &images); err != nil {
            log.Printf("GetImagesByProject: Failed to decode images - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode images"})
            return
        }

        // Enhance images with public URLs for frontend
        enhancedImages := make([]map[string]interface{}, 0, len(images))
        for _, img := range images {
            imageMap := map[string]interface{}{
                "id":          img.ID,
                "project_id":  img.ProjectID,
                "name":        img.Name,
                "path":        img.Path,
                "url":         cloudflare.GetPublicURL(img.Path), // Add public URL
                "width":       img.Width,
                "height":      img.Height,
                "status":      img.Status,
                "annotations": img.Annotations,
                "meta":        img.Meta,
                "created_at":  img.CreatedAt,
                "updated_at":  img.UpdatedAt,
            }
            enhancedImages = append(enhancedImages, imageMap)
        }

        log.Printf("GetImagesByProject: Retrieved %d images for project %s", len(images), projectID.Hex())
        c.JSON(http.StatusOK, enhancedImages)
    }
}

// GetProjectImageStats returns image statistics for a specific project.
// Statistics include total images and count of annotated images.
//
// Path parameters:
//   - id: MongoDB ObjectID of the project
//
// Response:
//   - Success: { "project_id": "<id>", "total_images": <count>, "annotated_images": <count> }
//   - Error: { "error": "<error message>" }
func GetProjectImageStats(imageCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        projectIDStr := c.Param("id")

        // Parse the project ID
        projectID, err := primitive.ObjectIDFromHex(projectIDStr)
        if err != nil {
            log.Printf("GetProjectImageStats: Invalid project ID format - %s", projectIDStr)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
            return
        }

        ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
        defer cancel()

        // Count total images for the project
        totalFilter := bson.M{"project_id": projectID}
        totalCount, err := imageCollection.CountDocuments(ctx, totalFilter)
        if err != nil {
            log.Printf("GetProjectImageStats: Failed to count total images - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count total images"})
            return
        }

        // Count annotated images (images with at least one annotation)
        annotatedFilter := bson.M{"project_id": projectID, "annotations.0": bson.M{"$exists": true}}
        annotatedCount, err := imageCollection.CountDocuments(ctx, annotatedFilter)
        if err != nil {
            log.Printf("GetProjectImageStats: Failed to count annotated images - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count annotated images"})
            return
        }

        log.Printf("GetProjectImageStats: Project %s - Total: %d, Annotated: %d", projectID.Hex(), totalCount, annotatedCount)
        c.JSON(http.StatusOK, gin.H{
            "project_id":       projectIDStr,
            "total_images":     totalCount,
            "annotated_images": annotatedCount,
        })
    }
}

// GetTotalImagesAllProjects returns image statistics across all projects.
// Statistics include total images and count of annotated images.
//
// Response:
//   - Success: { "total_images": <count>, "annotated_images": <count> }
//   - Error: { "error": "<error message>" }
func GetTotalImagesAllProjects(imageCollection *mongo.Collection) gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx, cancel := context.WithTimeout(context.Background(), dbTimeout)
        defer cancel()

        // Count total images across all projects
        totalCount, err := imageCollection.CountDocuments(ctx, bson.M{})
        if err != nil {
            log.Printf("GetTotalImagesAllProjects: Failed to count total images - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count total images"})
            return
        }

        // Count annotated images across all projects
        annotatedFilter := bson.M{"annotations.0": bson.M{"$exists": true}}
        annotatedCount, err := imageCollection.CountDocuments(ctx, annotatedFilter)
        if err != nil {
            log.Printf("GetTotalImagesAllProjects: Failed to count annotated images - %v", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count annotated images"})
            return
        }

        log.Printf("GetTotalImagesAllProjects: Total: %d, Annotated: %d", totalCount, annotatedCount)
        c.JSON(http.StatusOK, gin.H{
            "total_images":     totalCount,
            "annotated_images": annotatedCount,
        })
    }
}