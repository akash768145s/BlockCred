package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"blockcred-backend/blockchain"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/cors"
)

type User struct {
	ID           int           `json:"id"`
	Name         string        `json:"name"`
	Email        string        `json:"email"`
	Phone        string        `json:"phone"`
	Password     string        `json:"-"` // Don't expose password in JSON
	StudentID    string        `json:"student_id"`
	TenthMarks   int           `json:"tenth_marks"`
	SchoolName   string        `json:"school_name"`
	PassingYear  int           `json:"passing_year"`
	IsApproved   bool          `json:"is_approved"`
	NodeAssigned bool          `json:"node_assigned"`
	CreatedAt    string        `json:"created_at"`
	Certificates []Certificate `json:"certificates"`
}

type Certificate struct {
	ID          int    `json:"id"`
	Type        string `json:"type"`        // "degree", "bonafide", "marksheet", etc.
	Title       string `json:"title"`
	Institution string `json:"institution"`
	IssuedDate  string `json:"issued_date"`
	Status      string `json:"status"` // "pending", "issued", "verified"
	Description string `json:"description"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Password    string `json:"password"`
	TenthMarks  int    `json:"tenth_marks"`
	SchoolName  string `json:"school_name"`
	PassingYear int    `json:"passing_year"`
}

type IssueCertificateRequest struct {
	StudentID   string `json:"student_id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Institution string `json:"institution"`
	Description string `json:"description"`
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// In-memory storage (replace with database in production)
var users []User
var userIDCounter = 1
var certificateIDCounter = 1

// Blockchain client
var blockchainClient *blockchain.BlockchainClient

// Admin credentials
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin123"

// Prometheus metrics
var (
	// HTTP request metrics
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "blockcred_http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "blockcred_http_request_duration_seconds",
			Help: "HTTP request duration in seconds",
		},
		[]string{"method", "endpoint"},
	)

	// Business metrics
	usersTotal = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "blockcred_users_total",
			Help: "Total number of registered users",
		},
		[]string{"status"}, // approved, pending
	)

	certificatesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "blockcred_certificates_issued_total",
			Help: "Total number of certificates issued",
		},
		[]string{"type", "institution"},
	)

	blockchainNodesActive = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "blockcred_blockchain_nodes_active",
			Help: "Number of active blockchain nodes",
		},
	)

	loginAttemptsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "blockcred_login_attempts_total",
			Help: "Total number of login attempts",
		},
		[]string{"user_type", "status"}, // admin/student, success/failure
	)

	registrationAttemptsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "blockcred_registration_attempts_total",
			Help: "Total number of registration attempts",
		},
		[]string{"status"}, // success/failure
	)
)

func init() {
	// Register metrics with Prometheus
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
	prometheus.MustRegister(usersTotal)
	prometheus.MustRegister(certificatesTotal)
	prometheus.MustRegister(blockchainNodesActive)
	prometheus.MustRegister(loginAttemptsTotal)
	prometheus.MustRegister(registrationAttemptsTotal)
}

func initBlockchainClient() {
	rpcURL := getEnv("BLOCKCHAIN_RPC_URL", "http://localhost:8545")
	privateKey := getEnv("BLOCKCHAIN_PRIVATE_KEY", "your-private-key-here")
	contractAddress := getEnv("BLOCKCHAIN_CONTRACT_ADDRESS", "your-contract-address-here")

	if privateKey == "your-private-key-here" || contractAddress == "your-contract-address-here" {
		log.Println("⚠️  Blockchain not configured. Running in simulation mode.")
		return
	}

	client, err := blockchain.NewBlockchainClient(rpcURL, privateKey, contractAddress)
	if err != nil {
		log.Printf("❌ Failed to initialize blockchain client: %v", err)
		log.Println("⚠️  Running in simulation mode.")
		return
	}

	blockchainClient = client
	log.Println("✅ Blockchain client initialized successfully")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default values")
	}

	// Initialize blockchain client
	initBlockchainClient()

	r := mux.NewRouter()

	// Prometheus metrics endpoint
	r.Handle("/metrics", promhttp.Handler())

	// API routes with metrics middleware
	api := r.PathPrefix("/api").Subrouter()
	api.Use(metricsMiddleware)
	api.HandleFunc("/login", loginHandler).Methods("POST")
	api.HandleFunc("/student-login", studentLoginHandler).Methods("POST")
	api.HandleFunc("/register", registerHandler).Methods("POST")
	api.HandleFunc("/users", getUsersHandler).Methods("GET")
	api.HandleFunc("/users/{id}/approve", approveUserHandler).Methods("POST")
	api.HandleFunc("/student/{id}", getStudentHandler).Methods("GET")
	api.HandleFunc("/certificates/issue", issueCertificateHandler).Methods("POST")
	api.HandleFunc("/metrics/dashboard", metricsHandler).Methods("GET")

	// CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(r)

	fmt.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// Metrics middleware
func metricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Create a custom ResponseWriter to capture status code
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		
		next.ServeHTTP(rw, r)
		
		duration := time.Since(start).Seconds()
		endpoint := r.URL.Path
		method := r.Method
		status := fmt.Sprintf("%d", rw.statusCode)
		
		httpRequestsTotal.WithLabelValues(method, endpoint, status).Inc()
		httpRequestDuration.WithLabelValues(method, endpoint).Observe(duration)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func updateUserMetrics() {
	approvedCount := 0
	pendingCount := 0
	activeNodes := 0
	
	for _, user := range users {
		if user.IsApproved {
			approvedCount++
		} else {
			pendingCount++
		}
		if user.NodeAssigned {
			activeNodes++
		}
	}
	
	usersTotal.WithLabelValues("approved").Set(float64(approvedCount))
	usersTotal.WithLabelValues("pending").Set(float64(pendingCount))
	blockchainNodesActive.Set(float64(activeNodes))
}

func metricsHandler(w http.ResponseWriter, r *http.Request) {
	updateUserMetrics()
	
	metrics := map[string]interface{}{
		"total_users":        len(users),
		"approved_users":     len(getUsersByStatus(true)),
		"pending_users":      len(getUsersByStatus(false)),
		"active_nodes":       len(getActiveNodes()),
		"total_certificates": getTotalCertificates(),
	}
	
	sendResponse(w, true, "Metrics retrieved successfully", metrics, http.StatusOK)
}

func getUsersByStatus(approved bool) []User {
	var result []User
	for _, user := range users {
		if user.IsApproved == approved {
			result = append(result, user)
		}
	}
	return result
}

func getActiveNodes() []User {
	var result []User
	for _, user := range users {
		if user.NodeAssigned {
			result = append(result, user)
		}
	}
	return result
}

func getTotalCertificates() int {
	total := 0
	for _, user := range users {
		total += len(user.Certificates)
	}
	return total
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Check admin credentials
	if req.Username == ADMIN_USERNAME && req.Password == ADMIN_PASSWORD {
		loginAttemptsTotal.WithLabelValues("admin", "success").Inc()
		sendResponse(w, true, "Login successful", map[string]interface{}{
			"role": "admin",
			"username": req.Username,
		}, http.StatusOK)
		return
	}

	loginAttemptsTotal.WithLabelValues("admin", "failure").Inc()
	sendResponse(w, false, "Invalid credentials", nil, http.StatusUnauthorized)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Name == "" || req.Email == "" || req.Phone == "" || req.Password == "" || req.SchoolName == "" {
		sendResponse(w, false, "All fields are required", nil, http.StatusBadRequest)
		return
	}

	if req.TenthMarks < 0 || req.TenthMarks > 100 {
		sendResponse(w, false, "Invalid marks (0-100)", nil, http.StatusBadRequest)
		return
	}

	// Check if email already exists
	for _, user := range users {
		if user.Email == req.Email {
			sendResponse(w, false, "Email already registered", nil, http.StatusConflict)
			return
		}
	}

	// Generate Student ID based on 10th marksheet details
	studentID := generateStudentID(req.Name, req.SchoolName, req.PassingYear, req.TenthMarks)

	// Create new user
	user := User{
		ID:           userIDCounter,
		Name:         req.Name,
		Email:        req.Email,
		Phone:        req.Phone,
		Password:     req.Password, // In production, hash this password
		StudentID:    studentID,
		TenthMarks:   req.TenthMarks,
		SchoolName:   req.SchoolName,
		PassingYear:  req.PassingYear,
		IsApproved:   false,
		NodeAssigned: false,
		CreatedAt:    time.Now().Format("2006-01-02 15:04:05"),
		Certificates: []Certificate{},
	}

	users = append(users, user)
	userIDCounter++

	// Register student on blockchain
	if blockchainClient != nil {
		err := blockchainClient.RegisterStudent(
			studentID,
			req.Name,
			req.Email,
			req.SchoolName,
			int64(req.TenthMarks),
			int64(req.PassingYear),
		)
		if err != nil {
			log.Printf("⚠️  Failed to register student on blockchain: %v", err)
		}
	}

	registrationAttemptsTotal.WithLabelValues("success").Inc()
	updateUserMetrics()

	sendResponse(w, true, "Registration successful. Awaiting admin approval.", map[string]interface{}{
		"student_id": studentID,
		"user_id":    user.ID,
	}, http.StatusCreated)
}

func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	sendResponse(w, true, "Users retrieved successfully", users, http.StatusOK)
}

func approveUserHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		sendResponse(w, false, "Invalid user ID", nil, http.StatusBadRequest)
		return
	}

	// Find and approve user
	for i, user := range users {
		if user.ID == userID {
			users[i].IsApproved = true
			users[i].NodeAssigned = true

			// Assign blockchain node and approve on blockchain
			if blockchainClient != nil {
				nodeAddress := blockchain.GenerateNodeAddress(user.StudentID)
				err := blockchainClient.ApproveStudent(user.StudentID, nodeAddress)
				if err != nil {
					log.Printf("⚠️  Failed to approve student on blockchain: %v", err)
				} else {
					log.Printf("✅ Student %s approved and assigned node %s", user.StudentID, nodeAddress.Hex())
				}
			}

			updateUserMetrics()
			sendResponse(w, true, "User approved and blockchain node assigned", map[string]interface{}{
				"user_id":       userID,
				"student_id":    user.StudentID,
				"node_assigned": true,
			}, http.StatusOK)
			return
		}
	}

	sendResponse(w, false, "User not found", nil, http.StatusNotFound)
}

func generateStudentID(name, school string, passingYear int, marks int) string {
	// Generate student ID based on 10th marksheet details
	// Format: SCHOOL_INITIALS + YEAR + MARKS + NAME_INITIALS
	schoolInitials := getInitials(school)
	nameInitials := getInitials(name)
	
	studentID := fmt.Sprintf("%s%d%02d%s", schoolInitials, passingYear, marks, nameInitials)
	return strings.ToUpper(studentID)
}

func getInitials(text string) string {
	words := strings.Fields(text)
	initials := ""
	for _, word := range words {
		if len(word) > 0 {
			initials += string(word[0])
		}
		if len(initials) >= 3 { // Limit to 3 characters
			break
		}
	}
	return initials
}

func studentLoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Find user by student ID and password
	for _, user := range users {
		if user.StudentID == req.Username && user.Password == req.Password {
			if !user.IsApproved {
				loginAttemptsTotal.WithLabelValues("student", "failure").Inc()
				sendResponse(w, false, "Account not yet approved by admin", nil, http.StatusUnauthorized)
				return
			}
			
			loginAttemptsTotal.WithLabelValues("student", "success").Inc()
			sendResponse(w, true, "Login successful", map[string]interface{}{
				"role":       "student",
				"student_id": user.StudentID,
				"user_id":    user.ID,
				"name":       user.Name,
			}, http.StatusOK)
			return
		}
	}

	loginAttemptsTotal.WithLabelValues("student", "failure").Inc()
	sendResponse(w, false, "Invalid student ID or password", nil, http.StatusUnauthorized)
}

func getStudentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		sendResponse(w, false, "Invalid user ID", nil, http.StatusBadRequest)
		return
	}

	// Find student by ID
	for _, user := range users {
		if user.ID == userID && user.IsApproved {
			sendResponse(w, true, "Student data retrieved", user, http.StatusOK)
			return
		}
	}

	sendResponse(w, false, "Student not found or not approved", nil, http.StatusNotFound)
}

func issueCertificateHandler(w http.ResponseWriter, r *http.Request) {
	var req IssueCertificateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendResponse(w, false, "Invalid request body", nil, http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.StudentID == "" || req.Type == "" || req.Title == "" || req.Institution == "" {
		sendResponse(w, false, "All fields are required", nil, http.StatusBadRequest)
		return
	}

	// Find user by student ID
	for i, user := range users {
		if user.StudentID == req.StudentID && user.IsApproved {
			// Create new certificate
			certificate := Certificate{
				ID:          certificateIDCounter,
				Type:        req.Type,
				Title:       req.Title,
				Institution: req.Institution,
				IssuedDate:  time.Now().Format("2006-01-02"),
				Status:      "issued",
				Description: req.Description,
			}

			// Add certificate to user
			users[i].Certificates = append(users[i].Certificates, certificate)
			certificateIDCounter++

			// Issue certificate on blockchain
			if blockchainClient != nil {
				err := blockchainClient.IssueCredential(
					fmt.Sprintf("CERT_%d", certificate.ID),
					user.StudentID,
					req.Type,
					req.Title,
					req.Institution,
					req.Description,
				)
				if err != nil {
					log.Printf("⚠️  Failed to issue certificate on blockchain: %v", err)
				} else {
					log.Printf("✅ Certificate %s issued on blockchain for student %s", certificate.ID, user.StudentID)
				}
			}

			certificatesTotal.WithLabelValues(req.Type, req.Institution).Inc()
			sendResponse(w, true, "Certificate issued successfully and stored on blockchain", certificate, http.StatusCreated)
			return
		}
	}

	sendResponse(w, false, "Student not found or not approved", nil, http.StatusNotFound)
}

func sendResponse(w http.ResponseWriter, success bool, message string, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	response := Response{
		Success: success,
		Message: message,
		Data:    data,
	}
	
	json.NewEncoder(w).Encode(response)
}
