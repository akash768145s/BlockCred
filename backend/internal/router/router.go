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

	// Optional: initialize private blockchain (Besu / GoEth / mock) to complement DApp architecture
	var blockchainService services.BlockchainServiceInterface
	log.Printf("🔍 Checking Besu blockchain node connection...")
	besuService, err := services.NewBesuBlockchainService(cfg)
	if err != nil {
		log.Printf("⚠️  Besu blockchain service initialization failed: %v", err)
		log.Printf("💡 Make sure Besu is running: .\\backend\\blockchain\\scripts\\setup\\start-besu.bat")
		log.Printf("🔄 Trying GoEth blockchain service...")
		goEthService, err := services.NewGoEthBlockchainService(cfg)
		if err != nil {
			log.Printf("⚠️  GoEth blockchain service initialization failed: %v", err)
			log.Printf("🔄 Falling back to mock blockchain service...")
			mockService, err := services.NewBlockchainService(cfg)
			if err != nil {
				log.Printf("⚠️  Mock blockchain service initialization failed: %v", err)
				log.Printf("🔄 Certificate issuance will use pure DApp architecture (no on-chain write)")
				blockchainService = nil
			} else {
				blockchainService = mockService
				log.Printf("⚠️  Using mock blockchain service (certificates will not be stored on-chain)")
			}
		} else {
			blockchainService = goEthService
			log.Printf("✅ Using GoEth blockchain service")
		}
	} else {
		blockchainService = besuService
		log.Printf("✅ Using Besu blockchain service")
	}

	// Certificate service creates cryptographic and transparency log services internally.
	// When blockchainService is non-nil, data is also written to the private chain (backward compatible path).
	certSvc := services.NewCertificateService(st, ipfsService, blockchainService)
	authMiddleware := middleware.NewAuthMiddleware(st)

	auth := &handlerspkg.AuthHandler{Auth: authSvc, Store: st}
	users := &handlerspkg.UserHandler{Users: userSvc}
	rbacAdmin := &handlerspkg.RBACAdminHandler{Store: st}
	issuerCfg := &handlerspkg.IssuerConfigHandler{Store: st}
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
	api.HandleFunc("/public/departments", rbacAdmin.ListPublicDepartments).Methods("GET")
	api.HandleFunc("/public/credential-types", rbacAdmin.ListPublicCredentialTypes).Methods("GET")

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

	// Admin configuration: roles
	api.HandleFunc("/admin/roles", authMiddleware.RequireAuth(rbacAdmin.ListRoles)).Methods("GET")
	api.HandleFunc("/admin/roles", authMiddleware.RequireAuth(rbacAdmin.CreateRole)).Methods("POST")
	api.HandleFunc("/admin/roles/{id}", authMiddleware.RequireAuth(rbacAdmin.UpdateRole)).Methods("PUT")
	api.HandleFunc("/admin/roles/{id}", authMiddleware.RequireAuth(rbacAdmin.DeleteRole)).Methods("DELETE")

	// Admin configuration: departments
	api.HandleFunc("/admin/departments", authMiddleware.RequireAuth(rbacAdmin.ListDepartments)).Methods("GET")
	api.HandleFunc("/admin/departments", authMiddleware.RequireAuth(rbacAdmin.CreateDepartment)).Methods("POST")
	api.HandleFunc("/admin/departments/{id}", authMiddleware.RequireAuth(rbacAdmin.UpdateDepartment)).Methods("PUT")
	api.HandleFunc("/admin/departments/{id}", authMiddleware.RequireAuth(rbacAdmin.DeleteDepartment)).Methods("DELETE")

	// Admin configuration: credential types
	api.HandleFunc("/admin/credential-types", authMiddleware.RequireAuth(rbacAdmin.ListCredentialTypes)).Methods("GET")
	api.HandleFunc("/admin/credential-types", authMiddleware.RequireAuth(rbacAdmin.CreateCredentialType)).Methods("POST")
	api.HandleFunc("/admin/credential-types/{id}", authMiddleware.RequireAuth(rbacAdmin.UpdateCredentialType)).Methods("PUT")
	api.HandleFunc("/admin/credential-types/{id}", authMiddleware.RequireAuth(rbacAdmin.DeleteCredentialType)).Methods("DELETE")
	// Issuer-facing: list credential types current user can issue (no admin permission required)
	api.HandleFunc("/issuer/credential-types", authMiddleware.RequireAuth(issuerCfg.ListIssuerCredentialTypes)).Methods("GET")

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

	// Blockchain endpoints (private chain: Besu / GoEth / mock)
	if blockchainService != nil {
		var blockchain *handlerspkg.BlockchainHandler
		if besuSvc, ok := blockchainService.(*services.BesuBlockchainService); ok {
			blockchain = &handlerspkg.BlockchainHandler{Blockchain: besuSvc}
		} else if goEthSvc, ok := blockchainService.(*services.GoEthBlockchainService); ok {
			blockchain = &handlerspkg.BlockchainHandler{Blockchain: goEthSvc}
		} else {
			// Fallback for generic BlockchainService (mock); still expose status endpoints via interface
			blockchain = &handlerspkg.BlockchainHandler{Blockchain: blockchainService}
		}

		api.HandleFunc("/blockchain/status", blockchain.GetBlockchainStatus).Methods("GET")
		api.HandleFunc("/blockchain/register-issuer", authMiddleware.RequireAuth(blockchain.RegisterIssuer)).Methods("POST")
		api.HandleFunc("/blockchain/verify-certificate", blockchain.VerifyCertificateOnChain).Methods("GET")
		api.HandleFunc("/blockchain/certificate", blockchain.GetCertificateFromChain).Methods("GET")
	}

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
