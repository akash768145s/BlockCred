package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/services"

	"github.com/gorilla/mux"
)

type UserHandler struct {
	Users *services.UserService
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	list, err := h.Users.List()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to retrieve users", nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "users retrieved", list)
}

func (h *UserHandler) Onboard(w http.ResponseWriter, r *http.Request) {
	var in services.OnboardInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}
	u, err := h.Users.Onboard(in)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to onboard user", nil)
		return
	}
	httpx.JSON(w, http.StatusCreated, true, "user onboarded", map[string]any{"user_id": u.ID})
}

func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var in services.RegisterStudentInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}
	u, err := h.Users.RegisterStudent(in)
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to register student", nil)
		return
	}
	httpx.JSON(w, http.StatusCreated, true, "registration successful. awaiting admin approval.", map[string]any{
		"user_id":    u.ID,
		"student_id": u.StudentID,
	})
}

func (h *UserHandler) Approve(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userIDStr, ok := vars["id"]
	if !ok {
		httpx.JSON(w, http.StatusBadRequest, false, "user ID required", nil)
		return
	}

	user, err := h.Users.Approve(userIDStr)
	if err != nil {
		httpx.JSON(w, http.StatusNotFound, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "user approved successfully", user)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userIDStr, ok := vars["id"]
	if !ok {
		httpx.JSON(w, http.StatusBadRequest, false, "user ID required", nil)
		return
	}

	// Read raw request body for logging
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "failed to read request body", nil)
		return
	}
	
	// Log raw request body
	log.Printf("UpdateUser RAW request body for ID %s: %s", userIDStr, string(bodyBytes))
	
	// Create new reader for JSON decoder
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var in services.UpdateUserInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		log.Printf("JSON decode error: %v", err)
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}

	// Log the received data for debugging
	log.Printf("UpdateUser request for ID %s: Role='%s' (len=%d), Department='%s', ClubName='%s'", 
		userIDStr, in.Role, len(string(in.Role)), in.Department, in.ClubName)

	user, err := h.Users.UpdateUser(userIDStr, in)
	if err != nil {
		httpx.JSON(w, http.StatusNotFound, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "user updated successfully", user)
}

func (h *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userIDStr, ok := vars["id"]
	if !ok {
		httpx.JSON(w, http.StatusBadRequest, false, "user ID required", nil)
		return
	}

	err := h.Users.DeleteUser(userIDStr)
	if err != nil {
		httpx.JSON(w, http.StatusNotFound, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "user deleted successfully", nil)
}
