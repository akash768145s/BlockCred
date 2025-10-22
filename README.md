# BlockCred - Complete Role-Based Credential Management System

## Overview

BlockCred is a comprehensive blockchain-based credential management system designed for educational institutions. It implements a complete Role-Based Access Control (RBAC) system with role-specific dashboards and credential issuance workflows.

## System Architecture

### Roles and Permissions

| Role | Actions | Dashboard |
|------|---------|-----------|
| **SSN Main Admin** | Onboards sub-admins, deploys contracts, authorizes validators | `/admin-dashboard` |
| **COE (Sub-Admin)** | Issues semester marksheet credentials, degree certificates | `/coe-dashboard` |
| **Department Faculty** | Issues Bonafide, NOC certificates | `/faculty-dashboard` |
| **Club Coordinators** | Issues participation certificates for events | `/club-dashboard` |
| **External Verifiers** | Read-only access to verify authenticity | `/verifier-dashboard` |
| **Students** | View and share their credentials | `/student-dashboard`, `/student-wallet` |

## Frontend Components

### 1. Unified Login System (`/login`)
- **Modern Design**: Dark theme with gradient backgrounds
- **Role-Agnostic**: Single login form for all user types
- **Demo Credentials**: Pre-configured test accounts for all roles
- **Auto-Redirect**: Automatically redirects to role-specific dashboards

### 2. Admin Dashboard (`/admin-dashboard`)
- **User Management**: Create and manage COE, Faculty, Club Coordinators
- **User Overview**: Statistics and user management interface
- **Role Assignment**: Assign roles to new users
- **Credential Monitoring**: View all issued credentials

### 3. COE Dashboard (`/coe-dashboard`)
- **Academic Credentials**: Issue semester marksheets and degree certificates
- **Student Management**: Browse and manage student records
- **Credential Tracking**: Monitor issued academic credentials
- **Quick Actions**: Streamlined credential issuance workflow

### 4. Faculty Dashboard (`/faculty-dashboard`)
- **Document Issuance**: Issue NOC and Bonafide certificates
- **Student Services**: Manage student document requests
- **Certificate Management**: Track issued certificates
- **Department Focus**: Department-specific credential management

### 5. Club Coordinator Dashboard (`/club-dashboard`)
- **Event Certificates**: Issue participation and achievement certificates
- **Event Management**: Manage coding, sports, and cultural events
- **Student Recognition**: Award certificates for achievements
- **Club Activities**: Track club-related credentials

### 6. External Verifier Dashboard (`/verifier-dashboard`)
- **Credential Verification**: Verify authenticity of student credentials
- **Blockchain Verification**: Check blockchain integrity
- **Tamper Detection**: Identify tampered documents
- **Verification Reports**: Generate verification reports

### 7. Student Dashboard (`/student-dashboard`)
- **Credential View**: View all issued credentials
- **Profile Management**: Manage student profile
- **Credential Requests**: Request new certificates
- **Academic Progress**: Track academic achievements

### 8. Shareable Student Wallet (`/student-wallet`)
- **Public Profile**: Shareable student profile page
- **Credential Display**: Public view of verified credentials
- **QR Code Sharing**: QR code for easy sharing
- **External Verification**: Accessible to employers/HR
- **Blockchain Verification**: Direct blockchain verification links

## Backend API Endpoints

### Authentication
- `POST /api/login` - Unified login for all roles
- `POST /api/register` - Student registration

### User Management
- `GET /api/users` - Get all users (admin only)
- `POST /api/admin/onboard` - Onboard new users (admin only)

### Credential Management
- `GET /api/credentials/all` - Get all credentials
- `GET /api/student/{id}/credentials` - Get student credentials
- `GET /api/verifier/credentials` - Get credentials for verification

### Role-Specific Credential Issuance
- `POST /api/coe/issue-marksheet` - Issue academic credentials (COE)
- `POST /api/faculty/issue-noc` - Issue NOC certificates (Faculty)
- `POST /api/faculty/issue-bonafide` - Issue Bonafide certificates (Faculty)
- `POST /api/club/issue-participation-cert` - Issue participation certificates (Club)

### Verification
- `POST /api/verifier/verify/{id}` - Verify credential authenticity

## Key Features

### 1. Role-Based Access Control (RBAC)
- **Granular Permissions**: Each role has specific permissions
- **Secure Authentication**: JWT-based authentication
- **Role Validation**: Server-side role validation
- **Permission Checking**: Fine-grained permission system

