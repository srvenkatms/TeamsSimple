# Teams Simple App - Deployment Guide

## 🎯 Overview

This guide provides detailed instructions for deploying the Teams Simple App to Azure Web App and creating Teams app packages. This documentation covers all aspects of configuration, deployment, and troubleshooting.

## 🏗️ Azure Web App Configuration Deep Dive

### Required Azure App Service Settings

#### Application Settings (Environment Variables)
Configure these in **Azure Portal → App Service → Configuration → Application settings**:

```json
{
  "WEBSITE_NODE_DEFAULT_VERSION": "20-lts",
  "SCM_DO_BUILD_DURING_DEPLOYMENT": "false", 
  "WEBSITE_RUN_FROM_PACKAGE": "1",
  "WEBSITES_ENABLE_APP_SERVICE_STORAGE": "false"
}
```

#### General Settings
- **Runtime stack**: Node.js
- **Node.js version**: 20 LTS
- **Platform**: 64-bit (recommended)
- **WebSocket**: Off (not required for this app)
- **Always On**: On (prevents app from sleeping)
- **ARR Affinity**: Off (improves performance)

#### Startup Command Details
```bash
# Startup Command: npx serve -s . -l 8080
# Breakdown:
# npx: Node package executor
# serve: Static file server package
# -s: Single Page Application mode (serves index.html for unknown routes)
# .: Serve current directory (where build files are)
# -l 8080: Listen on port 8080 (Azure's default internal port)
```

### Why web.config is Essential

The `web.config` file is crucial for Windows-based Azure App Services because:

#### 1. **IIS Configuration**
Azure Web Apps run on IIS (Internet Information Services) on Windows, which requires XML configuration.

#### 2. **MIME Type Configuration**
```xml
<staticContent>
  <mimeMap fileExtension=".json" mimeType="application/json" />
  <mimeMap fileExtension=".js" mimeType="text/javascript" />
  <mimeMap fileExtension=".css" mimeType="text/css" />
</staticContent>
```
**Purpose**: Ensures IIS serves React build files with correct Content-Type headers.

#### 3. **Single Page Application (SPA) Support**
```xml
<rewrite>
  <rules>
    <rule name="React Router" stopProcessing="true">
      <match url=".*" />
      <conditions logicalGrouping="MatchAll">
        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
        <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
      </conditions>
      <action type="Rewrite" url="/" />
    </rule>
  </rules>
</rewrite>
```
**Purpose**: Redirects all non-file requests to `index.html`, enabling client-side routing.

#### 4. **Security Headers**
```xml
<httpProtocol>
  <customHeaders>
    <add name="X-Frame-Options" value="SAMEORIGIN" />
    <add name="X-Content-Type-Options" value="nosniff" />
  </customHeaders>
</httpProtocol>
```
**Purpose**: Adds security headers to prevent clickjacking and MIME-type attacks.

## 📦 Building and Packaging Process

### Step-by-Step Build Process

#### 1. **Environment Verification**
```bash
# Check Node.js version (should be 18+ for React 18)
node --version

# Check npm version
npm --version

# Verify all dependencies are installed
npm ls --depth=0
```

#### 2. **Production Build Creation**
```bash
# Clean previous builds (optional)
rm -rf build/

# Install dependencies (if not done)
npm install

# Create optimized production build
npm run build

# Verify build output
ls -la build/
```

**Expected build/ contents**:
```
build/
├── index.html              # Main SPA entry point
├── auth-end.html           # Teams authentication callback
├── web.config              # IIS configuration
├── asset-manifest.json     # Build manifest
└── static/
    ├── css/
    │   ├── main.[hash].css
    │   └── main.[hash].css.map
    └── js/
        ├── main.[hash].js
        ├── main.[hash].js.map
        └── main.[hash].js.LICENSE.txt
```

#### 3. **Deployment Package Creation**

##### PowerShell Method (Recommended for Windows):
```powershell
# Method 1: With timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$packageName = "deploy-$timestamp.zip"
Compress-Archive -Path "build\*" -DestinationPath $packageName -Force
Write-Host "Created package: $packageName"

# Method 2: Standard naming
Compress-Archive -Path "build\*" -DestinationPath "deploy-latest.zip" -Force

# Method 3: Validate package contents
Compress-Archive -Path "build\*" -DestinationPath "deploy-verify.zip" -Force
Expand-Archive -Path "deploy-verify.zip" -DestinationPath "temp-check" -Force
Get-ChildItem "temp-check" -Recurse
Remove-Item -Path "temp-check" -Recurse -Force
Remove-Item -Path "deploy-verify.zip" -Force
```

