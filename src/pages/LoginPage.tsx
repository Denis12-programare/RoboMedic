import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, ScanFace, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { googleLogin, loginUser } from '../api';
import { useAuth } from '../contexts/AuthContext';

interface GoogleCredentialResponse {
  credential?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const completeLogin = useCallback(
    (displayName: string, userEmail: string) => {
      localStorage.setItem('robo_auth', 'true');
      localStorage.setItem('robo_user_name', displayName);
      localStorage.setItem('robo_user_email', userEmail);
      setIsAuthenticated(true);
      navigate('/chat');
    },
    [navigate, setIsAuthenticated],
  );

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginUser({ email, password });
      if (response.error) {
        setError(response.error);
        return;
      }
      if (response.data?.status === 'ok') {
        completeLogin(response.data.display_name, response.data.email);
      }
    } catch {
      setError('Unable to reach the login service right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError('Google login failed. No credential was returned.');
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await googleLogin(response.credential);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.data?.status === 'ok') {
          completeLogin(result.data.display_name, result.data.email);
        }
      } catch {
        setError('Unable to reach the Google login service right now.');
      } finally {
        setIsLoading(false);
      }
    },
    [completeLogin],
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Missing VITE_GOOGLE_CLIENT_ID. Please configure it in your .env file.');
      return;
    }

    const initializeGoogle = () => {
      const google = (window as Window & typeof globalThis & { google?: any }).google;
      if (!google?.accounts?.id) {
        setError('Google accounts API is unavailable.');
        return;
      }
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
      });
      const button = document.getElementById('google-signin-button');
      if (button) {
        button.innerHTML = '';
        google.accounts.id.renderButton(button, {
          theme: 'outline',
          size: 'large',
          width: '100%',
        });
      }
    };

    const existingScript = document.getElementById('google-client-script');
    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.id = 'google-client-script';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
  }, [handleGoogleCredentialResponse]);

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <motion.section
          className="auth-panel glass-card auth-visual"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-copy">
            <div className="auth-copy__header">
              <div className="eyebrow">
                <ShieldCheck size={16} color="var(--accent-blue)" />
                Existing auth flow, refined presentation
              </div>
              <h1 className="auth-copy__title">
                Welcome back to a <span className="gradient-text">cleaner workspace</span>
              </h1>
              <p className="auth-copy__body">
                The login experience now matches the rest of the product: calmer surfaces, better spacing, and clearer calls to action without changing the underlying authentication flow.
              </p>
            </div>

            <div className="auth-feature-list">
              {[
                'Preserves your current login API and local session handling',
                'Keeps Google sign-in connected as an existing path',
                'Improves hierarchy, focus states, and mobile spacing',
              ].map((item) => (
                <GlassCard key={item} className="auth-feature-card">
                  <div className="auth-feature-row">
                    <span className="brand-lockup__mark auth-feature-icon">
                      <Sparkles size={18} />
                    </span>
                    <strong className="auth-feature-text">{item}</strong>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="auth-panel glass-card auth-card"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
        >
          <div className="auth-card__header">
            <div className="brand-lockup">
              <span className="brand-lockup__mark">
                <ScanFace size={20} />
              </span>
              <span className="brand-lockup__text">
                <strong>RoboMedic</strong>
                <span>Secure access to your analysis history</span>
              </span>
            </div>

            <div className="auth-card__heading">
              <h2 className="auth-card__title">Sign in</h2>
              <p>Use your existing account to continue your skincare consultation.</p>
            </div>
          </div>

          {error && (
            <div className="status-banner" style={{ borderRadius: 18, marginBottom: 18, borderBottom: 0 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="form-stack">
            <div className="form-group">
              <label htmlFor="email" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                Email
              </label>
              <div className="field-shell">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="helper-row">
                <label htmlFor="password" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Password
                </label>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Secure session</span>
              </div>
              <div className="field-shell">
                <Lock size={18} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <GradientButton type="submit" disabled={isLoading} style={{ width: '100%' }}>
              {isLoading ? 'Authenticating...' : 'Continue to Workspace'}
              {!isLoading && <ArrowRight size={18} />}
            </GradientButton>

            <div className="helper-row auth-divider">
              <div className="auth-divider__line" />
              <span className="auth-divider__label">or</span>
              <div className="auth-divider__line" />
            </div>

            <div id="google-signin-button" className="auth-provider-slot" />

            {/* <GradientButton type="button" variant="secondary" disabled={isLoading} onClick={handleGoogleLogin} style={{ width: '100%' }}>
              Open Google prompt
            </GradientButton> */}
          </form>

          <p className="auth-card__linkline">
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>
              Create one
            </Link>
          </p>
        </motion.section>
      </div>
    </div>
  );
};

export default LoginPage;
