import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const FEATURES = [
  { icon: '🎙️', text: 'Voice pronunciation coach' },
  { icon: '📊', text: 'B1–C2 vocabulary lists' },
  { icon: '✍️', text: 'Writing feedback & grammar check' },
  { icon: '🤝', text: 'AI conversation buddy' },
  { icon: '🐙', text: 'Progress saved via GitHub' },
  { icon: '🎯', text: 'Personalised tips & goals' },
];

export default function LandingPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);
  const [githubConfigured, setGithubConfigured] = useState(false);

  // Check server health for GitHub OAuth status
  useEffect(() => {
    fetch('/api/health', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setGithubConfigured(data.githubConfigured);
        if (data.user) navigate('/dashboard');
      })
      .catch(() => {});
  }, [navigate]);

  // Handle OAuth error params
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'github_not_configured') setError('GitHub OAuth is not configured. Use demo mode or set up a GitHub OAuth App.');
    else if (err === 'auth_failed') setError('GitHub authentication failed. Please try again.');
    else if (err === 'no_token') setError('Could not retrieve access token. Please try again.');
  }, [searchParams]);

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const data = await api.demoLogin();
      setUser(data.user);
      navigate('/dashboard');
    } catch {
      setError('Demo login failed. Is the server running?');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing-card slide-up">
        <span className="landing-emoji">🎓</span>
        <h1>English Buddy</h1>
        <p>
          Your AI-powered English coach. Improve your vocabulary from B1 to C2,
          practise pronunciation with your microphone, and get instant writing feedback —
          all synced to your GitHub account.
        </p>

        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.text} className="feature-item">
              <span className="f-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <div className="login-buttons">
          {githubConfigured && (
            <button className="btn-github" onClick={handleGitHubLogin}>
              <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Continue with GitHub
            </button>
          )}

          {githubConfigured && (
            <div className="divider">or</div>
          )}

          <button
            className="btn btn-secondary"
            onClick={handleDemoLogin}
            disabled={demoLoading}
          >
            {demoLoading ? '⏳ Loading...' : '🚀 Try Demo (no login required)'}
          </button>
        </div>

        {!githubConfigured && (
          <p style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            💡 To enable GitHub login, add a <code>.env</code> file in <code>server/</code> with your GitHub OAuth credentials.
            See <code>server/.env.example</code>.
          </p>
        )}
      </div>
    </div>
  );
}
