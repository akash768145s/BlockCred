# BlockCred

A blockchain-based credential management system for educational institutions with comprehensive Role-Based Access Control (RBAC).

## Quick Start

### Prerequisites
- Go 1.19+
- Node.js 18+
- npm or yarn
- **Blockchain Node**: Hyperledger Besu (for PoA network) - See [Blockchain Setup](#blockchain-setup)

### Installation

**Backend:**
```bash
cd backend
go mod init blockcred-backend
go get github.com/gorilla/mux github.com/gorilla/handlers
go run ./cmd/server/main.go
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Blockchain Setup

BlockCred uses a **Proof-of-Authority (PoA)** private blockchain network powered by **Hyperledger Besu**.

### Quick Setup

1. **Install Besu:**
   ```powershell
   cd backend
   .\install-besu.ps1
   ```
   Or manually: Download from [Besu Releases](https://github.com/hyperledger/besu/releases)

2. **Start Blockchain:**
   ```bash
   cd backend
   .\start-besu-blockchain.bat
   ```

3. **Verify it's Running:**
   ```bash
   .\check-besu-status.bat
   ```

### Network Details

- **Network ID**: 1337
- **Chain ID**: 1337
- **Consensus**: Clique (PoA)
- **Block Period**: 5 seconds
- **RPC Endpoint**: http://localhost:8545
- **WebSocket**: ws://localhost:8546
- **Validator**: Pre-configured with 1,000,000 ETH

### Why Besu?

- ✅ Full PoA (Clique) support
- ✅ Ethereum JSON-RPC compatible
- ✅ Production-ready and actively maintained
- ✅ Cross-platform (Windows, Linux, macOS)

For detailed setup instructions, see [`backend/blockchain-data/README-BESU.md`](backend/blockchain-data/README-BESU.md)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ssn.edu.in | admin123 |
| COE | coe@ssn.edu.in | coe123 |
| Faculty | faculty@ssn.edu.in | faculty123 |
| Club Coordinator | club@ssn.edu.in | club123 |
| Verifier | verifier@external.com | verifier123 |
| Student | john@student.ssn.edu.in | student123 |

## System Roles

| Role | Permissions | Dashboard |
|------|-------------|-----------|
| **SSN Main Admin** | Onboard sub-admins, deploy contracts, authorize validators | `/admin-dashboard` |
| **COE (Sub-Admin)** | Issue semester marksheets, degree certificates | `/coe-dashboard` |
| **Department Faculty** | Issue Bonafide, NOC certificates | `/faculty-dashboard` |
| **Club Coordinators** | Issue participation certificates for events | `/club-dashboard` |
| **External Verifiers** | Read-only credential verification | `/verifier-dashboard` |
| **Students** | View and share credentials | `/student-dashboard`, `/student-wallet` |

## Features

### Core Capabilities
- **Role-Based Access Control**: Granular permissions with JWT authentication
- **Credential Types**: Academic (marksheets, degrees), Administrative (NOC, Bonafide), Extracurricular (participation certificates)
- **Blockchain Verification**: Tamper-proof credential storage with hash verification
- **Shareable Wallet**: Public student profiles with QR code sharing for employers/HR
- **Modern UI**: Responsive dark theme with role-specific dashboards

### Security
- JWT-based authentication with server-side role validation
- Blockchain integrity checks and tamper detection
- End-to-end encryption and secure credential sharing
- Complete audit trails and activity logging

## Application Structure

### Frontend Routes

**Authentication:**
- `/login` - Unified login for all roles with auto-redirect

**Dashboards:**
- `/admin-dashboard` - User management, role assignment, credential monitoring
- `/coe-dashboard` - Academic credential issuance (marksheets, degrees)
- `/faculty-dashboard` - NOC and Bonafide certificate issuance
- `/club-dashboard` - Event participation certificate issuance
- `/verifier-dashboard` - Credential verification with blockchain checks
- `/student-dashboard` - Credential viewing and profile management
- `/student-wallet` - Public shareable profile with QR codes

### Backend API

**Authentication:**
```
POST /api/login          # Unified login
POST /api/register       # Student registration
```

**User Management:**
```
GET  /api/users                    # Get all users (admin only)
POST /api/admin/onboard            # Onboard new users (admin only)
```

**Credential Management:**
```
GET  /api/credentials/all              # Get all credentials
GET  /api/student/{id}/credentials     # Get student credentials
GET  /api/verifier/credentials         # Get credentials for verification
```

**Credential Issuance:**
```
POST /api/coe/issue-marksheet              # Issue academic credentials (COE)
POST /api/faculty/issue-noc                # Issue NOC certificates (Faculty)
POST /api/faculty/issue-bonafide           # Issue Bonafide certificates (Faculty)
POST /api/club/issue-participation-cert    # Issue participation certificates (Club)
```

**Verification:**
```
POST /api/verifier/verify/{id}    # Verify credential authenticity
```

## Project Structure

```
BlockCred/
├── backend/
│   ├── main-complete.go          # Complete backend API
│   ├── types.go                  # Role and permission definitions
│   ├── middleware.go             # JWT authentication middleware
│   └── contracts/
│       └── RoleManager.sol       # Smart contract for role management
├── frontend/
│   ├── src/app/
│   │   ├── login/page.tsx        # Unified login page
│   │   ├── admin-dashboard/      # Admin dashboard
│   │   ├── coe-dashboard/        # COE dashboard
│   │   ├── faculty-dashboard/    # Faculty dashboard
│   │   ├── club-dashboard/       # Club dashboard
│   │   ├── verifier-dashboard/   # Verifier dashboard
│   │   ├── student-dashboard/    # Student dashboard
│   │   └── student-wallet/       # Shareable wallet
│   ├── src/components/
│   │   ├── RoleBasedDashboard.tsx # Dynamic dashboard component
│   │   └── CredentialIssuer.tsx   # Credential issuance component
│   └── src/types/
│       └── auth.ts                # TypeScript type definitions
```

## Use Cases

**Academic Institutions:**
- Complete student lifecycle management
- Automated credential issuance workflows
- Regulatory compliance support

**Employers/HR:**
- Quick credential verification
- Automated background checks
- Fraud prevention through tamper-proof credentials

**Students:**
- Secure digital credential wallet
- Easy sharing with employers
- Academic portfolio management

## Future Roadmap

- Enhanced blockchain integration with smart contracts
- Decentralized credential storage
- Cross-institution credential sharing
- AI-powered verification
- Native mobile applications
- W3C credential standards compliance
- Advanced analytics and reporting