##### Bash/Linux Method:
```bash
# Create timestamped package
timestamp=$(date +"%Y%m%d-%H%M%S")
zip -r "deploy-$timestamp.zip" build/*

# Create standard package
zip -r deploy-latest.zip build/*

# Verify package contents
unzip -l deploy-latest.zip
```

## 🚀 Azure Deployment Commands

### Azure CLI Authentication and Setup
```bash
# Login to Azure (opens browser for authentication)
az login

# List available subscriptions
az account list --output table

# Set default subscription
az account set --subscription "your-subscription-id-or-name"

# Verify current subscription
az account show --output table
```

### Deployment Commands with Examples

#### Basic Deployment
```bash
az webapp deploy \
  --resource-group rgconncentrix \
  --name testsimple \
  --src-path ./deploy-latest.zip \
  --type zip
```

#### Advanced Deployment with Options
```bash
az webapp deploy \
  --resource-group rgconncentrix \
  --name testsimple \
  --src-path ./deploy-latest.zip \
  --type zip \
  --timeout 600 \
  --target-path "/" \
  --clean true
```

#### Deployment with Staging Slot
```bash
# Deploy to staging slot first
az webapp deploy \
  --resource-group rgconncentrix \
  --name testsimple \
  --slot staging \
  --src-path ./deploy-latest.zip \
  --type zip

# Swap staging to production after testing
az webapp deployment slot swap \
  --resource-group rgconncentrix \
  --name testsimple \
  --slot staging \
  --target-slot production
```

### Deployment Status Verification
```bash
# Check deployment status
az webapp deployment list \
  --resource-group rgconncentrix \
  --name testsimple \
  --output table

# Get deployment logs
az webapp log deployment show \
  --resource-group rgconncentrix \
  --name testsimple

# Stream live logs during deployment
az webapp log tail \
  --resource-group rgconncentrix \
  --name testsimple
```

## 📱 Teams App Package Creation

### Manifest Configuration Explained

#### Complete manifest.json Structure
```json
{
  "manifestVersion": "1.17",
  "version": "1.0.0",
  "id": "d136cbae-329b-4df5-a97a-9b22f97a7dd8",
  "packageName": "com.concentrix.teamsimple",
  "developer": {
    "name": "Concentrix Teams App",
    "websiteUrl": "https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net",
    "privacyUrl": "https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net",
    "termsOfUseUrl": "https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net"
  },
  "name": {
    "short": "Teams Simple Auth",
    "full": "Teams Simple Authentication App"
  },
  "description": {
    "short": "Simple Teams app with MSAL authentication",
    "full": "A demonstration app showing Microsoft authentication in Teams context using MSAL and Teams SDK"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "accentColor": "#FFFFFF",
  "staticTabs": [
    {
      "entityId": "index",
      "name": "Auth Demo",
      "contentUrl": "https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net",
      "scopes": ["personal"]
    }
  ],
  "permissions": ["identity"],
  "validDomains": [
    "testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net",
    "login.microsoftonline.com"
  ],
  "webApplicationInfo": {
    "id": "d136cbae-329b-4df5-a97a-9b22f97a7dd8",
    "resource": "https://graph.microsoft.com"
  }
}
```

#### Key Fields Explanation

| Field | Purpose | Notes |
|-------|---------|-------|
| `id` | Unique app identifier | Must match Azure AD App Registration Client ID |
| `validDomains` | Allowed domains for content | Include your app domain and Microsoft login domains |
| `permissions` | Required permissions | `identity` allows SSO authentication |
| `webApplicationInfo.id` | Azure AD App ID | Same as `id` field for SSO |
| `contentUrl` | Main app URL | Points to your deployed Azure Web App |

### Icon Requirements

#### Color Icon (color.png)
- **Size**: 192x192 pixels
- **Format**: PNG
- **Background**: Can be transparent or colored
- **Usage**: Shown in Teams app store and full-size displays

#### Outline Icon (outline.png)  
- **Size**: 32x32 pixels
- **Format**: PNG with transparent background
- **Color**: Monochrome (preferably white/transparent)
- **Usage**: Shown in Teams left navigation bar

### Teams Package Creation Scripts

