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
	Role        models.UserRole  `json:"role"`
	Department  string           `json:"department"`
	Institution string           `json:"institution"`
	ClubName    string           `json:"club_name"`
}

type RegisterStudentInput struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Password    string `json:"password"`
	TenthMarks  int    `json:"tenth_marks"`
	SchoolName  string `json:"school_name"`
	PassingYear int    `json:"passing_year"`
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
	studentID := generateStudentID(in.Name, in.SchoolName, in.PassingYear, in.TenthMarks)
	user := models.User{
		Name:       in.Name,
		Email:      strings.TrimSpace(in.Email),
		Phone:      in.Phone,
		Role:       models.RoleStudent,
		StudentID:  studentID,
		IsActive:   true,
		IsApproved: false,
		CreatedAt:  time.Now(),
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

func generateStudentID(name, school string, passingYear int, marks int) string {
	nameInit := initials(name)
	schoolInit := initials(school)
	if marks < 0 {
		marks = 0
	}
	if marks > 99 {
		marks = marks % 100
	}
	return strings.ToUpper(schoolInit) + fmt.Sprintf("%04d", passingYear) + fmt.Sprintf("%02d", marks) + strings.ToUpper(nameInit)
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
