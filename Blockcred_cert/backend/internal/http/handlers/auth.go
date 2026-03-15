package handlers

import (
	"encoding/json"
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/services"
)

type AuthHandler struct {
	Auth *services.AuthService
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}
	user, token, err := h.Auth.Login(req.Username, req.Password)
	if err != nil {
		httpx.JSON(w, http.StatusUnauthorized, false, err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "login successful", map[string]interface{}{
		"user":  user,
		"token": token,
	})
}
