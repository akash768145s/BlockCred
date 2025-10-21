package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// Global variables for enhanced system
var enhancedUsers []EnhancedUser
var enhancedUserIDCounter = 1
var enhancedCertificateIDCounter = 1
var activityLogs []ActivityLog

// Initialize enhanced system
func initEnhancedSystem() {
	// Create default SSN Main Admin
	adminUser := EnhancedUser{
		ID:          enhancedUserIDCounter,
		Name:        "SSN Main Administrator",
		Email:       "admin@ssn.edu.in",
		Phone:       "+91-9876543210",
		Password:    "admin123", // In production, hash this
		Role:        RoleSSNMainAdmin,
		Institution: "SSN College of Engineering",
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		UpdatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		Permissions: GetRolePermissions(RoleSSNMainAdmin),
	}
	enhancedUsers = append(enhancedUsers, adminUser)
	enhancedUserIDCounter++

	// Create sample COE user
	coeUser := EnhancedUser{
		ID:          enhancedUserIDCounter,
		Name:        "Dr. Controller of Examinations",
		Email:       "coe@ssn.edu.in",
		Phone:       "+91-9876543211",
		Password:    "coe123",
		Role:        RoleCOE,
		Institution: "SSN College of Engineering",
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		UpdatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		Permissions: GetRolePermissions(RoleCOE),
	}
	enhancedUsers = append(enhancedUsers, coeUser)
	enhancedUserIDCounter++

	// Create sample Department Faculty
	facultyUser := EnhancedUser{
		ID:          enhancedUserIDCounter,
		Name:        "Dr. Department Head",
		Email:       "faculty@ssn.edu.in",
		Phone:       "+91-9876543212",
		Password:    "faculty123",
		Role:        RoleDepartmentFaculty,
		Department:  "Computer Science",
		Institution: "SSN College of Engineering",
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		UpdatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		Permissions: GetRolePermissions(RoleDepartmentFaculty),
	}
	enhancedUsers = append(enhancedUsers, facultyUser)
	enhancedUserIDCounter++

	// Create sample Club Coordinator
	clubUser := EnhancedUser{
		ID:          enhancedUserIDCounter,
		Name:        "Club Coordinator",
		Email:       "club@ssn.edu.in",
		Phone:       "+91-9876543213",
		Password:    "club123",
		Role:        RoleClubCoordinator,
		ClubName:    "Technical Club",
		Institution: "SSN College of Engineering",
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		UpdatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		Permissions: GetRolePermissions(RoleClubCoordinator),
	}
	enhancedUsers = append(enhancedUsers, clubUser)
	enhancedUserIDCounter++

	// Create sample External Verifier
	verifierUser := EnhancedUser{
		ID:          enhancedUserIDCounter,
		Name:        "External Verifier",
		Email:       "verifier@external.com",
		Phone:       "+91-9876543214",
		Password:    "verifier123",
		Role:        RoleExternalVerifier,
		Institution: "External Organization",
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		UpdatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		Permissions: GetRolePermissions(RoleExternalVerifier),
	}
	enhancedUsers = append(enhancedUsers, verifierUser)
	enhancedUserIDCounter++
}

// Enhanced login handler with role support
func enhancedLoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Find user by email/username
	var user *EnhancedUser
	for _, u := range enhancedUsers {
		if (u.Email == req.Username || u.Name == req.Username) && u.Password == req.Password {
			user = &u
			break
		}
	}

	if user == nil {
		LogActivity(0, "LOGIN_FAILED", fmt.Sprintf("Failed login attempt for: %s", req.Username), GetClientIP(r))
		sendResponse(w, false, "Invalid credentials", nil, http.StatusUnauthorized)
		return
	}

	if !user.IsActive {
		LogActivity(user.ID, "LOGIN_FAILED", "Account is inactive", GetClientIP(r))
		sendResponse(w, false, "Account is inactive", nil, http.StatusUnauthorized)
		return
	}

	LogActivity(user.ID, "LOGIN_SUCCESS", fmt.Sprintf("User logged in with role: %s", user.Role), GetClientIP(r))

	// Generate token (simplified - in production, use JWT)
	token := user.Email // Simplified token for demo

	sendEnhancedResponse(w, true, "Login successful", map[string]interface{}{
		"token":      token,
		"user_id":    user.ID,
		"role":       user.Role,
		"role_name":  getRoleDisplayName(user.Role),
		"permissions": user.Permissions,
	}, user, http.StatusOK)
}

