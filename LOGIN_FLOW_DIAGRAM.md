# MSAL Login Flow and Component Architecture

**Project Root**: `C:\Yr2026\concentrix\TeamsSimple\`

**Key Files**:
- `src/index.tsx` - React app entry point
- `src/App.tsx` - Main app component with Teams SDK
- `src/LoginComponent.tsx` - MSAL authentication component
- `src/msalConfig.ts` - MSAL configuration
- `teams/manifest.json` - Teams app manifest
- `.env` - Environment variables
- `public/index.html` - HTML template

## 1. Application Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Microsoft Teams (Optional)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Teams SDK Layer                          │  │
│  │  • microsoftTeams.app.initialize()                        │  │
│  │  • Teams context and theming                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Application                          │
│                   C:\Yr2026\concentrix\TeamsSimple\src\        │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   index.tsx     │───▶│    App.tsx      │───▶│LoginComponent│ │
│  │                 │    │                 │    │   .tsx      │ │
│  │ • React.render  │    │ • Teams init    │    │ • MSAL UI   │ │
│  │ • DOM mount     │    │ • MsalProvider  │    │ • Auth logic│ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MSAL Configuration Layer                     │
│           C:\Yr2026\concentrix\TeamsSimple\src\msalConfig.ts    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │     src/msalConfig.ts (Teams-Aware Configuration)          │ │
│  │                                                             │ │
│  │ • clientId: 8e687840-b448-47fb-be35-3916f5636816          │ │
│  │ • authority: login.microsoftonline.com/[tenant]            │ │
│  │ • redirectUri: getRedirectUri() [DYNAMIC]                  │ │
│  │   ├─ Teams: REACT_APP_TEAMS_REDIRECT_URI                   │ │
│  │   ├─ Dev: http://localhost:3000                            │ │
│  │   └─ Prod: REACT_APP_REDIRECT_URI_PROD                    │ │
│  │ • scopes: ["User.Read"]                                    │ │
│  │ • Teams Detection: isInTeams() function                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Teams Detection and Redirect URI Logic

```
App Initialization:
    │
    ▼
┌─────────────┐
│  isInTeams  │
│ Detection   │
└─────────────┘
    │
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Check iframe│───▶│Check Origins│───▶│Check Context│
│ window.parent│    │teams.ms.com │    │ URL params  │
│ !== window  │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
    │                    │                    │
    ▼                    ▼                    ▼
    ├─ TRUE ─────────────┤─ TRUE ─────────────┤─ TRUE
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────────────────────────────────────────────┐
│            Teams Context Detected              │
│                                                 │
│ redirectUri = REACT_APP_TEAMS_REDIRECT_URI      │
│            || 'https://localhost:3000'         │
└─────────────────────────────────────────────────┘
    │
    │─ FALSE (any condition)
    ▼
┌─────────────────────────────────────────────────┐
│           Standalone Browser Context           │
│                                                 │
│ Development: http://localhost:3000              │
│ Production: REACT_APP_REDIRECT_URI_PROD         │
└─────────────────────────────────────────────────┘
```

## 3. Detailed Login Flow Sequence

```
User Action          Component              MSAL Library           Azure AD
    │                    │                      │                    │
    ▼                    │                      │                    │
┌─────────┐              │                      │                    │
│ Click   │              │                      │                    │
│"Login"  │              │                      │                    │
│ Button  │              │                      │                    │
└─────────┘              │                      │                    │
    │                    │                      │                    │
    ▼                    │                      │                    │
    │◄───────────────────┤                      │                    │
    │  handleLogin()     │                      │                    │
    │                    ▼                      │                    │
    │              ┌─────────────┐              │                    │
    │              │setLoginMsg  │              │                    │
    │              │    ('')     │              │                    │
    │              └─────────────┘              │                    │
    │                    │                      │                    │
    │                    ▼                      │                    │
    │              ┌─────────────┐              │                    │
    │              │   Call      │─────────────▶│                    │
    │              │loginPopup() │              │                    │
    │              └─────────────┘              │                    │
    │                    │                      ▼                    │
    │                    │              ┌─────────────┐              │
    │                    │              │  Create     │              │
    │                    │              │ Popup Win   │              │
    │                    │              │             │              │
    │                    │              └─────────────┘              │
    │                    │                      │                    │
    │                    │                      ▼                    │
    │                    │                      │───────────────────▶│
    │                    │                      │  Auth Request      │
    │                    │                      │                    ▼
    │                    │                      │            ┌─────────────┐
    │                    │                      │            │Show Login   │
    │                    │                      │            │Page in Popup│
    │                    │                      │            │             │
    │                    │                      │            └─────────────┘
    │                    │                      │                    │
    │                    │                      │                    ▼
    │                    │                      │            ┌─────────────┐
    │                    │                      │            │User Enters  │
    │                    │                      │            │Credentials  │
    │                    │                      │            │             │
    │                    │                      │            └─────────────┘
    │                    │                      │                    │
    │                    │                      │◄───────────────────┤
    │                    │                      │  Auth Response     │
    │                    │                      ▼                    │
    │                    │              ┌─────────────┐              │
    │                    │              │Process Token│              │
    │                    │              │& Close Popup│              │
    │                    │              └─────────────┘              │
    │                    │                      │                    │
    │                    ▼                      ▼                    │
    │              ┌─────────────┐    ┌─────────────┐              │
    │              │  SUCCESS    │ OR │   ERROR     │              │
    │              │   Path      │    │   Path      │              │
    │              └─────────────┘    └─────────────┘              │
    │                    │                      │                    │
    ▼                    ▼                      ▼                    │
