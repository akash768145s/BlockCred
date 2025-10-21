package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// Simple test server to verify backend is working
func main() {
	r := mux.NewRouter()

	// Test endpoint
	r.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Backend server is running",
			"timestamp": time.Now().Format("2006-01-02 15:04:05"),
		})
	}).Methods("GET")

	// Users endpoint
	r.HandleFunc("/api/users", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		
		users := []map[string]interface{}{
			{
				"id": 1,
				"name": "SSN Main Admin",
				"email": "admin@ssn.edu.in",
				"role": "ssn_main_admin",
				"department": "Administration",
				"is_approved": true,
				"is_active": true,
				"created_at": time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				"id": 2,
				"name": "COE Controller",
				"email": "coe@ssn.edu.in",
				"role": "coe",
				"department": "Examinations",
				"is_approved": true,
				"is_active": true,
				"created_at": time.Now().Format("2006-01-02 15:04:05"),
			},
			{
				"id": 3,
				"name": "John Doe",
				"email": "john@student.ssn.edu.in",
				"role": "student",
				"student_id": "SSN2024001",
				"department": "Computer Science",
				"is_approved": true,
				"is_active": true,
				"created_at": time.Now().Format("2006-01-02 15:04:05"),
			},
		}
		
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data": users,
		})
	}).Methods("GET")

	// Onboard user endpoint
	r.HandleFunc("/api/admin/onboard", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		
		var userData map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&userData); err != nil {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Invalid request format",
			})
			return
		}
		
		fmt.Printf("Received user data: %+v\n", userData)
		
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "User onboarded successfully",
			"data": map[string]interface{}{
				"user_id": 999,
				"name": userData["name"],
				"email": userData["email"],
				"role": userData["role"],
			},
		})
	}).Methods("POST")

	// Credentials endpoint
	r.HandleFunc("/api/credentials/all", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		
		credentials := []map[string]interface{}{
			{
				"id": 1,
				"type": "marksheet",
				"title": "Semester 1 Marksheet",
				"student_id": "SSN2024001",
				"student_name": "John Doe",
				"issued_by": "COE Controller",
				"issued_date": time.Now().Format("2006-01-02"),
				"status": "issued",
			},
		}
		
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data": credentials,
		})
	}).Methods("GET")

	// CORS middleware
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		r.ServeHTTP(w, r)
	})

	// Add logging
	loggedHandler := handlers.LoggingHandler(os.Stdout, handler)

	fmt.Println("Test server starting on :8080")
	fmt.Println("Test endpoint: http://localhost:8080/api/test")
	fmt.Println("Users endpoint: http://localhost:8080/api/users")
	log.Fatal(http.ListenAndServe(":8080", loggedHandler))
}
