package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name          string             `bson:"name" json:"name"`
	Email         string             `bson:"email" json:"email"`
	Phone         string             `bson:"phone" json:"phone"`
	PasswordHash  string             `bson:"password_hash" json:"-"`
	StudentID     string             `bson:"student_id,omitempty" json:"student_id,omitempty"`
	// Legacy role field kept for backward compatibility.
	// New code should use RoleID / RoleName and the Role collection.
	Role          UserRole           `bson:"role,omitempty" json:"role,omitempty"`
	// Dynamic role reference
	RoleID        *primitive.ObjectID `bson:"role_id,omitempty" json:"role_id,omitempty"`
	RoleName      string              `bson:"role_name,omitempty" json:"role_name,omitempty"`
	// Department is now modeled as a separate collection, but this string
	// field is kept for backward compatibility and display purposes.
	Department    string             `bson:"department,omitempty" json:"department,omitempty"`
	Institution   string             `bson:"institution,omitempty" json:"institution,omitempty"`
	ClubName      string             `bson:"club_name,omitempty" json:"club_name,omitempty"`
	DOB           string             `bson:"dob,omitempty" json:"dob,omitempty"`
	SchoolName    string             `bson:"school_name,omitempty" json:"school_name,omitempty"`
	FatherName    string             `bson:"father_name,omitempty" json:"father_name,omitempty"`
	AadharNumber  string             `bson:"aadhar_number,omitempty" json:"aadhar_number,omitempty"`
	TenthSchool   string             `bson:"tenth_school,omitempty" json:"tenth_school,omitempty"`
	TenthMarks    float64            `bson:"tenth_marks,omitempty" json:"tenth_marks,omitempty"`
	TwelfthSchool string             `bson:"twelfth_school,omitempty" json:"twelfth_school,omitempty"`
	TwelfthMarks  float64            `bson:"twelfth_marks,omitempty" json:"twelfth_marks,omitempty"`
	Cutoff        int                `bson:"cutoff,omitempty" json:"cutoff,omitempty"`
	IsActive      bool               `bson:"is_active" json:"is_active"`
	IsApproved    bool               `bson:"is_approved" json:"is_approved"`
	NodeAssigned  bool               `bson:"node_assigned" json:"node_assigned"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
}

// CanPerformAction checks if a user can perform a specific action
func (u *User) CanPerformAction(permission string) bool {
	return CanPerformAction(u.Role, permission)
}

