import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig';

const LoginComponent: React.FC = () => {
  const { instance, accounts } = useMsal();
  const [loginMessage, setLoginMessage] = useState<string>('');

  const handleLogin = async () => {
    try {
      setLoginMessage('');
      const response = await instance.loginPopup(loginRequest);
      
      if (response.account) {
        setLoginMessage(`Login Successful! Welcome ${response.account.name || response.account.username}`);
      } else {
        setLoginMessage('Login Failed: No account returned');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginMessage('Login Failed: ' + (error as Error).message);
    }
  };

  const handleLogout = () => {
    instance.logoutPopup();
    setLoginMessage('');
  };

  const isLoggedIn = accounts.length > 0;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
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
          Login with Microsoft
        </button>
      ) : (
        <div>
          <p>Welcome, {accounts[0].name || accounts[0].username}!</p>
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

export default LoginComponent;