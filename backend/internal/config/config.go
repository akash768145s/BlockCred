package config

import (
	"os"
)

// Config holds service configuration values
type Config struct {
	Port                string
	AllowedOrigins      []string
	JWTSecret           string
	MongoURI            string
	MongoDatabase       string
}

func Load() Config {
	cfg := Config{
		Port:           getEnv("PORT", "8080"),
		JWTSecret:      getEnv("JWT_SECRET", "dev-secret"),
		AllowedOrigins: []string{getEnv("ALLOWED_ORIGIN", "http://localhost:3000")},
		MongoURI:       getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDatabase:  getEnv("MONGO_DATABASE", "blockcred"),
	}
	return cfg
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
