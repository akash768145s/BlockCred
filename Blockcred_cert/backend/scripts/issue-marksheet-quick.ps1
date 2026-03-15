# Quick Marksheet Issuance Script
# Automatically issues a marksheet with 6-7 sample subjects
#
# IMPORTANT: Make sure the Besu blockchain node is running before using this script!
# Start Besu with: cd backend\blockchain\scripts\setup && .\start-besu.bat
# Or: cd backend && .\blockchain\scripts\setup\start-besu.bat
#
param(
    [string]$ApiUrl = "http://localhost:8080/api",
    [string]$CoeUsername = "admin@ssn.edu.in",
    [string]$CoePassword = "admin123",
    [string]$StudentEmail = "",
    [string]$StudentId = "",
    [int]$Semester = 3,
    [double]$CGPA = 8.5
)

Write-Host "📝 Quick Marksheet Issuance" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 0. Check if Besu is running
Write-Host "🔍 Checking if Besu blockchain is running..." -ForegroundColor Yellow
try {
    $besuCheck = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -TimeoutSec 2 -ErrorAction Stop | Out-Null
    Write-Host "✅ Besu blockchain is running" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Besu blockchain is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Please start the Besu blockchain first:" -ForegroundColor Yellow
    Write-Host "   1. Open a new terminal" -ForegroundColor White
    Write-Host "   2. Run: cd backend\blockchain\scripts\setup" -ForegroundColor White
    Write-Host "   3. Run: .\start-besu.bat" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or from project root:" -ForegroundColor Gray
    Write-Host "   cd backend && .\blockchain\scripts\setup\start-besu.bat" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
}

