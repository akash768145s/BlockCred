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
	client         *mongo.Client
	database       *mongo.Database
	users          *mongo.Collection
	credentials    *mongo.Collection
	certificates   *mongo.Collection
	roles          *mongo.Collection
	departments    *mongo.Collection
	credentialTypes *mongo.Collection
	courses        *mongo.Collection
	resultDetails  *mongo.Collection
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
		client:        client,
		database:      db,
		users:         db.Collection("users"),
		roles:         db.Collection("roles"),
		departments:   db.Collection("departments"),
		credentialTypes: db.Collection("credential_types"),
		credentials:   db.Collection("credentials"),
		certificates:  db.Collection("certificates"),
		courses:       db.Collection("courses"),
		resultDetails: db.Collection("result_details"),
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

	// Create unique index on role name
	_, err = s.roles.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "name", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	// Create unique index on department name
	_, err = s.departments.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "name", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	// Create unique index on credential type name
	_, err = s.credentialTypes.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "name", Value: 1}},
		Options: options.Index().SetUnique(true),
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

	// Seed roles if empty
	roleCount, err := s.roles.CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}

	if roleCount == 0 {
		now := time.Now()
		// Default departments (used below for some roles)
		deptAdmin := models.Department{Name: "Administration", CreatedAt: now}
		deptAcad := models.Department{Name: "Academics", CreatedAt: now}

		deptAdmin, err = s.CreateDepartment(deptAdmin)
		if err != nil {
			return err
		}
		deptAcad, err = s.CreateDepartment(deptAcad)
		if err != nil {
			return err
		}

		// Default roles
		adminRole := models.Role{
			Name:                "Admin",
			Description:         "System administrator",
			DepartmentID:        &deptAdmin.ID,
			CanIssueCredentials: false,
			Permissions: []string{
				"manage_roles",
				"manage_departments",
				"manage_credential_types",
				"manage_users",
				"view_system_data",
			},
			DashboardRoute: "/admin",
			CreatedAt:      now,
		}
		coeRole := models.Role{
			Name:                "COE",
			Description:         "Controller of Examinations",
			DepartmentID:        &deptAcad.ID,
			CanIssueCredentials: true,
			Permissions: []string{
				"issue_credentials",
				"view_system_data",
			},
			DashboardRoute: "/coe",
			CreatedAt:      now,
		}
		facultyRole := models.Role{
			Name:                "Faculty",
			Description:         "Department Faculty",
			DepartmentID:        &deptAcad.ID,
			CanIssueCredentials: true,
			Permissions: []string{
				"issue_credentials",
				"view_system_data",
			},
			DashboardRoute: "/faculty",
			CreatedAt:      now,
		}
		clubRole := models.Role{
			Name:                "ClubCoordinator",
			Description:         "Club Coordinator",
			CanIssueCredentials: true,
			Permissions: []string{
				"issue_credentials",
				"view_system_data",
			},
			DashboardRoute: "/club",
			CreatedAt:      now,
		}
		verifierRole := models.Role{
			Name:                "Verifier",
			Description:         "External Verifier / Data Entry",
			CanIssueCredentials: false,
			Permissions: []string{
				"manage_students",
				"view_system_data",
			},
			DashboardRoute: "/verifier",
			CreatedAt:      now,
		}
		studentVerifierRole := models.Role{
			Name:                "Student Verifier",
			Description:         "Review and approve new student registrations",
			CanIssueCredentials: false,
			Permissions: []string{
				"can_approve_students",
				"manage_students",
				"view_system_data",
			},
			DashboardRoute: "/student-verifier",
			CreatedAt:      now,
		}
		studentRole := models.Role{
			Name:                "Student",
			Description:         "Student self-service portal",
			DepartmentID:        &deptAcad.ID,
			CanIssueCredentials: false,
			Permissions: []string{
				"view_own_credentials",
			},
			DashboardRoute: "/student",
			CreatedAt:      now,
		}

		adminRole, err = s.CreateRole(adminRole)
		if err != nil {
			return err
		}
		coeRole, err = s.CreateRole(coeRole)
		if err != nil {
			return err
		}
		facultyRole, err = s.CreateRole(facultyRole)
		if err != nil {
			return err
		}
		clubRole, err = s.CreateRole(clubRole)
		if err != nil {
			return err
		}
		verifierRole, err = s.CreateRole(verifierRole)
		if err != nil {
			return err
		}
		_, err = s.CreateRole(studentVerifierRole)
		if err != nil {
			return err
		}
		_, err = s.CreateRole(studentRole)
		if err != nil {
			return err
		}

		// Seed some default credential types if none exist
		ctCount, err := s.credentialTypes.CountDocuments(ctx, bson.M{})
		if err != nil {
			return err
		}
		if ctCount == 0 {
			defaultTypes := []models.CredentialTypeConfig{
				{
					Name:        string(models.CredentialTypeMarksheet),
					Description: "Semester marksheet",
					IssuerRoleIDs: []primitive.ObjectID{
						coeRole.ID,
					},
					CreatedAt: now,
				},
				{
					Name:        string(models.CredentialTypeDegree),
					Description: "Degree certificate",
					IssuerRoleIDs: []primitive.ObjectID{
						coeRole.ID,
					},
					CreatedAt: now,
				},
				{
					Name:        string(models.CredentialTypeBonafide),
					Description: "Bonafide certificate",
					IssuerRoleIDs: []primitive.ObjectID{
						facultyRole.ID,
					},
					CreatedAt: now,
				},
				{
					Name:        string(models.CredentialTypeNOC),
					Description: "No Objection Certificate",
					IssuerRoleIDs: []primitive.ObjectID{
						facultyRole.ID,
					},
					CreatedAt: now,
				},
				{
					Name:        string(models.CredentialTypeParticipation),
					Description: "Participation certificate",
					IssuerRoleIDs: []primitive.ObjectID{
						clubRole.ID,
					},
					CreatedAt: now,
				},
			}
			for _, ct := range defaultTypes {
				if _, err := s.CreateCredentialType(ct); err != nil {
					return err
				}
			}
		}

		// Seed main admin user if not present
		count, err := s.users.CountDocuments(ctx, bson.M{"email": "admin@ssn.edu.in"})
		if err != nil {
			return err
		}
		if count == 0 {
			adminUser := models.User{
				Name:        "SSN Main Admin",
				Email:       "admin@ssn.edu.in",
				Phone:       "9876543210",
				Role:        models.RoleSSNMainAdmin, // legacy field, kept for compatibility
				RoleID:      &adminRole.ID,
				RoleName:    adminRole.Name,
				IsActive:    true,
				IsApproved:  true,
				CreatedAt:   now,
				Department:  "Administration",
				Institution: "SSN College of Engineering",
			}
			if _, err := s.CreateUser(adminUser); err != nil {
				return err
			}
		}
	}

	// Ensure "Student Verifier" role exists (e.g. DB had roles from before we added it to seed)
	studentVerifierCur, errSv := s.roles.Find(ctx, bson.M{"dashboard_route": "/student-verifier"})
	hasStudentVerifier := false
	if errSv == nil && studentVerifierCur != nil {
		hasStudentVerifier = studentVerifierCur.Next(ctx)
		studentVerifierCur.Close(ctx)
	}
	if !hasStudentVerifier {
		_, _ = s.CreateRole(models.Role{
			Name:                "Student Verifier",
			Description:         "Review and approve new student registrations",
			CanIssueCredentials: false,
			Permissions:         []string{"can_approve_students", "manage_students", "view_system_data"},
			DashboardRoute:      "/student-verifier",
			CreatedAt:           time.Now(),
		})
	}

	// Ensure "Student" role exists so student registrations can attach RoleID/RoleName
	studentCur, errStudent := s.roles.Find(ctx, bson.M{"dashboard_route": "/student"})
	hasStudentRole := false
	if errStudent == nil && studentCur != nil {
		hasStudentRole = studentCur.Next(ctx)
		studentCur.Close(ctx)
	}
	if !hasStudentRole {
		_, _ = s.CreateRole(models.Role{
			Name:                "Student",
			Description:         "Student self-service portal",
			CanIssueCredentials: false,
			Permissions:         []string{"view_own_credentials"},
			DashboardRoute:      "/student",
			CreatedAt:           time.Now(),
		})
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

// === Role operations ===

func (s *MongoDBStore) CreateRole(role models.Role) (models.Role, error) {
	ctx := context.Background()
	if role.CreatedAt.IsZero() {
		role.CreatedAt = time.Now()
	}
	result, err := s.roles.InsertOne(ctx, role)
	if err != nil {
		return models.Role{}, fmt.Errorf("failed to create role: %w", err)
	}
	var created models.Role
	if err := s.roles.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&created); err != nil {
		return models.Role{}, fmt.Errorf("failed to retrieve created role: %w", err)
	}
	return created, nil
}

