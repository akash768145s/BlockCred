package store

import (
	"sync"
	"time"
	"blockcred-backend/internal/models"
)

type MemoryStore struct {
	mu           sync.RWMutex
	users        []models.User
	credentials  []models.Credential
	nextUserID   int
	nextCredID   int
}

func NewMemoryStore() *MemoryStore {
	s := &MemoryStore{
		nextUserID:  1,
		nextCredID:  1,
		users:       make([]models.User, 0, 32),
		credentials: make([]models.Credential, 0, 64),
	}
	// seed demo data
	s.seed()
	return s
}

func (s *MemoryStore) seed() {
	s.CreateUser(models.User{
		Name:        "SSN Main Admin",
		Email:       "admin@ssn.edu.in",
		Phone:       "9876543210",
		Role:        models.RoleSSNMainAdmin,
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   time.Now(),
		Department:  "Administration",
		Institution: "SSN College of Engineering",
	})
}

func (s *MemoryStore) CreateUser(u models.User) models.User {
	s.mu.Lock()
	defer s.mu.Unlock()
	u.ID = s.nextUserID
	s.nextUserID++
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	s.users = append(s.users, u)
	return u
}

func (s *MemoryStore) ListUsers() []models.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.User, len(s.users))
	copy(out, s.users)
	return out
}

func (s *MemoryStore) CreateCredential(c models.Credential) models.Credential {
	s.mu.Lock()
	defer s.mu.Unlock()
	c.ID = s.nextCredID
	s.nextCredID++
	s.credentials = append(s.credentials, c)
	return c
}

func (s *MemoryStore) ListCredentials() []models.Credential {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Credential, len(s.credentials))
	copy(out, s.credentials)
	return out
}