┌─────────┐       ┌─────────────┐    ┌─────────────┐              │
│Display  │       │setLoginMsg  │    │setLoginMsg  │              │
│Success  │       │('Login      │    │('Login      │              │
│Message  │       │ Successful')│    │ Failed')    │              │
└─────────┘       └─────────────┘    └─────────────┘              │
```

## 3. Component State Flow

```
Initial State:
┌─────────────────────────────────────────────────────────────────┐
│                     LoginComponent                              │
│                                                                 │
│  State:                                                         │
│  • isLoggedIn: false                                           │
│  • loginMessage: ''                                            │
│  • accounts: []                                                │
│                                                                 │
│  UI:                                                           │
│  ┌───────────────────────┐                                    │
│  │ "Login with Microsoft"│ ◄── Button visible                 │
│  │       [BUTTON]        │                                    │
│  └───────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘

After Successful Login:
┌─────────────────────────────────────────────────────────────────┐
│                     LoginComponent                              │
│                                                                 │
│  State:                                                         │
│  • isLoggedIn: true                                            │
│  • loginMessage: 'Login Successful! Welcome [User Name]'       │
│  • accounts: [userAccount]                                     │
│                                                                 │
│  UI:                                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Welcome, John Doe!                                          │ │
│  │ ┌─────────────┐                                           │ │
│  │ │   Logout    │ ◄── Button visible                        │ │
│  │ │  [BUTTON]   │                                           │ │
│  │ └─────────────┘                                           │ │
│  │                                                           │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Login Successful! Welcome John Doe                     │ │ │
│  │ │            [SUCCESS MESSAGE]                           │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

After Failed Login:
┌─────────────────────────────────────────────────────────────────┐
│                     LoginComponent                              │
│                                                                 │
│  State:                                                         │
│  • isLoggedIn: false                                           │
│  • loginMessage: 'Login Failed: [Error Message]'              │
│  • accounts: []                                                │
│                                                                 │
│  UI:                                                           │
│  ┌───────────────────────┐                                    │
│  │ "Login with Microsoft"│ ◄── Button visible                 │
│  │       [BUTTON]        │                                    │
│  └───────────────────────┘                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Login Failed: User cancelled authentication                │ │
│  │               [ERROR MESSAGE]                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 4. MSAL Provider Hierarchy

```
src/App.tsx (C:\Yr2026\concentrix\TeamsSimple\src\App.tsx)
├── MsalProvider (wraps entire app)
│   ├── instance: msalInstance (from src/msalConfig.ts)
│   │   ├── Configuration (from .env file):
│   │   │   ├── clientId: REACT_APP_AZURE_CLIENT_ID=8e687840-b448-47fb-be35-3916f5636816
│   │   │   ├── authority: https://login.microsoftonline.com/REACT_APP_AZURE_TENANT_ID
│   │   │   └── redirectUri: window.location.origin
│   │   │
│   │   └── Methods Available:
│   │       ├── loginPopup(loginRequest)
│   │       ├── logoutPopup()
│   │       ├── getAllAccounts()
│   │       └── acquireTokenSilent()
│   │
│   └── src/LoginComponent.tsx (consumes MSAL context)
│       ├── useMsal() hook provides:
│       │   ├── instance (MSAL methods)
│       │   └── accounts (user accounts array)
│       │
│       └── Component Methods:
│           ├── handleLogin() → calls instance.loginPopup()
│           └── handleLogout() → calls instance.logoutPopup()
```

