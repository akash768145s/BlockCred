package handlers

import (
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/models"
	"blockcred-backend/internal/services"
	"blockcred-backend/internal/store"
)

// IssuerConfigHandler exposes issuer-facing configuration APIs (what the current role can issue).
type IssuerConfigHandler struct {
	Store store.Store
}

// getCurrentUser is reused from RBACAdminHandler, but we re-declare a minimal helper here
// to avoid tight coupling between handlers.
func (h *IssuerConfigHandler) getCurrentUser(r *http.Request) (models.User, bool) {
	u, ok := r.Context().Value("user").(models.User)
	return u, ok
}

// ListIssuerCredentialTypes returns only the credential types that the current user is allowed to issue,
// based on dynamic Role / CredentialTypeConfig configuration.
func (h *IssuerConfigHandler) ListIssuerCredentialTypes(w http.ResponseWriter, r *http.Request) {
	user, ok := h.getCurrentUser(r)
	if !ok {
		httpx.JSON(w, http.StatusInternalServerError, false, "user not found in context", nil)
		return
	}

	rbac := services.NewRBACService(h.Store)

	allTypes, err := h.Store.ListCredentialTypes()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to list credential types", nil)
		return
	}

	allowed := make([]models.CredentialTypeConfig, 0, len(allTypes))
	for _, ct := range allTypes {
		ok, err := rbac.CanIssueCredential(user, models.CredentialType(ct.Name))
		if err != nil {
			// treat errors (e.g. misconfig) as "not allowed" for this user
			continue
		}
		if ok {
			allowed = append(allowed, ct)
		}
	}

	httpx.JSON(w, http.StatusOK, true, "credential types for issuer retrieved", allowed)
}