func (s *MongoDBStore) ListRoles() ([]models.Role, error) {
	ctx := context.Background()
	cursor, err := s.roles.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list roles: %w", err)
	}
	defer cursor.Close(ctx)
	var roles []models.Role
	if err := cursor.All(ctx, &roles); err != nil {
		return nil, fmt.Errorf("failed to decode roles: %w", err)
	}
	return roles, nil
}

func (s *MongoDBStore) GetRoleByID(id string) (models.Role, error) {
	ctx := context.Background()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.Role{}, fmt.Errorf("invalid role ID: %w", err)
	}
	var role models.Role
	if err := s.roles.FindOne(ctx, bson.M{"_id": oid}).Decode(&role); err != nil {
		if err == mongo.ErrNoDocuments {
			return models.Role{}, fmt.Errorf("role not found")
		}
		return models.Role{}, fmt.Errorf("failed to get role: %w", err)
	}
	return role, nil
}

func (s *MongoDBStore) UpdateRole(id string, updates models.Role) (models.Role, error) {
	ctx := context.Background()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.Role{}, fmt.Errorf("invalid role ID: %w", err)
	}
	set := bson.M{
		"name":                  updates.Name,
		"description":           updates.Description,
		"can_issue_credentials": updates.CanIssueCredentials,
		"permissions":           updates.Permissions,
		"dashboard_route":       updates.DashboardRoute,
	}
	if updates.DepartmentID != nil {
		set["department_id"] = *updates.DepartmentID
	} else {
		set["department_id"] = nil
	}
	if _, err := s.roles.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{"$set": set}); err != nil {
		return models.Role{}, fmt.Errorf("failed to update role: %w", err)
	}
	var updated models.Role
	if err := s.roles.FindOne(ctx, bson.M{"_id": oid}).Decode(&updated); err != nil {
		return models.Role{}, fmt.Errorf("failed to retrieve updated role: %w", err)
	}
	return updated, nil
}

