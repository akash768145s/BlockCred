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
	authMiddleware := middleware.NewAuthMiddleware(st)

	auth := &handlerspkg.AuthHandler{Auth: authSvc}
	users := &handlerspkg.UserHandler{Users: userSvc}
	credentials := &handlerspkg.CredentialHandler{Credentials: credSvc}

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

	c := cors.New(cors.Options{
		AllowedOrigins: cfg.AllowedOrigins,
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})
	return c.Handler(r)
}
