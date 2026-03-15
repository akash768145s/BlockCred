package services

import (
	"encoding/base64"
	"fmt"
	"log"
)

// DebugIPFSUpload helps diagnose IPFS upload issues
func (s *IPFSService) DebugIPFSUpload(fileData []byte, fileName string, metadata map[string]interface{}) (string, error) {
	log.Printf("🔍 IPFS Debug: Starting upload process")
	
	// Check credentials
	if s.config.PinataAPIKey == "" {
		return "", fmt.Errorf("❌ Pinata API Key not configured")
	}
	if s.config.PinataAPISecret == "" {
		return "", fmt.Errorf("❌ Pinata API Secret not configured")
	}
	log.Printf("✅ Pinata credentials configured")
	
	// Check file data
	if len(fileData) == 0 {
		return "", fmt.Errorf("❌ File data is empty")
	}
	log.Printf("✅ File data size: %d bytes", len(fileData))
	
	// Check if file data is base64 encoded
	if isBase64Encoded(fileData) {
		log.Printf("📝 File data appears to be base64 encoded, decoding...")
		decoded, err := base64.StdEncoding.DecodeString(string(fileData))
		if err != nil {
			return "", fmt.Errorf("❌ Failed to decode base64 file data: %w", err)
		}
		fileData = decoded
		log.Printf("✅ Decoded file data size: %d bytes", len(fileData))
	}
	
	// Check metadata
	if metadata == nil {
		log.Printf("⚠️  No metadata provided")
	} else {
		log.Printf("✅ Metadata provided: %+v", metadata)
	}
	
	// Try the actual upload
	log.Printf("🚀 Attempting IPFS upload...")
	cid, err := s.UploadFile(fileData, fileName, metadata)
	if err != nil {
		log.Printf("❌ IPFS upload failed: %v", err)
		return "", err
	}
	
	log.Printf("✅ IPFS upload successful! CID: %s", cid)
	return cid, nil
}

// isBase64Encoded checks if the data appears to be base64 encoded
func isBase64Encoded(data []byte) bool {
	// Simple heuristic: check if it's a valid base64 string
	_, err := base64.StdEncoding.DecodeString(string(data))
	return err == nil && len(data) > 0
}

// TestPinataConnection tests the connection to Pinata API
func (s *IPFSService) TestPinataConnection() error {
	log.Printf("🔍 Testing Pinata API connection...")
	
	if s.config.PinataAPIKey == "" || s.config.PinataAPISecret == "" {
		return fmt.Errorf("❌ Pinata credentials not configured")
	}
	
	// Test with a simple JSON upload
	testData := map[string]interface{}{
		"test": "connection",
		"timestamp": "2024-01-01T00:00:00Z",
	}
	
	cid, err := s.PinJSON(testData, "test-connection.json")
	if err != nil {
		log.Printf("❌ Pinata connection test failed: %v", err)
		return err
	}
	
	log.Printf("✅ Pinata connection test successful! Test CID: %s", cid)
	return nil
}
