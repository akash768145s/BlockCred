package handlers

import (
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/services"

	"github.com/gorilla/mux"
)

type DashboardHandler struct {
	Dashboard *services.DashboardService
}

func (h *DashboardHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.Dashboard.GetStats()
	if err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to retrieve dashboard stats", nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "dashboard stats retrieved", stats)
}

func (h *DashboardHandler) GetStudentData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, ok := vars["id"]
	if !ok {
		httpx.JSON(w, http.StatusBadRequest, false, "user ID required", nil)
		return
	}

	data, err := h.Dashboard.GetStudentData(userID)
	if err != nil {
		httpx.JSON(w, http.StatusNotFound, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "student data retrieved", data)
}

func (h *DashboardHandler) GetStudentCredentials(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	studentID, ok := vars["student_id"]
	if !ok {
		httpx.JSON(w, http.StatusBadRequest, false, "student ID required", nil)
		return
	}

	data, err := h.Dashboard.GetStudentCredentials(studentID)
	if err != nil {
		httpx.JSON(w, http.StatusNotFound, false, err.Error(), nil)
		return
	}

	httpx.JSON(w, http.StatusOK, true, "student credentials retrieved", data)
}

