import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig';
import * as microsoftTeams from '@microsoft/teams-js';

const LoginComponent: React.FC = () => {
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

        // Teams Detection: Use Teams SDK when in Teams environment (UserAgent detected)
        // Teams can run apps in iframe OR as full tab/window - both need Teams SDK
        const inTeamsEnvironment = hasTeamsUserAgent;
        const isTeamsIframeContext = inIframe && hasTeamsOrigin;
        const isTeamsTabContext = hasTeamsUserAgent && !inIframe;
        
        // Use Teams SDK for any Teams context (iframe or tab/window)
        const shouldUseTeamsSDK = inTeamsEnvironment;
        
        setIsInTeams(shouldUseTeamsSDK);
        
        console.log('=== Teams Detection Analysis ===');
        console.log('- Teams Environment (UserAgent):', inTeamsEnvironment);
        console.log('- Teams iframe Context:', isTeamsIframeContext);
        console.log('- Teams Tab/Window Context:', isTeamsTabContext);
        console.log('- Will use Teams SDK:', shouldUseTeamsSDK);
        console.log('- Will use MSAL:', !shouldUseTeamsSDK);
        console.log('Teams context detection details:');
        console.log('- inIframe:', inIframe);
        console.log('- hasTeamsOrigin:', hasTeamsOrigin);
        console.log('- hasTeamsUserAgent:', hasTeamsUserAgent);
        console.log('- hasTeamsContext:', hasTeamsContext);
        
        // Store detection info for debugging
        localStorage.setItem('debugInfo', JSON.stringify({
          inIframe,
          hasTeamsOrigin,
          hasTeamsUserAgent,
          hasTeamsContext,
          teamsDetected: shouldUseTeamsSDK,
          inTeamsEnvironment,
          isTeamsIframeContext,
          isTeamsTabContext,
          userAgent: navigator.userAgent,
          url: window.location.href
        }));

        // Check if there's a stored Teams login state (for any Teams context)
        if (shouldUseTeamsSDK) {
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
    const handleAuthResponse = async () => {
      try {
        // Check if we have a Teams authentication code in URL
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');
        
        if (authCode && state === '12345') {
          // Teams authentication succeeded - we have the authorization code
          console.log('Teams authentication code received:', authCode.substring(0, 50) + '...');
          
          setIsTeamsLoggedIn(true);
          setTeamsUserInfo('Teams User');
          setLoginMessage('Login Successful! Authentication completed via Teams SDK.');
          
          // Store login state in localStorage for persistence
          localStorage.setItem('teamsLoggedIn', 'true');
          localStorage.setItem('teamsUserInfo', 'Teams User');
          
          // Clean up URL by removing query parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        } else if (error) {
          console.error('Teams authentication error in URL:', error);
          setLoginMessage('Login Failed: ' + error);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
        
        // Handle MSAL redirect responses (for browser context)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await instance.handleRedirectPromise();
        if (response && response.account) {
          console.log('MSAL redirect authentication successful:', response);
          
          // If we're in Teams context, set Teams login state
          if (isInTeams) {
            setIsTeamsLoggedIn(true);
            setTeamsUserInfo(response.account.name || response.account.username || 'Teams User');
            localStorage.setItem('teamsLoggedIn', 'true');
            localStorage.setItem('teamsUserInfo', response.account.name || 'Teams User');
          }
          
          setLoginMessage(`Login Successful! Welcome ${response.account.name || response.account.username}`);
        }
      } catch (error) {
        console.error('Error handling authentication response:', error);
        const errorMessage = (error as any).message || error;
        if (!errorMessage.includes('uninitialized_public_client_application')) {
          setLoginMessage('Login Failed: ' + errorMessage);
        }
      }
    };

    // Handle auth response if we have codes or are returning from auth
    if (accounts.length > 0 || 
        window.location.search.includes('code=') || 
        window.location.hash.includes('access_token') ||
        window.location.search.includes('error=')) {
      handleAuthResponse();
    }
  }, [instance, accounts.length, isInTeams]);

  const handleLogin = async () => {
    try {
      setLoginMessage('Initiating login...');
      
      if (isInTeams) {
        // Use Teams SDK authentication for Teams context (the working approach)
        console.log('Using Teams SDK authentication for Teams context');
        console.log('isInTeams state:', isInTeams);
        
        setLoginMessage('Opening Teams authentication popup...');
        
        try {
          // Initialize Teams SDK and check context first
          await microsoftTeams.app.initialize();
          
          // Get the current Teams context to check if authentication is allowed
          let teamsContext;
          try {
            teamsContext = await microsoftTeams.app.getContext();
            console.log('Teams context:', teamsContext);
          } catch (contextError) {
            console.log('Could not get Teams context:', contextError);
          }
          
          // Check if we're in a context that supports authentication
          const currentFrameContext = (teamsContext as any)?.page?.frameContext || 'unknown';
          console.log('Current frame context:', currentFrameContext);
          
          const allowedContexts = ['content', 'sidePanel', 'settings', 'remove', 'task', 'stage', 'meetingStage'];
          
          if (allowedContexts.includes(currentFrameContext)) {
            console.log('Teams context allows authentication, using Teams SDK');
            
            // Generate PKCE parameters for secure authentication
            const generateCodeVerifier = () => {
              const array = new Uint8Array(32);
              crypto.getRandomValues(array);
              return btoa(String.fromCharCode.apply(null, Array.from(array)))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            };
            
            const generateCodeChallenge = async (verifier: string) => {
              const encoder = new TextEncoder();
              const data = encoder.encode(verifier);
              const digest = await crypto.subtle.digest('SHA-256', data);
              return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            };
            
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            
            // Store code verifier for token exchange (though we're not doing token exchange in this demo)
            localStorage.setItem('codeVerifier', codeVerifier);
            
            // Use Teams SDK authentication with PKCE
            const authResult = await microsoftTeams.authentication.authenticate({
              url: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID}/oauth2/v2.0/authorize?` +
                   `client_id=${process.env.REACT_APP_AZURE_CLIENT_ID}` +
                   `&response_type=code` +
                   `&redirect_uri=${encodeURIComponent(window.location.origin)}` +
                   `&scope=${encodeURIComponent('https://graph.microsoft.com/User.Read openid profile')}` +
                   `&response_mode=query` +
                   `&state=12345` +
                   `&code_challenge=${codeChallenge}` +
                   `&code_challenge_method=S256`,
              width: 600,
              height: 535
            });
            
            console.log('Teams authentication successful:', authResult);
            setIsTeamsLoggedIn(true);
            setTeamsUserInfo('Teams User');
            setLoginMessage('Login Successful! Authentication completed via Teams SDK.');
            localStorage.setItem('teamsLoggedIn', 'true');
            localStorage.setItem('teamsUserInfo', 'Teams User');
            
          } else {
            console.log('Teams context does not allow authentication, using MSAL popup fallback');
            setLoginMessage('Teams context restricts authentication, trying alternative method...');
            
            // Fallback to MSAL popup when Teams context doesn't allow authentication
            const response = await instance.loginPopup({
              scopes: ['User.Read', 'openid', 'profile'],
              prompt: 'select_account'
            });
            
            if (response.account) {
              setIsTeamsLoggedIn(true);
              setTeamsUserInfo(response.account.name || response.account.username || 'Teams User');
              setLoginMessage(`Login Successful! Welcome ${response.account.name || response.account.username}`);
              localStorage.setItem('teamsLoggedIn', 'true');
              localStorage.setItem('teamsUserInfo', response.account.name || 'Teams User');
            } else {
              setLoginMessage('Login Failed: No account returned from authentication');
            }
          }
          
        } catch (teamsAuthError) {
          console.error('Teams authentication failed:', teamsAuthError);
          const errorMessage = (teamsAuthError as Error).message;
          
          // Check for different types of Teams authentication errors
          if (errorMessage.includes('popup_window_error') || 
              errorMessage.includes('popup') ||
              errorMessage.includes('blocked')) {
            
            console.log('Popup blocked error detected, trying MSAL popup as fallback');
            setLoginMessage('Popup blocked in Teams, trying alternative authentication method...');
            
            try {
              const response = await instance.loginPopup({
                scopes: ['User.Read', 'openid', 'profile'],
                prompt: 'select_account'
              });
              
              if (response.account) {
                setIsTeamsLoggedIn(true);
                setTeamsUserInfo(response.account.name || response.account.username || 'Teams User');
                setLoginMessage(`Login Successful! Welcome ${response.account.name || response.account.username}`);
                localStorage.setItem('teamsLoggedIn', 'true');
                localStorage.setItem('teamsUserInfo', response.account.name || 'Teams User');
              } else {
                setLoginMessage('Login Failed: No account returned from authentication');
              }
            } catch (msalError) {
              setIsTeamsLoggedIn(false);
              setTeamsUserInfo('');
              localStorage.removeItem('teamsLoggedIn');
              localStorage.removeItem('teamsUserInfo');
              
              const msalErrorMsg = (msalError as Error).message;
              if (msalErrorMsg.includes('popup') || msalErrorMsg.includes('blocked')) {
                setLoginMessage('Popups are blocked. Please allow popups for this site or try refreshing the page.');
              } else {
                setLoginMessage('Login Failed: ' + msalErrorMsg);
              }
            }
          } else if (errorMessage.includes('only allowed in following contexts') || 
                     errorMessage.includes('Current context:')) {
            
            console.log('Context restriction detected, falling back to MSAL popup');
            setLoginMessage('Teams context restrictions detected, using alternative authentication...');
            
            try {
              const response = await instance.loginPopup({
                scopes: ['User.Read', 'openid', 'profile'],
                prompt: 'select_account'
              });
              
              if (response.account) {
                setIsTeamsLoggedIn(true);
                setTeamsUserInfo(response.account.name || response.account.username || 'Teams User');
                setLoginMessage(`Login Successful! Welcome ${response.account.name || response.account.username}`);
                localStorage.setItem('teamsLoggedIn', 'true');
                localStorage.setItem('teamsUserInfo', response.account.name || 'Teams User');
              } else {
                setLoginMessage('Login Failed: No account returned from authentication');
              }
            } catch (msalError) {
              setIsTeamsLoggedIn(false);
              setTeamsUserInfo('');
              localStorage.removeItem('teamsLoggedIn');
              localStorage.removeItem('teamsUserInfo');
              setLoginMessage('Login Failed: ' + (msalError as Error).message);
            }
          } else {
            // Other errors
            setIsTeamsLoggedIn(false);
            setTeamsUserInfo('');
            localStorage.removeItem('teamsLoggedIn');
            localStorage.removeItem('teamsUserInfo');
            setLoginMessage('Login Failed: Teams authentication error - ' + errorMessage);
          }
        }
        
      } else {
        // Use popup flow for standalone browser
        console.log('Using popup flow for browser context');
        console.log('isInTeams state:', isInTeams);
        
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
      console.log('Logout initiated, isInTeams:', isInTeams);
      
      if (isInTeams) {
        // For Teams context, clear local state and show logged out message
        console.log('Logout in Teams context - clearing local state');
        setIsTeamsLoggedIn(false);
        setTeamsUserInfo('');
        setLoginMessage('Logged out successfully from Teams app');
        
        // Clear any local authentication state
        // Note: In Teams, we can't force logout from Azure AD, but we can clear local state
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
        await instance.logoutPopup();
        setLoginMessage('');
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

  const isLoggedIn = isInTeams ? isTeamsLoggedIn : accounts.length > 0;



  // Get debug info for display
  const debugInfo = JSON.parse(localStorage.getItem('debugInfo') || '{}');

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {/* Debug Information */}
      {Object.keys(debugInfo).length > 0 && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'left'
        }}>
          <strong>Debug Info:</strong><br/>
          Teams Detected: {debugInfo.teamsDetected ? 'YES' : 'NO'}<br/>
          In iFrame: {debugInfo.inIframe ? 'YES' : 'NO'}<br/>
          Teams Origin: {debugInfo.hasTeamsOrigin ? 'YES' : 'NO'}<br/>
          Teams UserAgent: {debugInfo.hasTeamsUserAgent ? 'YES' : 'NO'}<br/>
          Teams Context: {debugInfo.hasTeamsContext ? 'YES' : 'NO'}<br/>
          URL: {debugInfo.url}<br/>
          UserAgent: {debugInfo.userAgent}
        </div>
      )}
      
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
            display: 'inline-block',
            maxWidth: '600px'
          }}
        >
          {loginMessage}
        </div>
      )}
    </div>
  );
};

export default LoginComponent;