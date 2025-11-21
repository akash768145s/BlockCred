package main

import (
	"log"
	"net/http"

	"blockcred-backend/internal/config"
	"blockcred-backend/internal/router"
	"github.com/joho/godotenv"
)

// @title BlockCred API
// @version 1.0
// @description API for BlockCred Verification System
func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize router (handles all service initialization internally)
	r := router.New(cfg)

	// Start server
	log.Printf("🚀 BlockCred API starting on :%s", cfg.Port)
	log.Printf("🌐 API: http://localhost:%s/api", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
