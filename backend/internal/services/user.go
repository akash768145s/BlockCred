package services

import (
	"fmt"
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
	// Role is the legacy role string (e.g. "coe"). Kept for backward compatibility.
	Role        models.UserRole  `json:"role,omitempty"`
	// RoleID is the dynamic RBAC role document id (hex ObjectID).
	RoleID      string           `json:"role_id,omitempty"`
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
	SchoolName       string `json:"school_name,omitempty"` // Optional, will use tenth_school or twelfth_school if empty
	FatherName       string `json:"father_name"`
	AadharNumber     string `json:"aadhar_number"`
	TenthSchool      string  `json:"tenth_school"`
	TenthMarks       float64 `json:"tenth_marks"`
	TwelfthSchool    string  `json:"twelfth_school"`
	TwelfthMarks     float64 `json:"twelfth_marks"`
	Cutoff           int     `json:"cutoff"`
	Department       string `json:"department"` // Added department field
}

type UpdateUserInput struct {
	Name             string          `json:"name,omitempty"`
	Email            string          `json:"email,omitempty"`
	Phone            string          `json:"phone,omitempty"`
	Role             models.UserRole `json:"role,omitempty"`
	RoleID           string          `json:"role_id,omitempty"`
	DOB              string          `json:"dob,omitempty"`
	SchoolName       string          `json:"school_name,omitempty"`
	FatherName       string          `json:"father_name,omitempty"`
	AadharNumber     string          `json:"aadhar_number,omitempty"`
	TenthSchool      string          `json:"tenth_school,omitempty"`
	TenthMarks       float64         `json:"tenth_marks,omitempty"`
	TwelfthSchool    string          `json:"twelfth_school,omitempty"`
	TwelfthMarks     float64         `json:"twelfth_marks,omitempty"`
	Cutoff           int             `json:"cutoff,omitempty"`
	Department       string          `json:"department,omitempty"`
	Institution      string          `json:"institution,omitempty"`
	ClubName         string          `json:"club_name,omitempty"`
	IsActive         *bool           `json:"is_active,omitempty"`
	IsApproved       *bool           `json:"is_approved,omitempty"`
}

func (u *UserService) Onboard(in OnboardInput) (models.User, error) {
	var roleDoc *models.Role
	if strings.TrimSpace(in.RoleID) != "" {
		r, err := u.store.GetRoleByID(strings.TrimSpace(in.RoleID))
		if err != nil {
			return models.User{}, fmt.Errorf("invalid role_id: %w", err)
		}
		roleDoc = &r
	}

	// Validate legacy role if provided and no role_id
	if roleDoc == nil && strings.TrimSpace(string(in.Role)) != "" && !models.IsValidRole(string(in.Role)) {
		return models.User{}, fmt.Errorf("invalid role: %s", in.Role)
	}
	
	user := models.User{
		Name:        in.Name,
		Email:       strings.TrimSpace(in.Email),
		Phone:       in.Phone,
		PasswordHash: in.Password, // Store password as hash (plain for now; use bcrypt in production)
		Role:        in.Role,
		Department:  in.Department,
		Institution: in.Institution,
		ClubName:    in.ClubName,
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now(),
	}

	// If dynamic role was provided, attach it (and best-effort legacy mapping)
	if roleDoc != nil {
		user.RoleID = &roleDoc.ID
		user.RoleName = roleDoc.Name

		// If legacy Role wasn't provided, map from role name for backward compatibility.
		if strings.TrimSpace(string(in.Role)) == "" {
			if legacy, ok := legacyRoleFromName(roleDoc.Name); ok {
				user.Role = legacy
			}
		}
	}

	return u.store.CreateUser(user)
}

