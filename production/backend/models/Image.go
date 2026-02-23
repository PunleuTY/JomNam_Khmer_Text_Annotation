package models

import (
	"encoding/json"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// type Point struct {
// 	X int `bson:"x" json:"x"`
// 	Y int `bson:"y" json:"y"`
// }

//	type Rect struct {
//		X int `bson:"x" json:"x"`
//		Y int `bson:"y" json:"y"`
//		W int `bson:"w" json:"w"`
//		H int `bson:"h" json:"h"`
//	}
type Point struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
}
type Rect struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
	W float64 `bson:"w" json:"w"`
	H float64 `bson:"h" json:"h"`
}

type Annotation struct {
    Accuracy *float64 `bson:"accuracy" json:"accuracy"`
    GT       string   `bson:"gt" json:"gt"`
    ID       string   `bson:"id" json:"id"`
    Label    string   `bson:"label" json:"label"`
    Rect     Rect     `bson:"rect" json:"rect"`
	POINTS	[]Point  `bson:"points,omitempty" json:"points,omitempty"`
    Text     string   `bson:"text" json:"text"`
    Type     string   `bson:"type" json:"type"`
    // Url      string   `bson:"url" json:"url"` // 🔹 new field for cropped base64
}
type Meta struct {
	Tool      string `bson:"tool,omitempty" json:"tool"`
	Lang      string `bson:"lang,omitempty" json:"lang"`
	Timestamp string `bson:"timestamp,omitempty" json:"timestamp"`
}

type Image struct {
    ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    ProjectID   primitive.ObjectID `bson:"project_id" json:"project_id"`
    Name        string             `bson:"name" json:"name"`
    Path        string             `bson:"path" json:"path"`
    Base64      string             `bson:"base64" json:"base64"`
    Width       int                `bson:"width" json:"width"`
    Height      int                `bson:"height" json:"height"`
    Status      string             `bson:"status" json:"status"`
    Annotations []Annotation       `bson:"annotations" json:"annotations"`
    Meta        Meta               `bson:"meta" json:"meta"`
    CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
    UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type Project struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at,omitempty" json:"updated_at,omitempty"`
	Status      string             `bson:"status,omitempty" json:"status"` // active/archived/deleted
	Lang        string             `bson:"lang,omitempty" json:"lang"`
	TS          int64              `bson:"ts" json:"ts"`
	CurrentID   primitive.ObjectID `bson:"current_id,omitempty" json:"current_id"`
}

type ExportResponse struct {
	Meta        Meta                       `json:"meta"`
	Images      []map[string]interface{}   `json:"images"`
	Annotations map[string]json.RawMessage `json:"annotations"`
}
