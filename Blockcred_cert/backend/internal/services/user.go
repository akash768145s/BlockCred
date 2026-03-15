package services

import (
	"fmt"
	"log"
	"strings"
	"time"
	"unicode"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
)

type UserService struct {
	store store.Store
}

func NewUserService(s store.Store) *UserService {
	return &UserService{store: s}
}

func (u *UserService) List() ([]models.User, error) {
	return u.store.ListUsers()
}

type OnboardInput struct {
	Name        string           `json:"name"`
	Email       string           `json:"email"`
	Phone       string           `json:"phone"`
	Password    string           `json:"password"`
	Role        models.UserRole  `json:"role"`
	Department  string           `json:"department"`
	Institution string           `json:"institution"`
	ClubName    string           `json:"club_name"`
}

type RegisterStudentInput struct {
	Name             string `json:"name"`
	Email            string `json:"email"`
	Phone            string `json:"phone"`
	Password         string `json:"password"`
	DOB              string `json:"dob"`
	SchoolName       string `json:"school_name"`
	FatherName       string `json:"father_name"`
	AadharNumber     string `json:"aadhar_number"`
	TenthSchool      string `json:"tenth_school"`
	TenthMarks       int    `json:"tenth_marks"`
	TwelfthSchool    string `json:"twelfth_school"`
	TwelfthMarks     int    `json:"twelfth_marks"`
	Cutoff           int    `json:"cutoff"`
	Department       string `json:"department"` // Added department field
}

type UpdateUserInput struct {
	Name             string          `json:"name,omitempty"`
	Email            string          `json:"email,omitempty"`
	Phone            string          `json:"phone,omitempty"`
	Role             models.UserRole `json:"role"` // Remove omitempty to ensure role is always processed when sent
	DOB              string          `json:"dob,omitempty"`
	SchoolName       string          `json:"school_name,omitempty"`
	FatherName       string          `json:"father_name,omitempty"`
	AadharNumber     string          `json:"aadhar_number,omitempty"`
	TenthSchool      string          `json:"tenth_school,omitempty"`
	TenthMarks       int             `json:"tenth_marks,omitempty"`
	TwelfthSchool    string          `json:"twelfth_school,omitempty"`
	TwelfthMarks     int             `json:"twelfth_marks,omitempty"`
	Cutoff           int             `json:"cutoff,omitempty"`
	Department       string          `json:"department,omitempty"`
	Institution      string          `json:"institution,omitempty"`
	ClubName         string          `json:"club_name,omitempty"`
	IsActive         *bool           `json:"is_active,omitempty"`
	IsApproved       *bool           `json:"is_approved,omitempty"`
}

func (u *UserService) Onboard(in OnboardInput) (models.User, error) {
	user := models.User{
		Name:        in.Name,
		Email:       strings.TrimSpace(in.Email),
		Phone:       in.Phone,
		Role:        in.Role,
		Department:  in.Department,
		Institution: in.Institution,
		ClubName:    in.ClubName,
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now(),
	}
	return u.store.CreateUser(user)
}

func (u *UserService) RegisterStudent(in RegisterStudentInput) (models.User, error) {
	studentID := generateStudentID(in.Name, in.SchoolName, in.TenthMarks, in.TwelfthMarks)
	user := models.User{
		Name:           in.Name,
		Email:          strings.TrimSpace(in.Email),
		Phone:          in.Phone,
		Role:           models.RoleStudent,
		StudentID:      studentID,
		DOB:            in.DOB,
		SchoolName:     in.SchoolName,
		FatherName:     in.FatherName,
		AadharNumber:   in.AadharNumber,
		TenthSchool:    in.TenthSchool,
		TenthMarks:     in.TenthMarks,
		TwelfthSchool:  in.TwelfthSchool,
		TwelfthMarks:   in.TwelfthMarks,
		Cutoff:         in.Cutoff,
		Department:     in.Department, // Added department field
		IsActive:       true,
		IsApproved:     false,
		NodeAssigned:   false,
		CreatedAt:      time.Now(),
	}
	return u.store.CreateUser(user)
}