func legacyRoleFromName(name string) (models.UserRole, bool) {
	n := strings.ToLower(strings.TrimSpace(name))
	switch n {
	case "admin", "ssn main admin", "ssn_main_admin":
		return models.RoleSSNMainAdmin, true
	case "coe", "controller of examinations":
		return models.RoleCOE, true
	case "faculty", "department faculty", "department_faculty":
		return models.RoleDepartmentFaculty, true
	case "club", "club coordinator", "club_coordinator", "clubcoordinator":
		return models.RoleClubCoordinator, true
	case "student verifier", "student_verifier":
		return models.RoleStudentVerifier, true
	case "external verifier", "external_verifier", "verifier":
		return models.RoleExternalVerifier, true
	default:
		return "", false
	}
}

func (u *UserService) RegisterStudent(in RegisterStudentInput) (models.User, error) {
	// Use school_name if provided, otherwise use tenth_school, or twelfth_school as fallback
	schoolName := in.SchoolName
	if schoolName == "" {
		if in.TenthSchool != "" {
			schoolName = in.TenthSchool
		} else if in.TwelfthSchool != "" {
			schoolName = in.TwelfthSchool
		}
	}
	
	// Password: use part of email before @ if not provided (e.g. john.doe@gmail.com → john.doe)
	passwordPlain := strings.TrimSpace(in.Password)
	if passwordPlain == "" && in.Email != "" {
		if idx := strings.Index(in.Email, "@"); idx > 0 {
			passwordPlain = in.Email[:idx]
		}
	}
	if passwordPlain == "" {
		passwordPlain = "student"
	}

	studentID := generateStudentID(in.Name, schoolName, int(in.TenthMarks), int(in.TwelfthMarks))
	user := models.User{
		Name:           in.Name,
		Email:          strings.TrimSpace(in.Email),
		Phone:          in.Phone,
		PasswordHash:   passwordPlain, // stored as plain for now; use bcrypt in production
		Role:           models.RoleStudent,
		StudentID:      studentID,
		DOB:            in.DOB,
		SchoolName:     schoolName,
		FatherName:     in.FatherName,
		AadharNumber:   in.AadharNumber,
		TenthSchool:    in.TenthSchool,
		TenthMarks:     in.TenthMarks,
		TwelfthSchool:  in.TwelfthSchool,
		TwelfthMarks:   in.TwelfthMarks,
		Cutoff:         in.Cutoff,
		Department:     in.Department,
		IsActive:       true,
		IsApproved:     false,
		NodeAssigned:   false,
		CreatedAt:      time.Now(),
	}

	// Attach dynamic "Student" role (RoleID/RoleName) so login can route using role.dashboard_route (/student).
	// If the role isn't present (misconfigured DB), we keep the legacy enum Role only.
	if roles, err := u.store.ListRoles(); err == nil {
		for _, r := range roles {
			if strings.EqualFold(strings.TrimSpace(r.Name), "student") {
				user.RoleID = &r.ID
				user.RoleName = r.Name
				break
			}
		}
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
	// Update role: prefer role_id (dynamic), else legacy role string
	if strings.TrimSpace(in.RoleID) != "" {
		r, err := u.store.GetRoleByID(strings.TrimSpace(in.RoleID))
		if err != nil {
			return models.User{}, fmt.Errorf("invalid role_id: %w", err)
		}
		existingUser.RoleID = &r.ID
		existingUser.RoleName = r.Name
		if legacy, ok := legacyRoleFromName(r.Name); ok {
			existingUser.Role = legacy
		}
		if r.Name == "COE" || existingUser.Role == models.RoleCOE {
			existingUser.Department = ""
			existingUser.ClubName = ""
		}
		if existingUser.Role == models.RoleDepartmentFaculty {
			existingUser.ClubName = ""
		}
	} else if in.Role != "" {
		existingUser.Role = in.Role
		if in.Role == models.RoleCOE {
			existingUser.Department = ""
			existingUser.ClubName = ""
		}
		if in.Role == models.RoleDepartmentFaculty {
			existingUser.ClubName = ""
		}
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
	existingUser.ClubName = in.ClubName
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