// Enhanced register handler
func enhancedRegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" || req.Email == "" || req.Phone == "" || req.Password == "" {
		sendResponse(w, false, "All fields are required", nil, http.StatusBadRequest)
		return
	}

	// Check if email already exists
	for _, user := range enhancedUsers {
		if user.Email == req.Email {
			sendResponse(w, false, "Email already registered", nil, http.StatusConflict)
			return
		}
	}

	// Generate Student ID
	studentID := generateStudentID(req.Name, req.SchoolName, req.PassingYear, req.TenthMarks)

	// Create new student user
	user := EnhancedUser{
		ID:          enhancedUserIDCounter,
		Name:        req.Name,
		Email:       req.Email,
		Phone:       req.Phone,
		Password:    req.Password,
		StudentID:   studentID,
		Role:        RoleStudent,
		IsActive:    true,
		IsApproved:  false,
		NodeAssigned: false,
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		UpdatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		Certificates: []Certificate{},
		Permissions: GetRolePermissions(RoleStudent),
	}

	enhancedUsers = append(enhancedUsers, user)
	enhancedUserIDCounter++

	LogActivity(user.ID, "REGISTRATION", "New student registered", GetClientIP(r))

	sendResponse(w, true, "Registration successful. Awaiting admin approval.", map[string]interface{}{
		"student_id": studentID,
		"user_id":    user.ID,
		"role":       user.Role,
	}, http.StatusCreated)
}

// Role assignment handler
func assignRoleHandler(w http.ResponseWriter, r *http.Request) {
	var req RoleAssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Validate role
	if !IsValidRole(string(req.Role)) {
		sendResponse(w, false, "Invalid role", nil, http.StatusBadRequest)
		return
	}

	// Find user to assign role to
	userIndex := -1
	for i, user := range enhancedUsers {
		if user.ID == req.UserID {
			userIndex = i
			break
		}
	}

	if userIndex == -1 {
		sendResponse(w, false, "User not found", nil, http.StatusNotFound)
		return
	}

	// Update user role and related fields
	enhancedUsers[userIndex].Role = req.Role
	enhancedUsers[userIndex].Department = req.Department
	enhancedUsers[userIndex].Institution = req.Institution
	enhancedUsers[userIndex].ClubName = req.ClubName
	enhancedUsers[userIndex].Permissions = GetRolePermissions(req.Role)
	enhancedUsers[userIndex].UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	// Log activity
	assignerName := getUserNameByID(req.AssignedBy)
	LogActivity(req.AssignedBy, "ROLE_ASSIGNED", 
		fmt.Sprintf("Assigned role %s to user %s", req.Role, enhancedUsers[userIndex].Name), GetClientIP(r))

	sendResponse(w, true, "Role assigned successfully", map[string]interface{}{
		"user_id":    req.UserID,
		"role":       req.Role,
		"role_name":  getRoleDisplayName(req.Role),
		"permissions": enhancedUsers[userIndex].Permissions,
	}, http.StatusOK)
}

// Dashboard handler
func dashboardHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	userRole := r.Header.Get("X-User-Role")
	
	userID, _ := strconv.Atoi(userIDStr)
	user := findUserByID(userID)
	
	if user == nil {
		sendResponse(w, false, "User not found", nil, http.StatusNotFound)
		return
	}

	// Get dashboard data based on role
	dashboardData := getDashboardData(user.Role, userID)
	
	sendEnhancedResponse(w, true, "Dashboard data retrieved", dashboardData, user, http.StatusOK)
}

// Get dashboard data based on role
func getDashboardData(role UserRole, userID int) DashboardData {
	data := DashboardData{
		UserRole: role,
		QuickActions: GetQuickActions(role),
	}

	switch role {
	case RoleSSNMainAdmin:
		data.TotalUsers = len(enhancedUsers)
		data.PendingUsers = getPendingUsersCount()
		data.TotalCredentials = getTotalCredentialsCount()
		data.RecentActivity = getRecentActivity(10)
	case RoleCOE:
		data.TotalCredentials = getCredentialsByType(CredentialTypeMarksheet)
		data.IssuedToday = getCredentialsIssuedToday(CredentialTypeMarksheet)
	case RoleDepartmentFaculty:
		data.TotalCredentials = getCredentialsByType(CredentialTypeBonafide) + getCredentialsByType(CredentialTypeNOC)
		data.IssuedToday = getCredentialsIssuedToday(CredentialTypeBonafide) + getCredentialsIssuedToday(CredentialTypeNOC)
	case RoleClubCoordinator:
		data.TotalCredentials = getCredentialsByType(CredentialTypeParticipation)
		data.IssuedToday = getCredentialsIssuedToday(CredentialTypeParticipation)
	case RoleExternalVerifier:
		data.VerifiedToday = getCredentialsVerifiedToday()
	case RoleStudent:
		user := findUserByID(userID)
		if user != nil {
			data.TotalCredentials = len(user.Certificates)
		}
	}

	return data
}