#### Advanced PowerShell Script
```powershell
function New-TeamsAppPackage {
    param(
        [string]$ManifestPath = "teams-package\manifest.json",
        [string]$ColorIcon = "teams-package\color.png", 
        [string]$OutlineIcon = "teams-package\outline.png",
        [string]$OutputPath = "TeamsApp-Auth-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
    )
    
    # Validate required files
    $requiredFiles = @($ManifestPath, $ColorIcon, $OutlineIcon)
    $missingFiles = @()
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        Write-Error "Missing required files: $($missingFiles -join ', ')"
        return $false
    }
    
    # Validate manifest JSON
    try {
        $manifest = Get-Content $ManifestPath | ConvertFrom-Json
        Write-Host "✅ Manifest JSON is valid" -ForegroundColor Green
        Write-Host "   App Name: $($manifest.name.short)" -ForegroundColor Cyan
        Write-Host "   App ID: $($manifest.id)" -ForegroundColor Cyan
        Write-Host "   Version: $($manifest.version)" -ForegroundColor Cyan
    } catch {
        Write-Error "Invalid JSON in manifest file: $($_.Exception.Message)"
        return $false
    }
    
    # Validate icon dimensions
    Add-Type -AssemblyName System.Drawing
    
    try {
        $colorImage = [System.Drawing.Image]::FromFile((Resolve-Path $ColorIcon))
        if ($colorImage.Width -ne 192 -or $colorImage.Height -ne 192) {
            Write-Warning "Color icon should be 192x192 pixels (current: $($colorImage.Width)x$($colorImage.Height))"
        }
        $colorImage.Dispose()
    } catch {
        Write-Warning "Could not validate color icon dimensions"
    }
    
    try {
        $outlineImage = [System.Drawing.Image]::FromFile((Resolve-Path $OutlineIcon))
        if ($outlineImage.Width -ne 32 -or $outlineImage.Height -ne 32) {
            Write-Warning "Outline icon should be 32x32 pixels (current: $($outlineImage.Width)x$($outlineImage.Height))"
        }
        $outlineImage.Dispose()
    } catch {
        Write-Warning "Could not validate outline icon dimensions"
    }
    
    # Create the package
    try {
        $currentDir = Get-Location
        Set-Location (Split-Path $ManifestPath -Parent)
        
        $files = @(
            (Split-Path $ManifestPath -Leaf),
            (Split-Path $ColorIcon -Leaf),
            (Split-Path $OutlineIcon -Leaf)
        )
        
        Compress-Archive -Path $files -DestinationPath (Join-Path $currentDir $OutputPath) -Force
        Set-Location $currentDir
        
        Write-Host "✅ Teams app package created: $OutputPath" -ForegroundColor Green
        
        # Display package info
        $packageSize = (Get-Item $OutputPath).Length / 1KB
        Write-Host "   Package size: $([math]::Round($packageSize, 2)) KB" -ForegroundColor Cyan
        
        return $true
    } catch {
        Write-Error "Failed to create package: $($_.Exception.Message)"
        return $false
    }
}

# Usage
New-TeamsAppPackage
```

#### Bash Script for Linux/Mac
```bash
#!/bin/bash

create_teams_package() {
    local manifest_path="teams-package/manifest.json"
    local color_icon="teams-package/color.png"
    local outline_icon="teams-package/outline.png"
    local output_path="TeamsApp-Auth-$(date +%Y%m%d-%H%M%S).zip"
    
    # Validate required files
    local missing_files=()
    
    for file in "$manifest_path" "$color_icon" "$outline_icon"; do
        if [[ ! -f "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo "❌ Missing required files: ${missing_files[*]}"
        return 1
    fi
    
    # Validate JSON
    if ! jq . "$manifest_path" > /dev/null 2>&1; then
        echo "❌ Invalid JSON in manifest file"
        return 1
    fi
    
    # Extract app info
    local app_name=$(jq -r '.name.short' "$manifest_path")
    local app_id=$(jq -r '.id' "$manifest_path")
    local app_version=$(jq -r '.version' "$manifest_path")
    
    echo "✅ Manifest JSON is valid"
    echo "   App Name: $app_name"
    echo "   App ID: $app_id"
    echo "   Version: $app_version"
    
    # Create package
    cd teams-package
    zip "../$output_path" manifest.json color.png outline.png
    cd ..
    
    if [[ -f "$output_path" ]]; then
        local package_size=$(du -h "$output_path" | cut -f1)
        echo "✅ Teams app package created: $output_path"
        echo "   Package size: $package_size"
        return 0
    else
        echo "❌ Failed to create package"
        return 1
    fi
}

# Run the function
create_teams_package
```

## 🔧 Advanced Deployment Scenarios

### Blue-Green Deployment with Staging Slots
```bash
# Create staging slot
az webapp deployment slot create \
  --resource-group rgconncentrix \
  --name testsimple \
  --slot staging

# Deploy to staging
az webapp deploy \
  --resource-group rgconncentrix \
  --name testsimple \
  --slot staging \
  --src-path ./deploy-latest.zip \
  --type zip

# Test staging environment
curl -I https://testsimple-staging.azurewebsites.net

# Swap to production if tests pass
az webapp deployment slot swap \
  --resource-group rgconncentrix \
  --name testsimple \
  --slot staging \
  --target-slot production
```

