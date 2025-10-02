# Teams Simple App - Deployment Scripts
# Quick reference scripts for common deployment tasks

# =============================================================================
# AZURE WEB APP DEPLOYMENT
# =============================================================================

# Full Build and Deploy Script (PowerShell)
function Deploy-TeamsApp {
    param(
        [string]$ResourceGroup = "rgconncentrix",
        [string]$AppName = "testsimple",
        [string]$BuildCommand = "npm run build"
    )
    
    Write-Host "🏗️ Building React application..." -ForegroundColor Green
    
    # Build the application
    Invoke-Expression $BuildCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful" -ForegroundColor Green
        
        # Create deployment package with timestamp
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $deployPackage = "deploy-$timestamp.zip"
        
        Write-Host "📦 Creating deployment package: $deployPackage" -ForegroundColor Yellow
        
        # Ensure we're packaging the build contents, not the build folder itself
        if (Test-Path "build") {
            Compress-Archive -Path "build\*" -DestinationPath $deployPackage -Force
            
            Write-Host "🚀 Deploying to Azure Web App..." -ForegroundColor Blue
            az webapp deploy --resource-group $ResourceGroup --name $AppName --src-path $deployPackage --type zip
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Deployment successful!" -ForegroundColor Green
                Write-Host "🌐 Live URL: https://$AppName.azurewebsites.net" -ForegroundColor Cyan
                
                # Clean up deployment package (optional)
                # Remove-Item $deployPackage -Force
            } else {
                Write-Host "❌ Deployment failed!" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Build folder not found!" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
    }
}

# Quick Deploy (assumes build is already done)
function Quick-Deploy {
    param(
        [string]$ResourceGroup = "rgconncentrix",
        [string]$AppName = "testsimple"
    )
    
    if (Test-Path "build") {
        $timestamp = Get-Date -Format "HHmmss"
        $deployPackage = "quick-deploy-$timestamp.zip"
        
        Compress-Archive -Path "build\*" -DestinationPath $deployPackage -Force
        az webapp deploy --resource-group $ResourceGroup --name $AppName --src-path $deployPackage --type zip
        
        Write-Host "🚀 Quick deployment completed" -ForegroundColor Green
        Remove-Item $deployPackage -Force
    } else {
        Write-Host "❌ No build folder found. Run 'npm run build' first." -ForegroundColor Red
    }
}

# =============================================================================
# TEAMS APP PACKAGE CREATION
# =============================================================================

# Create Teams App Package
function New-TeamsPackage {
    param(
        [string]$ManifestPath = "teams-package",
        [string]$OutputName = "TeamsApp-Auth-Latest.zip"
    )
    
    Write-Host "📱 Creating Teams app package..." -ForegroundColor Green
    
    # Validate required files
    $requiredFiles = @(
        "$ManifestPath\manifest.json",
        "$ManifestPath\color.png", 
        "$ManifestPath\outline.png"
    )
    
    $missingFiles = @()
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        # Change to teams-package directory and create zip
        Push-Location $ManifestPath
        Compress-Archive -Path "manifest.json", "color.png", "outline.png" -DestinationPath "..\$OutputName" -Force
        Pop-Location
        
        Write-Host "✅ Teams package created: $OutputName" -ForegroundColor Green
        Write-Host "📋 Upload this package to:" -ForegroundColor Yellow
        Write-Host "  • Teams Admin Center: https://admin.teams.microsoft.com" -ForegroundColor White
        Write-Host "  • Teams Developer Portal: https://dev.teams.microsoft.com" -ForegroundColor White
    } else {
        Write-Host "❌ Missing required files:" -ForegroundColor Red
        $missingFiles | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
    }
}

# =============================================================================
# COMBINED DEPLOYMENT (Web App + Teams Package)
# =============================================================================

function Full-Deployment {
    param(
        [string]$ResourceGroup = "rgconncentrix",
        [string]$AppName = "testsimple",
        [switch]$SkipBuild = $false
    )
    
    Write-Host "🚀 Starting full deployment process..." -ForegroundColor Cyan
    
    # Build if not skipped
    if (-not $SkipBuild) {
        Write-Host "🏗️ Building application..." -ForegroundColor Green
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed! Stopping deployment." -ForegroundColor Red
            return
        }
    }
    
    # Deploy to Azure Web App
    Write-Host "📦 Deploying to Azure Web App..." -ForegroundColor Blue
    Deploy-TeamsApp -ResourceGroup $ResourceGroup -AppName $AppName -BuildCommand "echo 'Build skipped'"
    
    # Create Teams package
    Write-Host "📱 Creating Teams app package..." -ForegroundColor Magenta  
    New-TeamsPackage
    
    Write-Host "🎉 Full deployment completed!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test web app: https://$AppName.azurewebsites.net" -ForegroundColor White
    Write-Host "2. Upload Teams package to Teams Admin Center or Developer Portal" -ForegroundColor White
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Check Azure CLI Authentication
function Test-AzureAuth {
    Write-Host "🔐 Checking Azure CLI authentication..." -ForegroundColor Blue
    
    $account = az account show 2>$null | ConvertFrom-Json
    
    if ($account) {
        Write-Host "✅ Authenticated as: $($account.user.name)" -ForegroundColor Green
        Write-Host "📋 Subscription: $($account.name)" -ForegroundColor Cyan
        Write-Host "🆔 Tenant: $($account.tenantId)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Not authenticated to Azure CLI" -ForegroundColor Red
        Write-Host "Run 'az login' to authenticate" -ForegroundColor Yellow
    }
}

