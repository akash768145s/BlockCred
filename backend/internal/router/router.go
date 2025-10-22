package router

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"blockcred-backend/internal/config"
	handlerspkg "blockcred-backend/internal/http/handlers"
	"blockcred-backend/internal/services"
	"blockcred-backend/internal/store"
)

func New(cfg config.Config) http.Handler {
	st := store.NewMemoryStore()

	authSvc := services.NewAuthService(st)
	userSvc := services.NewUserService(st)
	credSvc := services.NewCredentialService(st)

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

	// Protected routes (add auth middleware later)
	api.HandleFunc("/users", users.List).Methods("GET")
	api.HandleFunc("/admin/onboard", users.Onboard).Methods("POST")
	api.HandleFunc("/credentials", credentials.List).Methods("GET")
	api.HandleFunc("/credentials/issue", credentials.Issue).Methods("POST")

	c := cors.New(cors.Options{
		AllowedOrigins: cfg.AllowedOrigins,
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})
	return c.Handler(r)
}
