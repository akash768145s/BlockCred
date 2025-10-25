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
		if (strings.EqualFold(u.Email, username) || strings.EqualFold(u.Name, username)) && password != "" {
			if !u.IsApproved {
				return models.User{}, "", errors.New("account not approved")
			}
			// stub token; replace with real JWT
			token := fmt.Sprintf("token-%s", u.ID.Hex())
			return u, token, nil
		}
	}
	return models.User{}, "", errors.New("invalid credentials")
}
