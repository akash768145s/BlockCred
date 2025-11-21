# Quick script to check admin user role
$API_URL = "http://localhost:8080/api"

Write-Host "🔍 Checking Admin User Role" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Login
$loginBody = @{
    username = "admin@ssn.edu.in"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.data.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host ""
    
    # Get users
    $users = Invoke-RestMethod -Uri "$API_URL/users" `
        -Method GET `
        -Headers $headers
    
    $admin = $users.data | Where-Object { $_.email -eq "admin@ssn.edu.in" } | Select-Object -First 1
    
    if ($admin) {
        Write-Host "👤 Admin User Details:" -ForegroundColor Yellow
        Write-Host "   Name: $($admin.name)"
        Write-Host "   Email: $($admin.email)"
        Write-Host "   Role: $($admin.role)" -ForegroundColor $(if ($admin.role -eq "ssn_main_admin") { "Green" } else { "Red" })
        Write-Host "   ID: $($admin.id)"
        Write-Host ""
        
        if ($admin.role -ne "ssn_main_admin") {
            Write-Host "⚠️  WARNING: Admin role is '$($admin.role)' but should be 'ssn_main_admin'" -ForegroundColor Red
        } else {
            Write-Host "✅ Admin role is correct!" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Admin user not found!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response: $body" -ForegroundColor Red
    }
}

