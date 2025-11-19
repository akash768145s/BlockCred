# Script to add a new student to the system
# Usage: .\scripts\add-student.ps1

$API_URL = "http://localhost:8080/api"

Write-Host "🎓 Add New Student" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# Collect student information
Write-Host "Enter student details:" -ForegroundColor Yellow
Write-Host ""

$name = Read-Host "Full Name"
$email = Read-Host "Email"
$phone = Read-Host "Phone (10 digits)"
$password = Read-Host "Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "Select Department:" -ForegroundColor Yellow
Write-Host "1. Electrical and Electronics Engineering"
Write-Host "2. Electronics and Communication Engineering"
Write-Host "3. Computer Science and Engineering"
Write-Host "4. Information Technology"
Write-Host "5. Mechanical Engineering"
Write-Host "6. Chemical Engineering"
Write-Host "7. Biomedical Engineering"
Write-Host "8. Civil Engineering"
$deptChoice = Read-Host "Enter choice (1-8)"

$departments = @{
    "1" = "Electrical and Electronics Engineering"
    "2" = "Electronics and Communication Engineering"
    "3" = "Computer Science and Engineering"
    "4" = "Information Technology"
    "5" = "Mechanical Engineering"
    "6" = "Chemical Engineering"
    "7" = "Biomedical Engineering"
    "8" = "Civil Engineering"
}

$department = $departments[$deptChoice]
if (-not $department) {
    Write-Host "Invalid choice. Using default: Computer Science and Engineering" -ForegroundColor Yellow
    $department = "Computer Science and Engineering"
}

$dob = Read-Host "Date of Birth (YYYY-MM-DD)"
$schoolName = Read-Host "School Name"
$fatherName = Read-Host "Father's Name"

# Validate Aadhar number
do {
    $aadharNumber = Read-Host "Aadhar Number (12 digits)"
    if ($aadharNumber -notmatch '^\d{12}$') {
        Write-Host "❌ Aadhar number must be exactly 12 digits. Please try again." -ForegroundColor Red
    }
} while ($aadharNumber -notmatch '^\d{12}$')

$tenthSchool = Read-Host "10th School Name"
$tenthMarks = Read-Host "10th Marks (0-100)"
$twelfthSchool = Read-Host "12th School Name"
$twelfthMarks = Read-Host "12th Marks (0-100)"
$cutoff = Read-Host "Cut-off Marks"

Write-Host ""
Write-Host "Registering student..." -ForegroundColor Yellow

# Validate phone number
if ($phone -notmatch '^\d{10}$') {
    Write-Host "❌ Phone number must be exactly 10 digits" -ForegroundColor Red
    exit 1
}

# Prepare registration data
$registerData = @{
    name = $name
    email = $email
    phone = $phone
    password = $passwordPlain
    dob = $dob
    school_name = $schoolName
    father_name = $fatherName
    aadhar_number = $aadharNumber
    tenth_school = $tenthSchool
    tenth_marks = [int]$tenthMarks
    twelfth_school = $twelfthSchool
    twelfth_marks = [int]$twelfthMarks
    cutoff = [int]$cutoff
    department = $department
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerData
    
    Write-Host ""
    Write-Host "✅ Student registered successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Student Details:" -ForegroundColor Cyan
    Write-Host "   User ID: $($response.data.user_id)" -ForegroundColor White
    Write-Host "   Student ID: $($response.data.student_id)" -ForegroundColor White
    Write-Host "   Name: $name" -ForegroundColor White
    Write-Host "   Email: $email" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Note: Student is pending admin approval." -ForegroundColor Yellow
    Write-Host "   Admin needs to approve the student before they can use the system." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 To approve the student:" -ForegroundColor Cyan
    Write-Host "   1. Login as admin in the admin dashboard" -ForegroundColor White
    Write-Host "   2. Find the student in the Users tab" -ForegroundColor White
    Write-Host "   3. Click the 'Approve' button" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Error registering student" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        
        Write-Host "   Status: $statusCode $statusDescription" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            $errorStream.Close()
            
            try {
                $errorObj = $responseBody | ConvertFrom-Json
                if ($errorObj.message) {
                    Write-Host "   Message: $($errorObj.message)" -ForegroundColor Red
                } else {
                    Write-Host "   Response: $responseBody" -ForegroundColor Red
                }
            } catch {
                Write-Host "   Response: $responseBody" -ForegroundColor Red
            }
        } catch {
            Write-Host "   Could not read error response" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   Error: $_" -ForegroundColor Red
    }
}

