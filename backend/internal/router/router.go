package router

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"blockcred-backend/internal/config"
	handlerspkg "blockcred-backend/internal/http/handlers"
	"blockcred-backend/internal/http/middleware"
	"blockcred-backend/internal/services"
	"blockcred-backend/internal/store"
)

func New(cfg config.Config) http.Handler {
	// Try to initialize MongoDB store, fallback to memory store if it fails
	var st store.Store
	var err error
	
	st, err = store.NewMongoDBStore(cfg.MongoURI, cfg.MongoDatabase)
	if err != nil {
		log.Printf("⚠️  MongoDB connection failed: %v", err)
		log.Printf("🔄 Falling back to memory store")
		st = store.NewMemoryStore()
	} else {
		log.Printf("✅ Connected to MongoDB")
	}

	authSvc := services.NewAuthService(st)
	userSvc := services.NewUserService(st)
	credSvc := services.NewCredentialService(st)
	dashboardSvc := services.NewDashboardService(st)
	
	// Initialize IPFS service (DApp Architecture)
	ipfsService := services.NewIPFSService(cfg)
	
	// Certificate service creates cryptographic and transparency log services internally
	// Pass nil for blockchain service (not used in DApp architecture)
	certSvc := services.NewCertificateService(st, ipfsService, nil)
	authMiddleware := middleware.NewAuthMiddleware(st)

	auth := &handlerspkg.AuthHandler{Auth: authSvc}
	users := &handlerspkg.UserHandler{Users: userSvc}
	credentials := &handlerspkg.CredentialHandler{Credentials: credSvc}
	certificates := &handlerspkg.CertificateHandler{Certificates: certSvc}
	dashboard := &handlerspkg.DashboardHandler{Dashboard: dashboardSvc}
	courses := &handlerspkg.CoursesHandler{Store: st}

	r := mux.NewRouter()

	// Health check
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}).Methods("GET")

	api := r.PathPrefix("/api").Subrouter()

	// Public routes
	api.HandleFunc("/login", auth.Login).Methods("POST")
	api.HandleFunc("/register", users.Register).Methods("POST")

	// Protected routes with authentication
	api.HandleFunc("/users", authMiddleware.RequireAuth(users.List)).Methods("GET")
	api.HandleFunc("/admin/onboard", authMiddleware.RequireAuth(users.Onboard)).Methods("POST")
	api.HandleFunc("/credentials", authMiddleware.RequireAuth(credentials.List)).Methods("GET")
	api.HandleFunc("/credentials/issue", authMiddleware.RequireAuth(credentials.Issue)).Methods("POST")
	
	// Add user approval endpoint
	api.HandleFunc("/users/{id}/approve", authMiddleware.RequireAuth(users.Approve)).Methods("POST")
	
	// Add user update endpoint
	api.HandleFunc("/admin/users/{id}", authMiddleware.RequireAuth(users.UpdateUser)).Methods("PUT")
	// Add user delete endpoint
	api.HandleFunc("/admin/users/{id}", authMiddleware.RequireAuth(users.DeleteUser)).Methods("DELETE")
	
	// Certificate endpoints
	api.HandleFunc("/certificates/issue", authMiddleware.RequireAuth(certificates.IssueCertificate)).Methods("POST")
	api.HandleFunc("/certificates/verify/{cert_id}", certificates.VerifyCertificate).Methods("GET")
	api.HandleFunc("/certificates", authMiddleware.RequireAuth(certificates.ListCertificates)).Methods("GET")
	api.HandleFunc("/certificates/student/{student_id}", authMiddleware.RequireAuth(certificates.ListCertificatesByStudent)).Methods("GET")
	api.HandleFunc("/certificates/issuer", authMiddleware.RequireAuth(certificates.ListCertificatesByIssuer)).Methods("GET")
	api.HandleFunc("/certificates/{cert_id}/revoke", authMiddleware.RequireAuth(certificates.RevokeCertificate)).Methods("POST")
	api.HandleFunc("/certificates/{cert_id}", authMiddleware.RequireAuth(certificates.DeleteCertificate)).Methods("DELETE")
	api.HandleFunc("/certificates/test-ipfs", certificates.TestIPFS).Methods("GET")
	api.HandleFunc("/public/student/{student_id}", certificates.GetPublicStudentProfile).Methods("GET")

	// Dashboard endpoints
	api.HandleFunc("/dashboard/stats", authMiddleware.RequireAuth(dashboard.GetStats)).Methods("GET")
	api.HandleFunc("/dashboard/students/{id}", authMiddleware.RequireAuth(dashboard.GetStudentData)).Methods("GET")
	api.HandleFunc("/dashboard/students/{student_id}/credentials", authMiddleware.RequireAuth(dashboard.GetStudentCredentials)).Methods("GET")

	// Add-result: course and result-detail uploads (Excel)
	api.HandleFunc("/courses", authMiddleware.RequireAuth(courses.UploadCourses)).Methods("POST")
	api.HandleFunc("/result-details", authMiddleware.RequireAuth(courses.UploadResultDetails)).Methods("POST")

	// Cryptographic endpoints (DApp Architecture)
	// Note: Cryptographic operations are handled internally by certificate service
	// These endpoints can be added if needed for public key management, etc.

	corsOptions := cors.Options{
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}
	
	// Allow all origins if "*" is in the list, or if list is empty
	if len(cfg.AllowedOrigins) == 0 || (len(cfg.AllowedOrigins) == 1 && cfg.AllowedOrigins[0] == "*") {
		corsOptions.AllowOriginFunc = func(origin string) bool {
			return true
		}
	} else {
		corsOptions.AllowedOrigins = cfg.AllowedOrigins
	}
	
	c := cors.New(corsOptions)
	return c.Handler(r)
}
