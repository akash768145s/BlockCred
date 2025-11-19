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

	// Certificate operations
	CreateCertificate(cert models.Certificate) (models.Certificate, error)
	GetCertificateByID(id string) (models.Certificate, error)
	GetCertificateByCertID(certID string) (models.Certificate, error)
	ListCertificates() ([]models.Certificate, error)
	ListCertificatesByStudent(studentID string) ([]models.Certificate, error)
	ListCertificatesByIssuer(issuerID string) ([]models.Certificate, error)
	UpdateCertificate(certID string, updates models.Certificate) (models.Certificate, error)

	// Credential operations
	CreateCredential(credential models.Credential) (models.Credential, error)
	ListCredentials() ([]models.Credential, error)
	GetCredentialsByStudentID(studentID string) ([]models.Credential, error)

	// Cleanup
	Close() error
}
