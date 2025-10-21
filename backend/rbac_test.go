package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Test data
var testUsers = []EnhancedUser{
	{
		ID:          1,
		Name:        "SSN Main Admin",
		Email:       "admin@ssn.edu.in",
		Role:        RoleSSNMainAdmin,
		IsActive:    true,
		IsApproved:  true,
		Permissions: GetRolePermissions(RoleSSNMainAdmin),
	},
	{
		ID:          2,
		Name:        "COE User",
		Email:       "coe@ssn.edu.in",
		Role:        RoleCOE,
		IsActive:    true,
		IsApproved:  true,
		Permissions: GetRolePermissions(RoleCOE),
	},
	{
		ID:          3,
		Name:        "Faculty User",
		Email:       "faculty@ssn.edu.in",
		Role:        RoleDepartmentFaculty,
		IsActive:    true,
		IsApproved:  true,
		Permissions: GetRolePermissions(RoleDepartmentFaculty),
	},
	{
		ID:          4,
		Name:        "Student User",
		Email:       "student@ssn.edu.in",
		Role:        RoleStudent,
		IsActive:    true,
		IsApproved:  true,
		Permissions: GetRolePermissions(RoleStudent),
	},
}

func TestRolePermissions(t *testing.T) {
	tests := []struct {
		role       UserRole
		permission string
		expected   bool
	}{
		{RoleSSNMainAdmin, "can_onboard_sub_admins", true},
		{RoleSSNMainAdmin, "can_deploy_contracts", true},
		{RoleSSNMainAdmin, "can_issue_marksheet", true},
		{RoleCOE, "can_issue_marksheet", true},
		{RoleCOE, "can_onboard_sub_admins", false},
		{RoleDepartmentFaculty, "can_issue_bonafide", true},
		{RoleDepartmentFaculty, "can_issue_marksheet", false},
		{RoleClubCoordinator, "can_issue_participation", true},
		{RoleExternalVerifier, "can_verify_credentials", true},
		{RoleExternalVerifier, "can_issue_marksheet", false},
		{RoleStudent, "can_read_only_access", true},
		{RoleStudent, "can_issue_marksheet", false},
	}

	for _, test := range tests {
		perms := GetRolePermissions(test.role)
		user := &EnhancedUser{Role: test.role, Permissions: perms}
		result := user.CanPerformAction(test.permission)
		
		if result != test.expected {
			t.Errorf("Role %s, Permission %s: expected %v, got %v", 
				test.role, test.permission, test.expected, result)
		}
	}
}

func TestRoleValidation(t *testing.T) {
	validRoles := []string{
		"ssn_main_admin",
		"coe",
		"department_faculty",
		"club_coordinator",
		"external_verifier",
		"student",
	}

	invalidRoles := []string{
		"invalid_role",
		"admin",
		"",
		"user",
	}

	for _, role := range validRoles {
		if !IsValidRole(role) {
			t.Errorf("Role %s should be valid", role)
		}
	}

	for _, role := range invalidRoles {
		if IsValidRole(role) {
			t.Errorf("Role %s should be invalid", role)
		}
	}
}

func TestQuickActions(t *testing.T) {
	tests := []struct {
		role     UserRole
		expected int // expected number of quick actions
	}{
		{RoleSSNMainAdmin, 5},
		{RoleCOE, 2},
		{RoleDepartmentFaculty, 2},
		{RoleClubCoordinator, 1},
		{RoleExternalVerifier, 1},
		{RoleStudent, 1},
	}

	for _, test := range tests {
		actions := GetQuickActions(test.role)
		if len(actions) != test.expected {
			t.Errorf("Role %s: expected %d quick actions, got %d", 
				test.role, test.expected, len(actions))
		}
	}
}

func TestEnhancedLogin(t *testing.T) {
	// Initialize test users
	enhancedUsers = testUsers

	tests := []struct {
		name     string
		username string
		password string
		expected int // expected HTTP status code
	}{
		{"Valid admin login", "admin@ssn.edu.in", "admin123", http.StatusOK},
		{"Valid COE login", "coe@ssn.edu.in", "coe123", http.StatusOK},
		{"Invalid credentials", "admin@ssn.edu.in", "wrongpassword", http.StatusUnauthorized},
		{"Non-existent user", "nonexistent@ssn.edu.in", "password", http.StatusUnauthorized},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			req := LoginRequest{
				Username: test.username,
				Password: test.password,
			}

			jsonData, _ := json.Marshal(req)
			request := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(jsonData))
			request.Header.Set("Content-Type", "application/json")

			response := httptest.NewRecorder()
			enhancedLoginHandler(response, request)

			if response.Code != test.expected {
				t.Errorf("Expected status %d, got %d", test.expected, response.Code)
			}
		})
	}
}

