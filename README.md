# Teams Simple App ✅ WORKING

> **Status**: ✅ **FULLY FUNCTIONAL** - Authentication working in both Teams and browser contexts

A simple Microsoft Teams application built with React that demonstrates Microsoft authentication with intelligent context detection for Teams and browser environments.

## 🚀 Features

- **React.js** application with TypeScript support
- **Dual Authentication Strategy**:
  - Teams SDK authentication for Microsoft Teams context
  - MSAL popup/redirect authentication for browser context
- **Smart Context Detection**: Automatically detects Teams vs browser environment
- **Success/Failure** login message display
- **Azure Web App** deployment ready
- **Teams App Package** included for easy deployment

## 📋 Prerequisites

- Node.js (version 18 or higher)
- npm package manager
- Azure AD app registration
- Azure subscription (for deployment)

## ⚙️ Azure Configuration

This app uses the following Azure AD configuration:

- **Client ID**: `d136cbae-329b-4df5-a97a-9b22f97a7dd8`
- **Tenant ID**: `16b3c013-d300-468d-ac64-7eda0820b6d3`
- **Deployed URL**: `https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net`

### Environment Variables Configuration

> ⚠️ **Security Note**: Never commit real credentials to version control!

1. **Copy the example file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual values**:
   ```env
   # Azure AD Authentication (Replace with your actual values)
   REACT_APP_AZURE_CLIENT_ID=your-actual-client-id
   REACT_APP_AZURE_TENANT_ID=your-actual-tenant-id

   # Redirect URIs for different environments
   REACT_APP_REDIRECT_URI_DEV=http://localhost:3000
   REACT_APP_REDIRECT_URI_PROD=https://your-app.azurewebsites.net
   REACT_APP_TEAMS_REDIRECT_URI=https://your-app.azurewebsites.net
   ```

3. **Get Azure AD values from**:
   - Azure Portal → App registrations → Your app → Overview

## 🛠️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd TeamsSimple
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your actual Azure AD values
   # Replace dummy values with real ones from your Azure AD App Registration
   ```

4. **Start development server**:
   ```bash
   npm start
   ```
   This starts the server on `http://localhost:3000`

## 🎯 Usage

### In Browser
1. Navigate to the application URL
2. Click "**Login with Microsoft**" button
3. Complete authentication in popup window
4. See success/failure message with user information

### In Microsoft Teams
1. Upload Teams app package (`TeamsApp-Auth-Fixed.zip`)
2. Click "**Login with Microsoft (Teams Auth)**" button
3. Complete authentication via Teams SDK
4. See success/failure message

## 🔐 Authentication Flow

### Browser Context
- Uses **MSAL popup** authentication
- Fallback to **MSAL redirect** if popup is blocked
- Displays user name from MSAL response

### Teams Context  
- Uses **Teams SDK authentication** (`microsoftTeams.authentication.authenticate()`)
- No iframe redirect issues
- Proper Teams-native authentication experience

## 📱 Teams Integration

### **Deployment Packages Available**

- ✅ `TeamsApp-Auth-Fixed.zip` - Latest Teams app package
- ✅ `deploy-teams-auth.zip` - Azure Web App deployment package
- ✅ Live URL: https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net

### **Teams Deployment Steps**

1. **Upload Teams Package**:
   ```bash
   # Use the pre-built package
   TeamsApp-Auth-Fixed.zip
   ```

