package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/services"
)

type UserHandler struct {
	Users *services.UserService
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	list := h.Users.List()
	httpx.JSON(w, http.StatusOK, true, "users retrieved", list)
}

func (h *UserHandler) Onboard(w http.ResponseWriter, r *http.Request) {
	var in services.OnboardInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}
	u := h.Users.Onboard(in)
	httpx.JSON(w, http.StatusCreated, true, "user onboarded", map[string]any{"user_id": u.ID})
}

func (h *UserHandler) Register(w http.ResponseWriter, r *http.Request) {
	var in services.RegisterStudentInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
		return
	}
	u := h.Users.RegisterStudent(in)
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

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid user ID", nil)
		return
	}

	user, err := h.Users.Approve(userID)
	if err != nil {
		httpx.JSON(w, http.StatusNotFound, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "user approved successfully", user)
}
