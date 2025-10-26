package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"blockcred-backend/internal/config"
)

type IPFSService struct {
	config config.Config
	client *http.Client
}

type PinataResponse struct {
	IpfsHash  string `json:"IpfsHash"`
	PinSize   int    `json:"PinSize"`
	Timestamp string `json:"Timestamp"`
}

type PinataError struct {
	Error struct {
		Reason  string `json:"reason"`
		Details string `json:"details"`
	} `json:"error"`
}

func NewIPFSService(cfg config.Config) *IPFSService {
	return &IPFSService{
		config: cfg,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// UploadFile uploads a file to IPFS via Pinata and returns the CID
func (s *IPFSService) UploadFile(fileData []byte, fileName string, metadata map[string]interface{}) (string, error) {
	if s.config.PinataAPIKey == "" || s.config.PinataAPISecret == "" {
		return "", fmt.Errorf("Pinata API credentials not configured - please set PINATA_API_KEY and PINATA_API_SECRET environment variables")
	}
	
	// Validate input
	if len(fileData) == 0 {
		return "", fmt.Errorf("file data is empty")
	}
	if fileName == "" {
		return "", fmt.Errorf("file name is required")
	}

	// Create multipart form data
	var b bytes.Buffer
	w := multipart.NewWriter(&b)

	// Add file
	fw, err := w.CreateFormFile("file", fileName)
	if err != nil {
		return "", fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := fw.Write(fileData); err != nil {
		return "", fmt.Errorf("failed to write file data: %w", err)
	}

	// Add metadata with proper Pinata format
	pinataMetadata := map[string]interface{}{
		"name": fileName,
		"keyvalues": metadata,
	}
	metadataJSON, err := json.Marshal(pinataMetadata)
	if err != nil {
		return "", fmt.Errorf("failed to marshal metadata: %w", err)
	}
	
	if err := w.WriteField("pinataMetadata", string(metadataJSON)); err != nil {
		return "", fmt.Errorf("failed to write metadata: %w", err)
	}

	// Add options
	options := map[string]interface{}{
		"cidVersion": 1,
	}
	optionsJSON, err := json.Marshal(options)
	if err != nil {
		return "", fmt.Errorf("failed to marshal options: %w", err)
	}
	
	if err := w.WriteField("pinataOptions", string(optionsJSON)); err != nil {
		return "", fmt.Errorf("failed to write options: %w", err)
	}

	w.Close()

	// Create request
	req, err := http.NewRequest("POST", "https://api.pinata.cloud/pinning/pinFileToIPFS", &b)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("pinata_api_key", s.config.PinataAPIKey)
	req.Header.Set("pinata_secret_api_key", s.config.PinataAPISecret)

	// Send request
	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var pinataErr PinataError
		if err := json.Unmarshal(body, &pinataErr); err != nil {
			return "", fmt.Errorf("Pinata API error (status %d): %s", resp.StatusCode, string(body))
		}
		return "", fmt.Errorf("Pinata API error: %s - %s", pinataErr.Error.Reason, pinataErr.Error.Details)
	}

	var pinataResp PinataResponse
	if err := json.Unmarshal(body, &pinataResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return pinataResp.IpfsHash, nil
}

// GetFileURL returns the full IPFS URL for a given CID
func (s *IPFSService) GetFileURL(cid string) string {
	return s.config.PinataGatewayURL + cid
}

// PinJSON uploads JSON data to IPFS via Pinata
func (s *IPFSService) PinJSON(data interface{}, name string) (string, error) {
	if s.config.PinataAPIKey == "" || s.config.PinataAPISecret == "" {
		return "", fmt.Errorf("Pinata API credentials not configured")
	}

	_, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// Create request body
	requestBody := map[string]interface{}{
		"pinataContent": data,
		"pinataMetadata": map[string]interface{}{
			"name": name,
		},
		"pinataOptions": map[string]interface{}{
			"cidVersion": 1,
		},
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create request
	req, err := http.NewRequest("POST", "https://api.pinata.cloud/pinning/pinJSONToIPFS", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("pinata_api_key", s.config.PinataAPIKey)
	req.Header.Set("pinata_secret_api_key", s.config.PinataAPISecret)

	// Send request
	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var pinataErr PinataError
		if err := json.Unmarshal(body, &pinataErr); err != nil {
			return "", fmt.Errorf("Pinata API error (status %d): %s", resp.StatusCode, string(body))
		}
		return "", fmt.Errorf("Pinata API error: %s - %s", pinataErr.Error.Reason, pinataErr.Error.Details)
	}

	var pinataResp PinataResponse
	if err := json.Unmarshal(body, &pinataResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return pinataResp.IpfsHash, nil
}
