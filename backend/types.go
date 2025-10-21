package main

import (
	"time"
)

// UserRole represents the different roles in the system
type UserRole string

const (
	RoleSSNMainAdmin     UserRole = "ssn_main_admin"
	RoleCOE             UserRole = "coe"
	RoleDepartmentFaculty UserRole = "department_faculty"
	RoleClubCoordinator UserRole = "club_coordinator"
	RoleExternalVerifier UserRole = "external_verifier"
	RoleStudent         UserRole = "student"
)

// RolePermissions defines what each role can do
type RolePermissions struct {
	CanOnboardSubAdmins     bool `json:"can_onboard_sub_admins"`
	CanDeployContracts      bool `json:"can_deploy_contracts"`
	CanAuthorizeValidators  bool `json:"can_authorize_validators"`
	CanIssueMarksheet       bool `json:"can_issue_marksheet"`
	CanIssueBonafide        bool `json:"can_issue_bonafide"`
	CanIssueNOC             bool `json:"can_issue_noc"`
	CanIssueParticipation   bool `json:"can_issue_participation"`
	CanVerifyCredentials    bool `json:"can_verify_credentials"`
	CanReadOnlyAccess       bool `json:"can_read_only_access"`
	CanManageUsers          bool `json:"can_manage_users"`
	CanViewAllCredentials   bool `json:"can_view_all_credentials"`
	CanApproveStudents      bool `json:"can_approve_students"`
}

// GetRolePermissions returns permissions for a given role
func GetRolePermissions(role UserRole) RolePermissions {
	switch role {
	case RoleSSNMainAdmin:
		return RolePermissions{
			CanOnboardSubAdmins:     true,
			CanDeployContracts:      true,
			CanAuthorizeValidators:  true,
			CanIssueMarksheet:       true,
			CanIssueBonafide:        true,
			CanIssueNOC:             true,
			CanIssueParticipation:   true,
			CanVerifyCredentials:    true,
			CanReadOnlyAccess:       true,
			CanManageUsers:          true,
			CanViewAllCredentials:   true,
			CanApproveStudents:      true,
		}
	case RoleCOE:
		return RolePermissions{
			CanIssueMarksheet:       true,
			CanVerifyCredentials:    true,
			CanReadOnlyAccess:       true,
			CanViewAllCredentials:   true,
		}
	case RoleDepartmentFaculty:
		return RolePermissions{
			CanIssueBonafide:        true,
			CanIssueNOC:             true,
			CanVerifyCredentials:    true,
			CanReadOnlyAccess:       true,
		}
	case RoleClubCoordinator:
		return RolePermissions{
			CanIssueParticipation:   true,
			CanVerifyCredentials:    true,
			CanReadOnlyAccess:       true,
		}
	case RoleExternalVerifier:
		return RolePermissions{
			CanVerifyCredentials:    true,
			CanReadOnlyAccess:       true,
		}
	case RoleStudent:
		return RolePermissions{
			CanReadOnlyAccess:       true,
		}
	default:
		return RolePermissions{}
	}
}

// Enhanced User struct with role support
type EnhancedUser struct {
	ID           int              `json:"id"`
	Name         string           `json:"name"`
	Email        string           `json:"email"`
	Phone        string           `json:"phone"`
	Password     string           `json:"-"` // Don't expose password in JSON
	StudentID    string           `json:"student_id,omitempty"`
	Role         UserRole         `json:"role"`
	Department   string           `json:"department,omitempty"`
	Institution  string           `json:"institution,omitempty"`
	ClubName     string           `json:"club_name,omitempty"`
	IsActive     bool             `json:"is_active"`
	IsApproved   bool             `json:"is_approved"`
	NodeAssigned bool             `json:"node_assigned"`
	CreatedAt    string           `json:"created_at"`
	UpdatedAt    string           `json:"updated_at"`
	Certificates []Certificate    `json:"certificates"`
	Permissions  RolePermissions  `json:"permissions"`
}

// CredentialType represents different types of credentials
type CredentialType string