func (s *MongoDBStore) DeleteRole(id string) error {
	ctx := context.Background()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid role ID: %w", err)
	}
	if _, err := s.roles.DeleteOne(ctx, bson.M{"_id": oid}); err != nil {
		return fmt.Errorf("failed to delete role: %w", err)
	}
	return nil
}

// === Department operations ===

func (s *MongoDBStore) CreateDepartment(dept models.Department) (models.Department, error) {
	ctx := context.Background()
	if dept.CreatedAt.IsZero() {
		dept.CreatedAt = time.Now()
	}
	result, err := s.departments.InsertOne(ctx, dept)
	if err != nil {
		return models.Department{}, fmt.Errorf("failed to create department: %w", err)
	}
	var created models.Department
	if err := s.departments.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&created); err != nil {
		return models.Department{}, fmt.Errorf("failed to retrieve created department: %w", err)
	}
	return created, nil
}

func (s *MongoDBStore) ListDepartments() ([]models.Department, error) {
	ctx := context.Background()
	cursor, err := s.departments.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list departments: %w", err)
	}
	defer cursor.Close(ctx)
	var depts []models.Department
	if err := cursor.All(ctx, &depts); err != nil {
		return nil, fmt.Errorf("failed to decode departments: %w", err)
	}
	return depts, nil
}

