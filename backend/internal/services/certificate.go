package services

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
)

type CertificateService struct {
	store           store.Store
	ipfsService     *IPFSService
	blockchainService BlockchainServiceInterface
}

func NewCertificateService(s store.Store, ipfs *IPFSService, blockchain BlockchainServiceInterface) *CertificateService {
	return &CertificateService{
		store:           s,
		ipfsService:     ipfs,
		blockchainService: blockchain,
	}
}

// IssueCertificate orchestrates the complete certificate issuance process
func (c *CertificateService) IssueCertificate(req models.IssueCertificateRequest, issuerID string) (*models.Certificate, error) {
	// 1. Validate student exists
	student, err := c.store.GetUserByStudentID(req.StudentID)
	if err != nil {
		return nil, fmt.Errorf("student not found: %w", err)
	}

	// 2. Validate issuer exists and has permission
	issuer, err := c.store.GetUserByID(issuerID)
	if err != nil {
		return nil, fmt.Errorf("issuer not found: %w", err)
	}

	// Check if issuer has permission to issue this type of certificate
	if !c.canIssueCertificate(issuer.Role, req.CertType) {
		return nil, fmt.Errorf("issuer does not have permission to issue %s certificates", req.CertType)
	}

	// 3. Compute file hash (Credential Hash - SHA-256)
	fileHash := c.computeFileHash(req.FileData)

	// 4. Prepare metadata and compute metadata hash
	metadata := map[string]interface{}{
		"student_id":   req.StudentID,
		"student_name": student.Name,
		"issuer_id":    issuerID,
		"issuer_name":  issuer.Name,
		"cert_type":    string(req.CertType),
		"issued_at":    time.Now().Format(time.RFC3339),
	}
	// Merge with request metadata
	for k, v := range req.Metadata.AdditionalData {
		metadata[k] = v
	}

	// Compute metadata hash (SHA-256 of metadata JSON)
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal metadata: %w", err)
	}
	metadataHash := c.computeFileHash(metadataJSON)

	// 5. Upload file to IPFS
	ipfsCID, err := c.ipfsService.UploadFile(req.FileData, req.FileName, metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to upload to IPFS: %w", err)
	}

	// 6. Get or create student wallet address
	studentWallet, err := c.blockchainService.GetStudentWallet(req.StudentID)
	if err != nil || studentWallet == "" {
		// Generate a deterministic wallet address for the student
		studentWallet = c.generateStudentWallet(req.StudentID)
		// Register wallet mapping on blockchain
		if err := c.blockchainService.RegisterStudentWallet(req.StudentID, studentWallet); err != nil {
			// Log but don't fail - wallet mapping is optional
			fmt.Printf("⚠️  Warning: Failed to register student wallet: %v\n", err)
		}
	}

	// 7. Compute certificate ID
	issuedAt := time.Now()
	certID := c.blockchainService.ComputeCertID(fileHash, req.StudentID, issuedAt)

	// 8. Get issuer wallet address (for now, use a default or generate from issuer ID)
	issuerWallet := c.generateIssuerWallet(issuerID)

	// 9. Prepare on-chain data
	onChainData := &OnChainCertificateData{
		CertID:         certID,
		StudentID:      req.StudentID,
		StudentWallet:  studentWallet,
		CredentialHash: fileHash,
		MetadataHash:   metadataHash,
		IssuerAddress:  issuerWallet,
		CertType:       req.CertType,
		Timestamp:      issuedAt.Unix(),
	}

	// 10. Issue certificate on blockchain with full on-chain data
	txResult, err := c.blockchainService.IssueCertificateOnChain(onChainData, ipfsCID)
	if err != nil {
		// Fallback to simple issue if on-chain fails
		fmt.Printf("⚠️  Warning: On-chain issuance failed, using fallback: %v\n", err)
		txResult, err = c.blockchainService.IssueCertificate(certID, ipfsCID, req.CertType)
	if err != nil {
		return nil, fmt.Errorf("failed to issue certificate on blockchain: %w", err)
		}
	}

	// 11. Create certificate record (OFF-CHAIN in MongoDB)
	certificate := models.Certificate{
		CertID:      certID,
		StudentID:   req.StudentID,
		IssuerID:    issuerID,
		CertType:    req.CertType,
		FileHash:    fileHash, // Credential Hash
		IPFSCID:     ipfsCID,
		IPFSURL:     c.ipfsService.GetFileURL(ipfsCID),
		TxHash:      txResult.TxHash,
		BlockNumber: txResult.BlockNumber,
		Status:      models.CertStatusIssued,
		IssuedAt:    issuedAt,
		Metadata:    req.Metadata,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Store metadata hash in additional data
	if certificate.Metadata.AdditionalData == nil {
		certificate.Metadata.AdditionalData = make(map[string]interface{})
	}
	certificate.Metadata.AdditionalData["metadata_hash"] = metadataHash
	certificate.Metadata.AdditionalData["student_wallet"] = studentWallet
	certificate.Metadata.AdditionalData["issuer_wallet"] = issuerWallet

	// 12. Save to database (OFF-CHAIN)
	createdCert, err := c.store.CreateCertificate(certificate)
	if err != nil {
		return nil, fmt.Errorf("failed to save certificate: %w", err)
	}

	return &createdCert, nil
}

