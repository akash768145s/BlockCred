package models

// Credential model uses CredentialType from types.go
type Credential struct {
	ID           int            `json:"id"`
	Type         CredentialType `json:"type"`
	Title        string         `json:"title"`
	StudentID    string         `json:"student_id"`
	StudentName  string         `json:"student_name"`
	IssuedBy     string         `json:"issued_by"`
	IssuedDate   string         `json:"issued_date"`
	Status       string         `json:"status"`
	Description  string         `json:"description"`
	Semester     string         `json:"semester,omitempty"`
	Subject      string         `json:"subject,omitempty"`
	Marks        string         `json:"marks,omitempty"`
	Grade        string         `json:"grade,omitempty"`
	Purpose      string         `json:"purpose,omitempty"`
	EventName    string         `json:"event_name,omitempty"`
	Position     string         `json:"position,omitempty"`
	ValidUntil   string         `json:"valid_until,omitempty"`
	EventDate    string         `json:"event_date,omitempty"`
	BlockchainTx string         `json:"blockchain_tx,omitempty"`
}
