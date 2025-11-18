package services

import (
	"time"

	"blockcred-backend/internal/models"
)

// ContractTransaction represents a blockchain transaction
type ContractTransaction struct {
	TxHash      string `json:"tx_hash"`
	BlockNumber uint64 `json:"block_number"`
	GasUsed     uint64 `json:"gas_used"`
	GasPrice    string `json:"gas_price"`
}

// OnChainCertificateData contains all data to be stored on-chain
type OnChainCertificateData struct {
	CertID         string
	StudentID      string
	StudentWallet  string
	CredentialHash string // SHA-256 hash of certificate file
	MetadataHash   string // SHA-256 hash of metadata JSON
	IssuerAddress  string
	CertType       models.CredentialType
	Timestamp      int64
}

// BlockchainServiceInterface defines the interface for blockchain operations
type BlockchainServiceInterface interface {
	IssueCertificate(certID, ipfsCID string, certType models.CredentialType) (*ContractTransaction, error)
	IssueCertificateOnChain(data *OnChainCertificateData, ipfsCID string) (*ContractTransaction, error)
	VerifyCertificate(certID string) (bool, error)
	ComputeCertID(fileHash, studentID string, issuedAt time.Time) string
	GetCertificateInfo(certID string) (map[string]interface{}, error)
	GetCertificateOnChain(certID string) (*OnChainCertificateData, error)
	RegisterStudentWallet(studentID, walletAddress string) error
	GetStudentWallet(studentID string) (string, error)
	RevokeCertificateOnChain(certID string) error
	Close()
}

