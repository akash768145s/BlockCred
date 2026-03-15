package services

import (
	"crypto/sha256"
	"fmt"
	"time"

	"blockcred-backend/internal/config"
	"blockcred-backend/internal/models"
)

type BlockchainService struct {
	config config.Config
}

func NewBlockchainService(cfg config.Config) (*BlockchainService, error) {
	// Simplified blockchain service for development
	// In production, you would connect to actual blockchain here
	return &BlockchainService{
		config: cfg,
	}, nil
}

// IssueCertificate calls the smart contract to issue a certificate
func (s *BlockchainService) IssueCertificate(certID, ipfsCID string, certType models.CredentialType) (*ContractTransaction, error) {
	// Simulate smart contract call for development
	// In production, this would call the actual smart contract
	
	// Generate a mock transaction hash
	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())
	
	// Simulate block number (in production, get from blockchain)
	blockNumber := uint64(time.Now().Unix() % 1000000)

	return &ContractTransaction{
		TxHash:      txHash,
		BlockNumber: blockNumber,
		GasUsed:     150000,
		GasPrice:    "20000000000", // 20 gwei in wei
	}, nil
}

// VerifyCertificate checks if a certificate exists on the blockchain
func (s *BlockchainService) VerifyCertificate(certID string) (bool, error) {
	// Simulate verification for development
	// In production, this would query the smart contract
	return true, nil
}

// GetCertificateInfo retrieves certificate information from the blockchain
func (s *BlockchainService) GetCertificateInfo(certID string) (map[string]interface{}, error) {
	// Simulate getting certificate info for development
	info := map[string]interface{}{
		"cert_id":    certID,
		"is_valid":   true,
		"issued_at":  time.Now().Unix(),
		"cert_type":  "marksheet",
		"ipfs_cid":   "QmExample...",
	}

	return info, nil
}

// ComputeCertID computes the certificate ID using SHA256(fileHash + studentId + issuedAt)
func (s *BlockchainService) ComputeCertID(fileHash, studentID string, issuedAt time.Time) string {
	// Combine the inputs
	input := fileHash + studentID + issuedAt.Format(time.RFC3339)
	
	// Compute SHA256 hash (using SHA256 instead of keccak256 for simplicity)
	hash := sha256.Sum256([]byte(input))
	
	return fmt.Sprintf("0x%x", hash)
}

// ComputeFileHash computes SHA256 hash of file data
func (s *BlockchainService) ComputeFileHash(fileData []byte) string {
	hash := sha256.Sum256(fileData)
	return fmt.Sprintf("%x", hash)
}

// IssueCertificateOnChain issues a certificate with full on-chain data
func (s *BlockchainService) IssueCertificateOnChain(data *OnChainCertificateData, ipfsCID string) (*ContractTransaction, error) {
	// Simulate smart contract call with on-chain data
	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())
	blockNumber := uint64(time.Now().Unix() % 1000000)

	fmt.Printf("🔗 Blockchain: Issuing certificate on-chain\n")
	fmt.Printf("   CertID: %s\n", data.CertID)
	fmt.Printf("   Credential Hash: %s\n", data.CredentialHash)
	fmt.Printf("   Metadata Hash: %s\n", data.MetadataHash)
	fmt.Printf("   Issuer: %s\n", data.IssuerAddress)
	fmt.Printf("   Student Wallet: %s\n", data.StudentWallet)
	fmt.Printf("   IPFS CID: %s\n", ipfsCID)
	fmt.Printf("   Timestamp: %d\n", data.Timestamp)

	return &ContractTransaction{
		TxHash:      txHash,
		BlockNumber: blockNumber,
		GasUsed:     200000,
		GasPrice:    "20000000000",
	}, nil
}

// GetCertificateOnChain retrieves on-chain certificate data
func (s *BlockchainService) GetCertificateOnChain(certID string) (*OnChainCertificateData, error) {
	// Simulate getting on-chain data
	return &OnChainCertificateData{
		CertID:         certID,
		CredentialHash: "0xabc123...",
		MetadataHash:   "0xdef456...",
		Timestamp:      time.Now().Unix(),
	}, nil
}

// RegisterStudentWallet registers a student-wallet mapping
func (s *BlockchainService) RegisterStudentWallet(studentID, walletAddress string) error {
	fmt.Printf("🔗 Blockchain: Registering student-wallet mapping\n")
	fmt.Printf("   Student ID: %s\n", studentID)
	fmt.Printf("   Wallet: %s\n", walletAddress)
	return nil
}

// GetStudentWallet retrieves wallet address for a student
func (s *BlockchainService) GetStudentWallet(studentID string) (string, error) {
	// Simulate getting wallet address
	return "", fmt.Errorf("wallet not found for student %s", studentID)
}

// RevokeCertificateOnChain revokes a certificate on the blockchain
func (s *BlockchainService) RevokeCertificateOnChain(certID string) error {
	fmt.Printf("🔗 Blockchain: Revoking certificate %s\n", certID)
	return nil
}

// Close closes the blockchain connection
func (s *BlockchainService) Close() {
	// No connection to close in simplified version
}
