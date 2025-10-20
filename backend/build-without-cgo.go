//go:build !cgo
// +build !cgo

package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/cors"
)

// Simplified version without blockchain integration for CGO-free compilation
// This version simulates blockchain operations

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
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default values")
	}

	log.Println("🚀 Starting BlockCred Backend (Simulation Mode)")
	log.Println("⚠️  Blockchain integration disabled due to CGO compilation issues")
	log.Println("💡 To enable real blockchain: Install TDM-GCC and rebuild")

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

// All handler functions remain the same as in main.go
// ... (rest of the handlers would be copied here)
