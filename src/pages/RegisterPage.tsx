import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  ScanFace,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { googleLogin, registerUser, verifyEmailCode } from '../api';
import { useAuth } from '../contexts/AuthContext';

interface GoogleCredentialResponse {
  credential?: string;
}

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [stage, setStage] = useState<'idle' | 'pending_code'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const completeRegistration = useCallback(
    (displayName: string, userEmail: string) => {
      localStorage.setItem('robo_auth', 'true');
      localStorage.setItem('robo_user_name', displayName);
      localStorage.setItem('robo_user_email', userEmail.toLowerCase());
      setIsAuthenticated(true);
      navigate('/chat');
    },
    [navigate, setIsAuthenticated],
  );

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatusMessage('');
    try {
      const response = await registerUser({ name, email, password, provider: 'local' });
      if (response.error) {
        setError(response.error);
        return;
      }
      if (response.data?.status === 'pending_verification') {
        setStage('pending_code');
        setVerificationCode('');
        setPendingEmail(response.data.email || email);
        setStatusMessage('We sent a verification code to your inbox. Enter it below to complete your account.');
        return;
      }
      if (response.data?.status === 'ok') {
        completeRegistration(response.data.display_name || name || email.split('@')[0], response.data.email || email);
      }
    } catch {
      setError('Unable to reach the registration service right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!pendingEmail || !verificationCode.trim()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await verifyEmailCode({ email: pendingEmail, code: verificationCode.trim() });
      if (response.error) {
        setError(response.error);
        return;
      }
      if (response.data) {
        completeRegistration(response.data.display_name || name || pendingEmail.split('@')[0], response.data.email || pendingEmail);
      }
    } catch {
      setError('Unable to verify the code right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError('Google registration failed. No credential returned.');
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
          completeRegistration(
            result.data.display_name || name || result.data.email.split('@')[0],
            result.data.email,
          );
        }
      } catch {
        setError('Unable to reach the Google registration service right now.');
      } finally {
        setIsLoading(false);
      }
    },
    [completeRegistration, name],
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Missing VITE_GOOGLE_CLIENT_ID in environment.');
      return;
    }

    const initializeGoogle = () => {
      const google = (window as Window & typeof globalThis & { google?: any }).google;
      if (!google?.accounts?.id) {
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
                <Sparkles size={16} color="var(--accent-blue)" />
                Visual redesign, same registration flow
              </div>
              <h1 className="auth-copy__title">
                Build your account in a <span className="gradient-text">more premium experience</span>
              </h1>
              <p className="auth-copy__body">
                Everything underneath is unchanged. You still register, verify, and enter the same workspace, but the interface now feels calmer, cleaner, and more product-ready.
              </p>
            </div>

            <div className="auth-feature-list">
              {[
                'Email verification stays connected to your existing backend',
                'Google registration remains available as an alternate path',
                'States are clearer during loading, validation, and completion',
              ].map((item) => (
                <GlassCard key={item} className="auth-feature-card">
                  <div className="auth-feature-row">
                    <span className="brand-lockup__mark auth-feature-icon">
                      <ShieldCheck size={18} />
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
                <span>Create your account and enter the consultation workspace</span>
              </span>
            </div>

            <div className="auth-card__heading">
              <h2 className="auth-card__title">Create account</h2>
              <p>Set up your profile and finish with verification if your flow requires it.</p>
            </div>
          </div>

          {error && (
            <div className="status-banner" style={{ borderRadius: 18, marginBottom: 18, borderBottom: 0 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="form-stack">
            <div className="form-group">
              <label htmlFor="register-name" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                Full name
              </label>
              <div className="field-shell">
                <User size={18} />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="John Doe"
                  disabled={stage === 'pending_code'}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-email" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                Email
              </label>
              <div className="field-shell">
                <Mail size={18} />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  disabled={stage === 'pending_code'}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-password" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                Password
              </label>
              <div className="field-shell">
                <Lock size={18} />
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  disabled={stage === 'pending_code'}
                  required
                />
              </div>
            </div>

            <div className="consent-note">
              <CheckCircle2 size={16} color="var(--accent-blue)" />
              <span className="consent-note__text">I agree to the medical data privacy policy.</span>
            </div>

            <GradientButton type="submit" disabled={isLoading} style={{ width: '100%' }}>
              {isLoading ? 'Processing...' : stage === 'pending_code' ? 'Registration Submitted' : 'Create Account'}
              {!isLoading && stage === 'idle' && <ArrowRight size={18} />}
            </GradientButton>

            {stage === 'pending_code' && (
              <GlassCard className="verification-card">
                <div className="verification-stack">
                  <div>
                    <div className="verification-title">Verification required</div>
                    <p className="verification-note">{statusMessage}</p>
                  </div>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    placeholder="Enter verification code"
                  />
                  <GradientButton type="button" onClick={handleVerificationSubmit} disabled={isLoading}>
                    Verify email
                  </GradientButton>
                </div>
              </GlassCard>
            )}

            <div className="helper-row auth-divider">
              <div className="auth-divider__line" />
              <span className="auth-divider__label">or</span>
              <div className="auth-divider__line" />
            </div>

            <div id="google-signin-button" className="auth-provider-slot" />

            {/* <GradientButton type="button" variant="secondary" disabled={isLoading} onClick={handleGoogleRegister} style={{ width: '100%' }}>
              Open Google prompt
            </GradientButton> */}
          </form>

          <p className="auth-card__linkline">
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>
              Sign in
            </Link>
          </p>
        </motion.section>
      </div>
    </div>
  );
};

export default RegisterPage;
