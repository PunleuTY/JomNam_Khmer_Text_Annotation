package main

import (
	"context"
	"log"
	"os"
	"time"

	"backend/middleware"
	"backend/routes"

	firebase "firebase.google.com/go"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/api/option"
)

func main() {

	// Initialize MongoDB client (updated to use Connect directly)

	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Stores Environment Variables
	MONGODB_URI := os.Getenv("MONGODB_URI")
	MONGODB_DB := os.Getenv("MONGODB_DB")
	IMAGE_COLLECTION := os.Getenv("IMAGE_COLLECTION")
	PROJECT_COLLECTION := os.Getenv("PROJECT_COLLECTION")
	CORS_ORIGIN := os.Getenv("CORS_ORIGIN")
	PORT := os.Getenv("PORT")

	// Validate required environment variables
	if MONGODB_URI == "" {
		log.Fatal("Missing required environment variable: MONGODB_URI")
	}
	if MONGODB_DB == "" {
		log.Fatal("Missing required environment variable: MONGODB_DB")
	}
	if IMAGE_COLLECTION == "" {
		log.Fatal("Missing required environment variable: IMAGE_COLLECTION")
	}
	if PROJECT_COLLECTION == "" {
		log.Fatal("Missing required environment variable: PROJECT_COLLECTION")
	}
	if CORS_ORIGIN == "" {
		log.Fatal("Missing required environment variable: CORS_ORIGIN")
	}
	if PORT == "" {
		log.Fatal("Missing required environment variable: PORT")
	}
	
	// Initialize MongoDB client
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(MONGODB_URI))
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err = client.Disconnect(ctx); err != nil {
			log.Fatal(err)
		}
	}()

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("MongoDB not connected:", err)
	} else {
		log.Println("✅ MongoDB connected successfully")
	}

	// Initialize Firebase
	opt := option.WithCredentialsFile(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"))
	firebaseApp, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatal("Error initializing Firebase app:", err)
	}

	firebaseAuth, err := firebaseApp.Auth(context.Background())
	if err != nil {
		log.Fatal("Error getting Firebase Auth client:", err)
	}
	log.Println("✅ Firebase initialized successfully")

	db := client.Database(MONGODB_DB)
	imageCollection := db.Collection(IMAGE_COLLECTION)
	projectCollection := db.Collection(PROJECT_COLLECTION)

	// Initialize Gin
	router := gin.Default()
	router.Static("/uploads", "./uploads")

	// ----- Add CORS middleware -----
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{CORS_ORIGIN}, // frontend origin from .env
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ----- Setup Routes -----
	// Public auth routes (no authentication required)
	log.Println("📍 Setting up public routes...")
	routes.AuthRoutes(router, firebaseAuth)

	// Protected routes group (require Firebase authentication)
	log.Println("📍 Setting up protected routes...")
	protected := router.Group("/api")
	protected.Use(middleware.FirebaseAuthMiddleware(firebaseAuth))
	{
		// Project routes - POST /api/projects, GET /api/projects, etc.
		routes.ProjectRoutes(protected, projectCollection, imageCollection)
		// Image upload routes - POST /api/images/upload, POST /api/images/save-groundtruth
		routes.ImageRoutes(protected, imageCollection)
		// Result/annotation routes - POST /api/results, GET /api/results
		routes.ResultRoutes(protected, imageCollection)
	}

	// Start server
	log.Printf("🚀 Server starting on %s", PORT)
	router.Run(PORT)
}
