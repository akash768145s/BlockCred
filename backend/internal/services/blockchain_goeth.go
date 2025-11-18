package services

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"blockcred-backend/internal/config"
	"blockcred-backend/internal/models"
)

// GoEthBlockchainService implements blockchain operations using GoEth
type GoEthBlockchainService struct {
	config        config.Config
	contractAddr  string
	httpClient    *http.Client
}

// JSONRPCRequest represents a JSON-RPC request
type JSONRPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
	ID      int           `json:"id"`
}

// JSONRPCResponse represents a JSON-RPC response
type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	Result  interface{} `json:"result"`
	Error   *RPCError   `json:"error"`
	ID      int         `json:"id"`
}

// RPCError represents a JSON-RPC error
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}


// NewGoEthBlockchainService creates a new blockchain service connected to GoEth
func NewGoEthBlockchainService(cfg config.Config) (*GoEthBlockchainService, error) {
	if cfg.BlockchainRPCURL == "" {
		return nil, fmt.Errorf("blockchain RPC URL not configured")
	}
	if cfg.ContractAddress == "" {
		return nil, fmt.Errorf("contract address not configured")
	}

	return &GoEthBlockchainService{
		config:       cfg,
		contractAddr: cfg.ContractAddress,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}, nil
}

// callContract makes a JSON-RPC call to the GoEth node
func (s *GoEthBlockchainService) callContract(method string, params []interface{}) (*JSONRPCResponse, error) {
	request := JSONRPCRequest{
		JSONRPC: "2.0",
		Method:  method,
		Params:  params,
		ID:      1,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := s.httpClient.Post(s.config.BlockchainRPCURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	var response JSONRPCResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if response.Error != nil {
		return nil, fmt.Errorf("RPC error: %s", response.Error.Message)
	}

	return &response, nil
}

// IssueCertificate calls the smart contract to issue a certificate (implements BlockchainServiceInterface)
func (s *GoEthBlockchainService) IssueCertificate(certID, ipfsCID string, certType models.CredentialType) (*ContractTransaction, error) {
	// Generate a mock transaction hash for development
	txHash := fmt.Sprintf("0x%x", time.Now().UnixNano())
	blockNumber := uint64(time.Now().Unix() % 1000000)

	// Log the certificate issuance (in production, this would be the actual transaction)
	fmt.Printf("🔗 Blockchain: Issuing certificate %s\n", certID)
	fmt.Printf("   Type: %s\n", certType)
	fmt.Printf("   IPFS CID: %s\n", ipfsCID)

	return &ContractTransaction{
		TxHash:      txHash,
		BlockNumber: blockNumber,
		GasUsed:     150000,
		GasPrice:    "20000000000", // 20 gwei
	}, nil
}

// IssueCertificateWithDetails calls the smart contract with additional details (extended method)
func (s *GoEthBlockchainService) IssueCertificateWithDetails(certID, ipfsCID string, certType models.CredentialType, studentID, fileHash, metadata string, issuerAddress string) (*ContractTransaction, error) {
	// Log the certificate issuance with details
	fmt.Printf("🔗 Blockchain: Issuing certificate %s for student %s\n", certID, studentID)
	fmt.Printf("   Type: %s\n", certType)
	fmt.Printf("   IPFS CID: %s\n", ipfsCID)
	fmt.Printf("   Issuer: %s\n", issuerAddress)

	// Use the standard IssueCertificate method
	return s.IssueCertificate(certID, ipfsCID, certType)
}

// VerifyCertificate checks if a certificate exists on the blockchain
func (s *GoEthBlockchainService) VerifyCertificate(certID string) (bool, error) {
	// In production, this would call the smart contract's verifyCertificate function
	// For now, we'll simulate verification
	
	// Check if the certificate ID format is valid
	if len(certID) < 10 {
		return false, nil
	}

	// Simulate blockchain verification
	// In production, you would:
	// 1. Call the contract's verifyCertificate function
	// 2. Check if the certificate exists and is not revoked
	// 3. Return the verification result

	return true, nil
}

// GetCertificateInfo retrieves certificate information from the blockchain
func (s *GoEthBlockchainService) GetCertificateInfo(certID string) (map[string]interface{}, error) {
	// In production, this would call the smart contract's getCertificate function
	// For now, we'll return mock data
	
	info := map[string]interface{}{
		"cert_id":    certID,
		"is_valid":   true,
		"issued_at":  time.Now().Unix(),
		"cert_type":  "marksheet",
		"ipfs_cid":   "QmExample...",
		"blockchain": "goeth",
		"network":    "private",
	}

	return info, nil
}

// ComputeCertID computes the certificate ID using SHA256(fileHash + studentId + issuedAt)
func (s *GoEthBlockchainService) ComputeCertID(fileHash, studentID string, issuedAt time.Time) string {
	// Combine the inputs as specified in your requirements
	input := fileHash + studentID + issuedAt.Format(time.RFC3339)
	
	// Compute SHA256 hash (in production, you might want to use keccak256)
	hash := sha256.Sum256([]byte(input))
	
	return fmt.Sprintf("0x%x", hash)
}

// ComputeFileHash computes SHA256 hash of file data
func (s *GoEthBlockchainService) ComputeFileHash(fileData []byte) string {
	hash := sha256.Sum256(fileData)
	return fmt.Sprintf("%x", hash)
}

// RegisterIssuer registers a new issuer on the blockchain
func (s *GoEthBlockchainService) RegisterIssuer(issuerAddress, name, role, institution string) error {
	// In production, this would call the smart contract's registerIssuer function
	fmt.Printf("🔗 Blockchain: Registering issuer %s (%s) at %s\n", name, role, institution)
	return nil
}

// GetBlockNumber gets the current block number
func (s *GoEthBlockchainService) GetBlockNumber() (uint64, error) {
	response, err := s.callContract("eth_blockNumber", []interface{}{})
	if err != nil {
		return 0, err
	}

	blockNumberHex, ok := response.Result.(string)
	if !ok {
		return 0, fmt.Errorf("invalid block number response")
	}

	// Remove 0x prefix and convert to uint64
	blockNumberHex = blockNumberHex[2:]
	blockNumber, err := hex.DecodeString(blockNumberHex)
	if err != nil {
		return 0, fmt.Errorf("failed to decode block number: %w", err)
	}

	// Convert bytes to uint64
	var result uint64
	for i, b := range blockNumber {
		result += uint64(b) << (8 * (len(blockNumber) - 1 - i))
	}

	return result, nil
}

// GetGasPrice gets the current gas price
func (s *GoEthBlockchainService) GetGasPrice() (*big.Int, error) {
	response, err := s.callContract("eth_gasPrice", []interface{}{})
	if err != nil {
		return nil, err
	}

	gasPriceHex, ok := response.Result.(string)
	if !ok {
		return nil, fmt.Errorf("invalid gas price response")
	}

	// Remove 0x prefix and convert to big.Int
	gasPriceHex = gasPriceHex[2:]
	gasPrice, ok := new(big.Int).SetString(gasPriceHex, 16)
	if !ok {
		return nil, fmt.Errorf("failed to parse gas price")
	}

	return gasPrice, nil
}

// IssueCertificateOnChain issues a certificate with full on-chain data
func (s *GoEthBlockchainService) IssueCertificateOnChain(data *OnChainCertificateData, ipfsCID string) (*ContractTransaction, error) {
	// In production, this would call the smart contract's issueCertificate function
	// with all the on-chain data: credential hash, metadata hash, issuer address, student wallet, timestamp
	
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

	// TODO: Call actual smart contract here
	// contract.IssueCertificate(auth, data.CertID, data.StudentID, string(data.CertType), 
	//   ipfsCID, data.CredentialHash, data.MetadataHash, data.IssuerAddress, data.StudentWallet)

	return &ContractTransaction{
		TxHash:      txHash,
		BlockNumber: blockNumber,
		GasUsed:     200000,
		GasPrice:    "20000000000",
	}, nil
}

// GetCertificateOnChain retrieves on-chain certificate data
func (s *GoEthBlockchainService) GetCertificateOnChain(certID string) (*OnChainCertificateData, error) {
	// TODO: Call smart contract getCertificate function
	// For now, return mock data
	info, err := s.GetCertificateInfo(certID)
	if err != nil {
		return nil, err
	}

	return &OnChainCertificateData{
		CertID:         certID,
		CredentialHash: fmt.Sprintf("%v", info["file_hash"]),
		MetadataHash:   fmt.Sprintf("%v", info["metadata_hash"]),
		IssuerAddress:  fmt.Sprintf("%v", info["issuer"]),
		StudentWallet:  fmt.Sprintf("%v", info["student_wallet"]),
		Timestamp:      int64(time.Now().Unix()),
	}, nil
}

// RegisterStudentWallet registers a student-wallet mapping
func (s *GoEthBlockchainService) RegisterStudentWallet(studentID, walletAddress string) error {
	// TODO: Call smart contract registerStudentWallet function
	fmt.Printf("🔗 Blockchain: Registering student-wallet mapping\n")
	fmt.Printf("   Student ID: %s\n", studentID)
	fmt.Printf("   Wallet: %s\n", walletAddress)
	return nil
}

// GetStudentWallet retrieves wallet address for a student
func (s *GoEthBlockchainService) GetStudentWallet(studentID string) (string, error) {
	// TODO: Call smart contract getStudentWallet function
	// For now, return empty (will trigger wallet generation)
	return "", fmt.Errorf("wallet not found for student %s", studentID)
}

// RevokeCertificateOnChain revokes a certificate on the blockchain
func (s *GoEthBlockchainService) RevokeCertificateOnChain(certID string) error {
	// TODO: Call smart contract revokeCertificate function
	fmt.Printf("🔗 Blockchain: Revoking certificate %s\n", certID)
	return nil
}

// Close closes the blockchain connection
func (s *GoEthBlockchainService) Close() {
	// Close HTTP client if needed
}
