import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig';
import * as microsoftTeams from '@microsoft/teams-js';

const LoginLegacyClean: React.FC = () => {
  const { instance, accounts } = useMsal();
  const [loginMessage, setLoginMessage] = useState<string>('');
  const [isInTeams, setIsInTeams] = useState<boolean>(false);
  const [isTeamsLoggedIn, setIsTeamsLoggedIn] = useState<boolean>(false);
  const [teamsUserInfo, setTeamsUserInfo] = useState<string>('');

  // Detect if running in Teams context
  useEffect(() => {
    const detectTeamsContext = () => {
      try {
        const inIframe = window.parent !== window.self;
        const hasTeamsOrigin = window.location.ancestorOrigins?.length > 0 && 
                              Array.from(window.location.ancestorOrigins).some(origin => 
                                origin.includes('teams.microsoft.com') ||
                                origin.includes('teams.live.com') ||
                                origin.includes('teams.office.com')
                              );
        const hasTeamsUserAgent = navigator.userAgent.includes('Teams/');
        const hasTeamsContext = window.location.search.includes('teams') || 
                               window.location.href.includes('teams');

        const teamsDetected = inIframe && (hasTeamsOrigin || hasTeamsUserAgent || hasTeamsContext);
        setIsInTeams(teamsDetected);
        console.log('Teams context detected:', teamsDetected);
        
        // Check if there's a stored Teams login state
        if (teamsDetected) {
          const storedLogin = localStorage.getItem('teamsLoggedIn');
          const storedUserInfo = localStorage.getItem('teamsUserInfo');
          if (storedLogin === 'true') {
            setIsTeamsLoggedIn(true);
            setTeamsUserInfo(storedUserInfo || 'Teams User');
            setLoginMessage('Previous Teams login restored');
          }
        }
      } catch (error) {
        console.warn('Error detecting Teams context:', error);
        setIsInTeams(false);
      }
    };

    detectTeamsContext();
  }, []);

  // Handle redirect response
  useEffect(() => {
    const handleRedirectResponse = async () => {
      try {
        // Wait a bit to ensure MSAL is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await instance.handleRedirectPromise();
        if (response && response.account) {
          setLoginMessage(`Login Successful! Welcome ${response.account.name || response.account.username}`);
        }
      } catch (error) {
        console.error('Error handling redirect response:', error);
        const errorMessage = (error as any).message || error;
        if (!errorMessage.includes('uninitialized_public_client_application')) {
          setLoginMessage('Login Failed: ' + errorMessage);
        }
      }
    };

    // Only handle redirect response if we have accounts or are returning from auth
    if (accounts.length > 0 || window.location.search.includes('code=') || window.location.hash.includes('access_token')) {
      handleRedirectResponse();
    }
  }, [instance, accounts.length]);

  const handleLogin = async () => {
    try {
      setLoginMessage('Initiating login...');
      
      if (isInTeams) {
        // Use Teams SDK authentication for Teams context
        console.log('Using Teams SDK authentication for Teams context');
        
        try {
          // Initialize Teams SDK first (if not already initialized)
          try {
            await microsoftTeams.app.initialize();
          } catch (initError) {
            console.log('Teams SDK already initialized or not in Teams context');
          }
          
          // Use Teams SDK authentication - this returns a Promise<string> with the auth result
          const authResult = await microsoftTeams.authentication.authenticate({
            url: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID}/oauth2/v2.0/authorize?client_id=${process.env.REACT_APP_AZURE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=https://graph.microsoft.com/User.Read%20openid%20profile&response_mode=query&state=12345`,
            width: 600,
            height: 535
          });
          
          console.log('Teams authentication successful:', authResult);
          
          // Set Teams login state
          setIsTeamsLoggedIn(true);
          setTeamsUserInfo('Teams User'); // We could parse the token for more info
          setLoginMessage('Login Successful! Authentication completed via Teams SDK.');
          
          // Store login state in localStorage for persistence
          localStorage.setItem('teamsLoggedIn', 'true');
          localStorage.setItem('teamsUserInfo', 'Teams User');
          
        } catch (teamsAuthError) {
          console.error('Teams SDK authentication failed:', teamsAuthError);
          setIsTeamsLoggedIn(false);
          setTeamsUserInfo('');
          localStorage.removeItem('teamsLoggedIn');
          localStorage.removeItem('teamsUserInfo');
          setLoginMessage('Login Failed: Teams authentication error - ' + (teamsAuthError as Error).message);
        }
        
      } else {
        // Use popup flow for standalone browser
        console.log('Using popup flow for browser context');
        
        try {
          const response = await instance.loginPopup(loginRequest);
          
          if (response.account) {
            setLoginMessage(`Login Successful! Welcome ${response.account.name || response.account.username}`);
          } else {
            setLoginMessage('Login Failed: No account returned');
          }
        } catch (popupError) {
          console.log('Popup authentication failed, trying redirect:', popupError);
          
          // Check if it's a popup error specifically
          const errorMessage = (popupError as Error).message;
          if (errorMessage.includes('popup_window_error') || 
              errorMessage.includes('popup') || 
              errorMessage.includes('blocked') || 
              errorMessage.includes('BrowserAuthError') || 
              errorMessage.includes('user_cancelled') ||
              errorMessage.includes('uninitialized_public_client_application')) {
            
            setLoginMessage('Popup blocked, redirecting for authentication...');
            
            // Use redirect as fallback after a short delay
            setTimeout(() => {
              console.log('Redirecting for authentication...');
              instance.loginRedirect(loginRequest);
            }, 1500);
          } else {
            // For other errors, just show the error
            setLoginMessage('Login Failed: ' + errorMessage);
          }
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginMessage('Login Failed: ' + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    try {
      if (isInTeams) {
        // For Teams context, clear local state and show logged out message
        console.log('Logout in Teams context - clearing local state');
        setIsTeamsLoggedIn(false);
        setTeamsUserInfo('');
        setLoginMessage('Logged out successfully from Teams app');
        
        // Clear any local authentication state
        localStorage.removeItem('teamsLoggedIn');
        localStorage.removeItem('teamsUserInfo');
        localStorage.clear();
        sessionStorage.clear();
        
        // Reset the login message after a brief display
        setTimeout(() => {
          setLoginMessage('');
        }, 2000);
        
      } else {
        // Use popup flow for standalone browser
        console.log('Logout in browser context using MSAL');
        
        try {
          await instance.logoutPopup();
          setLoginMessage('');
        } catch (logoutError) {
          console.log('Popup logout failed, trying redirect:', logoutError);
          // Fallback to redirect logout
          await instance.logoutRedirect();
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
      
      if (!isInTeams) {
        // Fallback to redirect if popup fails (browser only)
        try {
          await instance.logoutRedirect();
        } catch (redirectError) {
          console.error('Redirect logout also failed:', redirectError);
          // Clear local state as last resort
          localStorage.clear();
          sessionStorage.clear();
          setLoginMessage('Logged out (local state cleared)');
        }
      } else {
        // For Teams, just clear local state
        setIsTeamsLoggedIn(false);
        setTeamsUserInfo('');
        localStorage.clear();
        sessionStorage.clear();
        setLoginMessage('Logged out (local state cleared)');
      }
    }
  };

  // Determine login status based on context
  const isLoggedIn = isInTeams ? isTeamsLoggedIn : accounts.length > 0;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Legacy Login Component (Working Version)</h2>
      {!isLoggedIn ? (
        <button 
          onClick={handleLogin}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isInTeams ? 'Login with Microsoft (Teams Auth)' : 'Login with Microsoft'}
        </button>
      ) : (
        <div>
          <p>Welcome, {isInTeams ? teamsUserInfo : (accounts[0]?.name || accounts[0]?.username)}!</p>
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#d13438',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      )}
      
      {loginMessage && (
        <div 
          style={{ 
            marginTop: '20px', 
            padding: '10px',
            backgroundColor: loginMessage.includes('Successful') ? '#d4edda' : '#f8d7da',
            color: loginMessage.includes('Successful') ? '#155724' : '#721c24',
            border: `1px solid ${loginMessage.includes('Successful') ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          {loginMessage}
        </div>
      )}
    </div>
  );
};

export default LoginLegacyClean;