### Automated Deployment Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure Web App

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Create deployment package
      run: |
        cd build
        zip -r ../deploy-$(date +%Y%m%d-%H%M%S).zip ./*
    
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'testsimple'
        resource-group: 'rgconncentrix'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './deploy-*.zip'
```

## 🔍 Troubleshooting Guide

### Deployment Issues

#### Issue: Build fails during npm run build
```bash
# Common causes and solutions:
1. Node.js version mismatch
   Solution: Use Node.js 18+ (check with `node --version`)

2. Memory issues during build
   Solution: Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build

3. TypeScript errors
   Solution: Fix TypeScript errors or temporarily skip
   npm run build -- --noEmit false
```

#### Issue: Azure deployment fails
```bash
# Check deployment logs
az webapp log deployment show \
  --resource-group rgconncentrix \
  --name testsimple

# Common solutions:
1. Verify zip file structure (should contain files, not build folder)
2. Check App Service Plan has enough resources
3. Ensure startup command is correct
4. Verify web.config is included in package
```

#### Issue: Teams app package upload fails
```bash
# Validation checklist:
1. Manifest.json is valid JSON
2. All required fields are present
3. Icon files are correct dimensions (192x192 and 32x32)
4. Package size is under 25MB
5. No extra files in package root

# Test manifest locally:
jq . teams-package/manifest.json
```

### Runtime Issues

#### Issue: App shows blank page
**Causes and Solutions:**
1. **Missing web.config**: Ensure web.config is in build folder
2. **Incorrect startup command**: Should be `npx serve -s . -l 8080`
3. **Build path issues**: Verify build files are in root of zip package

#### Issue: Authentication fails
**Causes and Solutions:**
1. **Redirect URI mismatch**: Check Azure AD App Registration
2. **CORS issues**: Add domain to Azure AD App's redirect URIs
3. **Teams context errors**: Verify Teams SDK initialization

#### Issue: Routes don't work (404 on refresh)
**Cause**: Missing or incorrect web.config rewrite rules
**Solution**: Ensure web.config contains proper SPA rewrite configuration

### Performance Optimization

#### Bundle Size Optimization
```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Optimize strategies:
1. Enable code splitting in React
2. Lazy load components
3. Optimize images and assets
4. Remove unused dependencies
```

#### Azure App Service Optimization
```bash
# Enable compression
az webapp config set \
  --resource-group rgconncentrix \
  --name testsimple \
  --use-32bit-worker-process false \
  --http20-enabled true

# Configure Application Insights for monitoring
az webapp config appsettings set \
  --resource-group rgconncentrix \
  --name testsimple \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-key"
```

## 📊 Monitoring and Maintenance

### Application Insights Integration
```bash
# Enable Application Insights
az monitor app-insights component create \
  --app testsimple-insights \
  --location westus3 \
  --resource-group rgconncentrix \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app testsimple-insights \
  --resource-group rgconncentrix \
  --query instrumentationKey
```

### Log Management
```bash
# Enable file system logging
az webapp log config \
  --resource-group rgconncentrix \
  --name testsimple \
  --application-logging filesystem \
  --level information

# Stream logs in real-time
az webapp log tail \
  --resource-group rgconncentrix \
  --name testsimple

# Download log files
az webapp log download \
  --resource-group rgconncentrix \
  --name testsimple \
  --log-file logs.zip
```

### Health Check Endpoint
Add to your React app for monitoring:

```typescript
// Add to public folder: health.json
{
  "status": "healthy",
  "timestamp": "auto-generated",
  "version": "1.0.0"
}

// Configure health check in Azure
az webapp config set \
  --resource-group rgconncentrix \
  --name testsimple \
  --health-check-path "/health.json"
```

## 📋 Deployment Checklist

### Pre-Deployment Checklist
- [ ] Code committed to version control
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Azure AD App Registration configured
- [ ] Teams manifest updated with correct URLs
- [ ] Build process tested locally

### Deployment Checklist
- [ ] Clean build created (`npm run build`)
- [ ] Deployment package created correctly
- [ ] Azure CLI authenticated
- [ ] Deployment command executed successfully
- [ ] Application accessible at live URL
- [ ] Authentication working in browser
- [ ] Teams app package created
- [ ] Teams app uploaded and working

### Post-Deployment Checklist
- [ ] All routes accessible
- [ ] Authentication working in both contexts
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team notified of deployment

This comprehensive guide should cover all aspects of deploying your Teams Simple App successfully!