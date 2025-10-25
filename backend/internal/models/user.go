package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name         string             `bson:"name" json:"name"`
	Email        string             `bson:"email" json:"email"`
	Phone        string             `bson:"phone" json:"phone"`
	PasswordHash string             `bson:"password_hash" json:"-"`
	StudentID    string             `bson:"student_id,omitempty" json:"student_id,omitempty"`
	Role         UserRole           `bson:"role" json:"role"`
	Department   string             `bson:"department,omitempty" json:"department,omitempty"`
	Institution  string             `bson:"institution,omitempty" json:"institution,omitempty"`
	ClubName     string             `bson:"club_name,omitempty" json:"club_name,omitempty"`
	IsActive     bool               `bson:"is_active" json:"is_active"`
	IsApproved   bool               `bson:"is_approved" json:"is_approved"`
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
}
