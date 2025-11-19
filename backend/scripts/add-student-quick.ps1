# Quick script to add a sample student with random data (for testing)
# Usage: .\scripts\add-student-quick.ps1
# Each run generates unique student data

$API_URL = "http://localhost:8080/api"

Write-Host "🎓 Adding Sample Student (Random Data)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Generate random data
$random = Get-Random
$timestamp = [int](Get-Date -UFormat %s)
$uniqueId = "$($timestamp)$($random)".Substring(0, [Math]::Min(8, "$($timestamp)$($random)".Length))

# First names and last names for random generation
$firstNames = @("Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Sage", "River", "Blake", "Cameron", "Dakota", "Emery", "Finley", "Harper", "Hayden", "Jamie", "Kai", "Logan", "Noah", "Parker", "Reese", "Rowan", "Skyler")
$lastNames = @("Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez", "Clark")

# Departments
$departments = @(
    "Electrical and Electronics Engineering",
    "Electronics and Communication Engineering",
    "Computer Science and Engineering",
    "Information Technology",
    "Mechanical Engineering",
    "Chemical Engineering",
    "Biomedical Engineering",
    "Civil Engineering"
)

# Schools
$schools = @(
    "SSN High School",
    "SSN Higher Secondary School",
    "SSN Public School",
    "SSN International School",
    "SSN Academy",
    "SSN Central School"
)

# Generate random student data
$firstName = $firstNames | Get-Random
$lastName = $lastNames | Get-Random
$fullName = "$firstName $lastName"
$email = "$($firstName.ToLower()).$($lastName.ToLower()).$uniqueId@student.ssn.edu.in"

# Generate random phone number (10 digits, starting with 9)
$phone = "9" + (Get-Random -Minimum 100000000 -Maximum 999999999).ToString()

# Generate random Aadhar number (12 digits)
$aadharNumber = (Get-Random -Minimum 100000000000 -Maximum 999999999999).ToString()

# Generate random date of birth (between 2000 and 2005)
$year = Get-Random -Minimum 2000 -Maximum 2006
$month = Get-Random -Minimum 1 -Maximum 13
$day = Get-Random -Minimum 1 -Maximum 29
$dob = "$year-$($month.ToString('00'))-$($day.ToString('00'))"

# Generate random marks (between 75 and 95)
$tenthMarks = Get-Random -Minimum 75 -Maximum 96
$twelfthMarks = Get-Random -Minimum 75 -Maximum 96
$cutoff = $tenthMarks + $twelfthMarks + (Get-Random -Minimum 5 -Maximum 15)

# Random selections
$department = $departments | Get-Random
$schoolName = $schools | Get-Random
$tenthSchool = $schools | Get-Random
$twelfthSchool = $schools | Get-Random

# Generate father name (different last name)
$fatherLastName = $lastNames | Get-Random
$fatherNames = @("Robert", "James", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Christopher")
$fatherName = "$($fatherNames | Get-Random) $fatherLastName"

# Sample student data
$studentData = @{
    name = $fullName
    email = $email
    phone = $phone
    password = "student123"
    dob = $dob
    school_name = $schoolName
    father_name = $fatherName
    aadhar_number = $aadharNumber
    tenth_school = $tenthSchool
    tenth_marks = $tenthMarks
    twelfth_school = $twelfthSchool
    twelfth_marks = $twelfthMarks
    cutoff = $cutoff
    department = $department
} | ConvertTo-Json

$studentObj = $studentData | ConvertFrom-Json
Write-Host "📝 Generated Student Data:" -ForegroundColor Yellow
Write-Host "   Name: $($studentObj.name)" -ForegroundColor White
Write-Host "   Email: $($studentObj.email)" -ForegroundColor White
Write-Host "   Phone: $($studentObj.phone)" -ForegroundColor White
Write-Host "   Department: $($studentObj.department)" -ForegroundColor White
Write-Host "   DOB: $($studentObj.dob)" -ForegroundColor White
Write-Host ""
Write-Host "Registering student..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$API_URL/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $studentData
    
    Write-Host ""
    Write-Host "✅ Student registered successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Student Details:" -ForegroundColor Cyan
    Write-Host "   User ID: $($response.data.user_id)" -ForegroundColor White
    Write-Host "   Student ID: $($response.data.student_id)" -ForegroundColor White
    Write-Host "   Name: $($studentObj.name)" -ForegroundColor White
    Write-Host "   Email: $($studentObj.email)" -ForegroundColor White
    Write-Host "   Phone: $($studentObj.phone)" -ForegroundColor White
    Write-Host "   Department: $($studentObj.department)" -ForegroundColor White
    Write-Host "   Aadhar: $($studentObj.aadhar_number)" -ForegroundColor White
    Write-Host "   10th Marks: $($studentObj.tenth_marks)" -ForegroundColor White
    Write-Host "   12th Marks: $($studentObj.twelfth_marks)" -ForegroundColor White
    Write-Host "   Cutoff: $($studentObj.cutoff)" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Note: Student is pending admin approval." -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error registering student" -ForegroundColor Red
    
    if ($_.Exception.Response) {
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
                }
            } catch {
                Write-Host "   Response: $responseBody" -ForegroundColor Red
            }
        } catch {
            Write-Host "   Error: $_" -ForegroundColor Red
        }
    }
}

