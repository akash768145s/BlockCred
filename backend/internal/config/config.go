package config

import (
	"os"
	"strings"
)

// Config holds service configuration values
type Config struct {
	Port                string
	AllowedOrigins      []string
	JWTSecret           string
	MongoURI            string
	MongoDatabase       string
	PinataAPIKey        string
	PinataAPISecret     string
	PinataGatewayURL    string
	BlockchainRPCURL    string
	ContractAddress     string
	PrivateKey          string
}

func Load() Config {
	cfg := Config{
		Port:             getEnv("PORT", "8080"),
		JWTSecret:        getEnv("JWT_SECRET", "dev-secret"),
		AllowedOrigins:   parseAllowedOrigins(getEnv("ALLOWED_ORIGINS", "*")),
		MongoURI:         getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDatabase:    getEnv("MONGO_DATABASE", "blockcred"),
		PinataAPIKey:     getEnv("PINATA_API_KEY", ""),
		PinataAPISecret:  getEnv("PINATA_API_SECRET", ""),
		PinataGatewayURL: getEnv("PINATA_GATEWAY_URL", "https://gateway.pinata.cloud/ipfs/"),
		BlockchainRPCURL: getEnv("BLOCKCHAIN_RPC_URL", "http://localhost:8545"),
		ContractAddress:  getEnv("CONTRACT_ADDRESS", ""),
		PrivateKey:       getEnv("PRIVATE_KEY", ""),
	}
	return cfg
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func parseAllowedOrigins(origins string) []string {
	if origins == "" {
		return []string{"*"}
	}
	// Split by comma and trim spaces
	parts := strings.Split(origins, ",")
	result := []string{}
	for _, origin := range parts {
		trimmed := strings.TrimSpace(origin)
		if trimmed == "*" {
			return []string{"*"}
		}
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	if len(result) == 0 {
		return []string{"*"}
	}
	return result
}
