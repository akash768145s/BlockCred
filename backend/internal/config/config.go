package config

import (
	"os"
)

// Config holds service configuration values
// In a real system, extend with DB, blockchain, logging, etc.
type Config struct {
	Port                string
	AllowedOrigins      []string
	JWTSecret           string
}

func Load() Config {
	cfg := Config{
		Port:           getEnv("PORT", "8080"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret"),
		AllowedOrigins: []string{getEnv("ALLOWED_ORIGIN", "http://localhost:3000")},
	}
	return cfg
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
