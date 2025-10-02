# Teams App Deployment Script
# This script helps deploy the Teams app package

Write-Host "🚀 Teams App Deployment Helper" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check if the Teams app package exists
$teamsPackage = "TeamsApp-Fixed.zip"
if (Test-Path $teamsPackage) {
    Write-Host "✅ Teams app package found: $teamsPackage" -ForegroundColor Green
} else {
    Write-Host "❌ Teams app package not found: $teamsPackage" -ForegroundColor Red
    Write-Host "Available packages:" -ForegroundColor Yellow
    Get-ChildItem -Name "*.zip" | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    exit 1
}

Write-Host ""
Write-Host "📋 Deployment Options:" -ForegroundColor Cyan
Write-Host "1. Teams Developer Portal (Recommended for development)" -ForegroundColor White
Write-Host "2. Teams Admin Center (For organization deployment)" -ForegroundColor White
Write-Host "3. Teams Client (Direct sideloading)" -ForegroundColor White
Write-Host ""

# Get user choice
$choice = Read-Host "Select deployment method (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🌐 Opening Teams Developer Portal..." -ForegroundColor Green
        Start-Process "https://dev.teams.microsoft.com"
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Sign in with your Microsoft 365 account" -ForegroundColor White
        Write-Host "2. Click 'Apps' in the left navigation" -ForegroundColor White
        Write-Host "3. Click 'Import app'" -ForegroundColor White
        Write-Host "4. Select the file: $teamsPackage" -ForegroundColor White
        Write-Host "5. Click 'Publish to org' for testing" -ForegroundColor White
    }
    "2" {
        Write-Host ""
        Write-Host "🌐 Opening Teams Admin Center..." -ForegroundColor Green
        Start-Process "https://admin.teams.microsoft.com"
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Sign in with your admin account" -ForegroundColor White
        Write-Host "2. Navigate to 'Teams apps' → 'Manage apps'" -ForegroundColor White
        Write-Host "3. Click 'Upload new app'" -ForegroundColor White
        Write-Host "4. Select the file: $teamsPackage" -ForegroundColor White
        Write-Host "5. Configure permissions and availability" -ForegroundColor White
    }
    "3" {
        Write-Host ""
        Write-Host "🌐 Opening Microsoft Teams..." -ForegroundColor Green
        Start-Process "msteams:"
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. In Teams, click 'Apps' in the left sidebar" -ForegroundColor White
        Write-Host "2. Click 'Upload a custom app' at the bottom" -ForegroundColor White
        Write-Host "3. Select 'Upload for me or my teams'" -ForegroundColor White
        Write-Host "4. Select the file: $teamsPackage" -ForegroundColor White
        Write-Host "5. Click 'Add' to install the app" -ForegroundColor White
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📦 App Package Location:" -ForegroundColor Cyan
Write-Host "   $(Get-Location)\$teamsPackage" -ForegroundColor White
Write-Host ""
Write-Host "🔧 App Configuration:" -ForegroundColor Cyan
Write-Host "   Client ID: d136cbae-329b-4df5-a97a-9b22f97a7dd8" -ForegroundColor White
Write-Host "   Web App URL: https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net" -ForegroundColor White
Write-Host ""
Write-Host "✅ Ready for deployment!" -ForegroundColor Green