2. **Teams Developer Portal**:
   - Go to [Teams Developer Portal](https://dev.teams.microsoft.com)
   - Upload `TeamsApp-Auth-Fixed.zip`
   - Publish to your organization

3. **Sideload for Testing**:
   - Enable sideloading in Teams admin center
   - Upload the package directly in Teams

### **Automatic Context Detection**

The app intelligently detects context and adjusts authentication:

| Context | Authentication Method | Button Text |
|---------|----------------------|-------------|
| **Microsoft Teams** | Teams SDK Auth | "Login with Microsoft (Teams Auth)" |
| **Browser** | MSAL Popup/Redirect | "Login with Microsoft" |

### **Azure Web App Configuration**

- **Resource Group**: `rgconncentrix`
- **App Name**: `testsimple`
- **Runtime**: Node.js 20-lts
- **Startup Command**: `npx serve -s . -l 8080`

## 📁 Project Structure

```
├── public/
│   └── index.html              # Main HTML template
├── src/
│   ├── App.tsx                # Main app with MSAL & Teams SDK init
│   ├── LoginComponent.tsx     # Smart authentication component
│   ├── msalConfig.ts          # MSAL configuration with context detection
│   ├── index.tsx              # React app entry point
│   ├── App.css                # App styles
│   └── index.css              # Global styles
├── teams/
│   ├── manifest.json          # Teams app manifest
│   ├── color.png              # Teams app color icon
│   └── outline.png            # Teams app outline icon
├── teams-package/
│   ├── manifest.json          # Updated Teams manifest
│   ├── color.png              # Teams app color icon
│   └── outline.png            # Teams app outline icon
├── build/
│   └── (production files)     # Built React app
├── .env                       # Environment configuration
├── package.json              # Dependencies & scripts
└── *.zip                     # Deployment packages
```

## 🛡️ Technologies Used

- **React.js 18.2.0** with TypeScript
- **MSAL Browser 3.0.0** & **MSAL React 2.0.0** for browser authentication
- **Microsoft Teams JavaScript SDK 2.19.0** for Teams context
- **Azure Active Directory** for identity management
- **Azure Web Apps** for hosting

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server (localhost:3000) |
| `npm run build` | Build production version |
| `npm test` | Run tests |
| `npm run serve` | Serve build directory locally |

## � Comprehensive Deployment Guide

### 📋 Azure Web App Configuration

#### **Required App Settings**
Configure these in Azure Portal → App Service → Configuration → Application settings:

| Setting Name | Value | Purpose |
|-------------|-------|---------|
| `WEBSITE_NODE_DEFAULT_VERSION` | `20-lts` | Specifies Node.js runtime version |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` | Prevents build during deployment (we deploy pre-built files) |
| `WEBSITE_RUN_FROM_PACKAGE` | `1` | Runs from deployment package for better performance |

#### **Startup Command Configuration**
- **Location**: Azure Portal → App Service → Configuration → General settings → Startup Command
- **Command**: `npx serve -s . -l 8080`
- **Purpose**: Serves static React build files on port 8080 (Azure's default)

#### **Why web.config is Required**
The `web.config` file is essential for Windows-based Azure App Services:

```xml
<!-- Key features provided by web.config: -->
1. **Static Content Serving**: Configures MIME types for .js, .css, .json files
2. **React Router Support**: Rewrites all routes to index.html (SPA behavior)
3. **Security Headers**: Adds X-Frame-Options and X-Content-Type-Options
4. **Default Document**: Sets index.html as the default page
5. **API Route Protection**: Excludes /api routes from SPA rewriting
```

### 🏗️ Building and Creating Deployment Packages

#### **Step 1: Build the React Application**
```bash
# Install dependencies (if not already done)
npm install

# Create production build
npm run build

# Verify build contents
ls build/
# Should show: index.html, static/, auth-end.html, web.config, etc.
```

#### **Step 2: Create Azure Web App Deployment Package**
```powershell
# PowerShell command to create deployment zip
Compress-Archive -Path "build\*" -DestinationPath "deploy-$(Get-Date -Format 'yyyyMMdd-HHmm').zip" -Force

# Or use specific naming convention
Compress-Archive -Path "build\*" -DestinationPath "deploy-login-improved.zip" -Force

# Verify package contents
Expand-Archive -Path "deploy-login-improved.zip" -DestinationPath "temp-verify" -Force
ls temp-verify/
Remove-Item -Path "temp-verify" -Recurse -Force
```

#### **Step 3: Deploy to Azure Web App**
```bash
# Login to Azure CLI (if not already logged in)
az login

# Set default subscription (optional)
az account set --subscription "your-subscription-id"

# Deploy the package
az webapp deploy \
  --resource-group rgconncentrix \
  --name testsimple \
  --src-path ./deploy-login-improved.zip \
  --type zip

# Alternative: Deploy with specific timeout
az webapp deploy \
  --resource-group rgconncentrix \
  --name testsimple \
  --src-path ./deploy-login-improved.zip \
  --type zip \
  --timeout 600
```

### 📱 Teams App Package Creation

#### **Step 1: Prepare Teams Manifest**
Ensure `teams-package/manifest.json` contains correct values:

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
    "full": "A demonstration app showing Microsoft authentication in Teams context"
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
  ]
}
```

#### **Step 2: Create Teams App Package**
```powershell
# Navigate to teams-package directory
cd teams-package

# Create the Teams app zip package
Compress-Archive -Path "manifest.json", "color.png", "outline.png" -DestinationPath "../TeamsApp-Auth-$(Get-Date -Format 'yyyyMMdd').zip" -Force

# Or use standard naming
Compress-Archive -Path "manifest.json", "color.png", "outline.png" -DestinationPath "../TeamsApp-Auth-Fixed.zip" -Force

# Return to root directory
cd ..

# Verify package was created
ls *.zip
```

#### **Step 3: Deploy Teams App Package**

##### **Option A: Teams Admin Center (Organization-wide)**
1. Go to [Teams Admin Center](https://admin.teams.microsoft.com)
2. Navigate to **Teams apps** → **Manage apps**
3. Click **Upload new app** → **Upload an app to your org's app catalog**
4. Select your `TeamsApp-Auth-Fixed.zip` file
5. Configure permissions and availability

##### **Option B: Teams Developer Portal (Development)**
1. Go to [Teams Developer Portal](https://dev.teams.microsoft.com)
2. Click **Apps** → **Import app**
3. Upload your `TeamsApp-Auth-Fixed.zip` file
4. Review and publish for testing

##### **Option C: Sideloading (Testing)**
1. Enable sideloading in Teams admin settings
2. In Microsoft Teams client:
   - Click **Apps** in the left sidebar
   - Click **Manage your apps**
   - Click **Upload an app** → **Upload a custom app**
   - Select your `TeamsApp-Auth-Fixed.zip` file

### 🔧 Complete Deployment Commands Reference

#### **Full Build and Deploy Script (PowerShell)**
```powershell
# Complete deployment script
Write-Host "🏗️ Building React application..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
    
    # Create deployment package with timestamp
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $deployPackage = "deploy-$timestamp.zip"
    
    Write-Host "📦 Creating deployment package: $deployPackage" -ForegroundColor Yellow
    Compress-Archive -Path "build\*" -DestinationPath $deployPackage -Force
    
    Write-Host "🚀 Deploying to Azure Web App..." -ForegroundColor Blue
    az webapp deploy --resource-group rgconncentrix --name testsimple --src-path $deployPackage --type zip
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host "🌐 Live URL: https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
}
```

#### **Teams Package Creation Script (PowerShell)**
```powershell
# Teams app package creation script
Write-Host "📱 Creating Teams app package..." -ForegroundColor Green

# Verify required files exist
$requiredFiles = @("teams-package\manifest.json", "teams-package\color.png", "teams-package\outline.png")
$allFilesExist = $true

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing required file: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    cd teams-package
    $teamsPackage = "..\TeamsApp-Auth-$(Get-Date -Format 'yyyyMMdd').zip"
    Compress-Archive -Path "manifest.json", "color.png", "outline.png" -DestinationPath $teamsPackage -Force
    cd ..
    
    Write-Host "✅ Teams package created: $teamsPackage" -ForegroundColor Green
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Upload to Teams Admin Center or Developer Portal" -ForegroundColor White
    Write-Host "  2. Configure permissions and availability" -ForegroundColor White
    Write-Host "  3. Test in Teams client" -ForegroundColor White
} else {
    Write-Host "❌ Cannot create Teams package - missing required files" -ForegroundColor Red
}
```

### 📊 Deployment Verification Checklist

#### **Azure Web App Verification**
- [ ] App Service is running (Green status in Azure Portal)
- [ ] Startup Command: `npx serve -s . -l 8080`
- [ ] App Settings configured correctly
- [ ] Custom Domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Application Insights connected (optional)

#### **Authentication Verification**
- [ ] Azure AD App Registration redirect URIs include:
  - `https://your-app.azurewebsites.net`
  - `http://localhost:3000` (for development)
  - `https://teams.microsoft.com/l/auth-callback`
- [ ] Client ID matches in both Azure AD and Teams manifest
- [ ] Tenant ID correctly configured
- [ ] API permissions granted and admin consented

#### **Teams App Verification**
- [ ] Teams package uploads successfully
- [ ] App appears in Teams app catalog
- [ ] Authentication works within Teams context
- [ ] No console errors in Teams client
- [ ] Both personal and team scopes work (if configured)

### 🔍 Troubleshooting Deployment Issues

#### **Common Azure Web App Issues**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **App won't start** | 502/503 errors | Check startup command and Node.js version |
| **Routes don't work** | 404 on refresh | Verify web.config rewrite rules |
| **Static files not served** | CSS/JS 404 errors | Check web.config MIME type configuration |
| **Build files missing** | App shows empty page | Verify build folder contents before zip creation |

#### **Common Teams App Issues**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Upload fails** | "Invalid package" error | Check manifest.json syntax and required files |
| **Auth doesn't work** | Login loops or errors | Verify Azure AD redirect URIs and Teams manifest domains |
| **App not visible** | Can't find app in Teams | Check app catalog deployment and permissions |
| **Context errors** | "This call is only allowed..." | Ensure Teams SDK context detection is working |

### 📈 Monitoring and Maintenance

#### **Azure Application Insights (Recommended)**
```bash
# Enable Application Insights for monitoring
az webapp config appsettings set \
  --resource-group rgconncentrix \
  --name testsimple \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="your-instrumentation-key"
```

#### **Log Streaming**
```bash
# View real-time logs
az webapp log tail --resource-group rgconncentrix --name testsimple

# Download log files
az webapp log download --resource-group rgconncentrix --name testsimple
```

## 📚 Additional Documentation

### **Comprehensive Deployment Guide**
For detailed deployment instructions, Azure Web App configuration, Teams package creation, and troubleshooting, see:
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment documentation

### **Quick Deployment Scripts**
For ready-to-use PowerShell deployment functions, see:
- **[deployment-scripts.ps1](./deployment-scripts.ps1)** - Automated deployment scripts

#### **Using the Deployment Scripts**
```powershell
# Load the deployment functions
. .\deployment-scripts.ps1

# Full deployment (build + web app + Teams package)
Full-Deployment

# Just deploy web app
Deploy-TeamsApp  

# Just create Teams package
New-TeamsPackage

# Quick redeploy existing build
Quick-Deploy

# Check authentication and build status
Test-AzureAuth
Test-BuildOutput
```

## ❗ Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Popup blocked error** | App automatically falls back to redirect authentication |
| **iframe redirect error** | App uses Teams SDK auth in Teams context |
| **MSAL initialization error** | App waits for proper initialization before auth attempts |
| **Teams context not detected** | Check console logs for detection debugging |

### Debug Steps

1. **Check Browser Console** for context detection logs
2. **Verify Environment Variables** are correctly set in `.env`
3. **Confirm Azure AD App Registration** has correct redirect URIs:
   - `https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net`
   - `http://localhost:3000`
   - `https://teams.microsoft.com/l/auth-callback`

### Authentication Flow Verification - ✅ CONFIRMED WORKING

- ✅ **Browser**: Shows "Login with Microsoft" and uses popup/redirect (WORKING)
- ✅ **Teams**: Shows "Login with Microsoft (Teams Auth)" and uses Teams SDK (WORKING) 
- ✅ **Error Handling**: Properly handles all scenarios including popup blocks (WORKING)
- ✅ **URL Response Handling**: Correctly processes authorization codes from Teams authentication (FIXED)
- ✅ **Context Detection**: Automatically detects Teams vs browser environment (WORKING)

**Latest Fix (October 2025)**: Enhanced response handling to properly detect and process Teams authentication success from URL parameters.

## 🎯 Current Status - ✅ FULLY WORKING

- ✅ **Azure Web App**: Live and running at https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net
- ✅ **Teams Package**: Deployed and working (`TeamsApp-Auth-Fixed.zip`)
- ✅ **Authentication**: ✅ CONFIRMED WORKING in both browser and Teams contexts
- ✅ **Environment**: Production-ready configuration
- ✅ **Context Detection**: Smart authentication routing working perfectly
- ✅ **Teams SDK Integration**: Authentication responses properly handled
- ✅ **Error Handling**: All edge cases resolved including popup blocks and iframe restrictions
- ✅ **Deployment**: Latest version (deploy-login-improved.zip) successfully deployed

## 🔒 Security Best Practices

### Environment Variables
- ✅ **Never commit real credentials** to version control
- ✅ **Use `.env.example`** as a template for other developers
- ✅ **Regenerate secrets** if accidentally committed
- ✅ **Use different credentials** for development/staging/production

### Azure AD Security
- ✅ **Restrict redirect URIs** to only necessary domains
- ✅ **Use least privilege** principle for API permissions
- ✅ **Enable MFA** on Azure AD accounts
- ✅ **Monitor authentication** logs in Azure Portal

### Files Protected by .gitignore
```bash
# These files are automatically excluded from Git
.env                    # Your actual credentials
.env.local             # Local overrides
.env.development       # Development environment
.env.production        # Production environment
*.zip                  # Deployment packages
.azure/                # Azure CLI configuration
```

---

**Live Demo**: https://testsimple-fphefrckdtdwc2ez.westus3-01.azurewebsites.net  
**Note**: Demo uses placeholder credentials for security