## 5. Error Handling Flow

```
Login Process Error Scenarios:

1. User Cancels Login:
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Popup Opens │───▶│User Closes  │───▶│ Error:      │
   │             │    │   Popup     │    │"User        │
   │             │    │             │    │ cancelled"  │
   └─────────────┘    └─────────────┘    └─────────────┘

2. Network Error:
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │Auth Request │───▶│Network Fail │───▶│ Error:      │
   │   Sent      │    │             │    │"Network     │
   │             │    │             │    │ error"      │
   └─────────────┘    └─────────────┘    └─────────────┘

3. Invalid Credentials:
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │User Enters  │───▶│Azure AD     │───▶│ Error:      │
   │Bad Password │    │ Rejects     │    │"Invalid     │
   │             │    │             │    │ credentials"│
   └─────────────┘    └─────────────┘    └─────────────┘

All errors are caught in the LoginComponent and displayed in the red error message box.
```

## 6. Teams Integration Points

**Teams Manifest**: `teams/manifest.json` (C:\Yr2026\concentrix\TeamsSimple\teams\manifest.json)
**Teams Manifest**: `teams/manifest.json` (C:\Yr2026\concentrix\TeamsSimple\teams\manifest.json)
**Environment Config**: `.env` (C:\Yr2026\concentrix\TeamsSimple\.env)
**New Environment Variables**:
- `REACT_APP_REDIRECT_URI_DEV` - Development redirect URI
- `REACT_APP_REDIRECT_URI_PROD` - Production redirect URI  
- `REACT_APP_TEAMS_REDIRECT_URI` - Teams-specific redirect URI

```
When running in Microsoft Teams:

Browser/Standalone Mode:
┌─────────────────┐
│   Your App      │
│ (Full Window)   │
│                 │
│ ┌─────────────┐ │
│ │Login Button │ │
│ └─────────────┘ │
└─────────────────┘

Teams Integration Mode:
┌─────────────────────────────────────┐
│           Microsoft Teams           │
│ ┌─────────────────────────────────┐ │
│ │        Teams Tab/App            │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │        Your App             │ │ │
│ │ │    (iframe embedded)        │ │ │
│ │ │ ┌─────────────────────────┐ │ │ │
│ │ │ │    Login Component      │ │ │ │
│ │ │ │ ┌─────────────────────┐ │ │ │ │
│ │ │ │ │   Login Button      │ │ │ │ │
│ │ │ │ └─────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

The MSAL popup will work in both modes, opening in a new window.
```

## 7. Build and Development Files

```
Project Structure:
C:\Yr2026\concentrix\TeamsSimple\
├── package.json           ← Dependencies and scripts
├── tsconfig.json          ← TypeScript configuration
├── .env                   ← Azure AD environment variables
├── README.md              ← Project documentation
├── public/
│   └── index.html         ← HTML template
├── src/
│   ├── index.tsx          ← React entry point
│   ├── App.tsx            ← Main component + Teams SDK
│   ├── LoginComponent.tsx ← MSAL authentication UI
│   ├── msalConfig.ts      ← MSAL configuration
│   ├── App.css            ← App styles
│   └── index.css          ← Global styles
├── teams/
│   └── manifest.json      ← Teams app manifest
└── build/                 ← Production build output
    ├── static/
    └── index.html

Development Server: npm start (runs on http://localhost:3000)
Production Build: npm run build (outputs to build/ directory)
```

## 8. Teams Integration Troubleshooting

### **Common Issues and Solutions**

```
1. Redirect URI Mismatch in Teams:
   Problem: Authentication fails in Teams context
   Solution: Ensure REACT_APP_TEAMS_REDIRECT_URI is configured
   
2. HTTPS Required Error:
   Problem: Teams requires HTTPS for authentication
   Solution: Set up HTTPS for local development or use ngrok
   
3. Teams Context Not Detected:
   Problem: App uses wrong redirect URI in Teams
   Debug: Check console.log output from isInTeams() function
   
4. Popup Blocked in Teams:
   Problem: Teams blocks popup windows
   Solution: Use Teams SSO or configure popup permissions
```

### **Debug Commands**
```javascript
// In browser console, check Teams detection
console.log('Is in Teams:', window.parent !== window.self);
console.log('Origin:', window.location.origin);
console.log('Ancestor Origins:', window.location.ancestorOrigins);
console.log('User Agent:', navigator.userAgent);
```

This flow diagram shows how your Teams app handles the complete authentication process from user interaction through to displaying success/failure messages with Teams-aware redirect URI handling.