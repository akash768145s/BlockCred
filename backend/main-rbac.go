package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/cors"
)

// Enhanced main function with RBAC
func mainEnhanced() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default values")
	}

	// Initialize blockchain client
	initBlockchainClient()

	// Initialize enhanced system with default users
	initEnhancedSystem()

	r := mux.NewRouter()

	// Prometheus metrics endpoint
	r.Handle("/metrics", promhttp.Handler())

	// API routes with enhanced RBAC
	api := r.PathPrefix("/api").Subrouter()
	api.Use(metricsMiddleware)
	
	// Public routes (no auth required)
	api.HandleFunc("/login", enhancedLoginHandler).Methods("POST")
	api.HandleFunc("/register", enhancedRegisterHandler).Methods("POST")
	api.HandleFunc("/student-login", studentLoginHandler).Methods("POST")

	// Protected routes with authentication
	protected := api.PathPrefix("/").Subrouter()
	protected.Use(AuthMiddleware)

	// Role-based routes
	protected.HandleFunc("/dashboard", dashboardHandler).Methods("GET")
	protected.HandleFunc("/users", getUsersHandler).Methods("GET")
	protected.HandleFunc("/users/{id}/approve", approveUserHandler).Methods("POST")
	protected.HandleFunc("/users/{id}/assign-role", assignRoleHandler).Methods("POST")
	protected.HandleFunc("/student/{id}", getStudentHandler).Methods("GET")
	protected.HandleFunc("/credentials/issue", issueCredentialHandler).Methods("POST")
	protected.HandleFunc("/credentials/verify", verifyCredentialHandler).Methods("POST")
	protected.HandleFunc("/credentials/my", getMyCredentialsHandler).Methods("GET")
	protected.HandleFunc("/credentials/all", getAllCredentialsHandler).Methods("GET")
	protected.HandleFunc("/activity", getActivityHandler).Methods("GET")
	protected.HandleFunc("/metrics/dashboard", metricsHandler).Methods("GET")

	// Role-specific routes with permission checks
	adminRoutes := protected.PathPrefix("/admin").Subrouter()
	adminRoutes.Use(RoleMiddleware("can_manage_users"))
	adminRoutes.HandleFunc("/onboard", onboardSubAdminHandler).Methods("POST")
	adminRoutes.HandleFunc("/deploy-contract", deployContractHandler).Methods("POST")
	adminRoutes.HandleFunc("/validators", authorizeValidatorHandler).Methods("POST")

	coeRoutes := protected.PathPrefix("/coe").Subrouter()
	coeRoutes.Use(RoleMiddleware("can_issue_marksheet"))
	coeRoutes.HandleFunc("/issue-marksheet", issueMarksheetHandler).Methods("POST")

	facultyRoutes := protected.PathPrefix("/faculty").Subrouter()
	facultyRoutes.Use(RoleMiddleware("can_issue_bonafide"))
	facultyRoutes.HandleFunc("/issue-bonafide", issueBonafideHandler).Methods("POST")
	facultyRoutes.HandleFunc("/issue-noc", issueNOCHandler).Methods("POST")

	clubRoutes := protected.PathPrefix("/club").Subrouter()
	clubRoutes.Use(RoleMiddleware("can_issue_participation"))
	clubRoutes.HandleFunc("/issue-certificate", issueParticipationHandler).Methods("POST")

	verifierRoutes := protected.PathPrefix("/verifier").Subrouter()
	verifierRoutes.Use(RoleMiddleware("can_verify_credentials"))
	verifierRoutes.HandleFunc("/verify", verifyCredentialHandler).Methods("POST")

	// CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(r)

	fmt.Println("Enhanced BlockCred Server with RBAC starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// Role-specific handlers
func onboardSubAdminHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Phone       string `json:"phone"`
		Password    string `json:"password"`
		Role        UserRole `json:"role"`
		Department  string `json:"department,omitempty"`
		Institution string `json:"institution,omitempty"`
		ClubName    string `json:"club_name,omitempty"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Validate role
	if !IsValidRole(string(req.Role)) {
		sendResponse(w, false, "Invalid role", nil, http.StatusBadRequest)
		return
	}

	// Create new sub-admin
	user := EnhancedUser{
		ID:          enhancedUserIDCounter,
		Name:        req.Name,
		Email:       req.Email,
		Phone:       req.Phone,
		Password:    req.Password,
		Role:        req.Role,
		Department:  req.Department,
		Institution: req.Institution,
		ClubName:    req.ClubName,
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		UpdatedAt:   time.Now().Format("2006-01-02 15:04:05"),
		Permissions: GetRolePermissions(req.Role),
	}

	enhancedUsers = append(enhancedUsers, user)
	enhancedUserIDCounter++

	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	LogActivity(userID, "SUB_ADMIN_ONBOARDED", 
		fmt.Sprintf("Onboarded %s with role %s", req.Name, req.Role), GetClientIP(r))

	sendResponse(w, true, "Sub-admin onboarded successfully", map[string]interface{}{
		"user_id":    user.ID,
		"role":       user.Role,
		"role_name":  getRoleDisplayName(user.Role),
		"permissions": user.Permissions,
	}, http.StatusCreated)
}

func deployContractHandler(w http.ResponseWriter, r *http.Request) {
	// Deploy smart contract logic
	if blockchainClient != nil {
		// Contract deployment logic here
		LogActivity(1, "CONTRACT_DEPLOYED", "Smart contract deployed", GetClientIP(r))
		sendResponse(w, true, "Contract deployed successfully", map[string]interface{}{
			"contract_address": "0x1234567890abcdef",
			"deployment_tx":    "0xabcdef1234567890",
		}, http.StatusOK)
	} else {
		sendResponse(w, false, "Blockchain client not available", nil, http.StatusServiceUnavailable)
	}
}

func authorizeValidatorHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ValidatorAddress string `json:"validator_address"`
		ValidatorName    string `json:"validator_name"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Authorize validator logic
	LogActivity(1, "VALIDATOR_AUTHORIZED", 
		fmt.Sprintf("Authorized validator %s", req.ValidatorName), GetClientIP(r))
	
	sendResponse(w, true, "Validator authorized successfully", map[string]interface{}{
		"validator_address": req.ValidatorAddress,
		"validator_name":    req.ValidatorName,
		"authorized_at":     time.Now().Format("2006-01-02 15:04:05"),
	}, http.StatusOK)
}

func issueMarksheetHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID   string `json:"student_id"`
		Semester    string `json:"semester"`
		Subject     string `json:"subject"`
		Marks       string `json:"marks"`
		Grade       string `json:"grade"`
		Description string `json:"description"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Issue marksheet credential
	credential := EnhancedCertificate{
		ID:          enhancedCertificateIDCounter,
		Type:        CredentialTypeMarksheet,
		Title:       fmt.Sprintf("Semester %s Marksheet", req.Semester),
		Institution: "SSN College of Engineering",
		Semester:    req.Semester,
		Subject:     req.Subject,
		Marks:       req.Marks,
		Grade:       req.Grade,
		IssuedDate:  time.Now().Format("2006-01-02"),
		Status:      "issued",
		Description: req.Description,
		IssuedBy:    r.Header.Get("X-User-Name"),
	}

	// Add to student's certificates
	for i, user := range enhancedUsers {
		if user.StudentID == req.StudentID {
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

	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	LogActivity(userID, "MARKSHEET_ISSUED", 
		fmt.Sprintf("Issued marksheet for student %s", req.StudentID), GetClientIP(r))

	sendResponse(w, true, "Marksheet issued successfully", credential, http.StatusCreated)
}

func issueBonafideHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID   string `json:"student_id"`
		Department  string `json:"department"`
		ValidFrom   string `json:"valid_from"`
		ValidUntil  string `json:"valid_until"`
		Description string `json:"description"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Issue bonafide credential
	credential := EnhancedCertificate{
		ID:          enhancedCertificateIDCounter,
		Type:        CredentialTypeBonafide,
		Title:       "Bonafide Certificate",
		Institution: "SSN College of Engineering",
		Department:  req.Department,
		IssuedDate:  time.Now().Format("2006-01-02"),
		ValidFrom:   req.ValidFrom,
		ValidUntil:  req.ValidUntil,
		Status:      "issued",
		Description: req.Description,
		IssuedBy:    r.Header.Get("X-User-Name"),
	}

	// Add to student's certificates
	for i, user := range enhancedUsers {
		if user.StudentID == req.StudentID {
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

	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	LogActivity(userID, "BONAFIDE_ISSUED", 
		fmt.Sprintf("Issued bonafide for student %s", req.StudentID), GetClientIP(r))

	sendResponse(w, true, "Bonafide certificate issued successfully", credential, http.StatusCreated)
}

func issueNOCHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID   string `json:"student_id"`
		Department  string `json:"department"`
		ValidFrom   string `json:"valid_from"`
		ValidUntil  string `json:"valid_until"`
		Description string `json:"description"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Issue NOC credential
	credential := EnhancedCertificate{
		ID:          enhancedCertificateIDCounter,
		Type:        CredentialTypeNOC,
		Title:       "No Objection Certificate",
		Institution: "SSN College of Engineering",
		Department:  req.Department,
		IssuedDate:  time.Now().Format("2006-01-02"),
		ValidFrom:   req.ValidFrom,
		ValidUntil:  req.ValidUntil,
		Status:      "issued",
		Description: req.Description,
		IssuedBy:    r.Header.Get("X-User-Name"),
	}

	// Add to student's certificates
	for i, user := range enhancedUsers {
		if user.StudentID == req.StudentID {
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

	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	LogActivity(userID, "NOC_ISSUED", 
		fmt.Sprintf("Issued NOC for student %s", req.StudentID), GetClientIP(r))

	sendResponse(w, true, "NOC issued successfully", credential, http.StatusCreated)
}

func issueParticipationHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StudentID   string `json:"student_id"`
		EventName   string `json:"event_name"`
		EventDate   string `json:"event_date"`
		Position    string `json:"position"`
		Description string `json:"description"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Issue participation certificate
	credential := EnhancedCertificate{
		ID:          enhancedCertificateIDCounter,
		Type:        CredentialTypeParticipation,
		Title:       "Participation Certificate",
		Institution: "SSN College of Engineering",
		EventName:   req.EventName,
		EventDate:   req.EventDate,
		Position:    req.Position,
		IssuedDate:  time.Now().Format("2006-01-02"),
		Status:      "issued",
		Description: req.Description,
		IssuedBy:    r.Header.Get("X-User-Name"),
	}

	// Add to student's certificates
	for i, user := range enhancedUsers {
		if user.StudentID == req.StudentID {
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

	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	LogActivity(userID, "PARTICIPATION_ISSUED", 
		fmt.Sprintf("Issued participation certificate for student %s", req.StudentID), GetClientIP(r))

	sendResponse(w, true, "Participation certificate issued successfully", credential, http.StatusCreated)
}

func verifyCredentialHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CredentialID string `json:"credential_id"`
		StudentID    string `json:"student_id"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Find and verify credential
	credentialID, _ := strconv.Atoi(req.CredentialID)
	verified := false
	
	for i, user := range enhancedUsers {
		if user.StudentID == req.StudentID {
			for j, cert := range user.Certificates {
				if cert.ID == credentialID {
					// Update certificate status
					enhancedUsers[i].Certificates[j].Status = "verified"
					verified = true
					break
				}
			}
			break
		}
	}

	if !verified {
		sendResponse(w, false, "Credential not found", nil, http.StatusNotFound)
		return
	}

	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	LogActivity(userID, "CREDENTIAL_VERIFIED", 
		fmt.Sprintf("Verified credential %s for student %s", req.CredentialID, req.StudentID), GetClientIP(r))

	sendResponse(w, true, "Credential verified successfully", map[string]interface{}{
		"credential_id": credentialID,
		"student_id":    req.StudentID,
		"verified_at":   time.Now().Format("2006-01-02 15:04:05"),
		"verified_by":   r.Header.Get("X-User-Name"),
	}, http.StatusOK)
}

func getMyCredentialsHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	
	user := findUserByID(userID)
	if user == nil {
		sendResponse(w, false, "User not found", nil, http.StatusNotFound)
		return
	}

	sendResponse(w, true, "Credentials retrieved successfully", user.Certificates, http.StatusOK)
}

func getAllCredentialsHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	user := findUserByID(userID)

	if user == nil || !user.CanPerformAction("can_view_all_credentials") {
		sendResponse(w, false, "Insufficient permissions", nil, http.StatusForbidden)
		return
	}

	// Get all credentials from all users
	var allCredentials []map[string]interface{}
	for _, u := range enhancedUsers {
		for _, cert := range u.Certificates {
			allCredentials = append(allCredentials, map[string]interface{}{
				"credential": cert,
				"student_id": u.StudentID,
				"student_name": u.Name,
			})
		}
	}

	sendResponse(w, true, "All credentials retrieved successfully", allCredentials, http.StatusOK)
}

func getActivityHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	userID, _ := strconv.Atoi(userIDStr)
	user := findUserByID(userID)

	if user == nil || !user.CanPerformAction("can_manage_users") {
		sendResponse(w, false, "Insufficient permissions", nil, http.StatusForbidden)
		return
	}

	// Get recent activity
	recentActivity := getRecentActivity(50)
	sendResponse(w, true, "Activity log retrieved successfully", recentActivity, http.StatusOK)
}
