# BlockCred Backend

Go backend for the BlockCred blockchain credential management system.

## Features

- Admin authentication (username: admin, password: admin123)
- Student registration with 10th marksheet details
- Automatic Student ID generation based on academic information
- User approval system
- Blockchain node assignment simulation
- CORS enabled for frontend integration

## Setup

1. Install Go dependencies:
```bash
cd backend
go mod tidy
```

2. Run the server:
```bash
go run main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

### POST /api/login
Admin login endpoint
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### POST /api/register
Student registration
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "tenth_marks": 85,
  "school_name": "ABC High School",
  "passing_year": 2020
}
```

### GET /api/users
Get all registered users (for admin dashboard)

### POST /api/users/{id}/approve
Approve a user and assign blockchain node

## Student ID Generation

The system generates unique Student IDs based on:
- School name initials (first 3 characters)
- Passing year
- 10th grade marks
- Student name initials

Format: `SCHOOLINITIALS + YEAR + MARKS + NAMEINITIALS`

Example: `ABC202085JD` for John Doe from ABC High School, 2020 batch, 85% marks.

## Future Enhancements

- Integration with actual GoEth private blockchain
- JWT token authentication
- Database persistence (currently using in-memory storage)
- File upload for marksheet verification
- Email notifications for approval status
