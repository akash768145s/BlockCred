package services

import (
	"time"

	"blockcred-backend/internal/models"
	"blockcred-backend/internal/store"
)

type CredentialService struct {
	store store.Store
}

func NewCredentialService(s store.Store) *CredentialService {
	return &CredentialService{store: s}
}

func (c *CredentialService) List() ([]models.Credential, error) {
	return c.store.ListCredentials()
}

type IssueCredentialInput struct {
	StudentID   string                `json:"student_id"`
	Type        models.CredentialType `json:"type"`
	Title       string                `json:"title"`
	Description string                `json:"description"`
	Semester    string                `json:"semester,omitempty"`
	Subject     string                `json:"subject,omitempty"`
	Marks       string                `json:"marks,omitempty"`
	Grade       string                `json:"grade,omitempty"`
	Purpose     string                `json:"purpose,omitempty"`
	EventName   string                `json:"event_name,omitempty"`
	Position    string                `json:"position,omitempty"`
	ValidUntil  string                `json:"valid_until,omitempty"`
	EventDate   string                `json:"event_date,omitempty"`
	IssuedBy    string                `json:"issued_by"`
}

func (c *CredentialService) IssueCredential(in IssueCredentialInput) (models.Credential, error) {
	credential := models.Credential{
		Type:        in.Type,
		Title:       in.Title,
		StudentID:   in.StudentID,
		StudentName: "Student Name", // TODO: Get from user service
		IssuedBy:    in.IssuedBy,
		IssuedDate:  time.Now().Format("2006-01-02"),
		Status:      "issued",
		Description: in.Description,
		Semester:    in.Semester,
		Subject:     in.Subject,
		Marks:       in.Marks,
		Grade:       in.Grade,
		Purpose:     in.Purpose,
		EventName:   in.EventName,
		Position:    in.Position,
		ValidUntil:  in.ValidUntil,
		EventDate:   in.EventDate,
	}
	return c.store.CreateCredential(credential)
}
