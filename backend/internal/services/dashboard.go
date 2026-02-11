package services

import (
	"time"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DashboardService struct {
	store store.Store
}

func NewDashboardService(s store.Store) *DashboardService {
	return &DashboardService{store: s}
}

type DashboardStats struct {
	TotalUsers      int `json:"total_users"`
	PendingUsers    int `json:"pending_users"`
	TotalCredentials int `json:"total_credentials"`
	IssuedToday     int `json:"issued_today"`
	VerifiedToday   int `json:"verified_today"`
	TotalIssuers    int `json:"total_issuers"`
	TotalStudents   int `json:"total_students"`
}

func (d *DashboardService) GetStats() (DashboardStats, error) {
	// Fetch all users
	users, err := d.store.ListUsers()
	if err != nil {
		return DashboardStats{}, err
	}

	// Fetch all certificates
	certificates, err := d.store.ListCertificates()
	if err != nil {
		return DashboardStats{}, err
	}

	// Calculate stats
	today := time.Now().Format("2006-01-02")
	
	totalUsers := len(users)
	pendingUsers := 0
	totalIssuers := 0
	totalStudents := 0
	issuedToday := 0
	verifiedToday := 0

	for _, user := range users {
		// Treat any unapproved student as "pending" regardless of IsActive flag
		if !user.IsApproved {
			pendingUsers++
		}
		// Count issuers (COE, Faculty, Club Coordinators)
		if user.Role == models.RoleCOE || user.Role == models.RoleDepartmentFaculty || user.Role == models.RoleClubCoordinator {
			totalIssuers++
		}
		// Count students
		if user.Role == models.RoleStudent {
			totalStudents++
		}
	}

	for _, cert := range certificates {
		// Check if issued today
		if !cert.IssuedAt.IsZero() && cert.IssuedAt.Format("2006-01-02") == today {
			issuedToday++
		}
		// Check if verified today
		if cert.Status == "verified" && cert.VerifiedAt != nil {
			if cert.VerifiedAt.Format("2006-01-02") == today {
				verifiedToday++
			}
		}
	}

	return DashboardStats{
		TotalUsers:      totalUsers,
		PendingUsers:    pendingUsers,
		TotalCredentials: len(certificates),
		IssuedToday:     issuedToday,
		VerifiedToday:   verifiedToday,
		TotalIssuers:    totalIssuers,
		TotalStudents:   totalStudents,
	}, nil
}

type StudentData struct {
	User        models.User         `json:"user"`
	Certificates []models.Certificate `json:"certificates"`
}

func (d *DashboardService) GetStudentData(userID string) (StudentData, error) {
	user, err := d.store.GetUserByID(userID)
	if err != nil {
		return StudentData{}, err
	}

	// Get all certificates for this student
	allCerts, err := d.store.ListCertificates()
	if err != nil {
		return StudentData{}, err
	}

	// Filter certificates for this student
	var studentCerts []models.Certificate
	for _, cert := range allCerts {
		if cert.StudentID == user.StudentID {
			studentCerts = append(studentCerts, cert)
		}
	}

	return StudentData{
		User:        user,
		Certificates: studentCerts,
	}, nil
}

type StudentCredentials struct {
	Profile     StudentProfile      `json:"profile"`
	Credentials []models.Certificate `json:"credentials"`
}

type StudentProfile struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	StudentID     string `json:"student_id"`
	Email         string `json:"email"`
	Department    string `json:"department"`
	Semester      string `json:"semester"`
	GraduationYear string `json:"graduation_year"`
	IsVerified    bool   `json:"is_verified"`
}

func (d *DashboardService) GetStudentCredentials(studentID string) (StudentCredentials, error) {
	user, err := d.store.GetUserByStudentID(studentID)
	if err != nil {
		return StudentCredentials{}, err
	}

	// Get all certificates
	allCerts, err := d.store.ListCertificates()
	if err != nil {
		return StudentCredentials{}, err
	}

	// Filter certificates for this student
	var studentCerts []models.Certificate
	for _, cert := range allCerts {
		if cert.StudentID == studentID {
			studentCerts = append(studentCerts, cert)
		}
	}

	profileID := ""
	if user.ID != primitive.NilObjectID {
		profileID = user.ID.Hex()
	}

	return StudentCredentials{
		Profile: StudentProfile{
			ID:            profileID,
			Name:          user.Name,
			StudentID:     user.StudentID,
			Email:         user.Email,
			Department:    user.Department,
			Semester:      "", // Add if available in user model
			GraduationYear: "", // Add if available in user model
			IsVerified:    user.IsApproved,
		},
		Credentials: studentCerts,
	}, nil
}