const (
	CredentialTypeMarksheet     CredentialType = "marksheet"
	CredentialTypeBonafide      CredentialType = "bonafide"
	CredentialTypeNOC           CredentialType = "noc"
	CredentialTypeParticipation CredentialType = "participation"
	CredentialTypeDegree        CredentialType = "degree"
)

// CredentialRequest represents a request to issue a credential
type CredentialRequest struct {
	StudentID     string         `json:"student_id"`
	Type          CredentialType `json:"type"`
	Title         string         `json:"title"`
	Institution   string         `json:"institution"`
	Department    string         `json:"department,omitempty"`
	Semester      string         `json:"semester,omitempty"`
	Subject       string         `json:"subject,omitempty"`
	Marks         string         `json:"marks,omitempty"`
	Grade         string         `json:"grade,omitempty"`
	EventName     string         `json:"event_name,omitempty"`
	EventDate     string         `json:"event_date,omitempty"`
	Position      string         `json:"position,omitempty"`
	Description   string         `json:"description"`
	IssuedBy      string         `json:"issued_by"`
	ValidFrom     string         `json:"valid_from"`
	ValidUntil    string         `json:"valid_until,omitempty"`
}

// Enhanced Certificate struct
type EnhancedCertificate struct {
	ID            int            `json:"id"`
	Type          CredentialType `json:"type"`
	Title         string         `json:"title"`
	Institution   string         `json:"institution"`
	Department    string         `json:"department,omitempty"`
	Semester      string         `json:"semester,omitempty"`
	Subject       string         `json:"subject,omitempty"`
	Marks         string         `json:"marks,omitempty"`
	Grade         string         `json:"grade,omitempty"`
	EventName     string         `json:"event_name,omitempty"`
	EventDate     string         `json:"event_date,omitempty"`
	Position      string         `json:"position,omitempty"`
	IssuedDate    string         `json:"issued_date"`
	ValidFrom     string         `json:"valid_from"`
	ValidUntil    string         `json:"valid_until,omitempty"`
	Status        string         `json:"status"` // "pending", "issued", "verified", "expired"
	Description   string         `json:"description"`
	IssuedBy      string         `json:"issued_by"`
	VerifiedBy    string         `json:"verified_by,omitempty"`
	VerifiedAt    string         `json:"verified_at,omitempty"`
	BlockchainTx  string         `json:"blockchain_tx,omitempty"`
	QRCode        string         `json:"qr_code,omitempty"`
}

// RoleAssignmentRequest for assigning roles to users
type RoleAssignmentRequest struct {
	UserID       int      `json:"user_id"`
	Role         UserRole `json:"role"`
	Department   string   `json:"department,omitempty"`
	Institution  string   `json:"institution,omitempty"`
	ClubName     string   `json:"club_name,omitempty"`
	AssignedBy   int      `json:"assigned_by"`
}

// DashboardData represents data for role-specific dashboards
type DashboardData struct {
	UserRole       UserRole `json:"user_role"`
	TotalUsers     int      `json:"total_users,omitempty"`
	PendingUsers   int      `json:"pending_users,omitempty"`
	TotalCredentials int    `json:"total_credentials,omitempty"`
	IssuedToday    int      `json:"issued_today,omitempty"`
	VerifiedToday  int      `json:"verified_today,omitempty"`
	RecentActivity []ActivityLog `json:"recent_activity,omitempty"`
	QuickActions   []QuickAction `json:"quick_actions,omitempty"`
}

// ActivityLog represents system activity
type ActivityLog struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	UserName  string    `json:"user_name"`
	Action    string    `json:"action"`
	Details   string    `json:"details"`
	Timestamp time.Time `json:"timestamp"`
	IPAddress string    `json:"ip_address,omitempty"`
}

// QuickAction represents available actions for a role
type QuickAction struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Route       string `json:"route"`
	Permission  string `json:"permission"`
}

