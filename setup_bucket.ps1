$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY
if (-not $serviceKey) {
  Write-Host "Error: Set SUPABASE_SERVICE_ROLE_KEY before running this script." -ForegroundColor Red
  exit 1
}

$supabaseUrl = $env:SUPABASE_URL
if (-not $supabaseUrl) {
  Write-Host "Error: Set SUPABASE_URL before running this script." -ForegroundColor Red
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $serviceKey"
  "apikey"        = $serviceKey
}

# 1. Create the 'resumes' storage bucket
Write-Host "Creating 'resumes' storage bucket..." -ForegroundColor Cyan
try {
  $result = Invoke-RestMethod -Uri "$supabaseUrl/storage/v1/bucket" `
    -Method POST -Headers $headers -ContentType "application/json" `
    -Body '{"id":"resumes","name":"resumes","public":true}'
  Write-Host "Bucket created successfully!" -ForegroundColor Green
  $result | ConvertTo-Json
} catch {
  $err = $_.ErrorDetails.Message
  if ($err -match "already exists") {
    Write-Host "Bucket already exists - OK!" -ForegroundColor Yellow
  } else {
    Write-Host "Error: $err" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
  }
}

Write-Host "`nDone! Now try uploading your resume again." -ForegroundColor Green
