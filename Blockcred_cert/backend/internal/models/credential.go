package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// Credential model uses CredentialType from types.go
type Credential struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Type         CredentialType     `bson:"type" json:"type"`
	Title        string             `bson:"title" json:"title"`
	StudentID    string             `bson:"student_id" json:"student_id"`
	StudentName  string             `bson:"student_name" json:"student_name"`
	IssuedBy     string             `bson:"issued_by" json:"issued_by"`
	IssuedDate   string             `bson:"issued_date" json:"issued_date"`
	Status       string             `bson:"status" json:"status"`
	Description  string             `bson:"description" json:"description"`
	Semester     string             `bson:"semester,omitempty" json:"semester,omitempty"`
	Subject      string             `bson:"subject,omitempty" json:"subject,omitempty"`
	Marks        string             `bson:"marks,omitempty" json:"marks,omitempty"`
	Grade        string             `bson:"grade,omitempty" json:"grade,omitempty"`
	Purpose      string             `bson:"purpose,omitempty" json:"purpose,omitempty"`
	EventName    string             `bson:"event_name,omitempty" json:"event_name,omitempty"`
	Position     string             `bson:"position,omitempty" json:"position,omitempty"`
	ValidUntil   string             `bson:"valid_until,omitempty" json:"valid_until,omitempty"`
	EventDate    string             `bson:"event_date,omitempty" json:"event_date,omitempty"`
	BlockchainTx string             `bson:"blockchain_tx,omitempty" json:"blockchain_tx,omitempty"`
}
