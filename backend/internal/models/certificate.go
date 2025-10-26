package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Certificate represents a digital certificate issued to a student
type Certificate struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CertID       string             `bson:"cert_id" json:"cert_id"`           // keccak256(fileHash + studentId + issuedAt)
	StudentID    string             `bson:"student_id" json:"student_id"`     // Student's unique ID
	IssuerID     string             `bson:"issuer_id" json:"issuer_id"`       // COE/Dept/Club user ID
	CertType     CredentialType     `bson:"cert_type" json:"cert_type"`       // marksheet, degree, bonafide, etc.
	FileHash     string             `bson:"file_hash" json:"file_hash"`       // SHA256 hash of the certificate file
	IPFSCID      string             `bson:"ipfs_cid" json:"ipfs_cid"`         // IPFS Content Identifier
	IPFSURL      string             `bson:"ipfs_url" json:"ipfs_url"`         // Full IPFS URL
	TxHash       string             `bson:"tx_hash" json:"tx_hash"`           // Blockchain transaction hash
	BlockNumber  uint64             `bson:"block_number" json:"block_number"` // Block number where tx was mined
	Status       CertificateStatus  `bson:"status" json:"status"`             // issued, verified, revoked
	IssuedAt     time.Time          `bson:"issued_at" json:"issued_at"`
	VerifiedAt   *time.Time         `bson:"verified_at,omitempty" json:"verified_at,omitempty"`
	RevokedAt    *time.Time         `bson:"revoked_at,omitempty" json:"revoked_at,omitempty"`
	RevokeReason string             `bson:"revoke_reason,omitempty" json:"revoke_reason,omitempty"`
	Metadata     CertificateMetadata `bson:"metadata" json:"metadata"`         // Additional certificate data
	CreatedAt    time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time          `bson:"updated_at" json:"updated_at"`
}

// CertificateStatus represents the status of a certificate
type CertificateStatus string

const (
	CertStatusIssued   CertificateStatus = "issued"
	CertStatusVerified CertificateStatus = "verified"
	CertStatusRevoked  CertificateStatus = "revoked"
)

// CertificateMetadata contains additional information about the certificate
type CertificateMetadata struct {
	StudentName    string    `bson:"student_name" json:"student_name"`
	StudentEmail   string    `bson:"student_email" json:"student_email"`
	IssuerName     string    `bson:"issuer_name" json:"issuer_name"`
	IssuerRole     UserRole  `bson:"issuer_role" json:"issuer_role"`
	Institution    string    `bson:"institution" json:"institution"`
	Department     string    `bson:"department,omitempty" json:"department,omitempty"`
	Course         string    `bson:"course,omitempty" json:"course,omitempty"`
	Semester       string    `bson:"semester,omitempty" json:"semester,omitempty"`
	AcademicYear   string    `bson:"academic_year,omitempty" json:"academic_year,omitempty"`
	Grade          string    `bson:"grade,omitempty" json:"grade,omitempty"`
	CGPA           float64   `bson:"cgpa,omitempty" json:"cgpa,omitempty"`
	ValidFrom      time.Time `bson:"valid_from" json:"valid_from"`
	ValidUntil     time.Time `bson:"valid_until" json:"valid_until"`
	Description    string    `bson:"description,omitempty" json:"description,omitempty"`
	AdditionalData map[string]interface{} `bson:"additional_data,omitempty" json:"additional_data,omitempty"`
}

// IssueCertificateRequest represents the request to issue a certificate
type IssueCertificateRequest struct {
	StudentID     string           `json:"student_id" validate:"required"`
	CertType      CredentialType   `json:"cert_type" validate:"required"`
	FileData      []byte           `json:"file_data" validate:"required"` // Base64 encoded file
	FileName      string           `json:"file_name" validate:"required"`
	Metadata      CertificateMetadata `json:"metadata" validate:"required"`
}

// VerifyCertificateRequest represents the request to verify a certificate
type VerifyCertificateRequest struct {
	CertID string `json:"cert_id" validate:"required"`
}

// CertificateVerificationResult represents the result of certificate verification
type CertificateVerificationResult struct {
	IsValid      bool             `json:"is_valid"`
	CertID       string           `json:"cert_id"`
	StudentID    string           `json:"student_id"`
	IssuerID     string           `json:"issuer_id"`
	CertType     CredentialType   `json:"cert_type"`
	Status       CertificateStatus `json:"status"`
	IssuedAt     time.Time        `json:"issued_at"`
	IPFSURL      string           `json:"ipfs_url"`
	TxHash       string           `json:"tx_hash"`
	BlockNumber  uint64           `json:"block_number"`
	Metadata     CertificateMetadata `json:"metadata"`
	ErrorMessage string           `json:"error_message,omitempty"`
}
