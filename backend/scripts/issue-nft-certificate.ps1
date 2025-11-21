# Issue an NFT-style certificate for a specific student
param(
    [string]$ApiUrl = "http://localhost:8080/api",
    [string]$AdminUsername = "admin@ssn.edu.in",
    [string]$AdminPassword = "admin123",
    [string]$StudentEmail = "rowan.davis.17636548@student.ssn.edu.in",
    [string]$StudentId = "SHS202588RD"
)

Write-Host "🎨 Minting NFT Certificate for $StudentEmail" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login
$loginBody = @{
    username = $AdminUsername
    password = $AdminPassword
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
    Write-Host "✅ Authenticated as $AdminUsername" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Locate the student
try {
    $usersResponse = Invoke-RestMethod -Uri "$ApiUrl/users" `
        -Method GET `
        -Headers $authHeaders

    $student = $usersResponse.data | Where-Object {
        $_.role -eq "student" -and (
            ($_.email -ieq $StudentEmail) -or
            ($_.student_id -eq $StudentId)
        )
    } | Select-Object -First 1

    if (-not $student) {
        throw "Student with email '$StudentEmail' or ID '$StudentId' not found."
    }

    Write-Host "👤 Target student:" -ForegroundColor Yellow
    Write-Host "   Name : $($student.name)"
    Write-Host "   Email: $($student.email)"
    Write-Host "   ID   : $($student.student_id)"
    Write-Host ""
} catch {
    Write-Host "❌ Failed to fetch student: $_" -ForegroundColor Red
    exit 1
}

$department = $student.department
if (-not $department) { $department = "Electronics and Communication Engineering" }

# 3. Build NFT-style certificate artifact
$nftDocument = @{
    certificate_title = "NFT Academic Credential"
    student = @{
        name = $student.name
        student_id = $student.student_id
        email = $student.email
        department = $department
    }
    issuer = @{
        name = "SSN Blockchain Credentials Cell"
        role = "coe"
    }
    nft = @{
        token_standard = "ERC-721"
        chain = "Hyperledger Besu PoA"
        mint_timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        artwork_cid = "ipfs://pending-upload"
        traits = @(
            @{ trait_type = "Credential"; value = "NFT Certificate" },
            @{ trait_type = "Program"; value = $department },
            @{ trait_type = "Student ID"; value = $student.student_id },
            @{ trait_type = "Email"; value = $student.email }
        )
    }
} | ConvertTo-Json -Depth 10

$fileDataBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($nftDocument))
$fileName = "nft-certificate-$($student.student_id).json"

# 4. Assemble metadata payload
$now = Get-Date
$metadata = @{
    student_name = $student.name
    student_email = $student.email
    issuer_name = "SSN Blockchain Credentials Cell"
    issuer_role = "coe"
    institution = "SSN College of Engineering"
    department = $department
    course = "B.Tech - Electronics and Communication Engineering"
    academic_year = "2024-2025"
    grade = "Distinction"
    valid_from = $now.ToString("yyyy-MM-ddTHH:mm:ssZ")
    valid_until = $now.AddYears(5).ToString("yyyy-MM-ddTHH:mm:ssZ")
    description = "NFT-bound academic credential minted on the SSN BlockCred Besu network."
    additional_data = @{
        nft = @{
            collection = "BlockCred Academic Genesis"
            token_standard = "ERC-721"
            display_image = "https://dummyimage.com/600x400/0f172a/ffffff&text=$($student.student_id)"
            external_url = "https://blockcred.local/nft/$($student.student_id)"
            attributes = @(
                @{ trait_type = "Credential Type"; value = "NFT Certificate" }
                @{ trait_type = "Chain"; value = "Hyperledger Besu (Clique)" }
                @{ trait_type = "Student"; value = $student.name }
            )
        }
    }
}

$certificatePayload = @{
    student_id = $student.student_id
    cert_type = "nft_certificate"
    file_data = $fileDataBase64
    file_name = $fileName
    metadata = $metadata
} | ConvertTo-Json -Depth 10

# 5. Issue certificate
Write-Host "🚀 Issuing NFT certificate..." -ForegroundColor Yellow

try {
    $rawResponse = Invoke-WebRequest -Uri "$ApiUrl/certificates/issue" `
        -Method POST `
        -Headers $authHeaders `
        -Body $certificatePayload `
        -SkipHttpErrorCheck

    if ($rawResponse.StatusCode -ge 400) {
        Write-Host "❌ Failed to issue certificate" -ForegroundColor Red
        Write-Host ("Status: {0}" -f $rawResponse.StatusCode) -ForegroundColor Red
        if ($rawResponse.Content) {
            Write-Host $rawResponse.Content -ForegroundColor Red
        }
        exit 1
    }

    $issueResponse = $rawResponse.Content | ConvertFrom-Json
    $cert = $issueResponse.data
    Write-Host "✅ NFT certificate issued!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Certificate ID : $($cert.cert_id)"
    Write-Host "Transaction    : $($cert.tx_hash)"
    Write-Host "Block Number   : $($cert.block_number)"
    Write-Host "IPFS URL       : $($cert.ipfs_url)"
    Write-Host ""
    Write-Host "Use view-certificate.ps1 or the student dashboard to inspect the on-chain record." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to issue certificate" -ForegroundColor Red
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    } else {
        Write-Host $_ -ForegroundColor Red
    }
    exit 1
}

