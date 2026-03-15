# Scripts

Utility scripts for managing the BlockCred system.

## Student Management

### Add Student (Interactive)

**Interactive script** to add a new student with all required fields:

```powershell
.\scripts\add-student.ps1
```

This script will prompt you for:
- Full Name
- Email
- Phone (10 digits)
- Password
- Date of Birth (YYYY-MM-DD)
- School Name
- Father's Name
- Aadhar Number (12 digits)
- 10th School Name
- 10th Marks (0-100)
- 12th School Name
- 12th Marks (0-100)
- Cut-off Marks

### Add Student (Quick)

**Quick script** to add a sample student for testing:

```powershell
.\scripts\add-student-quick.ps1
```

This adds a pre-configured student:
- Name: David Wilson
- Email: david@student.ssn.edu.in
- Password: student123
- All other fields pre-filled

## Notes

- Students registered via these scripts will be **pending approval**
- Admin must approve students in the admin dashboard before they can use the system
- Student ID is automatically generated based on name, school, and marks

## Example Usage

```powershell
# Add a new student interactively
cd backend
.\scripts\add-student.ps1

# Or add a quick test student
.\scripts\add-student-quick.ps1
```

