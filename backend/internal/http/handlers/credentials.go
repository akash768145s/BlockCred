package handlers

import (
	"encoding/json"
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/services"
)

type CredentialHandler struct {
	Credentials *services.CredentialService
}

func (h *CredentialHandler) List(w http.ResponseWriter, r *http.Request) {
	list := h.Credentials.List()
	httpx.JSON(w, http.StatusOK, true, "credentials retrieved", list)
}

func (h *CredentialHandler) Issue(w http.ResponseWriter, r *http.Request) {
	var in services.IssueCredentialInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}
	
	credential := h.Credentials.IssueCredential(in)
	httpx.JSON(w, http.StatusCreated, true, "credential issued", map[string]any{"credential_id": credential.ID})
}
