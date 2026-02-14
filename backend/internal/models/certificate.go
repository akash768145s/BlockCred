package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Certificate represents a digital certificate issued to a student
type Certificate struct {
	ID           primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	CertID       string              `bson:"cert_id" json:"cert_id"`           // keccak256(fileHash + studentId + issuedAt)
	StudentID    string              `bson:"student_id" json:"student_id"`     // Student's unique ID
	IssuerID     string              `bson:"issuer_id" json:"issuer_id"`       // COE/Dept/Club user ID
	CertType     CredentialType      `bson:"cert_type" json:"cert_type"`       // marksheet, degree, bonafide, etc.
	FileHash     string              `bson:"file_hash" json:"file_hash"`       // SHA256 hash of the certificate file
	IPFSCID      string              `bson:"ipfs_cid" json:"ipfs_cid"`         // IPFS Content Identifier
	IPFSURL      string              `bson:"ipfs_url" json:"ipfs_url"`         // Full IPFS URL
	
	// NEW: Cryptographic proofs (DApp architecture)
	IssuerSignature      string    `bson:"issuer_signature,omitempty" json:"issuer_signature,omitempty"`
	IssuerPublicKey       string    `bson:"issuer_public_key,omitempty" json:"issuer_public_key,omitempty"`
	SignedDocument        string    `bson:"signed_document,omitempty" json:"signed_document,omitempty"` // JSON string
	SignedDocumentCID     string    `bson:"signed_document_cid,omitempty" json:"signed_document_cid,omitempty"`
	SignedDocumentURL     string    `bson:"signed_document_url,omitempty" json:"signed_document_url,omitempty"`
	MerkleRoot            string    `bson:"merkle_root,omitempty" json:"merkle_root,omitempty"`
	MerklePath            []string  `bson:"merkle_path,omitempty" json:"merkle_path,omitempty"`
	TransparencyLogIndex   int64     `bson:"transparency_log_index,omitempty" json:"transparency_log_index,omitempty"`
	
	// Optional: Public blockchain anchor
	AnchorTxHash          string    `bson:"anchor_tx_hash,omitempty" json:"anchor_tx_hash,omitempty"`
	AnchorBlockNumber     uint64    `bson:"anchor_block_number,omitempty" json:"anchor_block_number,omitempty"`
	AnchorTimestamp       *time.Time `bson:"anchor_timestamp,omitempty" json:"anchor_timestamp,omitempty"`
	
	// DEPRECATED: Blockchain fields (kept for backward compatibility)
	TxHash       string              `bson:"tx_hash,omitempty" json:"tx_hash,omitempty"`           // Deprecated
	BlockNumber  uint64              `bson:"block_number,omitempty" json:"block_number,omitempty"` // Deprecated
	
	Status       CertificateStatus   `bson:"status" json:"status"`             // issued, verified, revoked
	IssuedAt     time.Time           `bson:"issued_at" json:"issued_at"`
	VerifiedAt   *time.Time          `bson:"verified_at,omitempty" json:"verified_at,omitempty"`
	RevokedAt    *time.Time          `bson:"revoked_at,omitempty" json:"revoked_at,omitempty"`
	RevokeReason string              `bson:"revoke_reason,omitempty" json:"revoke_reason,omitempty"`
	Metadata     CertificateMetadata `bson:"metadata" json:"metadata"` // Additional certificate data
	CreatedAt    time.Time           `bson:"created_at" json:"created_at"`
	UpdatedAt    time.Time           `bson:"updated_at" json:"updated_at"`
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
	StudentName    string                 `bson:"student_name" json:"student_name"`
	StudentEmail   string                 `bson:"student_email" json:"student_email"`
	IssuerName     string                 `bson:"issuer_name" json:"issuer_name"`
	IssuerRole     UserRole               `bson:"issuer_role" json:"issuer_role"`
	Institution    string                 `bson:"institution" json:"institution"`
	Department     string                 `bson:"department,omitempty" json:"department,omitempty"`
	Course         string                 `bson:"course,omitempty" json:"course,omitempty"`
	Semester       string                 `bson:"semester,omitempty" json:"semester,omitempty"`
	AcademicYear   string                 `bson:"academic_year,omitempty" json:"academic_year,omitempty"`
	Grade          string                 `bson:"grade,omitempty" json:"grade,omitempty"`
	CGPA           float64                `bson:"cgpa,omitempty" json:"cgpa,omitempty"`
	ValidFrom      time.Time              `bson:"valid_from" json:"valid_from"`
	ValidUntil     time.Time              `bson:"valid_until" json:"valid_until"`
	Description    string                 `bson:"description,omitempty" json:"description,omitempty"`
	AdditionalData map[string]interface{} `bson:"additional_data,omitempty" json:"additional_data,omitempty"`
	// Extra holds dynamic fields defined in Admin Credential Types (key -> value).
	Extra map[string]interface{} `bson:"extra,omitempty" json:"extra,omitempty"`
}

