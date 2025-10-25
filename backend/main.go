package main

import (
	"blockcred-backend/internal/config"
	"blockcred-backend/internal/router"
	"log"
	"net/http"
	"os"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	r := router.New(cfg)

	addr := ":" + cfg.Port
	log.Printf("🚀 BlockCred API starting on %s", addr)
	log.Printf("🌐 API: http://localhost%s/api", addr)
	
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Println("❌ Server exited with error:", err)
		os.Exit(1)
	}
}
