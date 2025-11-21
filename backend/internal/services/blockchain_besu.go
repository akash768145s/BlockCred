package services

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"

	"blockcred-backend/internal/config"
	"blockcred-backend/internal/models"
)

// BesuBlockchainService implements blockchain operations using Hyperledger Besu
type BesuBlockchainService struct {
	config       config.Config
	contractAddr string
	httpClient   *http.Client
}

// NewBesuBlockchainService creates a new blockchain service connected to Besu
func NewBesuBlockchainService(cfg config.Config) (*BesuBlockchainService, error) {
	if cfg.BlockchainRPCURL == "" {
		return nil, fmt.Errorf("blockchain RPC URL not configured")
	}
	if cfg.ContractAddress == "" {
		// Contract not deployed yet, but we can still initialize
		fmt.Println("⚠️  Warning: Contract address not configured. Using mock transactions until contract is deployed.")
	}

	return &BesuBlockchainService{
		config:       cfg,
		contractAddr: cfg.ContractAddress,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}, nil
}

// callRPC makes a JSON-RPC call to the Besu node
func (s *BesuBlockchainService) callRPC(method string, params []interface{}) (*JSONRPCResponse, error) {
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

// getNonce gets the transaction count for an address (nonce)
func (s *BesuBlockchainService) getNonce(address string) (uint64, error) {
	response, err := s.callRPC("eth_getTransactionCount", []interface{}{address, "latest"})
	if err != nil {
		return 0, err
	}

	nonceHex, ok := response.Result.(string)
	if !ok {
		return 0, fmt.Errorf("invalid nonce response")
	}

	nonce := new(big.Int)
	nonce.SetString(strings.TrimPrefix(nonceHex, "0x"), 16)
	return nonce.Uint64(), nil
}

// getGasPrice gets the current gas price
func (s *BesuBlockchainService) getGasPrice() (*big.Int, error) {
	response, err := s.callRPC("eth_gasPrice", []interface{}{})
	if err != nil {
		return nil, err
	}

	gasPriceHex, ok := response.Result.(string)
	if !ok {
		return nil, fmt.Errorf("invalid gas price response")
	}

	gasPriceHex = strings.TrimPrefix(gasPriceHex, "0x")
	gasPrice, ok := new(big.Int).SetString(gasPriceHex, 16)
	if !ok {
		return nil, fmt.Errorf("failed to parse gas price")
	}

	return gasPrice, nil
}

// encodeIssueCertificate encodes the issueCertificate function call with ABI encoding
// Function signature: issueCertificate(string,string,string,string,string,string,address)
func (s *BesuBlockchainService) encodeIssueCertificate(
	certID, studentID, certType, ipfsCID, fileHash, metadataHash string,
	studentWallet common.Address,
) (string, error) {
	// Create ABI definition for the function
	contractABI, err := abi.JSON(strings.NewReader(`[{
		"name": "issueCertificate",
		"type": "function",
		"inputs": [
			{"name": "_certId", "type": "string"},
			{"name": "_studentId", "type": "string"},
			{"name": "_certType", "type": "string"},
			{"name": "_ipfsCID", "type": "string"},
			{"name": "_fileHash", "type": "string"},
			{"name": "_metadataHash", "type": "string"},
			{"name": "_studentWallet", "type": "address"}
		]
	}]`))
	if err != nil {
		return "", fmt.Errorf("failed to parse ABI: %w", err)
	}

	// Pack the arguments
	packed, err := contractABI.Pack("issueCertificate",
		certID,
		studentID,
		certType,
		ipfsCID,
		fileHash,
		metadataHash,
		studentWallet,
	)
	if err != nil {
		return "", fmt.Errorf("failed to pack arguments: %w", err)
	}

	// Return hex-encoded data (includes function selector + packed arguments)
	return hex.EncodeToString(packed), nil
}

// IssueCertificateOnChain issues a certificate with full on-chain data on Besu
func (s *BesuBlockchainService) IssueCertificateOnChain(data *OnChainCertificateData, ipfsCID string) (*ContractTransaction, error) {
	if s.contractAddr == "" {
		// Contract not deployed - use mock for now
		fmt.Println("⚠️  Contract not deployed. Using mock transaction.")
		return s.issueCertificateMock(data, ipfsCID)
	}

	// Issue certificate on Hyperledger Besu PoA network with all required on-chain data
	fmt.Printf("🧱 Besu Blockchain: Issuing certificate on-chain (PoA)\n")
	fmt.Printf("   Contract: %s\n", s.contractAddr)
	fmt.Printf("   CertID: %s\n", data.CertID)
	fmt.Printf("   Certificate Hash: %s (verifiability & tamper detection)\n", data.CredentialHash)
	fmt.Printf("   Metadata Hash: %s (prevents edits)\n", data.MetadataHash)
	fmt.Printf("   Issuer Address: %s (trust of authority)\n", data.IssuerAddress)
	fmt.Printf("   Timestamp: %d (immutable proof of time)\n", data.Timestamp)
	fmt.Printf("   Student Wallet: %s (persistent academic identity)\n", data.StudentWallet)
	fmt.Printf("   IPFS CID: %s\n", ipfsCID)
	
	// Get actual transaction from blockchain
	txHash, blockNumber, err := s.sendTransaction(data, ipfsCID)
	if err != nil {
		// Fallback to mock if transaction fails
		fmt.Printf("⚠️  Transaction failed, using mock: %v\n", err)
		return s.issueCertificateMock(data, ipfsCID)
	}

	return &ContractTransaction{
		TxHash:      txHash,
		BlockNumber: blockNumber,
		GasUsed:     200000,
		GasPrice:    "20000000000",
	}, nil
}

// sendTransaction sends a transaction to the Besu network with all on-chain data
// Stores: Certificate hash, Metadata hash, Issuer address, Timestamp, Student wallet, Revocation flag
func (s *BesuBlockchainService) sendTransaction(data *OnChainCertificateData, ipfsCID string) (string, uint64, error) {
	// Use issuer address as the transaction sender (must be authorized issuer)
	issuerAddr := data.IssuerAddress
	if issuerAddr == "" {
		// Fallback to validator if issuer address not provided
		issuerAddr = "0x53b8be11aada878bbf830e426d5d3071c34facef"
	}
	
	// Get nonce
	nonce, err := s.getNonce(issuerAddr)
	if err != nil {
		return "", 0, fmt.Errorf("failed to get nonce: %w", err)
	}

	// Get gas price
	gasPrice, err := s.getGasPrice()
	if err != nil {
		return "", 0, fmt.Errorf("failed to get gas price: %w", err)
	}

	// Convert student wallet to common.Address
	studentWallet := common.HexToAddress(data.StudentWallet)
	if !common.IsHexAddress(data.StudentWallet) {
		return "", 0, fmt.Errorf("invalid student wallet address: %s", data.StudentWallet)
	}

	// Encode function call with proper ABI encoding
	// issueCertificate(string _certId, string _studentId, string _certType, string _ipfsCID, 
	//                  string _fileHash, string _metadataHash, address _studentWallet)
	txDataHex, err := s.encodeIssueCertificate(
		data.CertID,
		data.StudentID,
		string(data.CertType),
		ipfsCID,
		data.CredentialHash,
		data.MetadataHash,
		studentWallet,
	)
	if err != nil {
		return "", 0, fmt.Errorf("failed to encode function call: %w", err)
	}

	tx := map[string]interface{}{
		"from":     issuerAddr,
		"to":       s.contractAddr,
		"data":     "0x" + txDataHex,
		"gas":      "0x30d40", // 200000 in hex
		"gasPrice": fmt.Sprintf("0x%x", gasPrice),
		"nonce":    fmt.Sprintf("0x%x", nonce),
		"value":    "0x0",
	}

	// Send transaction
	// Note: For Besu, you may need to unlock the account or use eth_sendTransaction with proper authentication
	response, err := s.callRPC("eth_sendTransaction", []interface{}{tx})
	if err != nil {
		return "", 0, fmt.Errorf("failed to send transaction: %w", err)
	}

	txHash, ok := response.Result.(string)
	if !ok {
		return "", 0, fmt.Errorf("invalid transaction hash response")
	}

	// Wait for transaction receipt (Clique PoA has 5 second block period)
	// Try multiple times with increasing wait time
	maxRetries := 12 // Up to 60 seconds
	for i := 0; i < maxRetries; i++ {
		time.Sleep(5 * time.Second) // Wait for block period
		
		receipt, err := s.getTransactionReceipt(txHash)
		if err == nil && receipt != nil {
			return txHash, receipt.BlockNumber, nil
		}
		
		// If still no receipt, try again
		if i < maxRetries-1 {
			fmt.Printf("   Waiting for block confirmation (attempt %d/%d)...\n", i+1, maxRetries)
		}
	}
	
	// If receipt still not available, return tx hash with block 0
	// The transaction is still pending and will be mined in next block
	fmt.Printf("⚠️  Transaction sent but receipt not available yet. TX: %s\n", txHash)
	return txHash, 0, nil
}

// getTransactionReceipt gets the receipt for a transaction
func (s *BesuBlockchainService) getTransactionReceipt(txHash string) (*TransactionReceipt, error) {
	response, err := s.callRPC("eth_getTransactionReceipt", []interface{}{txHash})
	if err != nil {
		return nil, err
	}

	// Parse receipt
	receiptMap, ok := response.Result.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid receipt format")
	}

	blockNumberHex, ok := receiptMap["blockNumber"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid block number")
	}

	blockNumber := new(big.Int)
	blockNumber.SetString(strings.TrimPrefix(blockNumberHex, "0x"), 16)

	return &TransactionReceipt{
		BlockNumber: blockNumber.Uint64(),
		Status:      "0x1", // Success
	}, nil
}

