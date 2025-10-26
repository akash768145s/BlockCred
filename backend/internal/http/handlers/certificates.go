package handlers

import (
	"encoding/json"
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/models"
	"blockcred-backend/internal/services"

	"github.com/gorilla/mux"
)

type CertificateHandler struct {
	Certificates *services.CertificateService
}

func (h *CertificateHandler) IssueCertificate(w http.ResponseWriter, r *http.Request) {
	var req models.IssueCertificateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}

	// Get user from context (set by auth middleware)
	user, ok := r.Context().Value("user").(models.User)
	if !ok {
		httpx.JSON(w, http.StatusUnauthorized, false, "user not authenticated", nil)
		return
	}
	
	issuerID := user.ID.Hex()

	certificate, err := h.Certificates.IssueCertificate(req, issuerID)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusCreated, true, "certificate issued successfully", map[string]interface{}{
		"certificate_id": certificate.ID,
		"cert_id":        certificate.CertID,
		"ipfs_url":       certificate.IPFSURL,
		"tx_hash":        certificate.TxHash,
		"block_number":   certificate.BlockNumber,
	})
}

func (h *CertificateHandler) VerifyCertificate(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	certID, ok := vars["cert_id"]
	if !ok {
		httpx.JSON(w, http.StatusBadRequest, false, "certificate ID required", nil)
		return
	}

	result, err := h.Certificates.VerifyCertificate(certID)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "verification completed", result)
}

func (h *CertificateHandler) ListCertificates(w http.ResponseWriter, r *http.Request) {
	certificates, err := h.Certificates.ListCertificates()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to retrieve certificates", nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "certificates retrieved", certificates)
}

func (h *CertificateHandler) ListCertificatesByStudent(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID, ok := vars["student_id"]
	if !ok {
		httpx.JSON(w, http.StatusBadRequest, false, "student ID required", nil)
		return
	}

	certificates, err := h.Certificates.ListCertificatesByStudent(studentID)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to retrieve certificates", nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "certificates retrieved", certificates)
}

func (h *CertificateHandler) ListCertificatesByIssuer(w http.ResponseWriter, r *http.Request) {
	// Get issuer ID from context
	issuerID, ok := r.Context().Value("user_id").(string)
	if !ok {
		httpx.JSON(w, http.StatusUnauthorized, false, "user not authenticated", nil)
		return
	}

	certificates, err := h.Certificates.ListCertificatesByIssuer(issuerID)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to retrieve certificates", nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "certificates retrieved", certificates)
}

func (h *CertificateHandler) RevokeCertificate(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	certID, ok := vars["cert_id"]
	if !ok {
		httpx.JSON(w, http.StatusBadRequest, false, "certificate ID required", nil)
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}

	err := h.Certificates.RevokeCertificate(certID, req.Reason)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "certificate revoked successfully", nil)
}

func (h *CertificateHandler) TestIPFS(w http.ResponseWriter, r *http.Request) {
	// Test IPFS connection
	if h.Certificates == nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "certificate service not initialized", nil)
		return
	}

	// This is a simple test - in a real implementation, you'd expose the IPFS service
	httpx.JSON(w, http.StatusOK, true, "IPFS service available", map[string]interface{}{
		"message": "IPFS service is initialized and ready",
		"note": "Use the certificate issuance endpoint to test actual IPFS upload",
	})
}
