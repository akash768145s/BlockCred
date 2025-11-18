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
	
	// Initialize IPFS and Blockchain services
	ipfsService := services.NewIPFSService(cfg)
	// Try Besu blockchain service first, then GoEth, then mock
	var blockchainService services.BlockchainServiceInterface
	besuService, err := services.NewBesuBlockchainService(cfg)
	if err != nil {
		log.Printf("⚠️  Besu blockchain service initialization failed: %v", err)
		log.Printf("🔄 Trying GoEth blockchain service...")
		goEthService, err := services.NewGoEthBlockchainService(cfg)
		if err != nil {
			log.Printf("⚠️  GoEth blockchain service initialization failed: %v", err)
			log.Printf("🔄 Falling back to mock blockchain service...")
			mockService, err := services.NewBlockchainService(cfg)
			if err != nil {
				log.Printf("⚠️  Mock blockchain service initialization failed: %v", err)
				log.Printf("🔄 Certificate issuance will be limited")
				blockchainService = nil
			} else {
				blockchainService = mockService
			}
		} else {
			blockchainService = goEthService
			log.Printf("✅ Using GoEth blockchain service")
		}
	} else {
		blockchainService = besuService
		log.Printf("✅ Using Besu blockchain service")
	}
	
	certSvc := services.NewCertificateService(st, ipfsService, blockchainService)
	authMiddleware := middleware.NewAuthMiddleware(st)

	auth := &handlerspkg.AuthHandler{Auth: authSvc}
	users := &handlerspkg.UserHandler{Users: userSvc}
	credentials := &handlerspkg.CredentialHandler{Credentials: credSvc}
	certificates := &handlerspkg.CertificateHandler{Certificates: certSvc}

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
	
	// Certificate endpoints
	api.HandleFunc("/certificates/issue", authMiddleware.RequireAuth(certificates.IssueCertificate)).Methods("POST")
	api.HandleFunc("/certificates/verify/{cert_id}", certificates.VerifyCertificate).Methods("GET")
	api.HandleFunc("/certificates", authMiddleware.RequireAuth(certificates.ListCertificates)).Methods("GET")
	api.HandleFunc("/certificates/student/{student_id}", authMiddleware.RequireAuth(certificates.ListCertificatesByStudent)).Methods("GET")
	api.HandleFunc("/certificates/issuer", authMiddleware.RequireAuth(certificates.ListCertificatesByIssuer)).Methods("GET")
	api.HandleFunc("/certificates/{cert_id}/revoke", authMiddleware.RequireAuth(certificates.RevokeCertificate)).Methods("POST")
	api.HandleFunc("/certificates/test-ipfs", certificates.TestIPFS).Methods("GET")

	// Blockchain endpoints
	var blockchain *handlerspkg.BlockchainHandler
	if blockchainService != nil {
		// Support both Besu and GoEth services
		if besuSvc, ok := blockchainService.(*services.BesuBlockchainService); ok {
			// Create a wrapper that implements the same interface
			blockchain = &handlerspkg.BlockchainHandler{Blockchain: besuSvc}
			api.HandleFunc("/blockchain/status", blockchain.GetBlockchainStatus).Methods("GET")
			api.HandleFunc("/blockchain/register-issuer", authMiddleware.RequireAuth(blockchain.RegisterIssuer)).Methods("POST")
			api.HandleFunc("/blockchain/verify-certificate", blockchain.VerifyCertificateOnChain).Methods("GET")
			api.HandleFunc("/blockchain/certificate", blockchain.GetCertificateFromChain).Methods("GET")
		} else if goEthSvc, ok := blockchainService.(*services.GoEthBlockchainService); ok {
			blockchain = &handlerspkg.BlockchainHandler{Blockchain: goEthSvc}
			api.HandleFunc("/blockchain/status", blockchain.GetBlockchainStatus).Methods("GET")
			api.HandleFunc("/blockchain/register-issuer", authMiddleware.RequireAuth(blockchain.RegisterIssuer)).Methods("POST")
			api.HandleFunc("/blockchain/verify-certificate", blockchain.VerifyCertificateOnChain).Methods("GET")
			api.HandleFunc("/blockchain/certificate", blockchain.GetCertificateFromChain).Methods("GET")
		}
	}

	corsOptions := cors.Options{
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
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
