package store

import (
	"blockcred-backend/internal/models"
	"fmt"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
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

func (s *MemoryStore) CreateUser(u models.User) (models.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	u.ID = primitive.NewObjectID()
	s.nextUserID++
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	s.users = append(s.users, u)
	return u, nil
}

func (s *MemoryStore) ListUsers() ([]models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.User, len(s.users))
	copy(out, s.users)
	return out, nil
}

func (s *MemoryStore) CreateCredential(c models.Credential) (models.Credential, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c.ID = primitive.NewObjectID()
	s.nextCredID++
	s.credentials = append(s.credentials, c)
	return c, nil
}

func (s *MemoryStore) ListCredentials() ([]models.Credential, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Credential, len(s.credentials))
	copy(out, s.credentials)
	return out, nil
}

func (s *MemoryStore) UpdateUser(userID string, updates models.User) (models.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	// Convert string ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return models.User{}, fmt.Errorf("invalid user ID")
	}
	
	for i, user := range s.users {
		if user.ID == objectID {
			// Update the user with new values
			updates.ID = user.ID
			updates.CreatedAt = user.CreatedAt
			s.users[i] = updates
			return updates, nil
		}
	}
	return models.User{}, fmt.Errorf("user not found")
}

func (s *MemoryStore) GetUserByEmail(email string) (models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	for _, user := range s.users {
		if user.Email == email {
			return user, nil
		}
	}
	return models.User{}, fmt.Errorf("user not found")
}

func (s *MemoryStore) GetUserByID(id string) (models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	// Convert string ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.User{}, fmt.Errorf("invalid user ID")
	}
	
	for _, user := range s.users {
		if user.ID == objectID {
			return user, nil
		}
	}
	return models.User{}, fmt.Errorf("user not found")
}

func (s *MemoryStore) GetCredentialsByStudentID(studentID string) ([]models.Credential, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	var result []models.Credential
	for _, cred := range s.credentials {
		if cred.StudentID == studentID {
			result = append(result, cred)
		}
	}
	return result, nil
}

func (s *MemoryStore) Close() error {
	// Memory store doesn't need cleanup
	return nil
}