// Issue credential handler with role-based validation
func issueCredentialHandler(w http.ResponseWriter, r *http.Request) {
	var req CredentialRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	user := findUserByID(userID)

	if user == nil {
		sendResponse(w, false, "User not found", nil, http.StatusNotFound)
		return
	}

	// Check if user can issue this type of credential
	if !canIssueCredentialType(user.Role, req.Type) {
		sendResponse(w, false, "You don't have permission to issue this type of credential", nil, http.StatusForbidden)
		return
	}

	// Find target student
	var targetUser *EnhancedUser
	for _, u := range enhancedUsers {
		if u.StudentID == req.StudentID && u.Role == RoleStudent {
			targetUser = &u
			break
		}
	}

	if targetUser == nil {
		sendResponse(w, false, "Student not found", nil, http.StatusNotFound)
		return
	}

	// Create credential
	credential := EnhancedCertificate{
		ID:          enhancedCertificateIDCounter,
		Type:        req.Type,
		Title:       req.Title,
		Institution: req.Institution,
		Department:  req.Department,
		Semester:    req.Semester,
		Subject:     req.Subject,
		Marks:       req.Marks,
		Grade:       req.Grade,
		EventName:   req.EventName,
		EventDate:   req.EventDate,
		Position:    req.Position,
		IssuedDate:  time.Now().Format("2006-01-02"),
		ValidFrom:   req.ValidFrom,
		ValidUntil:  req.ValidUntil,
		Status:      "issued",
		Description: req.Description,
		IssuedBy:    user.Name,
	}

	// Add credential to target user
	for i, u := range enhancedUsers {
		if u.ID == targetUser.ID {
			enhancedUsers[i].Certificates = append(enhancedUsers[i].Certificates, Certificate{
				ID:          credential.ID,
				Type:        string(credential.Type),
				Title:       credential.Title,
				Institution: credential.Institution,
				IssuedDate:  credential.IssuedDate,
				Status:      credential.Status,
				Description: credential.Description,
			})
			break
		}
	}

	enhancedCertificateIDCounter++

	// Log activity
	LogActivity(userID, "CREDENTIAL_ISSUED", 
		fmt.Sprintf("Issued %s credential to student %s", req.Type, req.StudentID), GetClientIP(r))

	sendResponse(w, true, "Credential issued successfully", credential, http.StatusCreated)
}

// Check if role can issue credential type
func canIssueCredentialType(role UserRole, credentialType CredentialType) bool {
	perms := GetRolePermissions(role)
	
	switch credentialType {
	case CredentialTypeMarksheet:
		return perms.CanIssueMarksheet
	case CredentialTypeBonafide:
		return perms.CanIssueBonafide
	case CredentialTypeNOC:
		return perms.CanIssueNOC
	case CredentialTypeParticipation:
		return perms.CanIssueParticipation
	default:
		return false
	}
}

// Helper functions
func getPendingUsersCount() int {
	count := 0
	for _, user := range enhancedUsers {
		if !user.IsApproved && user.Role == RoleStudent {
			count++
		}
	}
	return count
}

func getTotalCredentialsCount() int {
	count := 0
	for _, user := range enhancedUsers {
		count += len(user.Certificates)
	}
	return count
}

func getCredentialsByType(credType CredentialType) int {
	count := 0
	for _, user := range enhancedUsers {
		for _, cert := range user.Certificates {
			if cert.Type == string(credType) {
				count++
			}
		}
	}
	return count
}

func getCredentialsIssuedToday(credType CredentialType) int {
	today := time.Now().Format("2006-01-02")
	count := 0
	for _, user := range enhancedUsers {
		for _, cert := range user.Certificates {
			if cert.Type == string(credType) && cert.IssuedDate == today {
				count++
			}
		}
	}
	return count
}

func getCredentialsVerifiedToday() int {
	today := time.Now().Format("2006-01-02")
	count := 0
	for _, user := range enhancedUsers {
		for _, cert := range user.Certificates {
			if cert.Status == "verified" && strings.Contains(cert.IssuedDate, today) {
				count++
			}
		}
	}
	return count
}

func getRecentActivity(limit int) []ActivityLog {
	if len(activityLogs) <= limit {
		return activityLogs
	}
	return activityLogs[len(activityLogs)-limit:]
}