// VerifyCertificate verifies a certificate by checking blockchain and database
func (c *CertificateService) VerifyCertificate(certID string) (*models.CertificateVerificationResult, error) {
	// 1. Get certificate from database
	cert, err := c.store.GetCertificateByCertID(certID)
	if err != nil {
		return &models.CertificateVerificationResult{
			IsValid:      false,
			CertID:       certID,
			ErrorMessage: "Certificate not found in database",
		}, nil
	}

	// 2. Verify on blockchain
	isValidOnChain, err := c.blockchainService.VerifyCertificate(certID)
	if err != nil {
		return &models.CertificateVerificationResult{
			IsValid:      false,
			CertID:       certID,
			ErrorMessage: fmt.Sprintf("Blockchain verification failed: %v", err),
		}, nil
	}

	// 3. Check certificate status
	if cert.Status == models.CertStatusRevoked {
		return &models.CertificateVerificationResult{
			IsValid:      false,
			CertID:       certID,
			ErrorMessage: "Certificate has been revoked",
		}, nil
	}

	// 4. Return verification result
	result := &models.CertificateVerificationResult{
		IsValid:     isValidOnChain && cert.Status != models.CertStatusRevoked,
		CertID:      cert.CertID,
		StudentID:   cert.StudentID,
		IssuerID:    cert.IssuerID,
		CertType:    cert.CertType,
		Status:      cert.Status,
		IssuedAt:    cert.IssuedAt,
		IPFSURL:     cert.IPFSURL,
		TxHash:      cert.TxHash,
		BlockNumber: cert.BlockNumber,
		Metadata:    cert.Metadata,
	}

	if !result.IsValid {
		result.ErrorMessage = "Certificate verification failed"
	}

	return result, nil
}

// ListCertificates returns all certificates
func (c *CertificateService) ListCertificates() ([]models.Certificate, error) {
	return c.store.ListCertificates()
}

// ListCertificatesByStudent returns certificates for a specific student
func (c *CertificateService) ListCertificatesByStudent(studentID string) ([]models.Certificate, error) {
	return c.store.ListCertificatesByStudent(studentID)
}

// ListCertificatesByIssuer returns certificates issued by a specific issuer
func (c *CertificateService) ListCertificatesByIssuer(issuerID string) ([]models.Certificate, error) {
	return c.store.ListCertificatesByIssuer(issuerID)
}

// RevokeCertificate revokes a certificate
func (c *CertificateService) RevokeCertificate(certID, reason string) error {
	cert, err := c.store.GetCertificateByCertID(certID)
	if err != nil {
		return fmt.Errorf("certificate not found: %w", err)
	}

	now := time.Now()
	cert.Status = models.CertStatusRevoked
	cert.RevokedAt = &now
	cert.RevokeReason = reason
	cert.UpdatedAt = now

	_, err = c.store.UpdateCertificate(certID, cert)
	if err != nil {
		return fmt.Errorf("failed to revoke certificate: %w", err)
	}

	return nil
}

// Helper functions

func (c *CertificateService) computeFileHash(fileData []byte) string {
	hash := sha256.Sum256(fileData)
	return hex.EncodeToString(hash[:])
}

// generateStudentWallet generates a deterministic wallet address for a student
func (c *CertificateService) generateStudentWallet(studentID string) string {
	// Generate deterministic address from student ID
	hash := sha256.Sum256([]byte("student_wallet_" + studentID))
	// Format as Ethereum address (0x + 40 hex chars)
	return fmt.Sprintf("0x%x", hash[:20])
}

// generateIssuerWallet generates a deterministic wallet address for an issuer
func (c *CertificateService) generateIssuerWallet(issuerID string) string {
	// Generate deterministic address from issuer ID
	hash := sha256.Sum256([]byte("issuer_wallet_" + issuerID))
	// Format as Ethereum address (0x + 40 hex chars)
	return fmt.Sprintf("0x%x", hash[:20])
}

func (c *CertificateService) canIssueCertificate(role models.UserRole, certType models.CredentialType) bool {
	permissions := models.GetRolePermissions(role)
	
	switch certType {
	case models.CredentialTypeMarksheet:
		return permissions.CanIssueMarksheet
	case models.CredentialTypeBonafide:
		return permissions.CanIssueBonafide
	case models.CredentialTypeNOC:
		return permissions.CanIssueNOC
	case models.CredentialTypeParticipation:
		return permissions.CanIssueParticipation
	case models.CredentialTypeDegree:
		return permissions.CanIssueMarksheet // COE can issue degrees
	default:
		return false
	}
}
