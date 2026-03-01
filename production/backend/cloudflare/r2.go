package cloudflare

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// R2Client wraps the S3 client for Cloudflare R2 operations
type R2Client struct {
	client     *s3.Client
	bucketName string
}

// NewR2Client creates a new Cloudflare R2 client using S3-compatible API
func NewR2Client() (*R2Client, error) {
	accountID := os.Getenv("CLOUDFLARE_ACCOUNT_ID")
	accessKeyID := os.Getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
	bucketName := os.Getenv("CLOUDFLARE_R2_BUCKET_NAME")
	endpoint := os.Getenv("CLOUDFLARE_R2_ENDPOINT")

	if accountID == "" || accessKeyID == "" || secretAccessKey == "" || bucketName == "" || endpoint == "" {
		return nil, fmt.Errorf("missing required Cloudflare R2 environment variables")
	}

	// Create AWS config with static credentials for R2
	cfg := aws.Config{
		Region: "auto",
		Credentials: credentials.NewStaticCredentialsProvider(
			accessKeyID,
			secretAccessKey,
			"",
		),
	}

	// Create S3 client with R2 endpoint
	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true // R2 requires path-style addressing
	})

	log.Printf("R2 Client initialized successfully for bucket: %s", bucketName)

	return &R2Client{
		client:     client,
		bucketName: bucketName,
	}, nil
}

// UploadFile uploads a file to Cloudflare R2
// Returns the object key (path within bucket)
func (r *R2Client) UploadFile(ctx context.Context, file *multipart.FileHeader, objectKey string) (string, error) {
	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	// Read file content into buffer
	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(src); err != nil {
		return "", fmt.Errorf("failed to read file content: %w", err)
	}

	// Determine content type from file extension
	contentType := getContentType(file.Filename)

	// Upload to R2
	_, err = r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r.bucketName),
		Key:         aws.String(objectKey),
		Body:        bytes.NewReader(buf.Bytes()),
		ContentType: aws.String(contentType),
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload to R2: %w", err)
	}

	log.Printf("Successfully uploaded file to R2: %s", objectKey)
	return objectKey, nil
}

// DeleteFile deletes a file from Cloudflare R2
func (r *R2Client) DeleteFile(ctx context.Context, objectKey string) error {
	_, err := r.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(objectKey),
	})

	if err != nil {
		return fmt.Errorf("failed to delete from R2: %w", err)
	}

	log.Printf("Successfully deleted file from R2: %s", objectKey)
	return nil
}

// GenerateObjectKey creates the object key for R2 storage
// Format: datasets/{email}_{projectID}_{originalFilename}
func GenerateObjectKey(email, projectID, filename string) string {
	// Sanitize email (replace @ and dots with underscores for cleaner paths)
	sanitizedEmail := strings.ReplaceAll(email, "@", "_at_")
	sanitizedEmail = strings.ReplaceAll(sanitizedEmail, ".", "_")
	
	// Create the object key
	objectKey := fmt.Sprintf("datasets/%s_%s_%s", sanitizedEmail, projectID, filename)
	return objectKey
}

// GetPublicURL constructs the public URL for an R2 object
func GetPublicURL(objectKey string) string {
	publicEndpoint := os.Getenv("CLOUDFLARE_R2_PUBLIC_ENDPOINT")
	if publicEndpoint == "" {
		log.Println("Warning: CLOUDFLARE_R2_PUBLIC_ENDPOINT not set")
		return ""
	}
	
	// Remove trailing slash from endpoint if present
	publicEndpoint = strings.TrimSuffix(publicEndpoint, "/")
	
	return fmt.Sprintf("%s/%s", publicEndpoint, objectKey)
}

// getContentType determines the MIME type based on file extension
func getContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".webp":
		return "image/webp"
	case ".bmp":
		return "image/bmp"
	case ".svg":
		return "image/svg+xml"
	default:
		return "application/octet-stream"
	}
}