# 1. Login
$loginBody = @{
    username = $CoeUsername
    password = $CoePassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.data.token
    $authHeaders = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Authenticated as $CoeUsername" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Fetch students
try {
    $usersResponse = Invoke-RestMethod -Uri "$ApiUrl/users" `
        -Method GET `
        -Headers $authHeaders

    $students = $usersResponse.data | Where-Object { $_.role -eq "student" }
    
    if ($students.Count -eq 0) {
        throw "No students found in the system."
    }

    Write-Host "📚 Found $($students.Count) students" -ForegroundColor Yellow
    Write-Host ""

    # Select student
    $student = $null
    if ($StudentEmail -or $StudentId) {
        $student = $students | Where-Object {
            ($_.email -ieq $StudentEmail) -or ($_.student_id -eq $StudentId)
        } | Select-Object -First 1
    } else {
        # Use first student if not specified
        $student = $students | Select-Object -First 1
    }

    if (-not $student) {
        throw "Student not found. Please specify -StudentEmail or -StudentId"
    }

    Write-Host "👤 Selected Student:" -ForegroundColor Yellow
    Write-Host "   Name : $($student.name)"
    Write-Host "   Email: $($student.email)"
    Write-Host "   ID   : $($student.student_id)"
    Write-Host "   Dept : $($student.department)"
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch students: $_" -ForegroundColor Red
    exit 1
}

# 3. Generate sample subjects based on department
$department = $student.department
if (-not $department) { $department = "Computer Science and Engineering" }

# Common engineering subjects for different semesters
$subjectTemplates = @{
    "Computer Science and Engineering" = @(
        @{ code = "CS301"; name = "Data Structures and Algorithms"; marks = 85; grade = "A"; credits = 4 },
        @{ code = "CS302"; name = "Database Management Systems"; marks = 88; grade = "A+"; credits = 3 },
        @{ code = "CS303"; name = "Computer Networks"; marks = 82; grade = "A"; credits = 3 },
        @{ code = "CS304"; name = "Operating Systems"; marks = 90; grade = "A+"; credits = 4 },
        @{ code = "CS305"; name = "Software Engineering"; marks = 87; grade = "A"; credits = 3 },
        @{ code = "MA301"; name = "Probability and Statistics"; marks = 80; grade = "B+"; credits = 3 },
        @{ code = "HS301"; name = "Professional Ethics"; marks = 92; grade = "A+"; credits = 2 }
    )
    "Electronics and Communication Engineering" = @(
        @{ code = "EC301"; name = "Digital Signal Processing"; marks = 85; grade = "A"; credits = 4 },
        @{ code = "EC302"; name = "Communication Systems"; marks = 88; grade = "A+"; credits = 4 },
        @{ code = "EC303"; name = "Microprocessors and Microcontrollers"; marks = 82; grade = "A"; credits = 3 },
        @{ code = "EC304"; name = "VLSI Design"; marks = 90; grade = "A+"; credits = 3 },
        @{ code = "EC305"; name = "Antenna Theory"; marks = 87; grade = "A"; credits = 3 },
        @{ code = "MA301"; name = "Probability and Statistics"; marks = 80; grade = "B+"; credits = 3 },
        @{ code = "HS301"; name = "Professional Ethics"; marks = 92; grade = "A+"; credits = 2 }
    )
    "Electrical and Electronics Engineering" = @(
        @{ code = "EE301"; name = "Power Systems"; marks = 85; grade = "A"; credits = 4 },
        @{ code = "EE302"; name = "Control Systems"; marks = 88; grade = "A+"; credits = 4 },
        @{ code = "EE303"; name = "Electrical Machines"; marks = 82; grade = "A"; credits = 3 },
        @{ code = "EE304"; name = "Power Electronics"; marks = 90; grade = "A+"; credits = 3 },
        @{ code = "EE305"; name = "Renewable Energy Systems"; marks = 87; grade = "A"; credits = 3 },
        @{ code = "MA301"; name = "Probability and Statistics"; marks = 80; grade = "B+"; credits = 3 },
        @{ code = "HS301"; name = "Professional Ethics"; marks = 92; grade = "A+"; credits = 2 }
    )
    "Mechanical Engineering" = @(
        @{ code = "ME301"; name = "Thermodynamics"; marks = 85; grade = "A"; credits = 4 },
        @{ code = "ME302"; name = "Machine Design"; marks = 88; grade = "A+"; credits = 4 },
        @{ code = "ME303"; name = "Manufacturing Processes"; marks = 82; grade = "A"; credits = 3 },
        @{ code = "ME304"; name = "Heat Transfer"; marks = 90; grade = "A+"; credits = 3 },
        @{ code = "ME305"; name = "Fluid Mechanics"; marks = 87; grade = "A"; credits = 3 },
        @{ code = "MA301"; name = "Probability and Statistics"; marks = 80; grade = "B+"; credits = 3 },
        @{ code = "HS301"; name = "Professional Ethics"; marks = 92; grade = "A+"; credits = 2 }
    )
    "Information Technology" = @(
        @{ code = "IT301"; name = "Web Technologies"; marks = 85; grade = "A"; credits = 4 },
        @{ code = "IT302"; name = "Information Security"; marks = 88; grade = "A+"; credits = 3 },
        @{ code = "IT303"; name = "Cloud Computing"; marks = 82; grade = "A"; credits = 3 },
        @{ code = "IT304"; name = "Mobile Application Development"; marks = 90; grade = "A+"; credits = 3 },
        @{ code = "IT305"; name = "Data Analytics"; marks = 87; grade = "A"; credits = 3 },
        @{ code = "MA301"; name = "Probability and Statistics"; marks = 80; grade = "B+"; credits = 3 },
        @{ code = "HS301"; name = "Professional Ethics"; marks = 92; grade = "A+"; credits = 2 }
    )
    "Civil Engineering" = @(
        @{ code = "CE301"; name = "Structural Analysis"; marks = 85; grade = "A"; credits = 4 },
        @{ code = "CE302"; name = "Reinforced Concrete Design"; marks = 88; grade = "A+"; credits = 4 },
        @{ code = "CE303"; name = "Geotechnical Engineering"; marks = 82; grade = "A"; credits = 3 },
        @{ code = "CE304"; name = "Transportation Engineering"; marks = 90; grade = "A+"; credits = 3 },
        @{ code = "CE305"; name = "Environmental Engineering"; marks = 87; grade = "A"; credits = 3 },
        @{ code = "MA301"; name = "Probability and Statistics"; marks = 80; grade = "B+"; credits = 3 },
        @{ code = "HS301"; name = "Professional Ethics"; marks = 92; grade = "A+"; credits = 2 }
    )
    "Chemical Engineering" = @(
        @{ code = "CH301"; name = "Chemical Reaction Engineering"; marks = 85; grade = "A"; credits = 4 },
        @{ code = "CH302"; name = "Process Control"; marks = 88; grade = "A+"; credits = 3 },
        @{ code = "CH303"; name = "Mass Transfer Operations"; marks = 82; grade = "A"; credits = 3 },
        @{ code = "CH304"; name = "Process Design"; marks = 90; grade = "A+"; credits = 4 },
        @{ code = "CH305"; name = "Plant Safety and Environment"; marks = 87; grade = "A"; credits = 3 },
        @{ code = "MA301"; name = "Probability and Statistics"; marks = 80; grade = "B+"; credits = 3 },
        @{ code = "HS301"; name = "Professional Ethics"; marks = 92; grade = "A+"; credits = 2 }
    )
    "Biomedical Engineering" = @(
        @{ code = "BM301"; name = "Biomedical Instrumentation"; marks = 85; grade = "A"; credits = 4 },
        @{ code = "BM302"; name = "Biomedical Signal Processing"; marks = 88; grade = "A+"; credits = 3 },
        @{ code = "BM303"; name = "Biomaterials"; marks = 82; grade = "A"; credits = 3 },
        @{ code = "BM304"; name = "Medical Imaging Systems"; marks = 90; grade = "A+"; credits = 3 },
        @{ code = "BM305"; name = "Biomechanics"; marks = 87; grade = "A"; credits = 3 },
        @{ code = "MA301"; name = "Probability and Statistics"; marks = 80; grade = "B+"; credits = 3 },
        @{ code = "HS301"; name = "Professional Ethics"; marks = 92; grade = "A+"; credits = 2 }
    )
}

# Select subjects based on department, fallback to CSE
$subjects = $subjectTemplates[$department]
if (-not $subjects) {
    $subjects = $subjectTemplates["Computer Science and Engineering"]
    Write-Host "⚠️  Department '$department' not found, using CSE subjects" -ForegroundColor Yellow
}

Write-Host "📋 Generated Subjects ($($subjects.Count) subjects):" -ForegroundColor Yellow
foreach ($subj in $subjects) {
    Write-Host "   $($subj.code) - $($subj.name) | Marks: $($subj.marks) | Grade: $($subj.grade) | Credits: $($subj.credits)"
}
Write-Host ""

# 4. Create sample PDF content
$pdfContent = @"
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
72 720 Td
(Semester $Semester Marksheet - $($student.student_id)) Tj
0 -20 Td
(Student: $($student.name)) Tj
0 -20 Td
(CGPA: $CGPA) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
404
%%EOF
"@

$fileDataBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pdfContent))
$fileName = "marksheet_$($student.student_id)_sem$($Semester)_$(Get-Date -Format 'yyyyMMdd').pdf"

