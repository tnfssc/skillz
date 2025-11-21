import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { signIn } from '../lib/auth';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('dev@test.local');
  const [password, setPassword] = React.useState('devpassword');
  const [error, setError] = React.useState('');
  const [isCreatingUser, setIsCreatingUser] = React.useState(false);

  const handleGoogleSignIn = async () => {
    await signIn.social({ provider: 'google', callbackURL: '/dashboard' });
    navigate({ to: '/dashboard' });
  };

  const handleCreateTestUser = async () => {
    setIsCreatingUser(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8787/api/dev/create-test-user', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create test user');
        console.error('Create test user failed:', data);
        return;
      }

      setError(''); // Clear any previous errors
      alert('Test user ready! You can now sign in with:\nEmail: dev@test.local\nPassword: devpassword');
    } catch (err) {
      setError('Failed to connect to API. Is the server running?');
      console.error('Create test user error:', err);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Sign in using direct fetch since authClient is having issues
      console.log('Attempting sign in with:', email);
      
      const response = await fetch('http://localhost:8787/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Sign in result:', data);

      if (!response.ok) {
        setError(data.error?.message || data.message || 'Sign in failed');
        console.error('Sign in error:', data);
        return;
      }

      // Check if we got a user object back
      if (data.user) {
        console.log('Sign in successful, redirecting...');
        window.location.href = '/dashboard';
      } else {
        console.warn('Sign in returned success but no user data?', data);
        setError('Login succeeded but no user data returned');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Auth error:', err);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Sign In</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Sign in to manage your skills and API keys
        </p>
      </div>

      <button
        onClick={handleGoogleSignIn}
        style={{
          width: '100%',
          background: 'white',
          color: '#333',
          border: '1px solid #ddd',
          padding: '1rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <span>🔵</span> Continue with Google
      </button>

      {import.meta.env.DEV && (
        <>
          <div style={{ textAlign: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            — OR (Dev Only) —
          </div>

          <form onSubmit={handleEmailPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                padding: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              🔓 Sign In
            </button>
          </form>

          <button
            type="button"
            onClick={handleCreateTestUser}
            disabled={isCreatingUser}
            style={{
              width: '100%',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              padding: '0.75rem',
              borderRadius: '8px',
              cursor: isCreatingUser ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              marginTop: '0.5rem',
              opacity: isCreatingUser ? 0.5 : 1,
            }}
          >
            {isCreatingUser ? 'Creating...' : '👤 Create Test User (First Time Only)'}
          </button>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
            Default: dev@test.local / devpassword
          </p>
        </>
      )}
    </div>
  );
}