# Validate Build Output
function Test-BuildOutput {
    Write-Host "🔍 Validating build output..." -ForegroundColor Blue
    
    if (Test-Path "build") {
        $buildFiles = Get-ChildItem "build" -Recurse
        
        # Check for essential files
        $requiredFiles = @("index.html", "web.config")
        $missingFiles = @()
        
        foreach ($file in $requiredFiles) {
            if (-not (Test-Path "build\$file")) {
                $missingFiles += $file
            }
        }
        
        Write-Host "📂 Build folder exists with $($buildFiles.Count) files" -ForegroundColor Green
        
        if ($missingFiles.Count -eq 0) {
            Write-Host "✅ All required files present" -ForegroundColor Green
            
            # Check if static assets exist
            $staticFiles = Get-ChildItem "build\static" -Recurse -ErrorAction SilentlyContinue
            if ($staticFiles) {
                Write-Host "📦 Static assets: $($staticFiles.Count) files" -ForegroundColor Cyan
            }
        } else {
            Write-Host "❌ Missing required files:" -ForegroundColor Red
            $missingFiles | ForEach-Object { Write-Host "  • $_" -ForegroundColor White }
        }
    } else {
        Write-Host "❌ Build folder not found. Run 'npm run build' first." -ForegroundColor Red
    }
}

# View App Service Logs
function Get-AppLogs {
    param(
        [string]$ResourceGroup = "rgconncentrix",
        [string]$AppName = "testsimple",
        [int]$Lines = 50
    )
    
    Write-Host "📋 Fetching recent logs from $AppName..." -ForegroundColor Blue
    az webapp log tail --resource-group $ResourceGroup --name $AppName --provider application
}

# =============================================================================
# EXAMPLE USAGE
# =============================================================================

<#
# Examples of how to use these functions:

# 1. Full deployment from scratch
Full-Deployment

# 2. Quick redeploy (if build already exists)
Full-Deployment -SkipBuild

# 3. Just deploy web app
Deploy-TeamsApp

# 4. Just create Teams package
New-TeamsPackage

# 5. Check if ready to deploy
Test-AzureAuth
Test-BuildOutput

# 6. View live logs
Get-AppLogs

# 7. Quick deploy without rebuilding
Quick-Deploy
#>

# =============================================================================
# BASH EQUIVALENTS (for Linux/Mac)
# =============================================================================

<#
# Bash version of key functions:

# Build and Deploy
build_and_deploy() {
    echo "🏗️ Building React application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful"
        
        timestamp=$(date +"%Y%m%d-%H%M%S")
        package_name="deploy-$timestamp.zip"
        
        echo "📦 Creating deployment package: $package_name"
        cd build && zip -r "../$package_name" ./* && cd ..
        
        echo "🚀 Deploying to Azure Web App..."
        az webapp deploy \
          --resource-group rgconncentrix \
          --name testsimple \
          --src-path "$package_name" \
          --type zip
        
        if [ $? -eq 0 ]; then
            echo "✅ Deployment successful!"
            echo "🌐 Live URL: https://testsimple.azurewebsites.net"
        else
            echo "❌ Deployment failed!"
        fi
    else
        echo "❌ Build failed!"
    fi
}

# Create Teams Package
create_teams_package() {
    echo "📱 Creating Teams app package..."
    
    if [ -f "teams-package/manifest.json" ] && [ -f "teams-package/color.png" ] && [ -f "teams-package/outline.png" ]; then
        cd teams-package
        zip "../TeamsApp-Auth-Latest.zip" manifest.json color.png outline.png
        cd ..
        echo "✅ Teams package created: TeamsApp-Auth-Latest.zip"
    else
        echo "❌ Missing required files in teams-package directory"
    fi
}
#>

Write-Host "📝 Teams Simple App Deployment Scripts Loaded" -ForegroundColor Green
Write-Host "Available functions:" -ForegroundColor Yellow
Write-Host "  • Deploy-TeamsApp      - Full build and deploy" -ForegroundColor White
Write-Host "  • Quick-Deploy         - Deploy existing build" -ForegroundColor White  
Write-Host "  • New-TeamsPackage     - Create Teams app zip" -ForegroundColor White
Write-Host "  • Full-Deployment      - Deploy both web app and Teams package" -ForegroundColor White
Write-Host "  • Test-AzureAuth       - Check Azure CLI authentication" -ForegroundColor White
Write-Host "  • Test-BuildOutput     - Validate build folder" -ForegroundColor White
Write-Host "  • Get-AppLogs          - View App Service logs" -ForegroundColor White
Write-Host ""
Write-Host "Example: Deploy-TeamsApp" -ForegroundColor Cyan