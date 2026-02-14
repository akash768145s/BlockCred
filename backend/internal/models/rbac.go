package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Role represents a dynamic system role stored in MongoDB.
// NOTE: This is the new source of truth for authorization decisions.
// The legacy UserRole enum is kept only for backward compatibility.
type Role struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name               string             `bson:"name" json:"name"`                                   // e.g. "Admin", "COE"
	Description        string             `bson:"description,omitempty" json:"description,omitempty"` // human readable
	DepartmentID       *primitive.ObjectID `bson:"department_id,omitempty" json:"department_id,omitempty"`
	CanIssueCredentials bool              `bson:"can_issue_credentials" json:"can_issue_credentials"`
	Permissions        []string           `bson:"permissions,omitempty" json:"permissions,omitempty"` // e.g. ["manage_roles", "manage_departments"]
	DashboardRoute     string             `bson:"dashboard_route,omitempty" json:"dashboard_route,omitempty"` // e.g. "/admin", "/coe"
	CreatedAt          time.Time          `bson:"created_at" json:"created_at"`
}

// Department represents an academic or organizational department.
type Department struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name               string             `bson:"name" json:"name"`
	Description        string             `bson:"description,omitempty" json:"description,omitempty"`
	AcademicDepartment bool               `bson:"academic_department" json:"academic_department"`
	CreatedAt          time.Time          `bson:"created_at" json:"created_at"`
}

// CredentialFieldType represents the type of a dynamic form field for a credential.
type CredentialFieldType string

const (
	FieldTypeText   CredentialFieldType = "text"
	FieldTypeNumber CredentialFieldType = "number"
	FieldTypeDate   CredentialFieldType = "date"
	FieldTypeSelect CredentialFieldType = "select"
	FieldTypeBool   CredentialFieldType = "bool"
)

// CredentialFieldConfig represents one configurable field in a credential type's form.
type CredentialFieldConfig struct {
	Key        string              `bson:"key" json:"key"`                             // machine key, e.g. "semester"
	Label      string              `bson:"label" json:"label"`                         // UI label, e.g. "Semester"
	Type       CredentialFieldType `bson:"type" json:"type"`                           // text | number | date | select | bool
	Required   bool                `bson:"required" json:"required"`                   // whether field is mandatory
	HelpText   string              `bson:"help_text,omitempty" json:"help_text,omitempty"`
	Options    []string            `bson:"options,omitempty" json:"options,omitempty"` // for select type
	VisibleFor []string            `bson:"visible_for,omitempty" json:"visible_for,omitempty"` // optional: limit to certain role names
}

// CredentialTypeConfig represents a dynamic credential type that can be issued.
// It is intentionally kept separate from the existing CredentialType enum so
// that configuration can evolve without breaking the certificate schema.
type CredentialTypeConfig struct {
	ID            primitive.ObjectID      `bson:"_id,omitempty" json:"id"`
	Name          string                  `bson:"name" json:"name"`                                   // e.g. "marksheet", must match Certificate.CertType string value
	Description   string                  `bson:"description,omitempty" json:"description,omitempty"` // optional human description
	IssuerRoleIDs []primitive.ObjectID    `bson:"issuer_role_ids,omitempty" json:"issuer_role_ids,omitempty"`
	Fields        []CredentialFieldConfig `bson:"fields,omitempty" json:"fields,omitempty"` // dynamic form schema (optional)
	CreatedAt     time.Time               `bson:"created_at" json:"created_at"`
}

