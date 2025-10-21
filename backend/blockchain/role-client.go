package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// RoleManagerClient handles role management on blockchain
type RoleManagerClient struct {
	client     *ethclient.Client
	contract   *RoleManager
	auth       *bind.TransactOpts
	contractAddr common.Address
}

// Role definitions matching smart contract
type Role uint8

const (
	RoleSSNMainAdmin Role = iota
	RoleCOE
	RoleDepartmentFaculty
	RoleClubCoordinator
	RoleExternalVerifier
	RoleStudent
)

// Permission definitions matching smart contract
type Permission uint8

const (
	PermissionOnboardSubAdmins Permission = iota
	PermissionDeployContracts
	PermissionAuthorizeValidators
	PermissionIssueMarksheet
	PermissionIssueBonafide
	PermissionIssueNOC
	PermissionIssueParticipation
	PermissionVerifyCredentials
	PermissionReadOnlyAccess
	PermissionManageUsers
	PermissionViewAllCredentials
	PermissionApproveStudents
)

// NewRoleManagerClient creates a new role manager client
func NewRoleManagerClient(rpcURL, privateKeyHex, contractAddress string) (*RoleManagerClient, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum client: %v", err)
	}

	// Parse private key
	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid private key: %v", err)
	}

	// Get public key and address
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("error casting public key to ECDSA")
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

	// Create transaction options
	auth := bind.NewKeyedTransactor(privateKey)
	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)
	auth.GasLimit = uint64(300000)
	auth.GasPrice = gasPrice

	// Parse contract address
	contractAddr := common.HexToAddress(contractAddress)

	// Create contract instance
	contract, err := NewRoleManager(contractAddr, client)
	if err != nil {
		return nil, fmt.Errorf("failed to create contract instance: %v", err)
	}

	return &RoleManagerClient{
		client:       client,
		contract:     contract,
		auth:         auth,
		contractAddr: contractAddr,
	}, nil
}

// OnboardUser onboards a new user with specific role
func (rmc *RoleManagerClient) OnboardUser(userAddress, name, email string, role Role) error {
	addr := common.HexToAddress(userAddress)
	
	tx, err := rmc.contract.OnboardUser(rmc.auth, addr, uint8(role), name, email)
	if err != nil {
		return fmt.Errorf("failed to onboard user: %v", err)
	}

	fmt.Printf("User onboarded successfully. Transaction: %s\n", tx.Hash().Hex())
	return nil
}

// AssignRole assigns a role to a user
func (rmc *RoleManagerClient) AssignRole(userAddress string, role Role) error {
	addr := common.HexToAddress(userAddress)
	
	tx, err := rmc.contract.AssignRole(rmc.auth, addr, uint8(role))
	if err != nil {
		return fmt.Errorf("failed to assign role: %v", err)
	}

	fmt.Printf("Role assigned successfully. Transaction: %s\n", tx.Hash().Hex())
	return nil
}

// RevokeRole revokes a role from a user
func (rmc *RoleManagerClient) RevokeRole(userAddress string) error {
	addr := common.HexToAddress(userAddress)
	
	tx, err := rmc.contract.RevokeRole(rmc.auth, addr)
	if err != nil {
		return fmt.Errorf("failed to revoke role: %v", err)
	}

	fmt.Printf("Role revoked successfully. Transaction: %s\n", tx.Hash().Hex())
	return nil
}

// GrantPermission grants a permission to a role
func (rmc *RoleManagerClient) GrantPermission(role Role, permission Permission) error {
	tx, err := rmc.contract.GrantPermission(rmc.auth, uint8(role), uint8(permission))
	if err != nil {
		return fmt.Errorf("failed to grant permission: %v", err)
	}

	fmt.Printf("Permission granted successfully. Transaction: %s\n", tx.Hash().Hex())
	return nil
}

// RevokePermission revokes a permission from a role
func (rmc *RoleManagerClient) RevokePermission(role Role, permission Permission) error {
	tx, err := rmc.contract.RevokePermission(rmc.auth, uint8(role), uint8(permission))
	if err != nil {
		return fmt.Errorf("failed to revoke permission: %v", err)
	}

	fmt.Printf("Permission revoked successfully. Transaction: %s\n", tx.Hash().Hex())
	return nil
}

// HasUserPermission checks if a user has a specific permission
func (rmc *RoleManagerClient) HasUserPermission(userAddress string, permission Permission) (bool, error) {
	addr := common.HexToAddress(userAddress)
	
	hasPermission, err := rmc.contract.HasUserPermission(nil, addr, uint8(permission))
	if err != nil {
		return false, fmt.Errorf("failed to check user permission: %v", err)
	}

	return hasPermission, nil
}

// GetUserRole gets the role of a user
func (rmc *RoleManagerClient) GetUserRole(userAddress string) (Role, error) {
	addr := common.HexToAddress(userAddress)
	
	role, err := rmc.contract.GetUserRole(nil, addr)
	if err != nil {
		return 0, fmt.Errorf("failed to get user role: %v", err)
	}

	return Role(role), nil
}

