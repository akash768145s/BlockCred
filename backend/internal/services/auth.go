package services

import (
	"errors"
	"fmt"
	"strings"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
)

type AuthService struct {
	store *store.MemoryStore
}

func NewAuthService(s *store.MemoryStore) *AuthService {
	return &AuthService{store: s}
}

func (a *AuthService) Login(username, password string) (models.User, string, error) {
	users := a.store.ListUsers()
	for _, u := range users {
		if (strings.EqualFold(u.Email, username) || strings.EqualFold(u.Name, username)) && password != "" {
			if !u.IsApproved {
				return models.User{}, "", errors.New("account not approved")
			}
			// stub token; replace with real JWT
			token := fmt.Sprintf("token-%d", u.ID)
			return u, token, nil
		}
	}
	return models.User{}, "", errors.New("invalid credentials")
}
