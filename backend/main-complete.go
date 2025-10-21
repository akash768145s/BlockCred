package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// User struct with enhanced fields
type User struct {
	ID           int           `json:"id"`
	Name         string        `json:"name"`
	Email        string        `json:"email"`
	Phone        string        `json:"phone"`
	Password     string        `json:"-"`
	StudentID    string        `json:"student_id"`
	TenthMarks   int           `json:"tenth_marks"`
	SchoolName   string        `json:"school_name"`
	PassingYear  int           `json:"passing_year"`
	IsApproved   bool          `json:"is_approved"`
	NodeAssigned bool          `json:"node_assigned"`
	Role         Role          `json:"role"`
	Department   string        `json:"department"`
	Institution  string        `json:"institution"`
	ClubName     string        `json:"club_name"`
	CreatedAt    string        `json:"created_at"`
	Certificates []Certificate `json:"certificates"`
}

// Certificate struct
type Certificate struct {
	ID          int    `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	StudentID   string `json:"student_id"`
	StudentName string `json:"student_name"`
	IssuedBy    string `json:"issued_by"`
	IssuedDate  string `json:"issued_date"`
	Status      string `json:"status"`
	Description string `json:"description"`
	// Additional fields for different certificate types
	Semester    string `json:"semester,omitempty"`
	Subject     string `json:"subject,omitempty"`
	Marks       string `json:"marks,omitempty"`
	Grade       string `json:"grade,omitempty"`
	Purpose     string `json:"purpose,omitempty"`
	EventName   string `json:"event_name,omitempty"`
	Position    string `json:"position,omitempty"`
	ValidUntil  string `json:"valid_until,omitempty"`
	EventDate   string `json:"event_date,omitempty"`
	BlockchainHash string `json:"blockchain_hash,omitempty"`
}

// Role and Permission types
type Role string
type Permission string

const (
	RoleSSNMainAdmin      Role = "ssn_main_admin"
	RoleCOE              Role = "coe"
	RoleDepartmentFaculty Role = "department_faculty"
	RoleClubCoordinator  Role = "club_coordinator"
	RoleExternalVerifier Role = "external_verifier"
	RoleStudent          Role = "student"
)

const (
	PermOnboardSubAdmins        Permission = "onboard_sub_admins"
	PermDeployContracts         Permission = "deploy_contracts"
	PermAuthorizeValidators      Permission = "authorize_validators"
	PermIssueMarksheet          Permission = "issue_marksheet"
	PermIssueBonafide           Permission = "issue_bonafide"
	PermIssueNOC                Permission = "issue_noc"
	PermIssueParticipationCert  Permission = "issue_participation_cert"
	PermVerifyCredentials       Permission = "verify_credentials"
	PermViewOwnCredentials      Permission = "view_own_credentials"
	PermManageUsers             Permission = "manage_users"
	PermViewAllUsers            Permission = "view_all_users"
	PermViewMetrics             Permission = "view_metrics"
)

// RolePermissions maps roles to their allowed permissions
var RolePermissions = map[Role][]Permission{
	RoleSSNMainAdmin: {
		PermOnboardSubAdmins, PermDeployContracts, PermAuthorizeValidators,
		PermManageUsers, PermViewAllUsers, PermViewMetrics, PermVerifyCredentials,
	},
	RoleCOE: {
		PermIssueMarksheet, PermVerifyCredentials, PermViewOwnCredentials,
	},
	RoleDepartmentFaculty: {
		PermIssueBonafide, PermIssueNOC, PermVerifyCredentials, PermViewOwnCredentials,
	},
	RoleClubCoordinator: {
		PermIssueParticipationCert, PermVerifyCredentials, PermViewOwnCredentials,
	},
	RoleExternalVerifier: {
		PermVerifyCredentials,
	},
	RoleStudent: {
		PermViewOwnCredentials,
	},
}

// In-memory storage (replace with database in production)
var users []User
var certificates []Certificate
var nextUserID = 1
var nextCertID = 1

// Initialize with demo data
func init() {
	// Create demo users
	users = []User{
		{
			ID: 1, Name: "SSN Main Admin", Email: "admin@ssn.edu.in", Phone: "9876543210",
			Password: "admin123", Role: RoleSSNMainAdmin, IsApproved: true,
			Department: "Administration", Institution: "SSN College of Engineering",
			CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
		},
		{
			ID: 2, Name: "COE Controller", Email: "coe@ssn.edu.in", Phone: "9876543211",
			Password: "coe123", Role: RoleCOE, IsApproved: true,
			Department: "Examinations", Institution: "SSN College of Engineering",
			CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
		},
		{
			ID: 3, Name: "Department Faculty", Email: "faculty@ssn.edu.in", Phone: "9876543212",
			Password: "faculty123", Role: RoleDepartmentFaculty, IsApproved: true,
			Department: "Computer Science", Institution: "SSN College of Engineering",
			CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
		},
		{
			ID: 4, Name: "Club Coordinator", Email: "club@ssn.edu.in", Phone: "9876543213",
			Password: "club123", Role: RoleClubCoordinator, IsApproved: true,
			Department: "Student Activities", Institution: "SSN College of Engineering",
			ClubName: "Coding Club", CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
		},
		{
			ID: 5, Name: "External Verifier", Email: "verifier@external.com", Phone: "9876543214",
			Password: "verifier123", Role: RoleExternalVerifier, IsApproved: true,
			Institution: "External Organization", CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
		},
		{
			ID: 6, Name: "John Doe", Email: "john@student.ssn.edu.in", Phone: "9876543215",
			Password: "student123", Role: RoleStudent, IsApproved: true,
			StudentID: "SSN2024001", Department: "Computer Science", Institution: "SSN College of Engineering",
			CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
		},
	}
	nextUserID = 7

	// Create demo certificates
	certificates = []Certificate{
		{
			ID: 1, Type: "marksheet", Title: "Semester 1 Marksheet",
			StudentID: "SSN2024001", StudentName: "John Doe",
			IssuedBy: "COE Controller", IssuedDate: time.Now().Format("2006-01-02"),
			Status: "issued", Description: "Semester 1 academic results",
			Semester: "1", Subject: "Mathematics", Marks: "85", Grade: "A",
		},
		{
			ID: 2, Type: "bonafide", Title: "Bonafide Certificate",
			StudentID: "SSN2024001", StudentName: "John Doe",
			IssuedBy: "Department Faculty", IssuedDate: time.Now().Format("2006-01-02"),
			Status: "issued", Description: "Student bonafide certificate",
			Purpose: "Scholarship Application",
		},
		{
			ID: 3, Type: "participation_cert", Title: "Coding Competition Participation",
			StudentID: "SSN2024001", StudentName: "John Doe",
			IssuedBy: "Club Coordinator", IssuedDate: time.Now().Format("2006-01-02"),
			Status: "issued", Description: "Participation in coding competition",
			EventName: "Hackathon 2024", Position: "Participant",
		},
	}
	nextCertID = 4
}

// Response structure
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Send JSON response
func sendResponse(w http.ResponseWriter, success bool, message string, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	response := Response{Success: success, Message: message, Data: data}
	json.NewEncoder(w).Encode(response)
}

// Login handler
func loginHandler(w http.ResponseWriter, r *http.Request) {
	var loginData struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&loginData); err != nil {
		sendResponse(w, false, "Invalid request format", nil, http.StatusBadRequest)
		return
	}

	// Find user by email or username
	var user *User
	for i := range users {
		if (users[i].Email == loginData.Username || users[i].Name == loginData.Username) && 
		   users[i].Password == loginData.Password {
			user = &users[i]
			break
		}
	}

	if user == nil {
		sendResponse(w, false, "Invalid credentials", nil, http.StatusUnauthorized)
		return
	}

	if !user.IsApproved {
		sendResponse(w, false, "Account not approved", nil, http.StatusUnauthorized)
		return
	}

	// Generate JWT token (simplified - use proper JWT in production)
	token := fmt.Sprintf("jwt_token_%d_%s", user.ID, time.Now().Format("20060102150405"))

	// Get role display name
	roleName := getRoleDisplayName(user.Role)

	// Get permissions
	permissions := RolePermissions[user.Role]

	responseData := map[string]interface{}{
		"user_id":     user.ID,
		"role":        string(user.Role),
		"role_name":   roleName,
		"permissions": permissions,
		"token":       token,
	}

	sendResponse(w, true, "Login successful", responseData, http.StatusOK)
}

// Register handler
func registerHandler(w http.ResponseWriter, r *http.Request) {
	var userData struct {
		Name       string `json:"name"`
		Email      string `json:"email"`
		Phone      string `json:"phone"`
		Password   string `json:"password"`
		StudentID  string `json:"student_id"`
		TenthMarks int    `json:"tenth_marks"`
		SchoolName string `json:"school_name"`
		PassingYear int   `json:"passing_year"`
	}

	if err := json.NewDecoder(r.Body).Decode(&userData); err != nil {
		sendResponse(w, false, "Invalid request format", nil, http.StatusBadRequest)
		return
	}

	// Check if user already exists
	for _, user := range users {
		if user.Email == userData.Email {
			sendResponse(w, false, "User already exists", nil, http.StatusConflict)
			return
		}
	}

	// Create new user
	newUser := User{
		ID:          nextUserID,
		Name:        userData.Name,
		Email:       userData.Email,
		Phone:       userData.Phone,
		Password:    userData.Password,
		StudentID:   userData.StudentID,
		TenthMarks:  userData.TenthMarks,
		SchoolName:  userData.SchoolName,
		PassingYear: userData.PassingYear,
		Role:        RoleStudent, // Default role for registration
		IsApproved:  false,       // Requires approval
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
	}

	users = append(users, newUser)
	nextUserID++

	sendResponse(w, true, "Registration successful. Account pending approval.", map[string]interface{}{
		"user_id": newUser.ID,
	}, http.StatusCreated)
}

// Get all users (admin only)
func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	sendResponse(w, true, "Users retrieved successfully", map[string]interface{}{
		"users": users,
	}, http.StatusOK)
}

// Onboard new user (admin only)
func onboardUserHandler(w http.ResponseWriter, r *http.Request) {
	var userData struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Phone       string `json:"phone"`
		Password    string `json:"password"`
		Role        string `json:"role"`
		Department  string `json:"department"`
		Institution string `json:"institution"`
		ClubName    string `json:"club_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&userData); err != nil {
		sendResponse(w, false, "Invalid request format", nil, http.StatusBadRequest)
		return
	}

	// Create new user
	newUser := User{
		ID:          nextUserID,
		Name:        userData.Name,
		Email:       userData.Email,
		Phone:       userData.Phone,
		Password:    userData.Password,
		Role:        Role(userData.Role),
		Department:  userData.Department,
		Institution: userData.Institution,
		ClubName:    userData.ClubName,
		IsApproved:  true, // Admin-created users are pre-approved
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
	}

	users = append(users, newUser)
	nextUserID++

	sendResponse(w, true, "User onboarded successfully", map[string]interface{}{
		"user_id": newUser.ID,
	}, http.StatusCreated)
}