func (s *MongoDBStore) UpdateDepartment(id string, updates models.Department) (models.Department, error) {
	ctx := context.Background()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.Department{}, fmt.Errorf("invalid department ID: %w", err)
	}
	set := bson.M{
		"name":                 updates.Name,
		"description":          updates.Description,
		"academic_department":  updates.AcademicDepartment,
	}
	if _, err := s.departments.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{"$set": set}); err != nil {
		return models.Department{}, fmt.Errorf("failed to update department: %w", err)
	}
	var updated models.Department
	if err := s.departments.FindOne(ctx, bson.M{"_id": oid}).Decode(&updated); err != nil {
		return models.Department{}, fmt.Errorf("failed to retrieve updated department: %w", err)
	}
	return updated, nil
}

func (s *MongoDBStore) DeleteDepartment(id string) error {
	ctx := context.Background()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid department ID: %w", err)
	}
	if _, err := s.departments.DeleteOne(ctx, bson.M{"_id": oid}); err != nil {
		return fmt.Errorf("failed to delete department: %w", err)
	}
	return nil
}

// === Credential type configuration operations ===

func (s *MongoDBStore) CreateCredentialType(ct models.CredentialTypeConfig) (models.CredentialTypeConfig, error) {
	ctx := context.Background()
	if ct.CreatedAt.IsZero() {
		ct.CreatedAt = time.Now()
	}
	result, err := s.credentialTypes.InsertOne(ctx, ct)
	if err != nil {
		return models.CredentialTypeConfig{}, fmt.Errorf("failed to create credential type: %w", err)
	}
	var created models.CredentialTypeConfig
	if err := s.credentialTypes.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&created); err != nil {
		return models.CredentialTypeConfig{}, fmt.Errorf("failed to retrieve created credential type: %w", err)
	}
	return created, nil
}

func (s *MongoDBStore) ListCredentialTypes() ([]models.CredentialTypeConfig, error) {
	ctx := context.Background()
	cursor, err := s.credentialTypes.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list credential types: %w", err)
	}
	defer cursor.Close(ctx)
	var cts []models.CredentialTypeConfig
	if err := cursor.All(ctx, &cts); err != nil {
		return nil, fmt.Errorf("failed to decode credential types: %w", err)
	}
	return cts, nil
}

func (s *MongoDBStore) GetCredentialTypeByName(name string) (models.CredentialTypeConfig, error) {
	ctx := context.Background()
	var ct models.CredentialTypeConfig
	if err := s.credentialTypes.FindOne(ctx, bson.M{"name": name}).Decode(&ct); err != nil {
		if err == mongo.ErrNoDocuments {
			return models.CredentialTypeConfig{}, fmt.Errorf("credential type not found")
		}
		return models.CredentialTypeConfig{}, fmt.Errorf("failed to get credential type: %w", err)
	}
	return ct, nil
}

func (s *MongoDBStore) UpdateCredentialType(id string, updates models.CredentialTypeConfig) (models.CredentialTypeConfig, error) {
	ctx := context.Background()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.CredentialTypeConfig{}, fmt.Errorf("invalid credential type ID: %w", err)
	}
	set := bson.M{
		"name":            updates.Name,
		"description":     updates.Description,
		"issuer_role_ids": updates.IssuerRoleIDs,
		"fields":          updates.Fields,
	}
	if _, err := s.credentialTypes.UpdateOne(ctx, bson.M{"_id": oid}, bson.M{"$set": set}); err != nil {
		return models.CredentialTypeConfig{}, fmt.Errorf("failed to update credential type: %w", err)
	}
	var updated models.CredentialTypeConfig
	if err := s.credentialTypes.FindOne(ctx, bson.M{"_id": oid}).Decode(&updated); err != nil {
		return models.CredentialTypeConfig{}, fmt.Errorf("failed to retrieve updated credential type: %w", err)
	}
	return updated, nil
}