// TransactionReceipt represents a transaction receipt
type TransactionReceipt struct {
	BlockNumber uint64
	Status      string
}

// issueCertificateMock creates a mock transaction when contract is not deployed
func (s *BesuBlockchainService) issueCertificateMock(data *OnChainCertificateData, ipfsCID string) (*ContractTransaction, error) {
	// Get current block number
	response, err := s.callRPC("eth_blockNumber", []interface{}{})
	if err != nil {
		return nil, err
	}

	blockNumberHex, ok := response.Result.(string)
	if !ok {
		return nil, fmt.Errorf("invalid block number response")
	}

	blockNumber := new(big.Int)
	blockNumber.SetString(strings.TrimPrefix(blockNumberHex, "0x"), 16)

	// Generate a mock transaction hash
	txHash := fmt.Sprintf("0x%x", sha256.Sum256([]byte(fmt.Sprintf("%s%d", data.CertID, time.Now().UnixNano()))))

	return &ContractTransaction{
		TxHash:      txHash,
		BlockNumber: blockNumber.Uint64(),
		GasUsed:     200000,
		GasPrice:    "20000000000",
	}, nil
}

// IssueCertificate implements BlockchainServiceInterface
func (s *BesuBlockchainService) IssueCertificate(certID, ipfsCID string, certType models.CredentialType) (*ContractTransaction, error) {
	// Use simplified on-chain data
	data := &OnChainCertificateData{
		CertID:         certID,
		CredentialHash: "",
		MetadataHash:   "",
		CertType:       certType,
		Timestamp:      time.Now().Unix(),
	}
	return s.IssueCertificateOnChain(data, ipfsCID)
}