// Issue marksheet (COE only)
func issueMarksheetHandler(w http.ResponseWriter, r *http.Request) {
	var certData struct {
		StudentID string `json:"student_id"`
		Type      string `json:"type"`
		Title     string `json:"title"`
		Semester  string `json:"semester"`
		Subject   string `json:"subject"`
		Marks     string `json:"marks"`
		Grade     string `json:"grade"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&certData); err != nil {
		sendResponse(w, false, "Invalid request format", nil, http.StatusBadRequest)
		return
	}

	// Find student
	var student *User
	for i := range users {
		if users[i].StudentID == certData.StudentID {
			student = &users[i]
			break
		}
	}

	if student == nil {
		sendResponse(w, false, "Student not found", nil, http.StatusNotFound)
		return
	}

	// Create certificate
	newCert := Certificate{
		ID:          nextCertID,
		Type:        certData.Type,
		Title:       certData.Title,
		StudentID:   certData.StudentID,
		StudentName: student.Name,
		IssuedBy:    "COE Controller", // In real app, get from JWT
		IssuedDate:  time.Now().Format("2006-01-02"),
		Status:      "issued",
		Description: certData.Description,
		Semester:    certData.Semester,
		Subject:     certData.Subject,
		Marks:       certData.Marks,
		Grade:       certData.Grade,
	}

	certificates = append(certificates, newCert)
	nextCertID++

	sendResponse(w, true, "Marksheet issued successfully", map[string]interface{}{
		"certificate_id": newCert.ID,
	}, http.StatusCreated)
}

// Issue NOC (Faculty only)
func issueNOCHandler(w http.ResponseWriter, r *http.Request) {
	var certData struct {
		StudentID   string `json:"student_id"`
		Type        string `json:"type"`
		Title       string `json:"title"`
		Purpose     string `json:"purpose"`
		Description string `json:"description"`
		ValidUntil  string `json:"valid_until"`
	}

	if err := json.NewDecoder(r.Body).Decode(&certData); err != nil {
		sendResponse(w, false, "Invalid request format", nil, http.StatusBadRequest)
		return
	}

	// Find student
	var student *User
	for i := range users {
		if users[i].StudentID == certData.StudentID {
			student = &users[i]
			break
		}
	}

	if student == nil {
		sendResponse(w, false, "Student not found", nil, http.StatusNotFound)
		return
	}

	// Create certificate
	newCert := Certificate{
		ID:          nextCertID,
		Type:        certData.Type,
		Title:       certData.Title,
		StudentID:   certData.StudentID,
		StudentName: student.Name,
		IssuedBy:    "Department Faculty", // In real app, get from JWT
		IssuedDate:  time.Now().Format("2006-01-02"),
		Status:      "issued",
		Description: certData.Description,
		Purpose:     certData.Purpose,
		ValidUntil:  certData.ValidUntil,
	}

	certificates = append(certificates, newCert)
	nextCertID++

	sendResponse(w, true, "NOC issued successfully", map[string]interface{}{
		"certificate_id": newCert.ID,
	}, http.StatusCreated)
}

// Issue Bonafide (Faculty only)
func issueBonafideHandler(w http.ResponseWriter, r *http.Request) {
	var certData struct {
		StudentID   string `json:"student_id"`
		Type        string `json:"type"`
		Title       string `json:"title"`
		Purpose     string `json:"purpose"`
		Description string `json:"description"`
		ValidUntil  string `json:"valid_until"`
	}

	if err := json.NewDecoder(r.Body).Decode(&certData); err != nil {
		sendResponse(w, false, "Invalid request format", nil, http.StatusBadRequest)
		return
	}

	// Find student
	var student *User
	for i := range users {
		if users[i].StudentID == certData.StudentID {
			student = &users[i]
			break
		}
	}

	if student == nil {
		sendResponse(w, false, "Student not found", nil, http.StatusNotFound)
		return
	}

	// Create certificate
	newCert := Certificate{
		ID:          nextCertID,
		Type:        certData.Type,
		Title:       certData.Title,
		StudentID:   certData.StudentID,
		StudentName: student.Name,
		IssuedBy:    "Department Faculty", // In real app, get from JWT
		IssuedDate:  time.Now().Format("2006-01-02"),
		Status:      "issued",
		Description: certData.Description,
		Purpose:     certData.Purpose,
		ValidUntil:  certData.ValidUntil,
	}

	certificates = append(certificates, newCert)
	nextCertID++

	sendResponse(w, true, "Bonafide certificate issued successfully", map[string]interface{}{
		"certificate_id": newCert.ID,
	}, http.StatusCreated)
}

// Issue participation certificate (Club only)
func issueParticipationCertHandler(w http.ResponseWriter, r *http.Request) {
	var certData struct {
		StudentID   string `json:"student_id"`
		Type        string `json:"type"`
		Title       string `json:"title"`
		EventName   string `json:"event_name"`
		Position    string `json:"position"`
		Description string `json:"description"`
		EventDate   string `json:"event_date"`
	}

	if err := json.NewDecoder(r.Body).Decode(&certData); err != nil {
		sendResponse(w, false, "Invalid request format", nil, http.StatusBadRequest)
		return
	}

	// Find student
	var student *User
	for i := range users {
		if users[i].StudentID == certData.StudentID {
			student = &users[i]
			break
		}
	}

	if student == nil {
		sendResponse(w, false, "Student not found", nil, http.StatusNotFound)
		return
	}

	// Create certificate
	newCert := Certificate{
		ID:          nextCertID,
		Type:        certData.Type,
		Title:       certData.Title,
		StudentID:   certData.StudentID,
		StudentName: student.Name,
		IssuedBy:    "Club Coordinator", // In real app, get from JWT
		IssuedDate:  time.Now().Format("2006-01-02"),
		Status:      "issued",
		Description: certData.Description,
		EventName:   certData.EventName,
		Position:    certData.Position,
		EventDate:   certData.EventDate,
	}

	certificates = append(certificates, newCert)
	nextCertID++

	sendResponse(w, true, "Participation certificate issued successfully", map[string]interface{}{
		"certificate_id": newCert.ID,
	}, http.StatusCreated)
}

// Get all credentials
func getAllCredentialsHandler(w http.ResponseWriter, r *http.Request) {
	sendResponse(w, true, "Credentials retrieved successfully", map[string]interface{}{
		"credentials": certificates,
	}, http.StatusOK)
}

// Get student credentials
func getStudentCredentialsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID := vars["id"]

	var studentCerts []Certificate
	for _, cert := range certificates {
		if cert.StudentID == studentID {
			studentCerts = append(studentCerts, cert)
		}
	}

	// Find student profile
	var student *User
	for i := range users {
		if users[i].StudentID == studentID {
			student = &users[i]
			break
		}
	}

	if student == nil {
		sendResponse(w, false, "Student not found", nil, http.StatusNotFound)
		return
	}

	sendResponse(w, true, "Student credentials retrieved successfully", map[string]interface{}{
		"credentials": studentCerts,
		"profile":     student,
	}, http.StatusOK)
}

// Verify credential (Verifier only)
func verifyCredentialHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	certID, err := strconv.Atoi(vars["id"])
	if err != nil {
		sendResponse(w, false, "Invalid certificate ID", nil, http.StatusBadRequest)
		return
	}

	// Find certificate
	var cert *Certificate
	for i := range certificates {
		if certificates[i].ID == certID {
			cert = &certificates[i]
			break
		}
	}

	if cert == nil {
		sendResponse(w, false, "Certificate not found", nil, http.StatusNotFound)
		return
	}

	// Simulate verification process
	verificationResult := map[string]interface{}{
		"is_valid":          true,
		"blockchain_verified": true,
		"issuer_verified":    true,
		"tamper_detected":    false,
		"verification_date": time.Now().Format("2006-01-02 15:04:05"),
	}

	// Update certificate status
	cert.Status = "verified"

	sendResponse(w, true, "Credential verified successfully", map[string]interface{}{
		"verification_result": verificationResult,
	}, http.StatusOK)
}

// Get verifier credentials
func getVerifierCredentialsHandler(w http.ResponseWriter, r *http.Request) {
	sendResponse(w, true, "Verifier credentials retrieved successfully", map[string]interface{}{
		"credentials": certificates,
	}, http.StatusOK)
}

// Get role display name
func getRoleDisplayName(role Role) string {
	switch role {
	case RoleSSNMainAdmin:
		return "SSN Main Admin"
	case RoleCOE:
		return "COE (Sub-Admin)"
	case RoleDepartmentFaculty:
		return "Department Faculty"
	case RoleClubCoordinator:
		return "Club Coordinator"
	case RoleExternalVerifier:
		return "External Verifier"
	case RoleStudent:
		return "Student"
	default:
		return string(role)
	}
}

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	r := mux.NewRouter()

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Authentication routes
	api.HandleFunc("/login", loginHandler).Methods("POST")
	api.HandleFunc("/register", registerHandler).Methods("POST")

	// User management routes
	api.HandleFunc("/users", getUsersHandler).Methods("GET")
	api.HandleFunc("/admin/onboard", onboardUserHandler).Methods("POST")

	// Credential routes
	api.HandleFunc("/credentials/all", getAllCredentialsHandler).Methods("GET")
	api.HandleFunc("/student/{id}/credentials", getStudentCredentialsHandler).Methods("GET")
	api.HandleFunc("/verifier/credentials", getVerifierCredentialsHandler).Methods("GET")
	api.HandleFunc("/verifier/verify/{id}", verifyCredentialHandler).Methods("POST")

	// Role-specific credential issuance
	api.HandleFunc("/coe/issue-marksheet", issueMarksheetHandler).Methods("POST")
	api.HandleFunc("/faculty/issue-noc", issueNOCHandler).Methods("POST")
	api.HandleFunc("/faculty/issue-bonafide", issueBonafideHandler).Methods("POST")
	api.HandleFunc("/club/issue-participation-cert", issueParticipationCertHandler).Methods("POST")

	// Apply CORS middleware
	handler := corsMiddleware(r)

	// Add logging
	loggedHandler := handlers.LoggingHandler(os.Stdout, handler)

	fmt.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", loggedHandler))
}
