package store

import (
	"context"
	"fmt"
	"time"

	"blockcred-backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDBStore struct {
	client     *mongo.Client
	database   *mongo.Database
	users      *mongo.Collection
	credentials *mongo.Collection
}

func NewMongoDBStore(uri, database string) (*MongoDBStore, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Test the connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	db := client.Database(database)
	store := &MongoDBStore{
		client:      client,
		database:    db,
		users:       db.Collection("users"),
		credentials: db.Collection("credentials"),
	}

	// Create indexes
	if err := store.createIndexes(); err != nil {
		return nil, fmt.Errorf("failed to create indexes: %w", err)
	}

	// Seed demo data
	if err := store.seed(); err != nil {
		return nil, fmt.Errorf("failed to seed data: %w", err)
	}

	return store, nil
}

func (s *MongoDBStore) createIndexes() error {
	ctx := context.Background()

	// Create unique index on email
	_, err := s.users.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	// Create index on student_id for users
	_, err = s.users.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "student_id", Value: 1}},
	})
	if err != nil {
		return err
	}

	// Create index on student_id for credentials
	_, err = s.credentials.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "student_id", Value: 1}},
	})
	if err != nil {
		return err
	}

	return nil
}

func (s *MongoDBStore) seed() error {
	ctx := context.Background()

	// Check if admin user already exists
	count, err := s.users.CountDocuments(ctx, bson.M{"email": "admin@ssn.edu.in"})
	if err != nil {
		return err
	}

	if count == 0 {
		adminUser := models.User{
			Name:        "SSN Main Admin",
			Email:       "admin@ssn.edu.in",
			Phone:       "9876543210",
			Role:        models.RoleSSNMainAdmin,
			IsActive:    true,
			IsApproved:  true,
			CreatedAt:   time.Now(),
			Department:  "Administration",
			Institution: "SSN College of Engineering",
		}
		_, err = s.CreateUser(adminUser)
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *MongoDBStore) CreateUser(u models.User) (models.User, error) {
	ctx := context.Background()
	
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}

	result, err := s.users.InsertOne(ctx, u)
	if err != nil {
		return models.User{}, fmt.Errorf("failed to create user: %w", err)
	}

	// Get the inserted document to return with the generated ID
	var createdUser models.User
	err = s.users.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&createdUser)
	if err != nil {
		return models.User{}, fmt.Errorf("failed to retrieve created user: %w", err)
	}

	return createdUser, nil
}

func (s *MongoDBStore) ListUsers() ([]models.User, error) {
	ctx := context.Background()
	
	cursor, err := s.users.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}

	return users, nil
}

func (s *MongoDBStore) GetUserByEmail(email string) (models.User, error) {
	ctx := context.Background()
	
	var user models.User
	err := s.users.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return models.User{}, fmt.Errorf("user not found")
		}
		return models.User{}, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (s *MongoDBStore) GetUserByID(id string) (models.User, error) {
	ctx := context.Background()
	
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.User{}, fmt.Errorf("invalid user ID: %w", err)
	}

	var user models.User
	err = s.users.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return models.User{}, fmt.Errorf("user not found")
		}
		return models.User{}, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

func (s *MongoDBStore) UpdateUser(userID string, updates models.User) (models.User, error) {
	ctx := context.Background()
	
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return models.User{}, fmt.Errorf("invalid user ID: %w", err)
	}

	// Remove ID and CreatedAt from updates to prevent overwriting
	updates.ID = primitive.NilObjectID // Reset ID to prevent overwriting
	updates.CreatedAt = time.Time{} // Reset CreatedAt to prevent overwriting

	updateDoc := bson.M{"$set": updates}
	result, err := s.users.UpdateOne(ctx, bson.M{"_id": objectID}, updateDoc)
	if err != nil {
		return models.User{}, fmt.Errorf("failed to update user: %w", err)
	}

	if result.MatchedCount == 0 {
		return models.User{}, fmt.Errorf("user not found")
	}

	// Return the updated user
	return s.GetUserByID(userID)
}

func (s *MongoDBStore) CreateCredential(c models.Credential) (models.Credential, error) {
	ctx := context.Background()
	
	result, err := s.credentials.InsertOne(ctx, c)
	if err != nil {
		return models.Credential{}, fmt.Errorf("failed to create credential: %w", err)
	}

	// Get the inserted document to return with the generated ID
	var createdCredential models.Credential
	err = s.credentials.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&createdCredential)
	if err != nil {
		return models.Credential{}, fmt.Errorf("failed to retrieve created credential: %w", err)
	}

	return createdCredential, nil
}

func (s *MongoDBStore) ListCredentials() ([]models.Credential, error) {
	ctx := context.Background()
	
	cursor, err := s.credentials.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list credentials: %w", err)
	}
	defer cursor.Close(ctx)

	var credentials []models.Credential
	if err = cursor.All(ctx, &credentials); err != nil {
		return nil, fmt.Errorf("failed to decode credentials: %w", err)
	}

	return credentials, nil
}

func (s *MongoDBStore) GetCredentialsByStudentID(studentID string) ([]models.Credential, error) {
	ctx := context.Background()
	
	cursor, err := s.credentials.Find(ctx, bson.M{"student_id": studentID})
	if err != nil {
		return nil, fmt.Errorf("failed to get credentials by student ID: %w", err)
	}
	defer cursor.Close(ctx)

	var credentials []models.Credential
	if err = cursor.All(ctx, &credentials); err != nil {
		return nil, fmt.Errorf("failed to decode credentials: %w", err)
	}

	return credentials, nil
}

func (s *MongoDBStore) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.client.Disconnect(ctx)
}
