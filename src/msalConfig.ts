import { Configuration, PublicClientApplication } from "@azure/msal-browser";

// Detect if running in Teams
const isInTeams = (): boolean => {
  try {
    // Check if we're in an iframe (Teams context)
    const inIframe = window.parent !== window.self;
    
    // Check for Teams-specific indicators
    const hasTeamsOrigin = window.location.ancestorOrigins?.length > 0 && 
                          Array.from(window.location.ancestorOrigins).some(origin => 
                            origin.includes('teams.microsoft.com') ||
                            origin.includes('teams.live.com') ||
                            origin.includes('teams.office.com')
                          );
    
    // Check for Teams user agent
    const hasTeamsUserAgent = navigator.userAgent.includes('Teams/');
    
    // Check for Teams-specific URL parameters or context
    const hasTeamsContext = window.location.search.includes('teams') || 
                           window.location.href.includes('teams');

    return inIframe && (hasTeamsOrigin || hasTeamsUserAgent || hasTeamsContext);
  } catch (error) {
    console.warn('Error detecting Teams context:', error);
    return false;
  }
};

// Get appropriate redirect URI based on environment
const getRedirectUri = (): string => {
  if (isInTeams()) {
    // For Teams, use the Teams-specific redirect URI or fallback
    const teamsRedirectUri = process.env.REACT_APP_TEAMS_REDIRECT_URI || 
                            process.env.REACT_APP_REDIRECT_URI_PROD ||
                            'https://localhost:3000'; // HTTPS required for Teams
    console.log('Teams context detected, using redirect URI:', teamsRedirectUri);
    return teamsRedirectUri;
  }
  
  // For standalone browser (development/production)
  const standaloneUri = process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_REDIRECT_URI_PROD || window.location.origin
    : process.env.REACT_APP_REDIRECT_URI_DEV || window.location.origin;
    
  console.log('Standalone context detected, using redirect URI:', standaloneUri);
  return standaloneUri;
};

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID}`,
    redirectUri: getRedirectUri(),
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["User.Read"],
};