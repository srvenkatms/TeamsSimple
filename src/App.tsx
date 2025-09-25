import React, { useState, useEffect } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msalConfig';
import LoginComponent from './LoginComponent';
import * as microsoftTeams from '@microsoft/teams-js';
import './App.css';

function App() {
  const [isTeamsInitialized, setIsTeamsInitialized] = useState(false);

  useEffect(() => {
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

    initializeTeams();
  }, []);

  if (!isTeamsInitialized) {
    return <div>Initializing Teams App...</div>;
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