func TestRoleAssignment(t *testing.T) {
	// Initialize test users
	enhancedUsers = testUsers

	tests := []struct {
		name     string
		userID   int
		role     UserRole
		expected int
	}{
		{"Valid role assignment", 4, RoleCOE, http.StatusOK},
		{"Invalid user ID", 999, RoleCOE, http.StatusNotFound},
		{"Invalid role", 4, "invalid_role", http.StatusBadRequest},
	}

	for _, test := range test {
		t.Run(test.name, func(t *testing.T) {
			req := RoleAssignmentRequest{
				UserID: test.userID,
				Role:   test.role,
			}

			jsonData, _ := json.Marshal(req)
			request := httptest.NewRequest("POST", "/api/users/1/assign-role", bytes.NewBuffer(jsonData))
			request.Header.Set("Content-Type", "application/json")
			request.Header.Set("X-User-ID", "1")
			request.Header.Set("X-User-Role", "ssn_main_admin")

			response := httptest.NewRecorder()
			assignRoleHandler(response, request)

			if response.Code != test.expected {
				t.Errorf("Expected status %d, got %d", test.expected, response.Code)
			}
		})
	}
}

func TestCredentialIssuance(t *testing.T) {
	// Initialize test users
	enhancedUsers = testUsers

	tests := []struct {
		name           string
		userRole       UserRole
		credentialType CredentialType
		expected       bool
	}{
		{"COE can issue marksheet", RoleCOE, CredentialTypeMarksheet, true},
		{"COE cannot issue bonafide", RoleCOE, CredentialTypeBonafide, false},
		{"Faculty can issue bonafide", RoleDepartmentFaculty, CredentialTypeBonafide, true},
		{"Faculty can issue NOC", RoleDepartmentFaculty, CredentialTypeNOC, true},
		{"Faculty cannot issue marksheet", RoleDepartmentFaculty, CredentialTypeMarksheet, false},
		{"Club coordinator can issue participation", RoleClubCoordinator, CredentialTypeParticipation, true},
		{"Student cannot issue credentials", RoleStudent, CredentialTypeMarksheet, false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := canIssueCredentialType(test.userRole, test.credentialType)
			if result != test.expected {
				t.Errorf("Expected %v, got %v", test.expected, result)
			}
		})
	}
}

func TestDashboardData(t *testing.T) {
	// Initialize test users
	enhancedUsers = testUsers

	tests := []struct {
		role           UserRole
		expectedFields []string
	}{
		{RoleSSNMainAdmin, []string{"total_users", "pending_users", "total_credentials"}},
		{RoleCOE, []string{"total_credentials", "issued_today"}},
		{RoleStudent, []string{"total_credentials"}},
	}

	for _, test := range tests {
		t.Run(string(test.role), func(t *testing.T) {
			data := getDashboardData(test.role, 1)
			
			if data.UserRole != test.role {
				t.Errorf("Expected role %s, got %s", test.role, data.UserRole)
			}

			// Check if expected fields are present
			for _, field := range test.expectedFields {
				switch field {
				case "total_users":
					if data.TotalUsers == 0 {
						t.Errorf("Expected total_users to be set")
					}
				case "pending_users":
					if data.PendingUsers == 0 {
						t.Errorf("Expected pending_users to be set")
					}
				case "total_credentials":
					if data.TotalCredentials == 0 {
						t.Errorf("Expected total_credentials to be set")
					}
				case "issued_today":
					if data.IssuedToday == 0 {
						t.Errorf("Expected issued_today to be set")
					}
				}
			}
		})
	}
}

