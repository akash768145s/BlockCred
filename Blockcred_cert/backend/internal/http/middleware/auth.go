package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
)

type AuthMiddleware struct {
	store store.Store
}

func NewAuthMiddleware(s store.Store) *AuthMiddleware {
	return &AuthMiddleware{store: s}
}

func (m *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
			return
		}

		token := parts[1]
		
		// Simple token validation (in production, use proper JWT validation)
		user, err := m.validateToken(token)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add user to request context
		ctx := r.Context()
		ctx = context.WithValue(ctx, "user", user)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	}
}

func (m *AuthMiddleware) validateToken(token string) (models.User, error) {
	// Simple token validation - in production, use proper JWT validation
	if !strings.HasPrefix(token, "token-") {
		return models.User{}, errors.New("invalid token format")
	}

	// Extract user ID from token (now using ObjectID hex string)
	userIDHex := strings.TrimPrefix(token, "token-")
	if userIDHex == "" {
		return models.User{}, errors.New("invalid token")
	}

	// Find user by ID
	user, err := m.store.GetUserByID(userIDHex)
	if err != nil {
		return models.User{}, errors.New("user not found")
	}

	return user, nil
}

func (m *AuthMiddleware) RequireRole(requiredRole models.UserRole) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			user, ok := r.Context().Value("user").(models.User)
			if !ok {
				http.Error(w, "User not found in context", http.StatusInternalServerError)
				return
			}

			if user.Role != requiredRole {
				http.Error(w, "Insufficient permissions", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		}
	}
}
