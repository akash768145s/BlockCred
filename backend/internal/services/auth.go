package services

import (
	"errors"
	"fmt"
	"strings"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
)

type AuthService struct {
	store store.Store
}

func NewAuthService(s store.Store) *AuthService {
	return &AuthService{store: s}
}

func (a *AuthService) Login(username, password string) (models.User, string, error) {
	users, err := a.store.ListUsers()
	if err != nil {
		return models.User{}, "", fmt.Errorf("failed to get users: %w", err)
	}
	
	for _, u := range users {
		if !strings.EqualFold(u.Email, username) && !strings.EqualFold(u.Name, username) {
			continue
		}
		// If user has a stored password hash, verify it; otherwise allow any non-empty password (legacy)
		if u.PasswordHash != "" {
			if password != u.PasswordHash {
				continue
			}
		} else if password == "" {
			continue
		}
		if !u.IsApproved {
			return models.User{}, "", errors.New("account not approved")
		}
		token := fmt.Sprintf("token-%s", u.ID.Hex())
		return u, token, nil
	}
	return models.User{}, "", errors.New("invalid credentials")
}