func TestActivityLogging(t *testing.T) {
	// Clear activity logs
	activityLogs = []ActivityLog{}

	// Log some activities
	LogActivity(1, "LOGIN", "User logged in", "127.0.0.1")
	LogActivity(2, "CREDENTIAL_ISSUED", "Issued marksheet", "127.0.0.1")

	// Check if activities were logged
	if len(activityLogs) != 2 {
		t.Errorf("Expected 2 activities, got %d", len(activityLogs))
	}

	// Check first activity
	if activityLogs[0].UserID != 1 {
		t.Errorf("Expected user ID 1, got %d", activityLogs[0].UserID)
	}

	if activityLogs[0].Action != "LOGIN" {
		t.Errorf("Expected action LOGIN, got %s", activityLogs[0].Action)
	}
}

func TestRoleDisplayNames(t *testing.T) {
	tests := []struct {
		role     UserRole
		expected string
	}{
		{RoleSSNMainAdmin, "SSN Main Administrator"},
		{RoleCOE, "Controller of Examinations"},
		{RoleDepartmentFaculty, "Department Faculty"},
		{RoleClubCoordinator, "Club Coordinator"},
		{RoleExternalVerifier, "External Verifier"},
		{RoleStudent, "Student"},
	}

	for _, test := range tests {
		result := getRoleDisplayName(test.role)
		if result != test.expected {
			t.Errorf("Role %s: expected %s, got %s", test.role, test.expected, result)
		}
	}
}

func TestPermissionChecks(t *testing.T) {
	// Test SSN Main Admin permissions
	adminUser := &EnhancedUser{
		Role:        RoleSSNMainAdmin,
		Permissions: GetRolePermissions(RoleSSNMainAdmin),
	}

	adminPermissions := []string{
		"can_onboard_sub_admins",
		"can_deploy_contracts",
		"can_authorize_validators",
		"can_issue_marksheet",
		"can_issue_bonafide",
		"can_issue_noc",
		"can_issue_participation",
		"can_verify_credentials",
		"can_read_only_access",
		"can_manage_users",
		"can_view_all_credentials",
		"can_approve_students",
	}

	for _, permission := range adminPermissions {
		if !adminUser.CanPerformAction(permission) {
			t.Errorf("SSN Main Admin should have permission: %s", permission)
		}
	}

	// Test Student permissions
	studentUser := &EnhancedUser{
		Role:        RoleStudent,
		Permissions: GetRolePermissions(RoleStudent),
	}

	studentPermissions := []string{
		"can_read_only_access",
	}

	nonStudentPermissions := []string{
		"can_issue_marksheet",
		"can_issue_bonafide",
		"can_manage_users",
	}

	for _, permission := range studentPermissions {
		if !studentUser.CanPerformAction(permission) {
			t.Errorf("Student should have permission: %s", permission)
		}
	}

	for _, permission := range nonStudentPermissions {
		if studentUser.CanPerformAction(permission) {
			t.Errorf("Student should not have permission: %s", permission)
		}
	}
}

func TestCredentialTypeValidation(t *testing.T) {
	tests := []struct {
		credentialType CredentialType
		valid          bool
	}{
		{CredentialTypeMarksheet, true},
		{CredentialTypeBonafide, true},
		{CredentialTypeNOC, true},
		{CredentialTypeParticipation, true},
		{CredentialTypeDegree, true},
		{"invalid_type", false},
		{"", false},
	}

	for _, test := range tests {
		// This is a simple validation - in production, you'd have more sophisticated validation
		isValid := test.credentialType != "" && 
			(test.credentialType == CredentialTypeMarksheet ||
			 test.credentialType == CredentialTypeBonafide ||
			 test.credentialType == CredentialTypeNOC ||
			 test.credentialType == CredentialTypeParticipation ||
			 test.credentialType == CredentialTypeDegree)

		if isValid != test.valid {
			t.Errorf("Credential type %s: expected %v, got %v", 
				test.credentialType, test.valid, isValid)
		}
	}
}

// Benchmark tests
func BenchmarkRolePermissionCheck(b *testing.B) {
	user := &EnhancedUser{
		Role:        RoleSSNMainAdmin,
		Permissions: GetRolePermissions(RoleSSNMainAdmin),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		user.CanPerformAction("can_issue_marksheet")
	}
}

func BenchmarkGetRolePermissions(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		GetRolePermissions(RoleSSNMainAdmin)
	}
}

func BenchmarkIsValidRole(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		IsValidRole("ssn_main_admin")
	}
}
