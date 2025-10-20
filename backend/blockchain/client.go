package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

type BlockchainClient struct {
	client     *ethclient.Client
	contract   *CredentialManager
	auth       *bind.TransactOpts
	contractAddr common.Address
}

type StudentData struct {
	StudentID   string
	Name        string
	Email       string
	School      string
	TenthMarks  *big.Int
	PassingYear *big.Int
	IsApproved  bool
	NodeAddress common.Address
}

type CredentialData struct {
	CredentialID   string
	CredentialType string
	Title          string
	Institution    string
	StudentID      string
	IssuedDate     *big.Int
	Description    string
	IsVerified     bool
	Issuer         common.Address
}

func NewBlockchainClient(rpcURL, privateKeyHex, contractAddress string) (*BlockchainClient, error) {
	// Connect to the Ethereum client
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum client: %v", err)
	}

	// Parse private key
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %v", err)
	}

	// Get public key and address
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("failed to cast public key to ECDSA")
	}

	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	// Get nonce
	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %v", err)
	}

	// Get gas price
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %v", err)
	}

	// Create auth
	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(1337)) // GoEth testnet chain ID
	if err != nil {
		return nil, fmt.Errorf("failed to create transactor: %v", err)
	}
	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)
	auth.GasLimit = uint64(3000000)
	auth.GasPrice = gasPrice

	// Parse contract address
	contractAddr := common.HexToAddress(contractAddress)

	// Create contract instance
	contract, err := NewCredentialManager(contractAddr, client)
	if err != nil {
		return nil, fmt.Errorf("failed to create contract instance: %v", err)
	}

	return &BlockchainClient{
		client:       client,
		contract:     contract,
		auth:         auth,
		contractAddr: contractAddr,
	}, nil
}

func (bc *BlockchainClient) RegisterStudent(studentID, name, email, school string, tenthMarks, passingYear int64) error {
	_, err := bc.contract.RegisterStudent(
		bc.auth,
		studentID,
		name,
		email,
		school,
		big.NewInt(tenthMarks),
		big.NewInt(passingYear),
	)
	if err != nil {
		return fmt.Errorf("failed to register student: %v", err)
	}

	log.Printf("Student %s registered on blockchain", studentID)
	return nil
}

func (bc *BlockchainClient) ApproveStudent(studentID string, nodeAddress common.Address) error {
	_, err := bc.contract.ApproveStudent(bc.auth, studentID, nodeAddress)
	if err != nil {
		return fmt.Errorf("failed to approve student: %v", err)
	}

	log.Printf("Student %s approved and assigned node %s", studentID, nodeAddress.Hex())
	return nil
}

func (bc *BlockchainClient) IssueCredential(credentialID, studentID, credentialType, title, institution, description string) error {
	_, err := bc.contract.IssueCredential(
		bc.auth,
		credentialID,
		studentID,
		credentialType,
		title,
		institution,
		description,
	)
	if err != nil {
		return fmt.Errorf("failed to issue credential: %v", err)
	}

	log.Printf("Credential %s issued for student %s", credentialID, studentID)
	return nil
}

func (bc *BlockchainClient) GetStudent(studentID string) (*StudentData, error) {
	result, err := bc.contract.GetStudent(nil, studentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get student: %v", err)
	}

	return &StudentData{
		StudentID:   result.StudentId,
		Name:        result.Name,
		Email:       result.Email,
		School:      result.School,
		TenthMarks:  result.TenthMarks,
		PassingYear: result.PassingYear,
		IsApproved:  result.IsApproved,
		NodeAddress: result.NodeAddress,
	}, nil
}

func (bc *BlockchainClient) GetCredential(credentialID string) (*CredentialData, error) {
	result, err := bc.contract.GetCredential(nil, credentialID)
	if err != nil {
		return nil, fmt.Errorf("failed to get credential: %v", err)
	}

	return &CredentialData{
		CredentialID:   result.CredentialId,
		CredentialType: result.CredentialType,
		Title:          result.Title,
		Institution:    result.Institution,
		StudentID:      result.StudentId,
		IssuedDate:     result.IssuedDate,
		Description:    result.Description,
		IsVerified:     result.IsVerified,
		Issuer:         result.Issuer,
	}, nil
}

func (bc *BlockchainClient) GetStudentCredentials(nodeAddress common.Address) ([]string, error) {
	credentials, err := bc.contract.GetStudentCredentials(nil, nodeAddress)
	if err != nil {
		return nil, fmt.Errorf("failed to get student credentials: %v", err)
	}

	return credentials, nil
}

func (bc *BlockchainClient) VerifyCredential(credentialID string) (bool, error) {
	isVerified, err := bc.contract.VerifyCredential(nil, credentialID)
	if err != nil {
		return false, fmt.Errorf("failed to verify credential: %v", err)
	}

	return isVerified, nil
}

func (bc *BlockchainClient) GetTotalStudents() (*big.Int, error) {
	return bc.contract.GetTotalStudents(nil)
}

func (bc *BlockchainClient) GetTotalCredentials() (*big.Int, error) {
	return bc.contract.GetTotalCredentials(nil)
}

func (bc *BlockchainClient) GetApprovedStudents() (*big.Int, error) {
	return bc.contract.GetApprovedStudents(nil)
}

func (bc *BlockchainClient) GetAllStudents() ([]string, error) {
	return bc.contract.GetAllStudents(nil)
}

func (bc *BlockchainClient) GetAllCredentials() ([]string, error) {
	return bc.contract.GetAllCredentials(nil)
}

func (bc *BlockchainClient) GetContractAddress() common.Address {
	return bc.contractAddr
}

func (bc *BlockchainClient) Close() {
	bc.client.Close()
}

// Generate a unique node address for a student
func GenerateNodeAddress(studentID string) common.Address {
	// In a real implementation, this would be generated based on student data
	// For now, we'll create a deterministic address based on student ID
	hash := crypto.Keccak256Hash([]byte(studentID))
	return common.BytesToAddress(hash.Bytes()[:20])
}

// Validate Ethereum address format
func IsValidAddress(address string) bool {
	return common.IsHexAddress(address)
}

// Convert string to common.Address
func StringToAddress(address string) common.Address {
	return common.HexToAddress(address)
}
