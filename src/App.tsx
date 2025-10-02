import React, { useState, useEffect } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msalConfig';
import LoginComponent from './LoginComponent';
import * as microsoftTeams from '@microsoft/teams-js';
import './App.css';

function App() {
  const [isTeamsInitialized, setIsTeamsInitialized] = useState(false);
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);

  useEffect(() => {
    // Initialize MSAL
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        
        // Handle redirect response after authentication
        try {
          const response = await msalInstance.handleRedirectPromise();
          if (response) {
            console.log('Redirect authentication successful:', response);
            // The LoginComponent will automatically update based on accounts
          }
        } catch (redirectError) {
          console.error('Error handling redirect:', redirectError);
        }
        
        setIsMsalInitialized(true);
        console.log('MSAL initialized successfully');
      } catch (error) {
        console.error('MSAL initialization failed:', error);
        setIsMsalInitialized(true); // Continue even if initialization fails
      }
    };

    // Initialize Teams SDK
    const initializeTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsTeamsInitialized(true);
        console.log('Teams SDK initialized successfully');
      } catch (error) {
        console.warn('Teams SDK initialization failed, running in web mode:', error);
        setIsTeamsInitialized(true); // Allow app to work outside Teams
      }
    };

    initializeMsal();
    initializeTeams();
  }, []);

  if (!isTeamsInitialized || !isMsalInitialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Initializing Teams App...</div>
        {!isMsalInitialized && <div>Loading authentication...</div>}
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <div className="App">
        <header className="App-header">
          <h1>Simple Teams App</h1>
          <LoginComponent />
        </header>
      </div>
    </MsalProvider>
  );
}

export default App;