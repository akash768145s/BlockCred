package services

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
)

// CryptographicService handles cryptographic operations for certificates
type CryptographicService struct {
	issuerKeys map[string]ed25519.PrivateKey // issuerID -> private key
	mu         sync.RWMutex                 // Mutex for thread-safe access
}

// NewCryptographicService creates a new cryptographic service
func NewCryptographicService() *CryptographicService {
	return &CryptographicService{
		issuerKeys: make(map[string]ed25519.PrivateKey),
	}
}

// GenerateKeyPair generates a new Ed25519 key pair for an issuer
func (c *CryptographicService) GenerateKeyPair(issuerID string) (publicKey string, privateKey string, err error) {
	publicKeyBytes, privateKeyBytes, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate key pair: %w", err)
	}

	c.mu.Lock()
	c.issuerKeys[issuerID] = privateKeyBytes
	c.mu.Unlock()

	return hex.EncodeToString(publicKeyBytes), hex.EncodeToString(privateKeyBytes), nil
}

// GetOrGenerateKeyPair gets existing key pair or generates a new one
func (c *CryptographicService) GetOrGenerateKeyPair(issuerID string) (publicKey string, privateKey string, err error) {
	c.mu.RLock()
	if privKey, exists := c.issuerKeys[issuerID]; exists {
		c.mu.RUnlock()
		publicKeyBytes := privKey.Public().(ed25519.PublicKey)
		return hex.EncodeToString(publicKeyBytes), hex.EncodeToString(privKey), nil
	}
	c.mu.RUnlock()

	return c.GenerateKeyPair(issuerID)
}

// SignCertificate signs a certificate document with issuer's private key
func (c *CryptographicService) SignCertificate(certificateDocument []byte, issuerID string) (string, error) {
	c.mu.RLock()
	privateKey, exists := c.issuerKeys[issuerID]
	c.mu.RUnlock()

	if !exists {
		return "", errors.New("issuer key not found, please generate key pair first")
	}

	signature := ed25519.Sign(privateKey, certificateDocument)
	return hex.EncodeToString(signature), nil
}

// SignData signs arbitrary data with issuer's private key
func (c *CryptographicService) SignData(data []byte, issuerID string) (string, error) {
	return c.SignCertificate(data, issuerID)
}

// VerifySignature verifies a certificate signature
func (c *CryptographicService) VerifySignature(certificateDocument []byte, signatureHex string, publicKeyHex string) (bool, error) {
	signature, err := hex.DecodeString(signatureHex)
	if err != nil {
		return false, fmt.Errorf("invalid signature hex: %w", err)
	}

	publicKey, err := hex.DecodeString(publicKeyHex)
	if err != nil {
		return false, fmt.Errorf("invalid public key hex: %w", err)
	}

	if len(publicKey) != ed25519.PublicKeySize {
		return false, fmt.Errorf("invalid public key size: expected %d, got %d", ed25519.PublicKeySize, len(publicKey))
	}

	if len(signature) != ed25519.SignatureSize {
		return false, fmt.Errorf("invalid signature size: expected %d, got %d", ed25519.SignatureSize, len(signature))
	}

	return ed25519.Verify(publicKey, certificateDocument, signature), nil
}

// GetPublicKey returns the public key for an issuer
func (c *CryptographicService) GetPublicKey(issuerID string) (string, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	privateKey, exists := c.issuerKeys[issuerID]
	if !exists {
		return "", errors.New("issuer key not found")
	}

	publicKeyBytes := privateKey.Public().(ed25519.PublicKey)
	return hex.EncodeToString(publicKeyBytes), nil
}

// CreateSignedDocument creates a signed certificate document
func (c *CryptographicService) CreateSignedDocument(certID, studentID, fileHash, metadataHash, ipfsCID string, certType string, issuerID string, issuedAt int64) ([]byte, string, error) {
	// Get or generate key pair for issuer
	publicKeyHex, _, err := c.GetOrGenerateKeyPair(issuerID)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get issuer key pair: %w", err)
	}

	// Create certificate document
	certDoc := map[string]interface{}{
		"cert_id":       certID,
		"student_id":    studentID,
		"file_hash":     fileHash,
		"metadata_hash": metadataHash,
		"ipfs_cid":      ipfsCID,
		"cert_type":     certType,
		"issued_at":     issuedAt,
		"issuer_id":     issuerID,
		"revoked":       false,
	}

	// Marshal to JSON for signing
	certDocJSON, err := json.Marshal(certDoc)
	if err != nil {
		return nil, "", fmt.Errorf("failed to marshal certificate document: %w", err)
	}

	// Sign the document
	signature, err := c.SignCertificate(certDocJSON, issuerID)
	if err != nil {
		return nil, "", fmt.Errorf("failed to sign certificate: %w", err)
	}

	// Add signature and public key to document
	certDoc["signature"] = signature
	certDoc["issuer_public_key"] = publicKeyHex
	certDoc["signature_algorithm"] = "Ed25519"

	// Marshal final signed document
	signedDocJSON, err := json.Marshal(certDoc)
	if err != nil {
		return nil, "", fmt.Errorf("failed to marshal signed document: %w", err)
	}

	return signedDocJSON, signature, nil
}

