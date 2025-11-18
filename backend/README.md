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

2. **Set up MongoDB Atlas:**
   - Create a MongoDB Atlas account at https://cloud.mongodb.com
   - Create a new cluster
   - Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Set environment variables:
     ```bash
     export MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/"
     export MONGO_DATABASE="blockcred"
     ```

3. **Run with Air (Hot Reload):**
   ```bash
   air
   ```
   
   Or run directly:
   ```bash
   go run main.go
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

## Blockchain Setup

BlockCred uses a **Proof-of-Authority (PoA)** private blockchain network powered by **Hyperledger Besu**.

### Quick Setup

1. **Install Besu:**
   ```powershell
   cd backend
   .\blockchain\scripts\setup\install-besu.ps1
   ```
   Or manually: Download from [Besu Releases](https://github.com/hyperledger/besu/releases)

2. **Start Blockchain:**
   ```powershell
   cd backend
   .\blockchain\scripts\setup\start-besu.bat
   ```

3. **Verify it's Running:**
   ```powershell
   .\blockchain\scripts\setup\check-status.bat
   ```

For complete blockchain documentation, see [`blockchain/README.md`](blockchain/README.md)

## Configuration

Environment variables:
- `PORT` - Server port (default: 8080)
- `JWT_SECRET` - JWT signing secret
- `ALLOWED_ORIGIN` - CORS allowed origin (default: http://localhost:3000)
- `MONGO_URI` - MongoDB connection string (default: mongodb+srv://username:password@cluster.mongodb.net/)
- `MONGO_DATABASE` - MongoDB database name (default: blockcred)

### MongoDB Atlas Setup
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string from "Connect" → "Connect your application"
6. Set the `MONGO_URI` environment variable

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