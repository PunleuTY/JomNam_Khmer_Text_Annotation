package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a user in the MongoDB database
type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FirebaseUID  string            `bson:"firebase_uid" json:"firebase_uid"` // Firebase UID for linking
	Name         string            `bson:"name" json:"name"`
	Email        string            `bson:"email" json:"email"` // Used as unique identifier
	ProfilePhoto string            `bson:"profile_photo" json:"profilePhoto"`
	CoverPhoto   string            `bson:"cover_photo" json:"coverPhoto"`
	Bio          string            `bson:"bio" json:"bio"`
	PhoneNumber  string            `bson:"phone_number" json:"phoneNumber"`
	Role         string            `bson:"role" json:"role"`
	Organization string            `bson:"organization" json:"organization"`
	CreatedAt    time.Time         `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time         `bson:"updated_at" json:"updated_at"`
}

// NewUser creates a new User instance with required fields
func NewUser(firebaseUID, name, email string) *User {
	now := time.Now()
	return &User{
		FirebaseUID:  firebaseUID,
		Name:         name,
		Email:        email,
		ProfilePhoto: "",
		CoverPhoto:   "",
		Bio:          "",
		PhoneNumber:  "",
		Role:         "",
		Organization: "",
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}
