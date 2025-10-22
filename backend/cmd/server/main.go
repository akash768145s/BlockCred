package main

import (
	"log"
	"net/http"
	"os"

	"blockcred-backend/internal/config"
	"blockcred-backend/internal/router"
)

func main() {
	cfg := config.Load()

	r := router.New(cfg)

	addr := ":" + cfg.Port
	log.Printf("🚀 BlockCred API starting on %s", addr)
	log.Printf("📊 Metrics: http://localhost%s/metrics", addr)
	log.Printf("🌐 API: http://localhost%s/api", addr)
	
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Println("❌ Server exited with error:", err)
		os.Exit(1)
	}
}