// GetQuickActions returns available actions for a role
func GetQuickActions(role UserRole) []QuickAction {
	switch role {
	case RoleSSNMainAdmin:
		return []QuickAction{
			{ID: "onboard_admin", Title: "Onboard Sub-Admin", Description: "Add new sub-administrators", Icon: "user-plus", Route: "/admin/onboard", Permission: "can_onboard_sub_admins"},
			{ID: "deploy_contract", Title: "Deploy Contract", Description: "Deploy smart contracts", Icon: "code", Route: "/admin/deploy", Permission: "can_deploy_contracts"},
			{ID: "authorize_validator", Title: "Authorize Validator", Description: "Authorize blockchain validators", Icon: "shield-check", Route: "/admin/validators", Permission: "can_authorize_validators"},
			{ID: "manage_users", Title: "Manage Users", Description: "View and manage all users", Icon: "users", Route: "/admin/users", Permission: "can_manage_users"},
			{ID: "view_credentials", Title: "View All Credentials", Description: "View all issued credentials", Icon: "certificate", Route: "/admin/credentials", Permission: "can_view_all_credentials"},
		}
	case RoleCOE:
		return []QuickAction{
			{ID: "issue_marksheet", Title: "Issue Marksheet", Description: "Issue semester marksheet", Icon: "file-text", Route: "/coe/issue-marksheet", Permission: "can_issue_marksheet"},
			{ID: "view_credentials", Title: "View Credentials", Description: "View issued credentials", Icon: "certificate", Route: "/coe/credentials", Permission: "can_view_all_credentials"},
		}
	case RoleDepartmentFaculty:
		return []QuickAction{
			{ID: "issue_bonafide", Title: "Issue Bonafide", Description: "Issue bonafide certificate", Icon: "file-check", Route: "/faculty/issue-bonafide", Permission: "can_issue_bonafide"},
			{ID: "issue_noc", Title: "Issue NOC", Description: "Issue No Objection Certificate", Icon: "file-x", Route: "/faculty/issue-noc", Permission: "can_issue_noc"},
		}
	case RoleClubCoordinator:
		return []QuickAction{
			{ID: "issue_participation", Title: "Issue Certificate", Description: "Issue participation certificate", Icon: "award", Route: "/club/issue-certificate", Permission: "can_issue_participation"},
		}
	case RoleExternalVerifier:
		return []QuickAction{
			{ID: "verify_credential", Title: "Verify Credential", Description: "Verify credential authenticity", Icon: "search", Route: "/verifier/verify", Permission: "can_verify_credentials"},
		}
	case RoleStudent:
		return []QuickAction{
			{ID: "view_my_credentials", Title: "My Credentials", Description: "View my issued credentials", Icon: "certificate", Route: "/student/credentials", Permission: "can_read_only_access"},
		}
	default:
		return []QuickAction{}
	}
}

// IsValidRole checks if a role is valid
func IsValidRole(role string) bool {
	validRoles := []UserRole{
		RoleSSNMainAdmin,
		RoleCOE,
		RoleDepartmentFaculty,
		RoleClubCoordinator,
		RoleExternalVerifier,
		RoleStudent,
	}
	
	for _, validRole := range validRoles {
		if string(validRole) == role {
			return true
		}
	}
	return false
}

// CanPerformAction checks if a user can perform a specific action
func (u *EnhancedUser) CanPerformAction(permission string) bool {
	perms := GetRolePermissions(u.Role)
	
	switch permission {
	case "can_onboard_sub_admins":
		return perms.CanOnboardSubAdmins
	case "can_deploy_contracts":
		return perms.CanDeployContracts
	case "can_authorize_validators":
		return perms.CanAuthorizeValidators
	case "can_issue_marksheet":
		return perms.CanIssueMarksheet
	case "can_issue_bonafide":
		return perms.CanIssueBonafide
	case "can_issue_noc":
		return perms.CanIssueNOC
	case "can_issue_participation":
		return perms.CanIssueParticipation
	case "can_verify_credentials":
		return perms.CanVerifyCredentials
	case "can_read_only_access":
		return perms.CanReadOnlyAccess
	case "can_manage_users":
		return perms.CanManageUsers
	case "can_view_all_credentials":
		return perms.CanViewAllCredentials
	case "can_approve_students":
		return perms.CanApproveStudents
	default:
		return false
	}
}
