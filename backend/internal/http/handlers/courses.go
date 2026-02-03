package handlers

import (
	"encoding/json"
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
)

// CoursesHandler handles course and result-detail uploads (add-result Excel).
type CoursesHandler struct {
	Store store.Store
}

type uploadCoursesRequest struct {
	Courses []models.Course `json:"courses"`
}

type uploadResultDetailsRequest struct {
	Rows []models.ResultDetail `json:"rows"`
}

func (h *CoursesHandler) UploadCourses(w http.ResponseWriter, r *http.Request) {
	var req uploadCoursesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request body", nil)
		return
	}
	if len(req.Courses) == 0 {
		httpx.JSON(w, http.StatusOK, true, "no courses to upload", nil)
		return
	}
	if err := h.Store.UpsertCourses(req.Courses); err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to save courses: "+err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "courses saved", nil)
}

func (h *CoursesHandler) UploadResultDetails(w http.ResponseWriter, r *http.Request) {
	var req uploadResultDetailsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpx.JSON(w, http.StatusBadRequest, false, "invalid request body", nil)
		return
	}
	if len(req.Rows) == 0 {
		httpx.JSON(w, http.StatusOK, true, "no result details to upload", nil)
		return
	}
	if err := h.Store.UpsertResultDetails(req.Rows); err != nil {
		httpx.JSON(w, http.StatusInternalServerError, false, "failed to save result details: "+err.Error(), nil)
		return
	}
	httpx.JSON(w, http.StatusOK, true, "result details saved", nil)
}
