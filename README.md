# Teams Simple App

A simple Microsoft Teams application built with React that demonstrates MSAL (Microsoft Authentication Library) popup authentication.

## Features

- React.js application with TypeScript support
- Microsoft Teams SDK integration
- MSAL authentication with popup flow
- Success/failure login message display
- Single Page Application (SPA) architecture

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Azure AD app registration

## Azure Configuration

This app uses the following Azure AD configuration (set in `.env` file):

- **Client ID**: `8e687840-b448-47fb-be35-3916f5636816`
- **Tenant ID**: `f6433b42-6ade-43dc-9aec-230d304de0f5`

### Teams-Aware Redirect URIs

The app now includes intelligent redirect URI detection:

- **Development**: `http://localhost:3000` (automatic)
- **Production**: Set `REACT_APP_REDIRECT_URI_PROD` in `.env`
- **Teams Integration**: Set `REACT_APP_TEAMS_REDIRECT_URI` in `.env`

The `msalConfig.ts` automatically detects the execution context and uses the appropriate redirect URI.

## Installation

1. Clone or download this project
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```

## Development

To run the application in development mode:

```
npm start
```

This will start the development server on `http://localhost:3000`.

## Usage

1. The application will display a "Login with Microsoft" button
2. Click the button to open a popup authentication window
3. Complete the Microsoft authentication flow
4. Upon successful login, the app will display "Login Successful!" with the user's name
5. If login fails, an error message will be shown
6. Once logged in, a "Logout" button will be available

## Teams Integration

The app includes Teams-aware MSAL configuration for seamless integration:

### **Setup for Teams**

1. **Configure Environment Variables**:
   ```env
   REACT_APP_TEAMS_REDIRECT_URI=https://your-teams-app-domain.com
   REACT_APP_REDIRECT_URI_PROD=https://your-production-domain.com
   ```

2. **Set up HTTPS** (required for Teams):
   ```bash
   # Option 1: Use HTTPS=true
   HTTPS=true npm start
   
   # Option 2: Use ngrok for local HTTPS
   ngrok http 3000
   ```

3. **Update Teams Manifest**:
   - Edit `teams/manifest.json` with your production URLs
   - Ensure all domains are in `validDomains` array

4. **Upload to Teams**:
   - Package the `teams/manifest.json` with icons
   - Upload to Microsoft Teams App Studio or Teams Admin Center

### **Automatic Context Detection**

The app automatically detects:
- ✅ **Standalone Browser**: Uses `localhost:3000` or production URL
- ✅ **Teams Desktop**: Uses Teams-specific redirect URI
- ✅ **Teams Web**: Uses Teams-specific redirect URI

### **Debug Teams Integration**

Check browser console for context detection:
```javascript
// These logs will show which context was detected
console.log('Teams context detected, using redirect URI: ...')
console.log('Standalone context detected, using redirect URI: ...')
```

## Project Structure

```
├── public/
│   └── index.html          # Main HTML template
├── src/
│   ├── App.tsx            # Main app component with Teams SDK initialization
│   ├── LoginComponent.tsx # MSAL authentication component
│   ├── msalConfig.ts      # MSAL configuration
│   ├── index.tsx          # React app entry point
│   ├── App.css           # App styles
│   └── index.css         # Global styles
├── teams/
│   └── manifest.json     # Teams app manifest
├── .env                  # Environment variables
└── package.json         # Project dependencies
```

## Technologies Used

- React.js with TypeScript
- Microsoft Authentication Library (MSAL) for React
- Microsoft Teams JavaScript SDK
- Azure Active Directory authentication

## Scripts

- `npm start`: Start development server
- `npm build`: Build production version
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App (not recommended)

## Troubleshooting

- Ensure your Azure AD app registration has the correct redirect URIs configured
- For Teams integration, make sure the app is running on HTTPS
- Check browser console for any authentication errors
- Verify that your Azure AD app has the necessary API permissions