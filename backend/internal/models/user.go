package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	PasswordHash string    `json:"-"`
	StudentID    string    `json:"student_id,omitempty"`
	Role         UserRole  `json:"role"`
	Department   string    `json:"department,omitempty"`
	Institution  string    `json:"institution,omitempty"`
	ClubName     string    `json:"club_name,omitempty"`
	IsActive     bool      `json:"is_active"`
	IsApproved   bool      `json:"is_approved"`
	CreatedAt    time.Time `json:"created_at"`
}