func (u *UserService) Approve(userID string) (models.User, error) {
	user, err := u.store.GetUserByID(userID)
	if err != nil {
		return models.User{}, fmt.Errorf("user not found: %w", err)
	}
	
	user.IsApproved = true
	user.IsActive = true
	return u.store.UpdateUser(userID, user)
}

func (u *UserService) UpdateUser(userID string, in UpdateUserInput) (models.User, error) {
	// Get existing user
	existingUser, err := u.store.GetUserByID(userID)
	if err != nil {
		return models.User{}, fmt.Errorf("user not found: %w", err)
	}

	// Update only provided fields
	if in.Name != "" {
		existingUser.Name = in.Name
	}
	if in.Email != "" {
		existingUser.Email = strings.TrimSpace(in.Email)
	}
	if in.Phone != "" {
		existingUser.Phone = in.Phone
	}
	// Update role if provided (for staff users)
	// Always update role if it's provided and not empty
	if in.Role != "" {
		log.Printf("Updating role from %s to %s for user %s", existingUser.Role, in.Role, userID)
		existingUser.Role = in.Role
		// Clear role-specific fields when role changes to avoid data inconsistency
		// If changing to COE, clear department and club_name
		if in.Role == models.RoleCOE {
			existingUser.Department = ""
			existingUser.ClubName = ""
		}
		// If changing to Department Faculty, clear club_name
		if in.Role == models.RoleDepartmentFaculty {
			existingUser.ClubName = ""
		}
		// If changing to Club Coordinator, ensure department is set (handled below)
	} else {
		log.Printf("No role provided in update request for user %s, keeping existing role: %s", userID, existingUser.Role)
	}
	if in.DOB != "" {
		existingUser.DOB = in.DOB
	}
	if in.SchoolName != "" {
		existingUser.SchoolName = in.SchoolName
	}
	if in.FatherName != "" {
		existingUser.FatherName = in.FatherName
	}
	if in.AadharNumber != "" {
		existingUser.AadharNumber = in.AadharNumber
	}
	if in.TenthSchool != "" {
		existingUser.TenthSchool = in.TenthSchool
	}
	if in.TenthMarks != 0 {
		existingUser.TenthMarks = in.TenthMarks
	}
	if in.TwelfthSchool != "" {
		existingUser.TwelfthSchool = in.TwelfthSchool
	}
	if in.TwelfthMarks != 0 {
		existingUser.TwelfthMarks = in.TwelfthMarks
	}
	if in.Cutoff != 0 {
		existingUser.Cutoff = in.Cutoff
	}
	// Always update department if provided (even if empty string)
	// This ensures department selection from dropdown is saved
		existingUser.Department = in.Department
	if in.Institution != "" {
		existingUser.Institution = in.Institution
	}
	if in.ClubName != "" {
		existingUser.ClubName = in.ClubName
	}
	if in.IsActive != nil {
		existingUser.IsActive = *in.IsActive
	}
	if in.IsApproved != nil {
		existingUser.IsApproved = *in.IsApproved
	}

	return u.store.UpdateUser(userID, existingUser)
}

func (u *UserService) DeleteUser(userID string) error {
	// Check if user exists
	_, err := u.store.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	return u.store.DeleteUser(userID)
}

func generateStudentID(name, school string, tenthMarks, twelfthMarks int) string {
	nameInit := initials(name)
	schoolInit := initials(school)
	
	// Use average of 10th and 12th marks
	avgMarks := (tenthMarks + twelfthMarks) / 2
	if avgMarks < 0 {
		avgMarks = 0
	}
	if avgMarks > 99 {
		avgMarks = avgMarks % 100
	}
	
	// Use current year for student ID
	currentYear := time.Now().Year()
	return strings.ToUpper(schoolInit) + fmt.Sprintf("%04d", currentYear) + fmt.Sprintf("%02d", avgMarks) + strings.ToUpper(nameInit)
}

func initials(s string) string {
	parts := strings.Fields(s)
	out := make([]rune, 0, 3)
	for _, p := range parts {
		for _, r := range p {
			if unicode.IsLetter(r) {
				out = append(out, r)
				break
			}
		}
		if len(out) >= 3 {
			break
		}
	}
	return string(out)
}