### 2. Credential Types
- **Academic**: Semester marksheets, degree certificates
- **Administrative**: NOC, Bonafide certificates
- **Extracurricular**: Participation certificates, achievements
- **Verification**: Blockchain-verified credentials

### 3. Shareable Student Wallet
- **Public Access**: No login required for external verification
- **QR Code Sharing**: Easy sharing via QR codes
- **Blockchain Links**: Direct blockchain verification
- **Employer-Friendly**: Designed for HR/employer verification

### 4. Modern UI/UX
- **Responsive Design**: Works on all devices
- **Dark Theme**: Modern, professional appearance
- **Intuitive Navigation**: Role-specific workflows
- **Real-time Updates**: Live data updates

## Demo Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Admin | admin@ssn.edu.in | admin123 | Admin Dashboard |
| COE | coe@ssn.edu.in | coe123 | COE Dashboard |
| Faculty | faculty@ssn.edu.in | faculty123 | Faculty Dashboard |
| Club | club@ssn.edu.in | club123 | Club Dashboard |
| Verifier | verifier@external.com | verifier123 | Verifier Dashboard |
| Student | john@student.ssn.edu.in | student123 | Student Dashboard |

## Installation & Setup

### Backend Setup
```bash
cd backend
go mod init blockcred-backend
go get github.com/gorilla/mux
go get github.com/gorilla/handlers
go run main-complete.go
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## File Structure

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
│   │   ├── admin-dashboard/       # Admin dashboard
│   │   ├── coe-dashboard/         # COE dashboard
│   │   ├── faculty-dashboard/     # Faculty dashboard
│   │   ├── club-dashboard/        # Club dashboard
│   │   ├── verifier-dashboard/    # Verifier dashboard
│   │   ├── student-dashboard/     # Student dashboard
│   │   └── student-wallet/        # Shareable wallet
│   ├── src/components/
│   │   ├── RoleBasedDashboard.tsx # Dynamic dashboard component
│   │   └── CredentialIssuer.tsx   # Credential issuance component
│   └── src/types/
│       └── auth.ts                # TypeScript type definitions
```

## Security Features

### 1. Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role Validation**: Server-side role verification
- **Permission Checking**: Granular permission system
- **Session Management**: Secure session handling

### 2. Data Integrity
- **Blockchain Verification**: Tamper-proof credential storage
- **Hash Verification**: Cryptographic integrity checks
- **Audit Trails**: Complete credential history
- **Tamper Detection**: Automatic tamper detection

### 3. Privacy & Security
- **Data Encryption**: End-to-end encryption
- **Secure Sharing**: Controlled credential sharing
- **Access Control**: Role-based access restrictions
- **Audit Logging**: Complete activity logging

## Use Cases

### 1. Academic Institution
- **Student Management**: Complete student lifecycle management
- **Credential Issuance**: Automated credential issuance
- **Verification**: Easy credential verification
- **Compliance**: Regulatory compliance support

### 2. Employers/HR
- **Credential Verification**: Quick credential verification
- **Background Checks**: Automated background verification
- **Fraud Prevention**: Tamper-proof credentials
- **Efficiency**: Streamlined hiring process

### 3. Students
- **Digital Wallet**: Secure credential storage
- **Easy Sharing**: Simple credential sharing
- **Portfolio Management**: Academic portfolio management
- **Career Support**: Career development tools

## Future Enhancements

### 1. Blockchain Integration
- **Smart Contracts**: Automated credential verification
- **Decentralized Storage**: Distributed credential storage
- **Interoperability**: Cross-institution credential sharing
- **Scalability**: High-volume credential processing

### 2. Advanced Features
- **AI Verification**: AI-powered credential verification
- **Mobile App**: Native mobile applications
- **API Integration**: Third-party system integration
- **Analytics**: Advanced analytics and reporting

### 3. Compliance & Standards
- **W3C Standards**: W3C credential standards compliance
- **International Standards**: Global credential standards
- **Regulatory Compliance**: Government regulation compliance
- **Accessibility**: WCAG accessibility compliance

## Conclusion

BlockCred provides a complete, production-ready credential management system with:

- **Comprehensive RBAC**: Full role-based access control
- **Modern UI/UX**: Professional, responsive interface
- **Secure Architecture**: Blockchain-based security
- **Scalable Design**: Enterprise-ready architecture
- **Easy Integration**: Simple API integration
- **Future-Proof**: Extensible and maintainable

The system is designed to handle the complete credential lifecycle from issuance to verification, providing a secure, efficient, and user-friendly platform for educational credential management.
