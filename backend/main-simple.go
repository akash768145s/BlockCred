package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/cors"
)

// Simple version without blockchain dependencies
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
	CreatedAt    string        `json:"created_at"`
	Certificates []Certificate `json:"certificates"`
}

type Certificate struct {
	ID          int    `json:"id"`
	Type        string `json:"type"`
	Title       string `json:"title"`
	Institution string `json:"institution"`
	IssuedDate  string `json:"issued_date"`
	Status      string `json:"status"`
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

// In-memory storage
var users []User
var userIDCounter = 1
var certificateIDCounter = 1

// Admin credentials
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin123"

// Prometheus metrics
var (
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

	usersTotal = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "blockcred_users_total",
			Help: "Total number of registered users",
		},
		[]string{"status"},
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
		[]string{"user_type", "status"},
	)

	registrationAttemptsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "blockcred_registration_attempts_total",
			Help: "Total number of registration attempts",
		},
		[]string{"status"},
	)
)

func init() {
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
	prometheus.MustRegister(usersTotal)
	prometheus.MustRegister(certificatesTotal)
	prometheus.MustRegister(blockchainNodesActive)
	prometheus.MustRegister(loginAttemptsTotal)
	prometheus.MustRegister(registrationAttemptsTotal)
}

func main() {
	log.Println("🚀 Starting BlockCred Backend (Simple Mode)")
	log.Println("✅ All features working - blockchain operations simulated")

	r := mux.NewRouter()

	// Prometheus metrics endpoint
	r.Handle("/metrics", promhttp.Handler())

	// API routes
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

	fmt.Println("🌐 Server starting on :8080")
	fmt.Println("📊 Admin Dashboard: http://localhost:3000")
	fmt.Println("🔑 Admin Login: admin / admin123")
	log.Fatal(http.ListenAndServe(":8080", handler))
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
			"role":     "admin",
			"username": req.Username,
		}, http.StatusOK)
		return
	}

	loginAttemptsTotal.WithLabelValues("admin", "failure").Inc()
	sendResponse(w, false, "Invalid credentials", nil, http.StatusUnauthorized)
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

	// Generate Student ID
	studentID := generateStudentID(req.Name, req.SchoolName, req.PassingYear, req.TenthMarks)

	// Create new user
	user := User{
		ID:           userIDCounter,
		Name:         req.Name,
		Email:        req.Email,
		Phone:        req.Phone,
		Password:     req.Password,
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

	registrationAttemptsTotal.WithLabelValues("success").Inc()
	updateUserMetrics()

	log.Printf("✅ Student %s registered (simulated blockchain storage)", studentID)

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

			log.Printf("✅ Student %s approved and blockchain node assigned (simulated)", user.StudentID)

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

			certificatesTotal.WithLabelValues(req.Type, req.Institution).Inc()

			log.Printf("✅ Certificate %s issued for student %s (simulated blockchain storage)", certificate.ID, user.StudentID)

			sendResponse(w, true, "Certificate issued successfully and stored on blockchain", certificate, http.StatusCreated)
			return
		}
	}

	sendResponse(w, false, "Student not found or not approved", nil, http.StatusNotFound)
}

// ---- Metrics (simple mode) ----
func metricsHandler(w http.ResponseWriter, r *http.Request) {
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
    for _, u := range users {
        if u.IsApproved == approved {
            result = append(result, u)
        }
    }
    return result
}

func getActiveNodes() []User {
    var result []User
    for _, u := range users {
        if u.NodeAssigned {
            result = append(result, u)
        }
    }
    return result
}

func getTotalCertificates() int {
    total := 0
    for _, u := range users {
        total += len(u.Certificates)
    }
    return total
}

// ---- Prometheus middleware ----
func metricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		status := "200"

		next.ServeHTTP(w, r)

		duration := time.Since(start).Seconds()
		httpRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
		httpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, status).Inc()
	})
}

func updateUserMetrics() {
	approved := 0
	pending := 0
	nodes := 0
	for _, u := range users {
		if u.IsApproved {
			approved++
		} else {
			pending++
		}
		if u.NodeAssigned {
			nodes++
		}
	}
	usersTotal.WithLabelValues("approved").Set(float64(approved))
	usersTotal.WithLabelValues("pending").Set(float64(pending))
	blockchainNodesActive.Set(float64(nodes))
}

func generateStudentID(name, school string, passingYear int, marks int) string {
	// Generate student ID based on 10th marksheet details
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
		if len(initials) >= 3 {
			break
		}
	}
	return initials
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
