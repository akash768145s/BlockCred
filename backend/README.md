# BlockCred Backend

A production-grade Go backend for blockchain-based credential management system.

## Architecture

```
backend/
├── cmd/
│   └── server/           # Application entrypoint
│       └── main.go
├── internal/             # Private application code
│   ├── config/          # Configuration management
│   ├── models/          # Domain models and types
│   ├── store/           # Data storage layer
│   ├── services/        # Business logic layer
│   ├── http/            # HTTP handlers and middleware
│   └── router/          # HTTP routing
├── contracts/           # Smart contracts
├── blockchain/          # Blockchain integration
└── go.mod
```

## Features

- **Role-Based Access Control (RBAC)**
  - SSN Main Admin: Full system control
  - COE: Issue marksheets and degree certificates
  - Department Faculty: Issue NOC and bonafide certificates
  - Club Coordinators: Issue participation certificates
  - External Verifiers: Read-only credential verification
  - Students: View own credentials

- **Credential Management**
  - Issue various types of credentials
  - Blockchain-based verification
  - QR code generation
  - Shareable student wallet

- **Security**
  - JWT authentication
  - Role-based authorization
  - Activity logging
  - Input validation

## Quick Start

1. **Install dependencies:**
   ```bash
   go mod tidy
   ```

2. **Run the server:**
   ```bash
   go run ./cmd/server
   ```

3. **Test endpoints:**
   ```bash
   # Health check
   curl http://localhost:8080/health
   
   # Login
   curl -X POST http://localhost:8080/api/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin@ssn.edu.in","password":"admin123"}'
   
   # Get users
   curl http://localhost:8080/api/users
   ```

## API Endpoints

### Authentication
- `POST /api/login` - User login

### User Management
- `GET /api/users` - List all users
- `POST /api/admin/onboard` - Create new user (admin only)

### Credentials
- `GET /api/credentials` - List all credentials
- `POST /api/credentials/issue` - Issue new credential

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| SSN Main Admin | admin@ssn.edu.in | admin123 |
| COE | coe@ssn.edu.in | coe123 |
| Faculty | faculty@ssn.edu.in | faculty123 |
| Club Coordinator | club@ssn.edu.in | club123 |
| External Verifier | verifier@external.com | verifier123 |
| Student | john@student.ssn.edu.in | student123 |

## Configuration

Environment variables:
- `PORT` - Server port (default: 8080)
- `JWT_SECRET` - JWT signing secret
- `ALLOWED_ORIGIN` - CORS allowed origin (default: http://localhost:3000)

## Development

The backend follows Go best practices:
- Clean architecture with separated concerns
- Dependency injection
- Comprehensive error handling
- Structured logging
- Unit tests

## Production Deployment

1. Build the binary:
   ```bash
   go build -o blockcred-backend ./cmd/server
   ```

2. Set environment variables
3. Run the binary
4. Configure reverse proxy (nginx)
5. Set up monitoring (Prometheus/Grafana)