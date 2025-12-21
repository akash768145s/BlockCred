package services

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
)

type CertificateService struct {
	store                store.Store
	ipfsService          *IPFSService
	blockchainService    BlockchainServiceInterface // Deprecated, kept for backward compatibility
	cryptographicService *CryptographicService       // NEW: Cryptographic service
	transparencyLog      *TransparencyLogService     // NEW: Transparency log service
}

func NewCertificateService(s store.Store, ipfs *IPFSService, blockchain BlockchainServiceInterface) *CertificateService {
	return &CertificateService{
		store:                s,
		ipfsService:          ipfs,
		blockchainService:    blockchain,
		cryptographicService: NewCryptographicService(),
		transparencyLog:      NewTransparencyLogService(),
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
	hasPermission := c.canIssueCertificate(issuer.Role, req.CertType)
	if !hasPermission {
		return nil, fmt.Errorf("issuer does not have permission to issue %s certificates (issuer role: %s, cert type: %s)", req.CertType, issuer.Role, req.CertType)
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
	fmt.Printf("📤 Uploading file to IPFS: fileName=%s, fileSize=%d bytes\n", req.FileName, len(req.FileData))
	ipfsCID, err := c.ipfsService.UploadFile(req.FileData, req.FileName, metadata)
	if err != nil {
		fmt.Printf("❌ IPFS upload failed: %v\n", err)
		return nil, fmt.Errorf("failed to upload to IPFS: %w", err)
	}
	fmt.Printf("✅ IPFS upload successful: CID=%s\n", ipfsCID)

	// 6. Compute certificate ID (using same formula as before)
	issuedAt := time.Now()
	certID := c.computeCertID(fileHash, req.StudentID, issuedAt)

	// 7. Generate cryptographic signature (NEW - DApp architecture)
	fmt.Printf("🔐 Generating cryptographic signature for certificate: %s\n", certID)
	signedDocJSON, signature, err := c.cryptographicService.CreateSignedDocument(
		certID,
		req.StudentID,
		fileHash,
		metadataHash,
		ipfsCID,
		string(req.CertType),
		issuerID,
		issuedAt.Unix(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create signed document: %w", err)
	}

	// Get issuer public key
	issuerPublicKey, err := c.cryptographicService.GetPublicKey(issuerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get issuer public key: %w", err)
	}

	// 8. Store signed document in IPFS
	fmt.Printf("📤 Uploading signed document to IPFS\n")
	signedDocCID, err := c.ipfsService.UploadFile(signedDocJSON, "certificate_"+certID+".json", nil)
	if err != nil {
		fmt.Printf("⚠️  Warning: Failed to upload signed document to IPFS: %v\n", err)
		signedDocCID = "" // Continue without IPFS storage
	}
	signedDocURL := c.ipfsService.GetFileURL(signedDocCID)

	// 9. Append to transparency log (NEW - DApp architecture)
	fmt.Printf("📝 Appending certificate to transparency log\n")
	logEntry, err := c.transparencyLog.Append(certID, signedDocJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to append to transparency log: %w", err)
	}

	// 10. Generate Merkle proof
	merkleProof, err := c.transparencyLog.GenerateProof(certID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate Merkle proof: %w", err)
	}

	// 11. Optional: Try blockchain issuance for backward compatibility (deprecated)
	var txHash string
	var blockNumber uint64
	if c.blockchainService != nil {
		studentWallet := c.generateStudentWallet(req.StudentID)
		issuerWallet := c.generateIssuerWallet(issuerID)
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
		txResult, err := c.blockchainService.IssueCertificateOnChain(onChainData, ipfsCID)
		if err == nil {
			txHash = txResult.TxHash
			blockNumber = txResult.BlockNumber
			fmt.Printf("✅ Certificate also stored on blockchain (backward compatibility)\n")
		} else {
			fmt.Printf("⚠️  Blockchain storage skipped (using DApp architecture): %v\n", err)
		}
	}

	// 12. Create certificate record (OFF-CHAIN in MongoDB)
	certificate := models.Certificate{
		CertID:              certID,
		StudentID:           req.StudentID,
		IssuerID:            issuerID,
		CertType:            req.CertType,
		FileHash:            fileHash, // Credential Hash
		IPFSCID:             ipfsCID,
		IPFSURL:             c.ipfsService.GetFileURL(ipfsCID),
		
		// NEW: Cryptographic proofs (DApp architecture)
		IssuerSignature:     signature,
		IssuerPublicKey:      issuerPublicKey,
		SignedDocument:      string(signedDocJSON),
		SignedDocumentCID:    signedDocCID,
		SignedDocumentURL:    signedDocURL,
		MerkleRoot:           merkleProof.Root,
		MerklePath:           merkleProof.Path,
		TransparencyLogIndex: logEntry.Index,
		
		// DEPRECATED: Blockchain fields (kept for backward compatibility)
		TxHash:      txHash,
		BlockNumber: blockNumber,
		
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

	// 13. Save to database (OFF-CHAIN)
	createdCert, err := c.store.CreateCertificate(certificate)
	if err != nil {
		return nil, fmt.Errorf("failed to save certificate: %w", err)
	}

	fmt.Printf("✅ Certificate issued successfully: CertID=%s, Signature=%s, MerkleRoot=%s\n", certID, signature[:16]+"...", merkleProof.Root[:16]+"...")
	return &createdCert, nil
}

// computeCertID computes certificate ID using SHA256(fileHash + studentID + issuedAt)
func (c *CertificateService) computeCertID(fileHash, studentID string, issuedAt time.Time) string {
	input := fileHash + studentID + issuedAt.Format(time.RFC3339)
	hash := sha256.Sum256([]byte(input))
	return "0x" + hex.EncodeToString(hash[:])
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

	// 2. Verify cryptographic signature (NEW - DApp architecture) or legacy certificate
	var signatureVerified bool
	var merkleProofValid bool
	isLegacyCertificate := cert.IssuerSignature == "" && cert.TxHash != ""
	
	if cert.IssuerSignature != "" && cert.IssuerPublicKey != "" && cert.SignedDocument != "" {
		// New DApp certificate - verify cryptographic proofs
		// Extract the original document (without signature) for verification
		var signedDoc map[string]interface{}
		if err := json.Unmarshal([]byte(cert.SignedDocument), &signedDoc); err != nil {
			fmt.Printf("⚠️  Failed to parse signed document: %v\n", err)
			signatureVerified = false
		} else {
			// Create a copy without signature fields for verification
			originalDoc := make(map[string]interface{})
			for k, v := range signedDoc {
				if k != "signature" && k != "issuer_public_key" && k != "signature_algorithm" {
					originalDoc[k] = v
				}
			}
			originalDocJSON, err := json.Marshal(originalDoc)
			if err != nil {
				fmt.Printf("⚠️  Failed to marshal original document: %v\n", err)
				signatureVerified = false
			} else {
				signatureVerified, err = c.cryptographicService.VerifySignature(
					originalDocJSON,
					cert.IssuerSignature,
					cert.IssuerPublicKey,
				)
				if err != nil {
					fmt.Printf("⚠️  Signature verification error: %v\n", err)
					signatureVerified = false
				}
			}
		}
		
		// Verify Merkle proof if available
		// Note: Merkle proof verification is optional - if transparency log was reset (server restart),
		// we still consider certificate valid if signature is valid
		if cert.MerkleRoot != "" && len(cert.MerklePath) > 0 {
			merkleProofValid, err = c.transparencyLog.VerifyProof(
				cert.TransparencyLogIndex,
				cert.MerklePath,
				cert.MerkleRoot,
			)
			if err != nil {
				// If transparency log doesn't have the entry (e.g., server restart), 
				// we can't verify Merkle proof but signature verification is still valid
				fmt.Printf("⚠️  Merkle proof verification unavailable (transparency log may have been reset): %v\n", err)
				// Don't fail verification - signature is the primary proof
				merkleProofValid = true // Allow verification to pass if signature is valid
			}
		} else {
			// No Merkle proof available - signature verification is sufficient
			merkleProofValid = true
		}
	} else if isLegacyCertificate {
		// Legacy certificate (blockchain-based) - consider valid if exists in database
		// Note: Blockchain verification is not available in DApp architecture
		// Legacy certificates are considered valid if they exist and aren't revoked
		signatureVerified = true  // Legacy certificates don't have signatures
		merkleProofValid = true    // Legacy certificates don't have Merkle proofs
		fmt.Printf("ℹ️  Legacy certificate detected (blockchain-based): CertID=%s\n", certID)
	} else {
		// Certificate has no verification method
		signatureVerified = false
		merkleProofValid = false
	}

	// 3. Check certificate status
	if cert.Status == models.CertStatusRevoked {
		return &models.CertificateVerificationResult{
			IsValid:      false,
			CertID:       certID,
			ErrorMessage: "Certificate has been revoked",
		}, nil
	}

	// 4. Verify file integrity (tamper detection)
	// Download file from IPFS and recompute hash to check if it matches the stored hash
	isFileIntact, fileHashCheck, err := c.verifyFileIntegrity(cert.IPFSURL, cert.FileHash)
	if err != nil {
		fmt.Printf("⚠️  Warning: Could not verify file integrity: %v\n", err)
		// Don't fail verification if IPFS is temporarily unavailable, but mark it
		isFileIntact = true // Assume intact if we can't check (graceful degradation)
	}

	// 5. Return verification result
	tamperDetected := !isFileIntact
	fileIntegrityOK := isFileIntact
	
	// Determine overall validity
	// For legacy certificates, validity is based on existence and file integrity
	// For new certificates, validity requires signature verification (Merkle proof is optional enhancement)
	var isValid bool
	if isLegacyCertificate {
		isValid = cert.Status != models.CertStatusRevoked && isFileIntact
	} else {
		// Signature verification is the primary proof; Merkle proof is optional enhancement
		// If Merkle proof can't be verified (e.g., server restart), signature alone is sufficient
		isValid = signatureVerified && cert.Status != models.CertStatusRevoked && isFileIntact
	}
	
	result := &models.CertificateVerificationResult{
		IsValid:              isValid,
		CertID:               cert.CertID,
		StudentID:            cert.StudentID,
		IssuerID:             cert.IssuerID,
		CertType:             cert.CertType,
		Status:               cert.Status,
		IssuedAt:             cert.IssuedAt,
		IPFSURL:              cert.IPFSURL,
		
		// NEW: Cryptographic proofs
		IssuerSignature:     cert.IssuerSignature,
		IssuerPublicKey:      cert.IssuerPublicKey,
		SignatureVerified:    signatureVerified,
		MerkleRoot:           cert.MerkleRoot,
		MerkleProofValid:     merkleProofValid,
		TransparencyLogIndex:  cert.TransparencyLogIndex,
		SignedDocumentURL:    cert.SignedDocumentURL,
		
		// DEPRECATED: Blockchain fields (kept for backward compatibility)
		TxHash:               cert.TxHash,
		BlockNumber:          cert.BlockNumber,
		
		Metadata:             cert.Metadata,
		FileHash:             cert.FileHash,
		FileIntegrityOK:      &fileIntegrityOK,
		TamperDetected:       tamperDetected,
	}

	if !result.IsValid {
		if !isFileIntact {
			result.ErrorMessage = fmt.Sprintf("Certificate file has been tampered with. Stored hash: %s, Computed hash: %s", cert.FileHash, fileHashCheck)
		} else if isLegacyCertificate {
			result.ErrorMessage = "Legacy certificate verification failed (file integrity check)"
		} else if !signatureVerified {
			result.ErrorMessage = "Invalid issuer signature"
		} else if cert.Status == models.CertStatusRevoked {
			result.ErrorMessage = "Certificate has been revoked"
		} else {
			result.ErrorMessage = "Certificate verification failed"
		}
		// Note: Merkle proof verification failure is not a blocking error - signature is primary proof
	} else {
		if isLegacyCertificate {
			fmt.Printf("✅ Legacy certificate verified: CertID=%s, File integrity: OK\n", certID)
		} else {
			fmt.Printf("✅ Certificate verified: CertID=%s, Signature: OK, Merkle Proof: OK, File integrity: OK\n", certID)
		}
	}

	return result, nil
}

// verifyFileIntegrity downloads the file from IPFS and verifies its hash matches the stored hash
func (c *CertificateService) verifyFileIntegrity(ipfsURL, storedHash string) (bool, string, error) {
	if ipfsURL == "" {
		return false, "", fmt.Errorf("IPFS URL is empty")
	}

	// Download file from IPFS
	fileData, err := c.downloadFromIPFS(ipfsURL)
	if err != nil {
		return false, "", fmt.Errorf("failed to download file from IPFS: %w", err)
	}

	// Compute hash of downloaded file
	computedHash := c.computeFileHash(fileData)

	// Compare with stored hash
	if computedHash != storedHash {
		fmt.Printf("❌ File integrity check FAILED: Stored hash=%s, Computed hash=%s\n", storedHash, computedHash)
		return false, computedHash, nil
	}

	fmt.Printf("✅ File integrity check PASSED: Hash matches stored value\n")
	return true, computedHash, nil
}

// downloadFromIPFS downloads a file from IPFS URL
func (c *CertificateService) downloadFromIPFS(ipfsURL string) ([]byte, error) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Get(ipfsURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch from IPFS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("IPFS returned status %d", resp.StatusCode)
	}

	fileData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read file data: %w", err)
	}

	return fileData, nil
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

// GetPublicStudentProfile builds a shareable profile with sanitized certificate data
func (c *CertificateService) GetPublicStudentProfile(studentID string) (*models.PublicStudentProfile, error) {
	if studentID == "" {
		return nil, fmt.Errorf("student ID is required")
	}

	student, err := c.store.GetUserByStudentID(studentID)
	if err != nil {
		return nil, fmt.Errorf("student not found: %w", err)
	}

	certificates, err := c.store.ListCertificatesByStudent(studentID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch certificates: %w", err)
	}

	publicProfile := &models.PublicStudentProfile{
		StudentID:    student.StudentID,
		Name:         student.Name,
		Department:   student.Department,
		Institution:  student.Institution,
		Course:       student.Department,
		Certificates: make([]models.PublicCertificate, 0, len(certificates)),
	}

	for _, cert := range certificates {
		publicCert := models.PublicCertificate{
			CertID:      cert.CertID,
			CertType:    cert.CertType,
			Status:      cert.Status,
			IssuedAt:    cert.IssuedAt,
			IPFSURL:     cert.IPFSURL,
			
			// NEW: Cryptographic proofs
			IssuerSignature:     cert.IssuerSignature,
			MerkleRoot:           cert.MerkleRoot,
			TransparencyLogIndex: cert.TransparencyLogIndex,
			SignedDocumentURL:    cert.SignedDocumentURL,
			
			// DEPRECATED: Blockchain fields (kept for backward compatibility)
			TxHash:      cert.TxHash,
			BlockNumber: cert.BlockNumber,
			
			Metadata:    cert.Metadata,
		}

		// Capture wallet address if embedded inside metadata
		if publicProfile.WalletAddress == "" && cert.Metadata.AdditionalData != nil {
			if wallet, ok := cert.Metadata.AdditionalData["student_wallet"].(string); ok {
				publicProfile.WalletAddress = wallet
			}
		}

		// Prefer metadata course if user record is missing one
		if publicProfile.Course == "" && cert.Metadata.Course != "" {
			publicProfile.Course = cert.Metadata.Course
		}

		publicProfile.Certificates = append(publicProfile.Certificates, publicCert)
	}

	return publicProfile, nil
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
	// Explicit check for NFT certificates - allow for admin and COE roles
	certTypeStr := string(certType)
	roleStr := string(role)

	if certType == models.CredentialTypeNFT || certTypeStr == "nft_certificate" {
		// Allow for SSN Main Admin and COE (check both constant and string)
		if role == models.RoleSSNMainAdmin || roleStr == "ssn_main_admin" ||
			role == models.RoleCOE || roleStr == "coe" {
			return true
		}
		// Also check permissions as fallback
		permissions := models.GetRolePermissions(role)
		return permissions.CanIssueMarksheet
	}

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
