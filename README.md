# BlockCred

A blockchain-based credential management system for educational institutions with comprehensive Role-Based Access Control (RBAC). BlockCred ensures tamper-proof credential storage using Hyperledger Besu (Proof of Authority) blockchain and IPFS for decentralized file storage.

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Application Flow](#application-flow)
- [Quick Start](#quick-start)
- [Complete File Structure](#complete-file-structure)
- [API Endpoints](#api-endpoints)
- [Frontend Routes](#frontend-routes)
- [Blockchain Integration](#blockchain-integration)
- [System Roles](#system-roles)

## Technology Stack

### Backend
- **Language**: Go 1.21+
- **Framework**: Gorilla Mux (HTTP router)
- **Database**: MongoDB (with in-memory fallback)
- **Blockchain**: Hyperledger Besu (PoA)
- **Storage**: IPFS (InterPlanetary File System)
- **Authentication**: JWT (JSON Web Tokens)
- **Hot Reload**: Air

### Frontend
- **Framework**: Next.js 15+ (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Linting**: Biome

### Blockchain
- **Network**: Hyperledger Besu (Proof of Authority)
- **Consensus**: Clique PoA
- **Network ID**: 1337
- **RPC**: JSON-RPC over HTTP/WebSocket

## Project Structure

```
BlockCred/
├── backend/                          # Go backend application
│   ├── main.go                       # Application entry point (loads config, starts server)
│   ├── go.mod                        # Go module dependencies
│   ├── go.sum                        # Dependency checksums
│   ├── .air.toml                     # Air hot-reload configuration
│   │
│   ├── internal/                     # Private application code
│   │   ├── config/                   # Configuration management
│   │   │   └── config.go             # Loads env vars, provides Config struct
│   │   │
│   │   ├── models/                   # Domain models and data structures
│   │   │   ├── user.go               # User model (roles, student info, etc.)
│   │   │   ├── certificate.go        # Certificate model (on-chain data)
│   │   │   ├── credential.go         # Credential model (off-chain metadata)
│   │   │   └── types.go              # UserRole enum and type definitions
│   │   │
│   │   ├── store/                    # Data persistence layer (abstraction)
│   │   │   ├── interface.go          # Store interface (contract)
│   │   │   ├── mongodb.go            # MongoDB implementation
│   │   │   └── memory.go             # In-memory fallback store
│   │   │
│   │   ├── services/                 # Business logic layer
│   │   │   ├── auth.go               # Authentication & JWT generation
│   │   │   ├── user.go               # User management (CRUD, approval)
│   │   │   ├── certificate.go        # Certificate issuance & verification
│   │   │   ├── credentials.go        # Legacy credential service
│   │   │   ├── ipfs.go               # IPFS file upload/download
│   │   │   ├── ipfs_debug.go         # IPFS debugging utilities
│   │   │   ├── blockchain.go        # Mock blockchain service (fallback)
│   │   │   ├── blockchain_interface.go # Blockchain service interface
│   │   │   ├── blockchain_besu.go   # Hyperledger Besu integration
│   │   │   └── blockchain_goeth.go  # Go-ethereum integration
│   │   │
│   │   ├── http/                     # HTTP layer
│   │   │   ├── handlers/             # Request handlers
│   │   │   │   ├── auth.go           # Login handler
│   │   │   │   ├── users.go           # User CRUD, approval, delete
│   │   │   │   ├── certificates.go    # Certificate issuance, listing, verification
│   │   │   │   ├── credentials.go    # Legacy credential handlers
│   │   │   │   └── blockchain.go     # Blockchain status, verification
│   │   │   ├── middleware/           # HTTP middleware
│   │   │   │   └── auth.go           # JWT authentication middleware
│   │   │   └── response.go            # JSON response helpers
│   │   │
│   │   └── router/                   # HTTP routing
│   │       └── router.go             # Route definitions, CORS, service initialization
│   │
│   ├── contracts/                    # Solidity smart contracts
│   │   ├── CertificateManager.sol    # Main certificate contract (on-chain storage)
│   │   ├── CredentialManager.sol     # Legacy credential contract
│   │   └── RoleManager.sol           # Role management contract
│   │
│   ├── blockchain/                   # Blockchain network configuration & scripts
│   │   ├── config/
│   │   │   └── genesis.json          # Genesis block configuration (PoA setup)
│   │   │
│   │   ├── scripts/
│   │   │   ├── setup/                # Network setup & management
│   │   │   │   ├── install-besu.ps1   # Besu installation helper
│   │   │   │   ├── start-besu.bat    # Start Besu (Windows)
│   │   │   │   ├── start-besu.sh     # Start Besu (Linux/macOS)
│   │   │   │   ├── check-status.bat  # Verify node status
│   │   │   │   └── README.md         # Setup documentation
│   │   │   │
│   │   │   ├── deploy/               # Contract deployment
│   │   │   │   ├── deploy-contract.js # Deploy CertificateManager.sol
│   │   │   │   └── README.md         # Deployment guide
│   │   │   │
│   │   │   └── data/                 # Data interaction scripts
│   │   │       ├── store-sample-data.ps1    # Store certificate via API
│   │   │       ├── store-sample-data.go     # Store certificate (Go)
│   │   │       ├── store-sample-data.sh     # Store certificate (Bash)
│   │   │       ├── get-certificates.ps1     # Fetch all certificates
│   │   │       ├── view-certificate.ps1     # View specific certificate
│   │   │       ├── verify-on-chain.ps1      # Verify certificate on-chain
│   │   │       ├── verify-besu-storage.ps1  # Check blockchain storage
│   │   │       ├── check-besu-data.ps1      # Inspect blockchain data
│   │   │       ├── view-blockchain-data.go   # View blockchain data (Go)
│   │   │       ├── sample-certificate.json  # Sample certificate data
│   │   │       ├── QUICK-START.md           # Quick start guide
│   │   │       └── README.md                 # Data scripts documentation
│   │   │
│   │   ├── data/                     # Blockchain data (auto-generated by Besu)
│   │   │   └── .gitkeep              # Keep directory in git
│   │   │
│   │   └── README.md                  # Complete blockchain documentation
│   │
│   ├── scripts/                      # Utility scripts
│   │   ├── add-student.ps1          # Interactive student registration
│   │   ├── add-student-quick.ps1    # Quick test student creation
│   │   └── README.md                # Scripts documentation
│   │
│   ├── tmp/                          # Build artifacts (Air)
│   │   └── main.exe                  # Compiled binary
│   │
│   └── README.md                     # Backend-specific documentation
│
├── frontend/                         # Next.js frontend application
│   ├── src/
│   │   ├── app/                      # Next.js App Router pages
│   │   │   ├── layout.tsx            # Root layout (fonts, metadata)
│   │   │   ├── page.tsx              # Home/landing page
│   │   │   ├── globals.css           # Global styles (Tailwind)
│   │   │   ├── favicon.ico           # Site favicon
│   │   │   │
│   │   │   ├── login/                # Authentication
│   │   │   │   └── page.tsx          # Unified login (all roles)
│   │   │   │
│   │   │   ├── register/             # Registration
│   │   │   │   └── page.tsx          # Student registration form
│   │   │   │
│   │   │   ├── admin-dashboard/      # Admin dashboard
│   │   │   │   └── page.tsx          # User management, approval, CRUD
│   │   │   │
│   │   │   ├── coe-dashboard/        # COE dashboard
│   │   │   │   └── page.tsx          # Issue marksheets, degree certificates
│   │   │   │
│   │   │   ├── faculty-dashboard/    # Faculty dashboard
│   │   │   │   └── page.tsx          # Issue NOC, Bonafide certificates
│   │   │   │
│   │   │   ├── club-dashboard/       # Club coordinator dashboard
│   │   │   │   └── page.tsx          # Issue participation certificates
│   │   │   │
│   │   │   ├── verifier-dashboard/   # External verifier dashboard
│   │   │   │   └── page.tsx          # Credential verification interface
│   │   │   │
│   │   │   ├── student-dashboard/    # Student dashboard
│   │   │   │   └── page.tsx          # View own credentials, profile
│   │   │   │
│   │   │   ├── student-wallet/       # Public student wallet
│   │   │   │   └── page.tsx          # Shareable profile with QR codes
│   │   │   │
│   │   │   ├── dashboard/            # Legacy dashboard
│   │   │   │   └── page.tsx          # Old dashboard implementation
│   │   │   │
│   │   │   └── dashboard-enhanced/   # Enhanced dashboard
│   │   │       └── page.tsx          # Alternative dashboard UI
│   │   │
│   │   ├── components/               # Reusable React components
│   │   │   ├── RoleBasedDashboard.tsx # Dynamic dashboard switcher
│   │   │   ├── CredentialIssuer.tsx   # Credential issuance form
│   │   │   └── CertificateDisplay.tsx # Certificate display component
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.ts            # Authentication state management
│   │   │   ├── useApi.ts             # API calls (users, credentials, stats)
│   │   │   └── useStudentWallet.ts   # Student wallet data fetching
│   │   │
│   │   ├── lib/                       # Utility libraries
│   │   │   ├── api.ts                # API client functions
│   │   │   ├── auth.ts               # Auth helpers (token storage)
│   │   │   └── utils.ts              # Utility functions (formatting, roles)
│   │   │
│   │   └── types/                     # TypeScript type definitions
│   │       └── auth.ts               # Auth-related types (User, Role, etc.)
│   │
│   ├── public/                       # Static assets
│   │   ├── logo.png                  # Main logo
│   │   ├── logob.png                 # Logo (black variant)
│   │   ├── index.html                # Static HTML (if needed)
│   │   └── *.svg                     # SVG icons
│   │
│   ├── package.json                  # Node.js dependencies & scripts
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── next.config.ts                # Next.js configuration
│   ├── postcss.config.mjs            # PostCSS (Tailwind) config
│   ├── biome.json                    # Biome linter configuration
│   └── README.md                     # Frontend documentation
│
└── README.md                         # This file (project overview)
```

## Application Flow

### 1. **Authentication Flow**
```
User → Login Page → POST /api/login → JWT Token → Stored in localStorage
→ Role-based redirect → Dashboard (admin/coe/faculty/club/verifier/student)
```

### 2. **Certificate Issuance Flow**
```
Issuer (COE/Faculty/Club) → Dashboard → Fill Form → POST /api/certificates/issue
→ Backend Service:
  1. Validate student exists
  2. Compute file hash (SHA-256)
  3. Upload to IPFS → Get IPFS CID
  4. Compute metadata hash
  5. Generate certificate ID
  6. ABI encode transaction data
  7. Send to Besu blockchain → Get TX hash & block number
  8. Store certificate in MongoDB (off-chain metadata)
→ Return: cert_id, tx_hash, block_number, ipfs_url
```

### 3. **On-Chain Data Storage**
When a certificate is issued, the following data is stored on the Besu blockchain:
- **Certificate Hash** (SHA-256 of file) - For verifiability & tamper detection
- **Metadata Hash** - Prevents unauthorized edits
- **Issuer Blockchain Address** - Establishes trust of authority
- **Timestamp** - Immutable proof of issuance time
- **Student Identity Mapping** - Links to student wallet address
- **Revocation Flag** - Allows certificate invalidation

### 4. **Verification Flow**
```
Verifier → Enter Certificate ID → GET /api/blockchain/verify-certificate
→ Backend:
  1. Query blockchain for certificate data
  2. Verify hashes match
  3. Check revocation status
  4. Validate issuer signature
→ Return: Verification result (valid/invalid/revoked)
```

### 5. **Student Registration Flow**
```
Student → Register Page → POST /api/register
→ Backend:
  1. Generate student_id (from name, school, marks)
  2. Create user (pending approval)
  3. Store in MongoDB
→ Admin → Approve → POST /api/users/{id}/approve
→ Student can now login
```

## Quick Start

### Prerequisites
- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **MongoDB Atlas** - [Sign up](https://cloud.mongodb.com) (or local MongoDB)
- **Hyperledger Besu** - See [Blockchain Setup](#blockchain-setup)

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   go mod tidy
   ```

2. **Configure environment:**
   Create `.env` file (optional, or use environment variables):
   ```env
   PORT=8080
   JWT_SECRET=your-secret-key-here
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
   MONGO_DATABASE=blockcred
   ALLOWED_ORIGIN=http://localhost:3000
   BESU_RPC_URL=http://localhost:8545
   IPFS_API_URL=http://localhost:5001
   ```

3. **Run with hot-reload:**
```bash
cd backend
   air
   ```
   
   Or run directly:
   ```bash
   go run main.go
   ```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
   ```

2. **Start development server:**
   ```bash
npm run dev
```

3. **Access application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080/api

### Blockchain Setup

1. **Install Besu:**
   ```powershell
   cd backend
   .\blockchain\scripts\setup\install-besu.ps1
   ```

2. **Start Besu network:**
   ```powershell
   .\blockchain\scripts\setup\start-besu.bat
   ```

3. **Verify it's running:**
   ```powershell
   .\blockchain\scripts\setup\check-status.bat
   ```

For detailed blockchain setup, see [`backend/blockchain/README.md`](backend/blockchain/README.md)

## Complete File Structure

### Backend Files Explained

#### Core Application
- **`main.go`**: Entry point. Loads config, initializes router, starts HTTP server.
- **`go.mod`**: Go module definition and dependencies.
- **`.air.toml`**: Air configuration for hot-reload (watches `.go` files, rebuilds on change).

#### Configuration (`internal/config/`)
- **`config.go`**: Loads environment variables, provides `Config` struct with defaults.

#### Models (`internal/models/`)
- **`user.go`**: User model with roles, student info, approval status.
- **`certificate.go`**: Certificate model (on-chain data: hashes, timestamps, blockchain addresses).
- **`credential.go`**: Legacy credential model (off-chain metadata).
- **`types.go`**: UserRole enum, permission definitions.

#### Store Layer (`internal/store/`)
- **`interface.go`**: Store interface (contract for data operations).
- **`mongodb.go`**: MongoDB implementation (production).
- **`memory.go`**: In-memory store (development/fallback).

#### Services (`internal/services/`)
- **`auth.go`**: JWT generation, password hashing, login validation.
- **`user.go`**: User CRUD, approval, student ID generation.
- **`certificate.go`**: Certificate issuance orchestration (IPFS + blockchain).
- **`credentials.go`**: Legacy credential service.
- **`ipfs.go`**: IPFS file upload/download.
- **`blockchain_besu.go`**: Hyperledger Besu integration (ABI encoding, transactions).
- **`blockchain_goeth.go`**: Go-ethereum integration (alternative).
- **`blockchain.go`**: Mock blockchain service (fallback).
- **`blockchain_interface.go`**: Blockchain service interface.

#### HTTP Layer (`internal/http/`)
- **`handlers/auth.go`**: Login endpoint handler.
- **`handlers/users.go`**: User CRUD, approval, delete handlers.
- **`handlers/certificates.go`**: Certificate issuance, listing, verification handlers.
- **`handlers/blockchain.go`**: Blockchain status, on-chain verification handlers.
- **`middleware/auth.go`**: JWT authentication middleware (protects routes).
- **`response.go`**: JSON response helpers (success/error formatting).

#### Router (`internal/router/`)
- **`router.go`**: Route definitions, CORS setup, service initialization, fallback chain (MongoDB → Memory, Besu → GoEth → Mock).

#### Smart Contracts (`contracts/`)
- **`CertificateManager.sol`**: Main contract for on-chain certificate storage.
- **`CredentialManager.sol`**: Legacy credential contract.
- **`RoleManager.sol`**: Role management contract.

### Frontend Files Explained

#### Pages (`src/app/`)
- **`layout.tsx`**: Root layout with fonts, metadata.
- **`page.tsx`**: Home/landing page.
- **`login/page.tsx`**: Unified login (all roles, auto-redirect).
- **`register/page.tsx`**: Student registration form.
- **`admin-dashboard/page.tsx`**: Admin dashboard (user management, approval, CRUD).
- **`coe-dashboard/page.tsx`**: COE dashboard (issue marksheets, degrees).
- **`faculty-dashboard/page.tsx`**: Faculty dashboard (issue NOC, Bonafide).
- **`club-dashboard/page.tsx`**: Club dashboard (issue participation certificates).
- **`verifier-dashboard/page.tsx`**: Verifier dashboard (credential verification).
- **`student-dashboard/page.tsx`**: Student dashboard (view credentials, profile).
- **`student-wallet/page.tsx`**: Public shareable wallet (QR codes).

#### Components (`src/components/`)
- **`RoleBasedDashboard.tsx`**: Dynamic dashboard switcher based on user role.
- **`CredentialIssuer.tsx`**: Reusable credential issuance form.
- **`CertificateDisplay.tsx`**: Certificate display component.

#### Hooks (`src/hooks/`)
- **`useAuth.ts`**: Authentication state, login/logout, token management.
- **`useApi.ts`**: API hooks (useUsers, useCredentials, useDashboardStats).
- **`useStudentWallet.ts`**: Student wallet data fetching.

#### Libraries (`src/lib/`)
- **`api.ts`**: API client functions (fetch wrappers).
- **`auth.ts`**: Auth helpers (token storage/retrieval).
- **`utils.ts`**: Utility functions (date formatting, role icons, role names).

#### Types (`src/types/`)
- **`auth.ts`**: TypeScript types (User, Role, AuthResponse, etc.).

## API Endpoints

### Authentication
```
POST   /api/login                    # Login (returns JWT token)
POST   /api/register                 # Student registration
```

### User Management
```
GET    /api/users                    # List all users (admin only)
POST   /api/admin/onboard            # Create new user (admin only)
POST   /api/users/{id}/approve       # Approve pending user (admin only)
PUT    /api/admin/users/{id}         # Update user details (admin only)
DELETE /api/admin/users/{id}          # Delete user (admin only)
```

### Certificates
```
POST   /api/certificates/issue       # Issue new certificate (authenticated)
GET    /api/certificates              # List all certificates (authenticated)
GET    /api/certificates/student/{student_id}  # Get student's certificates
GET    /api/certificates/issuer     # Get certificates issued by current user
GET    /api/certificates/verify/{cert_id}      # Verify certificate (public)
POST   /api/certificates/{cert_id}/revoke      # Revoke certificate
GET    /api/certificates/test-ipfs   # Test IPFS connection
```

### Blockchain
```
GET    /api/blockchain/status        # Get blockchain network status
POST   /api/blockchain/register-issuer         # Register issuer on-chain
GET    /api/blockchain/verify-certificate      # Verify certificate on-chain
GET    /api/blockchain/certificate              # Get certificate from blockchain
```

### Credentials (Legacy)
```
GET    /api/credentials              # List all credentials
POST   /api/credentials/issue        # Issue new credential
```

### Health Check
```
GET    /health                       # Server health check
```

## Frontend Routes

### Public Routes
- **`/`** - Home/Landing page
- **`/login`** - Unified login (auto-redirects based on role)
- **`/register`** - Student registration

### Protected Routes (Require Authentication)
- **`/admin-dashboard`** - Admin dashboard
  - User management (CRUD)
  - User approval
  - View user details
  - Delete users
  - System statistics

- **`/coe-dashboard`** - Controller of Examinations dashboard
  - Issue semester marksheets
  - Issue degree certificates
  - View issued credentials
  - Student management

- **`/faculty-dashboard`** - Department Faculty dashboard
  - Issue NOC certificates
  - Issue Bonafide certificates
  - View issued certificates

- **`/club-dashboard`** - Club Coordinator dashboard
  - Issue participation certificates
  - Event management

- **`/verifier-dashboard`** - External Verifier dashboard
  - Verify certificate authenticity
  - Blockchain verification
  - Certificate lookup

- **`/student-dashboard`** - Student dashboard
  - View own credentials
  - Profile management
  - Certificate history

- **`/student-wallet`** - Public student wallet
  - Shareable profile
  - QR code generation
  - Public credential viewing

## Blockchain Integration

### On-Chain Data Storage

When a certificate is issued, the following data is **immutably stored** on the Besu blockchain:

| Field | Purpose |
|-------|---------|
| **Certificate Hash** | SHA-256 hash of certificate file (verifiability & tamper detection) |
| **Metadata Hash** | SHA-256 hash of metadata (prevents unauthorized edits) |
| **Issuer Blockchain Address** | Establishes trust of authority |
| **Timestamp** | Immutable proof of issuance time |
| **Student Identity Mapping** | Links to student wallet address (persistent academic identity) |
| **Revocation Flag** | Allows certificate invalidation |

### Smart Contract

**`CertificateManager.sol`** provides:
- `issueCertificate()` - Store certificate data on-chain
- `verifyCertificate()` - Verify certificate authenticity
- `revokeCertificate()` - Mark certificate as revoked
- `getCertificate()` - Retrieve certificate data

### Blockchain Scripts

**Setup Scripts** (`blockchain/scripts/setup/`):
- `install-besu.ps1` - Install Hyperledger Besu
- `start-besu.bat` / `start-besu.sh` - Start PoA network
- `check-status.bat` - Verify node status

**Data Scripts** (`blockchain/scripts/data/`):
- `store-sample-data.ps1` - Store certificate via API
- `get-certificates.ps1` - Fetch all certificates
- `view-certificate.ps1` - View specific certificate
- `verify-on-chain.ps1` - Verify certificate on blockchain

**Deploy Scripts** (`blockchain/scripts/deploy/`):
- `deploy-contract.js` - Deploy CertificateManager.sol

## System Roles

| Role | Permissions | Dashboard |
|------|-------------|-----------|
| **SSN Main Admin** | Full system control, onboard users, approve students, delete users | `/admin-dashboard` |
| **COE (Sub-Admin)** | Issue semester marksheets, degree certificates | `/coe-dashboard` |
| **Department Faculty** | Issue Bonafide, NOC certificates | `/faculty-dashboard` |
| **Club Coordinators** | Issue participation certificates for events | `/club-dashboard` |
| **External Verifiers** | Read-only credential verification | `/verifier-dashboard` |
| **Students** | View and share own credentials | `/student-dashboard`, `/student-wallet` |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ssn.edu.in | admin123 |
| COE | coe@ssn.edu.in | coe123 |
| Faculty | faculty@ssn.edu.in | faculty123 |
| Club Coordinator | club@ssn.edu.in | club123 |
| Verifier | verifier@external.com | verifier123 |
| Student | john@student.ssn.edu.in | student123 |

## Utility Scripts

### Student Management
```powershell
# Interactive student registration
.\backend\scripts\add-student.ps1

# Quick test student
.\backend\scripts\add-student-quick.ps1
```

### Blockchain Data
```powershell
# Store certificate
.\backend\blockchain\scripts\data\store-sample-data.ps1

# View certificates
.\backend\blockchain\scripts\data\get-certificates.ps1

# Verify on-chain
.\backend\blockchain\scripts\data\verify-on-chain.ps1 -CertId "0x..."
```

## Configuration

### Environment Variables

**Backend** (`.env` or system environment):
```env
PORT=8080                              # Server port
JWT_SECRET=your-secret-key              # JWT signing secret
MONGO_URI=mongodb+srv://...            # MongoDB connection string
MONGO_DATABASE=blockcred               # MongoDB database name
ALLOWED_ORIGIN=http://localhost:3000   # CORS allowed origin
BESU_RPC_URL=http://localhost:8545    # Besu JSON-RPC endpoint
IPFS_API_URL=http://localhost:5001    # IPFS API endpoint
```

### MongoDB Atlas Setup

1. Create account at https://cloud.mongodb.com
2. Create a free cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string from "Connect" → "Connect your application"
6. Set `MONGO_URI` environment variable

## Development Workflow

### Backend Development
```bash
cd backend
air  # Hot-reload on file changes
```

### Frontend Development
```bash
cd frontend
npm run dev  # Next.js dev server with hot-reload
```

### Testing Blockchain
```bash
# Terminal 1: Start Besu
cd backend
.\blockchain\scripts\setup\start-besu.bat

# Terminal 2: Start Backend
cd backend
air

# Terminal 3: Store test data
.\blockchain\scripts\data\store-sample-data.ps1
```

## Architecture Patterns

### Backend Architecture
- **Clean Architecture**: Separation of concerns (models, store, services, handlers)
- **Dependency Injection**: Services injected into handlers
- **Interface-based Design**: Store and blockchain services use interfaces
- **Fallback Chain**: MongoDB → Memory Store, Besu → GoEth → Mock

### Frontend Architecture
- **Component-based**: Reusable React components
- **Custom Hooks**: Encapsulated API logic
- **Type Safety**: Full TypeScript coverage
- **Role-based Routing**: Dynamic dashboard selection

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Authorization**: Server-side permission checks
- **Password Hashing**: bcrypt for password storage
- **CORS Protection**: Configurable origin whitelist
- **Input Validation**: Form validation on frontend and backend
- **Blockchain Integrity**: Tamper-proof credential storage

## Use Cases

**Academic Institutions:**
- Complete student lifecycle management
- Automated credential issuance workflows
- Regulatory compliance support
- Immutable academic records

**Employers/HR:**
- Quick credential verification
- Automated background checks
- Fraud prevention through tamper-proof credentials
- QR code scanning for instant verification

**Students:**
- Secure digital credential wallet
- Easy sharing with employers
- Academic portfolio management
- Blockchain-verified credentials

## Metrics & Performance

BlockCred tracks comprehensive system metrics including:

- **System Performance**: Response times, throughput, error rates, uptime
- **User Activity**: DAU/MAU, user growth, role distribution, engagement
- **Blockchain Metrics**: Transaction throughput, confirmation times, on-chain storage
- **API Performance**: Endpoint response times, success rates, usage statistics
- **Database Metrics**: Query performance, collection sizes, growth rates
- **Business Metrics**: Credential issuance, verification rates, student statistics
- **Security Metrics**: Authentication failures, tamper detection, data integrity

For detailed metrics documentation, see [`METRICS.md`](METRICS.md)

## Future Roadmap

- Enhanced blockchain integration with smart contracts
- Decentralized credential storage
- Cross-institution credential sharing
- AI-powered verification
- Native mobile applications
- W3C credential standards compliance
- Advanced analytics and reporting
- Real-time metrics dashboard
- Predictive analytics
- Multi-chain support
- NFT-based credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:
- Check [`backend/blockchain/README.md`](backend/blockchain/README.md) for blockchain setup
- Check [`backend/README.md`](backend/README.md) for backend documentation
- Check [`frontend/README.md`](frontend/README.md) for frontend documentation