func (s *MongoDBStore) DeleteCredentialType(id string) error {
	ctx := context.Background()
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return fmt.Errorf("invalid credential type ID: %w", err)
	}
	if _, err := s.credentialTypes.DeleteOne(ctx, bson.M{"_id": oid}); err != nil {
		return fmt.Errorf("failed to delete credential type: %w", err)
	}
	return nil
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

func (s *MongoDBStore) GetUserByStudentID(studentID string) (models.User, error) {
	ctx := context.Background()
	
	var user models.User
	err := s.users.FindOne(ctx, bson.M{"student_id": studentID}).Decode(&user)
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

func (s *MongoDBStore) DeleteUser(userID string) error {
	ctx := context.Background()
	
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	result, err := s.users.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// Certificate operations

func (s *MongoDBStore) CreateCertificate(cert models.Certificate) (models.Certificate, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := s.certificates.InsertOne(ctx, cert)
	if err != nil {
		return models.Certificate{}, fmt.Errorf("failed to create certificate: %w", err)
	}

	var createdCert models.Certificate
	err = s.certificates.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&createdCert)
	if err != nil {
		return models.Certificate{}, fmt.Errorf("failed to retrieve created certificate: %w", err)
	}

	return createdCert, nil
}

func (s *MongoDBStore) GetCertificateByID(id string) (models.Certificate, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return models.Certificate{}, fmt.Errorf("invalid certificate ID: %w", err)
	}

	var cert models.Certificate
	err = s.certificates.FindOne(ctx, bson.M{"_id": objectID}).Decode(&cert)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return models.Certificate{}, fmt.Errorf("certificate not found")
		}
		return models.Certificate{}, fmt.Errorf("failed to get certificate: %w", err)
	}

	return cert, nil
}

func (s *MongoDBStore) GetCertificateByCertID(certID string) (models.Certificate, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var cert models.Certificate
	err := s.certificates.FindOne(ctx, bson.M{"cert_id": certID}).Decode(&cert)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return models.Certificate{}, fmt.Errorf("certificate not found")
		}
		return models.Certificate{}, fmt.Errorf("failed to get certificate: %w", err)
	}

	return cert, nil
}

func (s *MongoDBStore) ListCertificates() ([]models.Certificate, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := s.certificates.Find(ctx, bson.M{})
	if err != nil {
		return nil, fmt.Errorf("failed to list certificates: %w", err)
	}
	defer cursor.Close(ctx)

	var certificates []models.Certificate
	if err = cursor.All(ctx, &certificates); err != nil {
		return nil, fmt.Errorf("failed to decode certificates: %w", err)
	}

	return certificates, nil
}

func (s *MongoDBStore) ListCertificatesByStudent(studentID string) ([]models.Certificate, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := s.certificates.Find(ctx, bson.M{"student_id": studentID})
	if err != nil {
		return nil, fmt.Errorf("failed to list certificates: %w", err)
	}
	defer cursor.Close(ctx)
	var certificates []models.Certificate
	if err = cursor.All(ctx, &certificates); err != nil {
		return nil, fmt.Errorf("failed to decode certificates: %w", err)
	}
	return certificates, nil
}

