package handlers

import (
	"encoding/json"
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/services"
)

type BlockchainHandler struct {
	Blockchain services.BlockchainServiceInterface
}

type RegisterIssuerRequest struct {
	IssuerAddress string `json:"issuer_address"`
	Name          string `json:"name"`
	Role          string `json:"role"`
	Institution   string `json:"institution"`
}

type BlockchainStatusResponse struct {
	IsConnected    bool   `json:"is_connected"`
	BlockNumber    uint64 `json:"block_number,omitempty"`
	GasPrice       string `json:"gas_price,omitempty"`
	ContractAddr   string `json:"contract_address,omitempty"`
	TotalIssuers   int    `json:"total_issuers,omitempty"`
	TotalCerts     int    `json:"total_certificates,omitempty"`
}

func (h *BlockchainHandler) RegisterIssuer(w http.ResponseWriter, r *http.Request) {
	var req RegisterIssuerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}

	if req.IssuerAddress == "" || req.Name == "" || req.Role == "" || req.Institution == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "missing required fields", nil)
		return
	}

	// Type assert to call RegisterIssuer
	var err error
	if besuSvc, ok := h.Blockchain.(*services.BesuBlockchainService); ok {
		err = besuSvc.RegisterIssuer(req.IssuerAddress, req.Name, req.Role, req.Institution)
	} else if goEthSvc, ok := h.Blockchain.(*services.GoEthBlockchainService); ok {
		err = goEthSvc.RegisterIssuer(req.IssuerAddress, req.Name, req.Role, req.Institution)
	} else {
		httpx.JSON(w, http.StatusInternalServerError, false, "blockchain service does not support issuer registration", nil)
		return
	}

	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "issuer registered successfully", map[string]interface{}{
		"issuer_address": req.IssuerAddress,
		"name":           req.Name,
		"role":           req.Role,
		"institution":    req.Institution,
	})
}

func (h *BlockchainHandler) GetBlockchainStatus(w http.ResponseWriter, r *http.Request) {
	status := BlockchainStatusResponse{
		IsConnected: true,
	}

	// Type assert to get methods not in interface
	if besuSvc, ok := h.Blockchain.(*services.BesuBlockchainService); ok {
		blockNumber, err := besuSvc.GetBlockNumber()
		if err != nil {
			status.IsConnected = false
			httpx.JSON(w, http.StatusOK, true, "blockchain status retrieved", status)
			return
		}
		status.BlockNumber = blockNumber

		gasPrice, err := besuSvc.GetGasPrice()
		if err == nil {
			status.GasPrice = gasPrice.String()
		}
	} else if goEthSvc, ok := h.Blockchain.(*services.GoEthBlockchainService); ok {
		blockNumber, err := goEthSvc.GetBlockNumber()
	if err != nil {
		status.IsConnected = false
		httpx.JSON(w, http.StatusOK, true, "blockchain status retrieved", status)
		return
	}
	status.BlockNumber = blockNumber

		gasPrice, err := goEthSvc.GetGasPrice()
	if err == nil {
		status.GasPrice = gasPrice.String()
		}
	}

	httpx.JSON(w, http.StatusOK, true, "blockchain status retrieved", status)
}

func (h *BlockchainHandler) VerifyCertificateOnChain(w http.ResponseWriter, r *http.Request) {
	certID := r.URL.Query().Get("cert_id")
	if certID == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "certificate ID required", nil)
		return
	}

	isValid, err := h.Blockchain.VerifyCertificate(certID)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "certificate verification completed", map[string]interface{}{
		"cert_id":  certID,
		"is_valid": isValid,
	})
}

func (h *BlockchainHandler) GetCertificateFromChain(w http.ResponseWriter, r *http.Request) {
	certID := r.URL.Query().Get("cert_id")
	if certID == "" {
		httpx.JSON(w, http.StatusBadRequest, false, "certificate ID required", nil)
		return
	}

	info, err := h.Blockchain.GetCertificateInfo(certID)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "certificate information retrieved", info)
}