# 5. Build metadata with subjects
$now = Get-Date
$metadata = @{
    student_name = $student.name
    student_email = $student.email
    issuer_name = "COE Office"
    issuer_role = "coe"
    institution = "SSN College of Engineering"
    course = $department
    semester = $Semester.ToString()
    academic_year = "2024-25"
    cgpa = $CGPA
    valid_from = $now.ToString("yyyy-MM-ddTHH:mm:ssZ")
    valid_until = $now.AddYears(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
    description = "marksheet certificate"
    subjects = $subjects | ForEach-Object {
        @{
            subject_code = $_.code
            subject_name = $_.name
            marks = $_.marks
            grade = $_.grade
            credits = $_.credits
        }
    }
}

$certificatePayload = @{
    student_id = $student.student_id
    cert_type = "marksheet"
    file_data = $fileDataBase64
    file_name = $fileName
    metadata = $metadata
} | ConvertTo-Json -Depth 10

# 6. Issue certificate
Write-Host "🚀 Issuing marksheet..." -ForegroundColor Yellow
Write-Host "   Semester: $Semester" -ForegroundColor Gray
Write-Host "   CGPA: $CGPA" -ForegroundColor Gray
Write-Host ""

try {
    $rawResponse = Invoke-WebRequest -Uri "$ApiUrl/certificates/issue" `
        -Method POST `
        -Headers $authHeaders `
        -Body $certificatePayload `
        -SkipHttpErrorCheck

    if ($rawResponse.StatusCode -ge 400) {
        Write-Host "❌ Failed to issue marksheet" -ForegroundColor Red
        Write-Host ("Status: {0}" -f $rawResponse.StatusCode) -ForegroundColor Red
        if ($rawResponse.Content) {
            $errorData = $rawResponse.Content | ConvertFrom-Json
            Write-Host ("Error: {0}" -f $errorData.message) -ForegroundColor Red
        }
        exit 1
    }

    $issueResponse = $rawResponse.Content | ConvertFrom-Json
    $cert = $issueResponse.data
    Write-Host "✅ Marksheet issued successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Certificate Details:" -ForegroundColor Cyan
    Write-Host "   Certificate ID : $($cert.cert_id)"
    Write-Host "   Transaction    : $($cert.tx_hash)"
    Write-Host "   Block Number   : $($cert.block_number)"
    Write-Host "   IPFS URL       : $($cert.ipfs_url)"
    Write-Host ""
    Write-Host "🎓 View the certificate in the student dashboard!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to issue marksheet" -ForegroundColor Red
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    } else {
        Write-Host $_ -ForegroundColor Red
    }
    exit 1
}