func (s *MongoDBStore) ListCertificatesByStudentUserID(studentUserIDHex string, fallbackStudentID string) ([]models.Certificate, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	userOID, err := primitive.ObjectIDFromHex(studentUserIDHex)
	if err != nil {
		return nil, fmt.Errorf("invalid student user id: %w", err)
	}
	filter := bson.M{
		"$or": []bson.M{
			{"student_user_id": userOID},
			{"student_user_id": bson.M{"$exists": false}, "student_id": fallbackStudentID},
			{"student_user_id": nil, "student_id": fallbackStudentID},
		},
	}
	cursor, err := s.certificates.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to list certificates: %w", err)
	}
	defer cursor.Close(ctx)
	var certificates []models.Certificate
	if err = cursor.All(ctx, &certificates); err != nil {
		return nil, fmt.Errorf("failed to decode certificates: %w", err)
	}
	return certificates, nil
}

func (s *MongoDBStore) ListCertificatesByIssuer(issuerID string) ([]models.Certificate, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := s.certificates.Find(ctx, bson.M{"issuer_id": issuerID})
	if err != nil {
		return nil, fmt.Errorf("failed to list certificates: %w", err)
	}
	defer cursor.Close(ctx)

	var certificates []models.Certificate
	if err = cursor.All(ctx, &certificates); err != nil {
		return nil, fmt.Errorf("failed to decode certificates: %w", err)
	}

	return certificates, nil
}

func (s *MongoDBStore) UpdateCertificate(certID string, updates models.Certificate) (models.Certificate, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updates.UpdatedAt = time.Now()
	
	result, err := s.certificates.ReplaceOne(ctx, bson.M{"cert_id": certID}, updates)
	if err != nil {
		return models.Certificate{}, fmt.Errorf("failed to update certificate: %w", err)
	}

	if result.MatchedCount == 0 {
		return models.Certificate{}, fmt.Errorf("certificate not found")
	}

	return s.GetCertificateByCertID(certID)
}

func (s *MongoDBStore) DeleteCertificate(certID string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Try to delete by cert_id first
	result, err := s.certificates.DeleteOne(ctx, bson.M{"cert_id": certID})
	if err != nil {
		return fmt.Errorf("failed to delete certificate: %w", err)
	}

	if result.DeletedCount == 0 {
		// Try to delete by MongoDB _id if cert_id didn't work
		objectID, err := primitive.ObjectIDFromHex(certID)
		if err == nil {
			result, err := s.certificates.DeleteOne(ctx, bson.M{"_id": objectID})
			if err != nil {
				return fmt.Errorf("failed to delete certificate: %w", err)
			}
			if result.DeletedCount == 0 {
				return fmt.Errorf("certificate not found")
			}
			return nil
		}
		return fmt.Errorf("certificate not found")
	}

	return nil
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

func (s *MongoDBStore) UpsertCourses(courses []models.Course) error {
	ctx := context.Background()
	for _, c := range courses {
		if c.CourseCode == "" {
			continue
		}
		filter := bson.M{"course_code": c.CourseCode}
		update := bson.M{"$set": bson.M{
			"course_code":  c.CourseCode,
			"course_title": c.CourseTitle,
			"semester":     c.Semester,
			"credit":       c.Credit,
		}}
		opts := options.Update().SetUpsert(true)
		if _, err := s.courses.UpdateOne(ctx, filter, update, opts); err != nil {
			return fmt.Errorf("upsert course %s: %w", c.CourseCode, err)
		}
	}
	return nil
}

func (s *MongoDBStore) UpsertResultDetails(rows []models.ResultDetail) error {
	ctx := context.Background()
	for _, r := range rows {
		if r.RegisterNo == "" || r.CourseCode == "" {
			continue
		}
		filter := bson.M{"register_no": r.RegisterNo, "course_code": r.CourseCode}
		update := bson.M{"$set": bson.M{
			"register_no": r.RegisterNo,
			"name":        r.Name,
			"course_code": r.CourseCode,
			"grade":       r.Grade,
			"cleared_by":  r.ClearedBy,
		}}
		opts := options.Update().SetUpsert(true)
		if _, err := s.resultDetails.UpdateOne(ctx, filter, update, opts); err != nil {
			return fmt.Errorf("upsert result detail: %w", err)
		}
	}
	return nil
}

func (s *MongoDBStore) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.client.Disconnect(ctx)
}
