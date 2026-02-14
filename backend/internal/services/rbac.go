package services

import (
	"fmt"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RBACService centralizes dynamic role / department / credential type logic.
// It is the single source of truth for authorization checks.
type RBACService struct {
	store store.Store
}

func NewRBACService(s store.Store) *RBACService {
	return &RBACService{store: s}
}

// ResolveUserRole loads the dynamic Role document for a given user.
// It supports multiple migration paths:
// 1) user.RoleID (preferred)
// 2) user.RoleName mapped to Role.Name
// 3) legacy user.Role (UserRole enum) mapped to default seeded roles.
func (r *RBACService) ResolveUserRole(user models.User) (*models.Role, error) {
	// 1) RoleID takes precedence
	if user.RoleID != nil {
		role, err := r.store.GetRoleByID(user.RoleID.Hex())
		if err == nil {
			return &role, nil
		}
	}

	// 2) RoleName
	if user.RoleName != "" {
		roles, err := r.store.ListRoles()
		if err != nil {
			return nil, fmt.Errorf("failed to list roles: %w", err)
		}
		for _, role := range roles {
			if role.Name == user.RoleName {
				return &role, nil
			}
		}
	}

	// 3) Legacy enum -> default seeded role names
	var legacyName string
	switch user.Role {
	case models.RoleSSNMainAdmin:
		legacyName = "Admin"
	case models.RoleCOE:
		legacyName = "COE"
	case models.RoleDepartmentFaculty:
		legacyName = "Faculty"
	case models.RoleClubCoordinator:
		legacyName = "ClubCoordinator"
	case models.RoleExternalVerifier, models.RoleStudentVerifier:
		legacyName = "Verifier"
	default:
		legacyName = ""
	}

	if legacyName != "" {
		roles, err := r.store.ListRoles()
		if err != nil {
			return nil, fmt.Errorf("failed to list roles: %w", err)
		}
		for _, role := range roles {
			if role.Name == legacyName {
				// Backfill user with RoleID / RoleName if possible
				user.RoleID = &role.ID
				user.RoleName = role.Name
				// We do not persist here to avoid extra writes during authorization paths.
				return &role, nil
			}
		}
	}

	return nil, fmt.Errorf("no dynamic role found for user %s", user.ID.Hex())
}

// CanIssueCredential checks if a user is allowed to issue a given credential type
// based on dynamic Role and CredentialTypeConfig configuration.
func (r *RBACService) CanIssueCredential(user models.User, certType models.CredentialType) (bool, error) {
	role, err := r.ResolveUserRole(user)
	if err != nil {
		return false, err
	}
	if !role.CanIssueCredentials {
		return false, fmt.Errorf("role %s is not allowed to issue credentials", role.Name)
	}

	// Load credential type configuration by name; this must match the Certificate.CertType string value.
	ct, err := r.store.GetCredentialTypeByName(string(certType))
	if err != nil {
		return false, fmt.Errorf("credential type %s is not configured for issuance", certType)
	}

	// Check if role.ID is in ct.IssuerRoleIDs
	for _, rid := range ct.IssuerRoleIDs {
		if rid == role.ID {
			return true, nil
		}
	}

	return false, fmt.Errorf("role %s is not allowed to issue credential type %s", role.Name, ct.Name)
}

// HasPermission checks if a user has a given permission string in their Role.Permissions.
func (r *RBACService) HasPermission(user models.User, permission string) (bool, error) {
	role, err := r.ResolveUserRole(user)
	if err != nil {
		return false, err
	}
	for _, p := range role.Permissions {
		if p == permission {
			return true, nil
		}
	}
	return false, nil
}

// BuildObjectIDSlice converts a slice of hex IDs to primitive.ObjectID list.
func BuildObjectIDSlice(ids []string) ([]primitive.ObjectID, error) {
	result := make([]primitive.ObjectID, 0, len(ids))
	for _, id := range ids {
		oid, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return nil, fmt.Errorf("invalid id %s: %w", id, err)
		}
		result = append(result, oid)
	}
	return result, nil
}

