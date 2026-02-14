package store

import "blockcred-backend/internal/models"

// Store defines the interface for data storage operations
type Store interface {
	// User operations
	CreateUser(user models.User) (models.User, error)
	ListUsers() ([]models.User, error)
	GetUserByEmail(email string) (models.User, error)
	GetUserByID(id string) (models.User, error)
	GetUserByStudentID(studentID string) (models.User, error)
	UpdateUser(userID string, updates models.User) (models.User, error)
	DeleteUser(userID string) error

	// Role operations (dynamic RBAC)
	CreateRole(role models.Role) (models.Role, error)
	ListRoles() ([]models.Role, error)
	GetRoleByID(id string) (models.Role, error)
	UpdateRole(id string, updates models.Role) (models.Role, error)
	DeleteRole(id string) error

	// Department operations
	CreateDepartment(dept models.Department) (models.Department, error)
	ListDepartments() ([]models.Department, error)
	UpdateDepartment(id string, updates models.Department) (models.Department, error)
	DeleteDepartment(id string) error

	// Credential type configuration operations
	CreateCredentialType(ct models.CredentialTypeConfig) (models.CredentialTypeConfig, error)
	ListCredentialTypes() ([]models.CredentialTypeConfig, error)
	GetCredentialTypeByName(name string) (models.CredentialTypeConfig, error)
	UpdateCredentialType(id string, updates models.CredentialTypeConfig) (models.CredentialTypeConfig, error)
	DeleteCredentialType(id string) error

	// Certificate operations
	CreateCertificate(cert models.Certificate) (models.Certificate, error)
	GetCertificateByID(id string) (models.Certificate, error)
	GetCertificateByCertID(certID string) (models.Certificate, error)
	ListCertificates() ([]models.Certificate, error)
	ListCertificatesByStudent(studentID string) ([]models.Certificate, error)
	ListCertificatesByStudentUserID(studentUserIDHex string, fallbackStudentID string) ([]models.Certificate, error)
	ListCertificatesByIssuer(issuerID string) ([]models.Certificate, error)
	UpdateCertificate(certID string, updates models.Certificate) (models.Certificate, error)
	DeleteCertificate(certID string) error

	// Credential operations
	CreateCredential(credential models.Credential) (models.Credential, error)
	ListCredentials() ([]models.Credential, error)
	GetCredentialsByStudentID(studentID string) ([]models.Credential, error)

	// Course and result-detail operations (add-result Excel upload)
	UpsertCourses(courses []models.Course) error
	UpsertResultDetails(rows []models.ResultDetail) error

	// Cleanup
	Close() error
}