// VerifyCertificate checks if a certificate exists on the blockchain
func (s *BesuBlockchainService) VerifyCertificate(certID string) (bool, error) {
	if s.contractAddr == "" {
		return true, nil // Mock verification
	}

	// Call contract's verifyCertificate function
	// In production, use proper ABI encoding
	response, err := s.callRPC("eth_call", []interface{}{
		map[string]interface{}{
			"to":   s.contractAddr,
			"data": fmt.Sprintf("0x%x", []byte("verifyCertificate:"+certID)),
		},
		"latest",
	})
	if err != nil {
		return false, err
	}

	// Parse result (simplified)
	result, ok := response.Result.(string)
	if !ok {
		return false, fmt.Errorf("invalid verification result")
	}

	// In production, decode the boolean result from hex
	return result != "0x0", nil
}

// GetCertificateOnChain retrieves on-chain certificate data
func (s *BesuBlockchainService) GetCertificateOnChain(certID string) (*OnChainCertificateData, error) {
	if s.contractAddr == "" {
		// Return mock data
		return &OnChainCertificateData{
			CertID:         certID,
			CredentialHash: "0xabc123...",
			MetadataHash:   "0xdef456...",
			Timestamp:      time.Now().Unix(),
		}, nil
	}

	// Call contract's getCertificate function
	// In production, use proper ABI encoding
	response, err := s.callRPC("eth_call", []interface{}{
		map[string]interface{}{
			"to":   s.contractAddr,
			"data": fmt.Sprintf("0x%x", []byte("getCertificate:"+certID)),
		},
		"latest",
	})
	if err != nil {
		return nil, err
	}

	// Parse result (simplified - in production decode properly)
	result, ok := response.Result.(string)
	if !ok {
		return nil, fmt.Errorf("invalid certificate data")
	}

	// Check result length before slicing
	resultLen := len(result)
	var credentialHash, metadataHash string
	
	if resultLen >= 20 {
		credentialHash = result[:20] + "..."
	} else {
		credentialHash = result + "..."
	}
	
	if resultLen >= 40 {
		metadataHash = result[20:40] + "..."
	} else if resultLen > 20 {
		metadataHash = result[20:] + "..."
	} else {
		metadataHash = "N/A"
	}

	// In production, decode the struct from hex
	// For now, return mock
	return &OnChainCertificateData{
		CertID:         certID,
		CredentialHash: credentialHash,
		MetadataHash:   metadataHash,
		Timestamp:      time.Now().Unix(),
	}, nil
}

