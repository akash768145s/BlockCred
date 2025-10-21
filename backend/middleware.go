package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
)

// AuthMiddleware handles authentication and role-based access control
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for login and register endpoints
		if r.URL.Path == "/api/login" || r.URL.Path == "/api/register" || r.URL.Path == "/api/student-login" {
			next.ServeHTTP(w, r)
			return
		}

		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			sendResponse(w, false, "Authorization header required", nil, http.StatusUnauthorized)
			return
		}

		// Extract token (assuming Bearer token format)
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			sendResponse(w, false, "Invalid token format", nil, http.StatusUnauthorized)
			return
		}

		// Validate token and get user
		user, err := validateToken(token)
		if err != nil {
			sendResponse(w, false, "Invalid token", nil, http.StatusUnauthorized)
			return
		}

		// Add user to request context
		r.Header.Set("X-User-ID", string(rune(user.ID)))
		r.Header.Set("X-User-Role", string(user.Role))
		r.Header.Set("X-User-Name", user.Name)

		next.ServeHTTP(w, r)
	})
}

// RoleMiddleware checks if user has required role/permission
func RoleMiddleware(requiredPermission string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get user role from header
			userRole := r.Header.Get("X-User-Role")
			userIDStr := r.Header.Get("X-User-ID")
			
			if userRole == "" || userIDStr == "" {
				sendResponse(w, false, "User information not found", nil, http.StatusUnauthorized)
				return
			}

			// Find user to get full permissions
			userID := int(userIDStr[0]) // Simple conversion for demo
			user := findUserByID(userID)
			if user == nil {
				sendResponse(w, false, "User not found", nil, http.StatusNotFound)
				return
			}

			// Check if user has required permission
			if !user.CanPerformAction(requiredPermission) {
				sendResponse(w, false, "Insufficient permissions", nil, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// validateToken validates JWT token and returns user (simplified for demo)
func validateToken(token string) (*EnhancedUser, error) {
	// In a real implementation, you would:
	// 1. Parse and validate JWT token
	// 2. Extract user ID from token claims
	// 3. Fetch user from database
	// 4. Return user with role information

	// For demo purposes, we'll simulate token validation
	// In production, use proper JWT validation
	if token == "admin-token" {
		return &EnhancedUser{
			ID:   1,
			Name: "SSN Main Admin",
			Role: RoleSSNMainAdmin,
		}, nil
	}

	// Find user by token (simplified - in production, decode JWT)
	for _, user := range enhancedUsers {
		if user.Email == token { // Simplified token validation
			return &user, nil
		}
	}

	return nil, http.ErrBodyReadAfterClose
}

// findUserByID finds user by ID
func findUserByID(id int) *EnhancedUser {
	for _, user := range enhancedUsers {
		if user.ID == id {
			return &user
		}
	}
	return nil
}

// LogActivity logs user activity
func LogActivity(userID int, action, details, ipAddress string) {
	activity := ActivityLog{
		ID:        len(activityLogs) + 1,
		UserID:    userID,
		UserName:  getUserNameByID(userID),
		Action:    action,
		Details:   details,
		Timestamp: time.Now(),
		IPAddress: ipAddress,
	}
	activityLogs = append(activityLogs, activity)
}

// getUserNameByID gets user name by ID
func getUserNameByID(id int) string {
	for _, user := range enhancedUsers {
		if user.ID == id {
			return user.Name
		}
	}
	return "Unknown User"
}

// GetClientIP extracts client IP from request
func GetClientIP(r *http.Request) string {
	ip := r.Header.Get("X-Forwarded-For")
	if ip == "" {
		ip = r.Header.Get("X-Real-IP")
	}
	if ip == "" {
		ip = r.RemoteAddr
	}
	return ip
}

// Enhanced response with role information
type EnhancedResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	User    *UserInfo   `json:"user,omitempty"`
}

type UserInfo struct {
	ID       int      `json:"id"`
	Name     string   `json:"name"`
	Role     UserRole `json:"role"`
	RoleName string   `json:"role_name"`
}

// sendEnhancedResponse sends response with user information
func sendEnhancedResponse(w http.ResponseWriter, success bool, message string, data interface{}, user *EnhancedUser, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	var userInfo *UserInfo
	if user != nil {
		userInfo = &UserInfo{
			ID:       user.ID,
			Name:     user.Name,
			Role:     user.Role,
			RoleName: getRoleDisplayName(user.Role),
		}
	}
	
	response := EnhancedResponse{
		Success: success,
		Message: message,
		Data:    data,
		User:    userInfo,
	}
	
	json.NewEncoder(w).Encode(response)
}

// getRoleDisplayName returns human-readable role name
func getRoleDisplayName(role UserRole) string {
	switch role {
	case RoleSSNMainAdmin:
		return "SSN Main Administrator"
	case RoleCOE:
		return "Controller of Examinations"
	case RoleDepartmentFaculty:
		return "Department Faculty"
	case RoleClubCoordinator:
		return "Club Coordinator"
	case RoleExternalVerifier:
		return "External Verifier"
	case RoleStudent:
		return "Student"
	default:
		return "Unknown Role"
	}
}
