package handlers

import (
	"encoding/json"
	"net/http"

	httpx "blockcred-backend/internal/http"
	"blockcred-backend/internal/services"
	"blockcred-backend/internal/store"
)

type AuthHandler struct {
	Auth  *services.AuthService
	Store store.Store
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

	// Fetch dashboard_route ONLY from roles created in admin Roles tab
	// Dashboard route comes from role.dashboard_route field (set in Admin → Roles)
	dashboardRoute := ""
	if user.RoleID != nil {
		// Try RoleID first (most reliable)
		role, err := h.Store.GetRoleByID(user.RoleID.Hex())
		if err == nil {
			dashboardRoute = role.DashboardRoute
		}
	}
	// If no dashboard_route found yet and user has RoleName, try looking up by name
	if dashboardRoute == "" && user.RoleName != "" {
		roles, err := h.Store.ListRoles()
		if err == nil {
			for _, role := range roles {
				if role.Name == user.RoleName {
					dashboardRoute = role.DashboardRoute
					break
				}
			}
		}
	}
	// If role has no dashboard_route set, default to /dashboard (fallback page)
	if dashboardRoute == "" {
		dashboardRoute = "/dashboard"
	}

	// Add dashboard_route to user object in response
	userMap := map[string]interface{}{
		"id":             user.ID,
		"name":           user.Name,
		"email":          user.Email,
		"phone":          user.Phone,
		"student_id":     user.StudentID,
		"role":           user.Role,
		"role_id":        user.RoleID,
		"role_name":      user.RoleName,
		"department":     user.Department,
		"institution":    user.Institution,
		"club_name":      user.ClubName,
		"dob":            user.DOB,
		"school_name":    user.SchoolName,
		"father_name":    user.FatherName,
		"aadhar_number":  user.AadharNumber,
		"tenth_school":   user.TenthSchool,
		"tenth_marks":    user.TenthMarks,
		"twelfth_school": user.TwelfthSchool,
		"twelfth_marks":  user.TwelfthMarks,
		"cutoff":         user.Cutoff,
		"is_active":      user.IsActive,
		"is_approved":    user.IsApproved,
		"node_assigned":  user.NodeAssigned,
		"created_at":     user.CreatedAt,
	}
	// Always include dashboard_route (defaults to /dashboard if role has none)
	userMap["dashboard_route"] = dashboardRoute

	httpx.JSON(w, http.StatusOK, true, "login successful", map[string]interface{}{
		"user":  userMap,
		"token": token,
	})
}
