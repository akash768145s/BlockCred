# BlockCred Backend

Go backend for the BlockCred blockchain credential management system with comprehensive Role-Based Access Control (RBAC).

## Features

### 🔐 **Role-Based Access Control (RBAC)**
- **SSN Main Admin**: User management, contract deployment, validator authorization
- **COE (Controller of Examinations)**: Academic credential issuance (marksheets, degrees)
- **Department Faculty**: Administrative certificates (NOC, Bonafide)
- **Club Coordinators**: Extracurricular certificates (participation, achievements)
- **External Verifiers**: Credential verification and authenticity checking
- **Students**: Personal credential management and sharing

### 🎯 **Core Capabilities**
- JWT-based authentication with role-specific permissions
- Comprehensive credential issuance workflows
- Blockchain-integrated credential verification
- Shareable student wallet for external verification
- Real-time credential status tracking
- Tamper-proof credential storage

## Setup

1. Install Go dependencies:
```bash
cd backend
go mod tidy
```

2. Run the complete server:
```bash
go run main-complete.go
```

The server will start on `http://localhost:8080`

## API Endpoints

### 🔑 **Authentication**
- `POST /api/login` - Unified login for all roles
- `POST /api/register` - Student registration

### 👥 **User Management**
- `GET /api/users` - Get all users (admin only)
- `POST /api/admin/onboard` - Onboard new users (admin only)

### 📜 **Credential Management**
- `GET /api/credentials/all` - Get all credentials
- `GET /api/student/{id}/credentials` - Get student credentials
- `GET /api/verifier/credentials` - Get credentials for verification

### 🎓 **Role-Specific Credential Issuance**
- `POST /api/coe/issue-marksheet` - Issue academic credentials (COE)
- `POST /api/faculty/issue-noc` - Issue NOC certificates (Faculty)
- `POST /api/faculty/issue-bonafide` - Issue Bonafide certificates (Faculty)
- `POST /api/club/issue-participation-cert` - Issue participation certificates (Club)

### ✅ **Verification**
- `POST /api/verifier/verify/{id}` - Verify credential authenticity

## Demo Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **SSN Main Admin** | admin@ssn.edu.in | admin123 | Admin Dashboard |
| **COE** | coe@ssn.edu.in | coe123 | COE Dashboard |
| **Faculty** | faculty@ssn.edu.in | faculty123 | Faculty Dashboard |
| **Club Coordinator** | club@ssn.edu.in | club123 | Club Dashboard |
| **External Verifier** | verifier@external.com | verifier123 | Verifier Dashboard |
| **Student** | john@student.ssn.edu.in | student123 | Student Dashboard |

## Credential Types

### 🎓 **Academic Credentials (COE)**
- **Semester Marksheets**: Academic performance records
- **Degree Certificates**: Graduation credentials
- **Transcripts**: Detailed academic records

### 📋 **Administrative Certificates (Faculty)**
- **NOC (No Objection Certificate)**: For various purposes
- **Bonafide Certificates**: Student status verification
- **Character Certificates**: Conduct verification

### 🏆 **Extracurricular Certificates (Club Coordinators)**
- **Participation Certificates**: Event participation
- **Achievement Certificates**: Competition winners
- **Leadership Certificates**: Club leadership roles

## Security Features

### 🔐 **Authentication & Authorization**
- JWT token-based authentication
- Role-based permission system
- Secure session management
- API endpoint protection

### 🛡️ **Data Integrity**
- Blockchain verification
- Cryptographic hash validation
- Tamper detection
- Audit trail maintenance

### 🔒 **Privacy & Access Control**
- Role-based data access
- Secure credential sharing
- External verification controls
- Activity logging

## Student ID Generation

The system generates unique Student IDs based on:
- School name initials (first 3 characters)
- Passing year
- 10th grade marks
- Student name initials

**Format**: `SCHOOLINITIALS + YEAR + MARKS + NAMEINITIALS`

**Example**: `ABC202085JD` for John Doe from ABC High School, 2020 batch, 85% marks.

## Shareable Student Wallet

### 🌐 **Public Access Features**
- **No Login Required**: External verification without authentication
- **QR Code Sharing**: Easy sharing with employers/HR
- **Blockchain Links**: Direct blockchain verification
- **Professional Display**: Employer-friendly interface

### 📱 **Access Methods**
- Direct URL: `/student-wallet?id=STUDENT_ID`
- QR Code scanning
- Social media sharing
- Email integration

## Architecture

### 🏗️ **Backend Structure**
```
backend/
├── main-complete.go          # Complete RBAC API server
├── types.go                  # Role and permission definitions
├── middleware.go             # JWT authentication middleware
├── contracts/
│   └── RoleManager.sol       # Smart contract for role management
└── blockchain/
    └── role-client.go        # Blockchain interaction client
```

### 🔄 **Request Flow**
1. **Authentication**: JWT token validation
2. **Authorization**: Role-based permission checking
3. **Processing**: Role-specific business logic
4. **Response**: Structured JSON responses
5. **Logging**: Complete audit trail

## Database Schema

### 👤 **Users Table**
- User ID, Name, Email, Phone
- Role, Department, Institution
- Student ID, Academic Details
- Approval Status, Creation Date

### 📜 **Certificates Table**
- Certificate ID, Type, Title
- Student Information
- Issuer Details, Issue Date
- Status, Description
- Blockchain Hash, Verification Data

## Error Handling

### 📝 **Standardized Responses**
```json
{
  "success": true/false,
  "message": "Description",
  "data": {...}
}
```

### 🚨 **Error Codes**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Performance Considerations

### ⚡ **Optimization**
- In-memory storage for development
- Efficient role-based queries
- Minimal database calls
- Cached permission lookups

### 📊 **Monitoring**
- Request/response logging
- Performance metrics
- Error tracking
- Security monitoring

## Future Enhancements

### 🔮 **Planned Features**
- **Database Integration**: PostgreSQL/MongoDB persistence
- **Blockchain Integration**: Full GoEth private blockchain
- **File Upload**: Document verification system
- **Email Notifications**: Automated status updates
- **Mobile API**: Native mobile app support
- **Analytics Dashboard**: Advanced reporting and metrics

### 🚀 **Scalability**
- **Microservices Architecture**: Service decomposition
- **Load Balancing**: High availability setup
- **Caching Layer**: Redis integration
- **Message Queues**: Asynchronous processing

## Development

### 🛠️ **Local Development**
```bash
# Start backend server
go run main-complete.go

# Start frontend (separate terminal)
cd ../frontend
npm run dev
```

### 🧪 **Testing**
```bash
# Run tests
go test ./...

# API testing
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@ssn.edu.in","password":"admin123"}'
```

### 📦 **Deployment**
```bash
# Build for production
go build -o blockcred-server main-complete.go

# Run production server
./blockcred-server
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
