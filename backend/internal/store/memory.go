package store

import (
	"blockcred-backend/internal/models"
	"fmt"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MemoryStore struct {
	mu            sync.RWMutex
	users         []models.User
	credentials   []models.Credential
	certificates   []models.Certificate
	roles         []models.Role
	departments   []models.Department
	credentialTypes []models.CredentialTypeConfig
	courses       []models.Course
	resultDetails []models.ResultDetail
	nextUserID    int
	nextCredID    int
	nextCertID    int
}

func NewMemoryStore() *MemoryStore {
	s := &MemoryStore{
		nextUserID:     1,
		nextCredID:     1,
		nextCertID:     1,
		users:          make([]models.User, 0, 32),
		credentials:    make([]models.Credential, 0, 64),
		certificates:   make([]models.Certificate, 0, 64),
		roles:          make([]models.Role, 0, 16),
		departments:    make([]models.Department, 0, 16),
		credentialTypes: make([]models.CredentialTypeConfig, 0, 16),
		courses:        make([]models.Course, 0, 128),
		resultDetails:  make([]models.ResultDetail, 0, 512),
	}
	// seed demo data
	s.seed()
	return s
}

func (s *MemoryStore) seed() {
	now := time.Now()

	// Seed default roles (so role-based dashboard routing works in memory mode)
	adminRole, _ := s.CreateRole(models.Role{
		Name:                "Admin",
		Description:         "System administrator",
		CanIssueCredentials: false,
		Permissions:         []string{"manage_roles", "manage_departments", "manage_credential_types", "manage_users", "view_system_data"},
		DashboardRoute:      "/admin",
		CreatedAt:           now,
	})
	_, _ = s.CreateRole(models.Role{
		Name:                "COE",
		Description:         "Controller of Examinations",
		CanIssueCredentials: true,
		Permissions:         []string{"issue_credentials", "view_system_data"},
		DashboardRoute:      "/coe",
		CreatedAt:           now,
	})
	_, _ = s.CreateRole(models.Role{
		Name:                "Faculty",
		Description:         "Department Faculty",
		CanIssueCredentials: true,
		Permissions:         []string{"issue_credentials", "view_system_data"},
		DashboardRoute:      "/faculty",
		CreatedAt:           now,
	})
	_, _ = s.CreateRole(models.Role{
		Name:                "ClubCoordinator",
		Description:         "Club Coordinator",
		CanIssueCredentials: true,
		Permissions:         []string{"issue_credentials", "view_system_data"},
		DashboardRoute:      "/club",
		CreatedAt:           now,
	})
	_, _ = s.CreateRole(models.Role{
		Name:                "Verifier",
		Description:         "External Verifier / Data Entry",
		CanIssueCredentials: false,
		Permissions:         []string{"manage_students", "view_system_data"},
		DashboardRoute:      "/verifier",
		CreatedAt:           now,
	})
	_, _ = s.CreateRole(models.Role{
		Name:                "Student Verifier",
		Description:         "Review and approve new student registrations",
		CanIssueCredentials: false,
		Permissions:         []string{"can_approve_students", "manage_students", "view_system_data"},
		DashboardRoute:      "/student-verifier",
		CreatedAt:           now,
	})
	_, _ = s.CreateRole(models.Role{
		Name:                "Student",
		Description:         "Student self-service portal",
		CanIssueCredentials: false,
		Permissions:         []string{"view_own_credentials"},
		DashboardRoute:      "/student",
		CreatedAt:           now,
	})

	// Seed admin user for memory store (link dynamic role too)
	_, _ = s.CreateUser(models.User{
		Name:        "SSN Main Admin",
		Email:       "admin@ssn.edu.in",
		Phone:       "9876543210",
		Role:        models.RoleSSNMainAdmin,
		RoleID:      &adminRole.ID,
		RoleName:    adminRole.Name,
		IsActive:    true,
		IsApproved:  true,
		CreatedAt:   now,
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

func (s *MemoryStore) GetUserByStudentID(studentID string) (models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	for _, user := range s.users {
		if user.StudentID == studentID {
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

func (s *MemoryStore) DeleteUser(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	for i, user := range s.users {
		if user.ID == objectID {
			s.users = append(s.users[:i], s.users[i+1:]...)
			return nil
		}
	}

	return fmt.Errorf("user not found")
}

// Certificate operations

func (s *MemoryStore) CreateCertificate(cert models.Certificate) (models.Certificate, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	cert.ID = primitive.NewObjectID()
	s.certificates = append(s.certificates, cert)
	s.nextCertID++
	
	return cert, nil
}

func (s *MemoryStore) GetCertificateByID(id string) (models.Certificate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.Certificate{}, fmt.Errorf("invalid certificate ID")
	}
	
	for _, cert := range s.certificates {
		if cert.ID == objectID {
			return cert, nil
		}
	}
	return models.Certificate{}, fmt.Errorf("certificate not found")
}

func (s *MemoryStore) GetCertificateByCertID(certID string) (models.Certificate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	for _, cert := range s.certificates {
		if cert.CertID == certID {
			return cert, nil
		}
	}
	return models.Certificate{}, fmt.Errorf("certificate not found")
}

func (s *MemoryStore) ListCertificates() ([]models.Certificate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	out := make([]models.Certificate, len(s.certificates))
	copy(out, s.certificates)
	return out, nil
}

func (s *MemoryStore) ListCertificatesByStudent(studentID string) ([]models.Certificate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []models.Certificate
	for _, cert := range s.certificates {
		if cert.StudentID == studentID {
			result = append(result, cert)
		}
	}
	return result, nil
}

func (s *MemoryStore) ListCertificatesByStudentUserID(studentUserIDHex string, fallbackStudentID string) ([]models.Certificate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	userOID, err := primitive.ObjectIDFromHex(studentUserIDHex)
	if err != nil {
		return nil, err
	}
	var result []models.Certificate
	for _, cert := range s.certificates {
		if cert.StudentUserID != nil && *cert.StudentUserID == userOID {
			result = append(result, cert)
		} else if cert.StudentUserID == nil && cert.StudentID == fallbackStudentID {
			result = append(result, cert)
		}
	}
	return result, nil
}

func (s *MemoryStore) ListCertificatesByIssuer(issuerID string) ([]models.Certificate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	var result []models.Certificate
	for _, cert := range s.certificates {
		if cert.IssuerID == issuerID {
			result = append(result, cert)
		}
	}
	return result, nil
}

func (s *MemoryStore) UpdateCertificate(certID string, updates models.Certificate) (models.Certificate, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	for i, cert := range s.certificates {
		if cert.CertID == certID {
			updates.ID = cert.ID
			updates.CreatedAt = cert.CreatedAt
			s.certificates[i] = updates
			return updates, nil
		}
	}
	return models.Certificate{}, fmt.Errorf("certificate not found")
}

func (s *MemoryStore) DeleteCertificate(certID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	for i, cert := range s.certificates {
		if cert.CertID == certID || cert.ID.Hex() == certID {
			// Remove certificate from slice
			s.certificates = append(s.certificates[:i], s.certificates[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("certificate not found")
}

// === Dynamic RBAC: roles / departments / credential types ===

func (s *MemoryStore) CreateRole(role models.Role) (models.Role, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	role.ID = primitive.NewObjectID()
	if role.CreatedAt.IsZero() {
		role.CreatedAt = time.Now()
	}
	s.roles = append(s.roles, role)
	return role, nil
}

func (s *MemoryStore) ListRoles() ([]models.Role, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Role, len(s.roles))
	copy(out, s.roles)
	return out, nil
}

func (s *MemoryStore) GetRoleByID(id string) (models.Role, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.Role{}, fmt.Errorf("invalid role ID")
	}
	for _, r := range s.roles {
		if r.ID == oid {
			return r, nil
		}
	}
	return models.Role{}, fmt.Errorf("role not found")
}

func (s *MemoryStore) UpdateRole(id string, updates models.Role) (models.Role, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.Role{}, fmt.Errorf("invalid role ID")
	}
	for i := range s.roles {
		if s.roles[i].ID == oid {
			s.roles[i].Name = updates.Name
			s.roles[i].Description = updates.Description
			s.roles[i].DepartmentID = updates.DepartmentID
			s.roles[i].CanIssueCredentials = updates.CanIssueCredentials
			s.roles[i].Permissions = updates.Permissions
			s.roles[i].DashboardRoute = updates.DashboardRoute
			return s.roles[i], nil
		}
	}
	return models.Role{}, fmt.Errorf("role not found")
}

func (s *MemoryStore) DeleteRole(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid role ID")
	}
	for i, r := range s.roles {
		if r.ID == oid {
			s.roles = append(s.roles[:i], s.roles[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("role not found")
}

func (s *MemoryStore) CreateDepartment(dept models.Department) (models.Department, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	dept.ID = primitive.NewObjectID()
	if dept.CreatedAt.IsZero() {
		dept.CreatedAt = time.Now()
	}
	s.departments = append(s.departments, dept)
	return dept, nil
}

func (s *MemoryStore) ListDepartments() ([]models.Department, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.Department, len(s.departments))
	copy(out, s.departments)
	return out, nil
}

func (s *MemoryStore) UpdateDepartment(id string, updates models.Department) (models.Department, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.Department{}, fmt.Errorf("invalid department ID")
	}
	for i := range s.departments {
		if s.departments[i].ID == oid {
			s.departments[i].Name = updates.Name
			s.departments[i].Description = updates.Description
			s.departments[i].AcademicDepartment = updates.AcademicDepartment
			return s.departments[i], nil
		}
	}
	return models.Department{}, fmt.Errorf("department not found")
}

func (s *MemoryStore) DeleteDepartment(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid department ID")
	}
	for i, d := range s.departments {
		if d.ID == oid {
			s.departments = append(s.departments[:i], s.departments[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("department not found")
}

func (s *MemoryStore) CreateCredentialType(ct models.CredentialTypeConfig) (models.CredentialTypeConfig, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	ct.ID = primitive.NewObjectID()
	if ct.CreatedAt.IsZero() {
		ct.CreatedAt = time.Now()
	}
	s.credentialTypes = append(s.credentialTypes, ct)
	return ct, nil
}

func (s *MemoryStore) ListCredentialTypes() ([]models.CredentialTypeConfig, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.CredentialTypeConfig, len(s.credentialTypes))
	copy(out, s.credentialTypes)
	return out, nil
}

func (s *MemoryStore) GetCredentialTypeByName(name string) (models.CredentialTypeConfig, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, ct := range s.credentialTypes {
		if ct.Name == name {
			return ct, nil
		}
	}
	return models.CredentialTypeConfig{}, fmt.Errorf("credential type not found")
}

func (s *MemoryStore) UpdateCredentialType(id string, updates models.CredentialTypeConfig) (models.CredentialTypeConfig, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.CredentialTypeConfig{}, fmt.Errorf("invalid credential type ID")
	}
	for i := range s.credentialTypes {
		if s.credentialTypes[i].ID == oid {
			s.credentialTypes[i].Name = updates.Name
			s.credentialTypes[i].Description = updates.Description
			s.credentialTypes[i].IssuerRoleIDs = updates.IssuerRoleIDs
			s.credentialTypes[i].Fields = updates.Fields
			return s.credentialTypes[i], nil
		}
	}
	return models.CredentialTypeConfig{}, fmt.Errorf("credential type not found")
}

func (s *MemoryStore) DeleteCredentialType(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid credential type ID")
	}
	for i, ct := range s.credentialTypes {
		if ct.ID == oid {
			s.credentialTypes = append(s.credentialTypes[:i], s.credentialTypes[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("credential type not found")
}

func (s *MemoryStore) UpsertCourses(courses []models.Course) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, c := range courses {
		if c.CourseCode == "" {
			continue
		}
		found := false
		for i, existing := range s.courses {
			if existing.CourseCode == c.CourseCode {
				s.courses[i] = c
				found = true
				break
			}
		}
		if !found {
			s.courses = append(s.courses, c)
		}
	}
	return nil
}

func (s *MemoryStore) UpsertResultDetails(rows []models.ResultDetail) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, r := range rows {
		if r.RegisterNo == "" || r.CourseCode == "" {
			continue
		}
		found := false
		for i, existing := range s.resultDetails {
			if existing.RegisterNo == r.RegisterNo && existing.CourseCode == r.CourseCode {
				s.resultDetails[i] = r
				found = true
				break
			}
		}
		if !found {
			s.resultDetails = append(s.resultDetails, r)
		}
	}
	return nil
}

func (s *MemoryStore) Close() error {
	// Memory store doesn't need cleanup
	return nil
}
