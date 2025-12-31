package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"

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
	// Check content type - handle both multipart form data and JSON
	contentType := r.Header.Get("Content-Type")
	
	var in services.RegisterStudentInput
	
	if contentType == "application/json" {
		// Handle JSON request
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			httpx.JSON(w, http.StatusBadRequest, false, "invalid request", nil)
			return
		}
	} else {
		// Handle multipart form data (for file uploads) - default for FormData
		if err := r.ParseMultipartForm(32 << 20); err != nil { // 32MB max
			httpx.JSON(w, http.StatusBadRequest, false, "failed to parse form data: "+err.Error(), nil)
			return
		}
		
		// Extract form values
		in.Name = r.FormValue("name")
		in.Email = r.FormValue("email")
		in.Phone = r.FormValue("phone")
		in.Password = r.FormValue("password")
		in.DOB = r.FormValue("dob")
		in.SchoolName = r.FormValue("school_name") // Optional
		in.FatherName = r.FormValue("father_name")
		in.AadharNumber = r.FormValue("aadhar_number")
		in.Department = r.FormValue("department")
		in.TenthSchool = r.FormValue("tenth_school")
		in.TwelfthSchool = r.FormValue("twelfth_school")
		
		// Parse numeric fields
		if tenthMarksStr := r.FormValue("tenth_marks"); tenthMarksStr != "" {
			if val, err := strconv.ParseFloat(tenthMarksStr, 64); err == nil {
				in.TenthMarks = val
			}
		}
		if twelfthMarksStr := r.FormValue("twelfth_marks"); twelfthMarksStr != "" {
			if val, err := strconv.ParseFloat(twelfthMarksStr, 64); err == nil {
				in.TwelfthMarks = val
			}
		}
		if cutoffStr := r.FormValue("cutoff"); cutoffStr != "" {
			if val, err := strconv.Atoi(cutoffStr); err == nil {
				in.Cutoff = val
			}
		}
		
		// Handle file uploads (photo and twelfth_marksheet)
		// Note: Files are currently not stored in the user model, but we parse them
		// to validate the request. If you need to store files, you'll need to add
		// file handling logic here (e.g., save to disk, upload to IPFS, etc.)
		if photoFile, _, err := r.FormFile("photo"); err == nil {
			photoFile.Close() // Close the file handle
		}
		if marksheetFile, _, err := r.FormFile("twelfth_marksheet"); err == nil {
			marksheetFile.Close() // Close the file handle
		}
	}
	
	u, err := h.Users.RegisterStudent(in)
	if err != nil {
		log.Printf("Registration error: %v", err)
		httpx.JSON(w, http.StatusInternalServerError, false, err.Error(), nil)
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