// IssueCertificateRequest represents the request to issue a certificate
type IssueCertificateRequest struct {
	StudentID string              `json:"student_id" validate:"required"`
	CertType  CredentialType      `json:"cert_type" validate:"required"`
	FileData  []byte              `json:"file_data" validate:"required"` // Base64 encoded file
	FileName  string              `json:"file_name" validate:"required"`
	Metadata  CertificateMetadata `json:"metadata" validate:"required"`
}

// VerifyCertificateRequest represents the request to verify a certificate
type VerifyCertificateRequest struct {
	CertID string `json:"cert_id" validate:"required"`
}

// CertificateVerificationResult represents the result of certificate verification
type CertificateVerificationResult struct {
	IsValid          bool                `json:"is_valid"`
	CertID           string              `json:"cert_id"`
	StudentID        string              `json:"student_id"`
	IssuerID         string              `json:"issuer_id"`
	CertType         CredentialType      `json:"cert_type"`
	Status           CertificateStatus   `json:"status"`
	IssuedAt         time.Time           `json:"issued_at"`
	IPFSURL          string              `json:"ipfs_url"`
	
	// NEW: Cryptographic proofs
	IssuerSignature      string    `json:"issuer_signature,omitempty"`
	IssuerPublicKey       string    `json:"issuer_public_key,omitempty"`
	SignatureVerified     bool      `json:"signature_verified,omitempty"`
	MerkleRoot            string    `json:"merkle_root,omitempty"`
	MerkleProofValid      bool      `json:"merkle_proof_valid,omitempty"`
	TransparencyLogIndex   int64     `json:"transparency_log_index,omitempty"`
	SignedDocumentURL     string    `json:"signed_document_url,omitempty"`
	
	// Optional: Public blockchain anchor
	AnchorTxHash          string    `json:"anchor_tx_hash,omitempty"`
	AnchorBlockNumber     uint64    `json:"anchor_block_number,omitempty"`
	AnchorVerified        bool      `json:"anchor_verified,omitempty"`
	
	// DEPRECATED: Blockchain fields (kept for backward compatibility)
	TxHash           string              `json:"tx_hash,omitempty"`
	BlockNumber      uint64              `json:"block_number,omitempty"`
	
	Metadata         CertificateMetadata `json:"metadata"`
	ErrorMessage     string              `json:"error_message,omitempty"`
	FileHash         string              `json:"file_hash,omitempty"`         // Stored file hash for comparison
	FileIntegrityOK  *bool               `json:"file_integrity_ok,omitempty"` // Whether file hash matches (nil if check unavailable)
	TamperDetected   bool                `json:"tamper_detected,omitempty"`   // True if file has been modified
}

// PublicCertificate is a sanitized view of a certificate for sharing
type PublicCertificate struct {
	CertID      string              `json:"cert_id"`
	CertType    CredentialType      `json:"cert_type"`
	Status      CertificateStatus   `json:"status"`
	IssuedAt    time.Time           `json:"issued_at"`
	IPFSURL     string              `json:"ipfs_url"`
	
	// NEW: Cryptographic proofs
	IssuerSignature      string    `json:"issuer_signature,omitempty"`
	MerkleRoot            string    `json:"merkle_root,omitempty"`
	TransparencyLogIndex   int64     `json:"transparency_log_index,omitempty"`
	SignedDocumentURL     string    `json:"signed_document_url,omitempty"`
	
	// DEPRECATED: Blockchain fields (kept for backward compatibility)
	TxHash      string              `json:"tx_hash,omitempty"`
	BlockNumber uint64              `json:"block_number,omitempty"`
	
	Metadata    CertificateMetadata `json:"metadata"`
}

// PublicStudentProfile aggregates the student identity with shareable certificates
type PublicStudentProfile struct {
	StudentID     string              `json:"student_id"`
	Name          string              `json:"name"`
	Department    string              `json:"department,omitempty"`
	Institution   string              `json:"institution,omitempty"`
	Course        string              `json:"course,omitempty"`
	WalletAddress string              `json:"wallet_address,omitempty"`
	Certificates  []PublicCertificate `json:"certificates"`
}