// GetUsersByRole gets all users with a specific role
func (rmc *RoleManagerClient) GetUsersByRole(role Role) ([]string, error) {
	addresses, err := rmc.contract.GetUsersByRole(nil, uint8(role))
	if err != nil {
		return nil, fmt.Errorf("failed to get users by role: %v", err)
	}

	var result []string
	for _, addr := range addresses {
		result = append(result, addr.Hex())
	}

	return result, nil
}

// GetRolePermission checks if a role has a specific permission
func (rmc *RoleManagerClient) GetRolePermission(role Role, permission Permission) (bool, error) {
	hasPermission, err := rmc.contract.GetRolePermission(nil, uint8(role), uint8(permission))
	if err != nil {
		return false, fmt.Errorf("failed to get role permission: %v", err)
	}

	return hasPermission, nil
}

// GetRoleUserCount gets the number of users with a specific role
func (rmc *RoleManagerClient) GetRoleUserCount(role Role) (int, error) {
	count, err := rmc.contract.GetRoleUserCount(nil, uint8(role))
	if err != nil {
		return 0, fmt.Errorf("failed to get role user count: %v", err)
	}

	return int(count.Int64()), nil
}

// IsAdmin checks if a user is an admin
func (rmc *RoleManagerClient) IsAdmin(userAddress string) (bool, error) {
	addr := common.HexToAddress(userAddress)
	
	isAdmin, err := rmc.contract.IsAdmin(nil, addr)
	if err != nil {
		return false, fmt.Errorf("failed to check if user is admin: %v", err)
	}

	return isAdmin, nil
}

// CanIssueCredentials checks if a user can issue credentials
func (rmc *RoleManagerClient) CanIssueCredentials(userAddress string) (bool, error) {
	addr := common.HexToAddress(userAddress)
	
	canIssue, err := rmc.contract.CanIssueCredentials(nil, addr)
	if err != nil {
		return false, fmt.Errorf("failed to check if user can issue credentials: %v", err)
	}

	return canIssue, nil
}

// CanVerifyCredentials checks if a user can verify credentials
func (rmc *RoleManagerClient) CanVerifyCredentials(userAddress string) (bool, error) {
	addr := common.HexToAddress(userAddress)
	
	canVerify, err := rmc.contract.CanVerifyCredentials(nil, addr)
	if err != nil {
		return false, fmt.Errorf("failed to check if user can verify credentials: %v", err)
	}

	return canVerify, nil
}

// CanManageUsers checks if a user can manage users
func (rmc *RoleManagerClient) CanManageUsers(userAddress string) (bool, error) {
	addr := common.HexToAddress(userAddress)
	
	canManage, err := rmc.contract.CanManageUsers(nil, addr)
	if err != nil {
		return false, fmt.Errorf("failed to check if user can manage users: %v", err)
	}

	return canManage, nil
}

// GetRoleDisplayName returns human-readable role name
func GetRoleDisplayName(role Role) string {
	switch role {
	case RoleSSNMainAdmin:
		return "SSN Main Administrator"
	case RoleCOE:
		return "Controller of Examinations"
	case RoleDepartmentFaculty:
		return "Department Faculty"
	case RoleClubCoordinator:
		return "Club Coordinator"
	case RoleExternalVerifier:
		return "External Verifier"
	case RoleStudent:
		return "Student"
	default:
		return "Unknown Role"
	}
}

// GetPermissionDisplayName returns human-readable permission name
func GetPermissionDisplayName(permission Permission) string {
	switch permission {
	case PermissionOnboardSubAdmins:
		return "Onboard Sub-Admins"
	case PermissionDeployContracts:
		return "Deploy Contracts"
	case PermissionAuthorizeValidators:
		return "Authorize Validators"
	case PermissionIssueMarksheet:
		return "Issue Marksheet"
	case PermissionIssueBonafide:
		return "Issue Bonafide"
	case PermissionIssueNOC:
		return "Issue NOC"
	case PermissionIssueParticipation:
		return "Issue Participation"
	case PermissionVerifyCredentials:
		return "Verify Credentials"
	case PermissionReadOnlyAccess:
		return "Read-Only Access"
	case PermissionManageUsers:
		return "Manage Users"
	case PermissionViewAllCredentials:
		return "View All Credentials"
	case PermissionApproveStudents:
		return "Approve Students"
	default:
		return "Unknown Permission"
	}
}

// ValidateRole validates if a role is valid
func ValidateRole(role Role) bool {
	return role >= RoleSSNMainAdmin && role <= RoleStudent
}

// ValidatePermission validates if a permission is valid
func ValidatePermission(permission Permission) bool {
	return permission >= PermissionOnboardSubAdmins && permission <= PermissionApproveStudents
}