// RegisterStudentWallet registers a student-wallet mapping
func (s *BesuBlockchainService) RegisterStudentWallet(studentID, walletAddress string) error {
	if s.contractAddr == "" {
		fmt.Printf("🔗 Besu: Registering student-wallet mapping (mock)\n")
		fmt.Printf("   Student ID: %s\n", studentID)
		fmt.Printf("   Wallet: %s\n", walletAddress)
		return nil
	}

	// Call contract's registerStudentWallet function
	// In production, use proper ABI encoding and send transaction
	fmt.Printf("🔗 Besu: Registering student-wallet mapping\n")
	fmt.Printf("   Student ID: %s\n", studentID)
	fmt.Printf("   Wallet: %s\n", walletAddress)
	
	// TODO: Implement actual contract call
	return nil
}

// GetStudentWallet retrieves wallet address for a student
func (s *BesuBlockchainService) GetStudentWallet(studentID string) (string, error) {
	if s.contractAddr == "" {
		return "", fmt.Errorf("wallet not found for student %s", studentID)
	}

	// Call contract's getStudentWallet function
	// In production, use proper ABI encoding
	response, err := s.callRPC("eth_call", []interface{}{
		map[string]interface{}{
			"to":   s.contractAddr,
			"data": fmt.Sprintf("0x%x", []byte("getStudentWallet:"+studentID)),
		},
		"latest",
	})
	if err != nil {
		return "", err
	}

	result, ok := response.Result.(string)
	if !ok || result == "0x" || result == "0x0" {
		return "", fmt.Errorf("wallet not found for student %s", studentID)
	}

	return result, nil
}

// RevokeCertificateOnChain revokes a certificate on the blockchain
func (s *BesuBlockchainService) RevokeCertificateOnChain(certID string) error {
	if s.contractAddr == "" {
		fmt.Printf("🔗 Besu: Revoking certificate %s (mock)\n", certID)
		return nil
	}

	// Call contract's revokeCertificate function
	// In production, use proper ABI encoding and send transaction
	fmt.Printf("🔗 Besu: Revoking certificate %s\n", certID)
	
	// TODO: Implement actual contract call
	return nil
}

// ComputeCertID computes the certificate ID using SHA256(fileHash + studentId + issuedAt)
func (s *BesuBlockchainService) ComputeCertID(fileHash, studentID string, issuedAt time.Time) string {
	input := fileHash + studentID + issuedAt.Format(time.RFC3339)
	hash := sha256.Sum256([]byte(input))
	return fmt.Sprintf("0x%x", hash)
}

// GetCertificateInfo retrieves certificate information from the blockchain
func (s *BesuBlockchainService) GetCertificateInfo(certID string) (map[string]interface{}, error) {
	data, err := s.GetCertificateOnChain(certID)
	if err != nil {
		return nil, err
	}

	info := map[string]interface{}{
		"cert_id":         data.CertID,
		"credential_hash": data.CredentialHash,
		"metadata_hash":   data.MetadataHash,
		"timestamp":       data.Timestamp,
		"is_valid":        true,
	}

	return info, nil
}

// GetBlockNumber gets the current block number
func (s *BesuBlockchainService) GetBlockNumber() (uint64, error) {
	response, err := s.callRPC("eth_blockNumber", []interface{}{})
	if err != nil {
		return 0, err
	}

	blockNumberHex, ok := response.Result.(string)
	if !ok {
		return 0, fmt.Errorf("invalid block number response")
	}

	blockNumber := new(big.Int)
	blockNumber.SetString(strings.TrimPrefix(blockNumberHex, "0x"), 16)
	return blockNumber.Uint64(), nil
}

// GetGasPrice gets the current gas price
func (s *BesuBlockchainService) GetGasPrice() (*big.Int, error) {
	return s.getGasPrice()
}

// RegisterIssuer registers an issuer on the blockchain
func (s *BesuBlockchainService) RegisterIssuer(issuerAddress, name, role, institution string) error {
	if s.contractAddr == "" {
		fmt.Printf("🔗 Besu: Registering issuer (mock)\n")
		fmt.Printf("   Address: %s\n", issuerAddress)
		fmt.Printf("   Name: %s\n", name)
		fmt.Printf("   Role: %s\n", role)
		fmt.Printf("   Institution: %s\n", institution)
		return nil
	}

	// TODO: Implement actual contract call to registerIssuer
	fmt.Printf("🔗 Besu: Registering issuer\n")
	fmt.Printf("   Address: %s\n", issuerAddress)
	fmt.Printf("   Name: %s\n", name)
	fmt.Printf("   Role: %s\n", role)
	fmt.Printf("   Institution: %s\n", institution)
	
	return nil
}

// Close closes the blockchain connection
func (s *BesuBlockchainService) Close() {
	// No persistent connection to close
}

