import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ChevronRight,
  Cpu,
  Droplets,
  Menu,
  Microscope,
  Moon,
  ScanFace,
  ShieldCheck,
  Sun,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { getThemePreference, setThemePreference, themePreferenceEventName } from '../utils/themePreference';
import type { ThemeMode } from '../utils/themePreference';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Process', href: '#about' },
  { label: 'Experience', href: '#results' },
  { label: 'FAQ', href: '#faq' },
];

const features = [
  {
    icon: ScanFace,
    title: 'Facial Mapping',
    desc: 'High-fidelity issue detection, texture review, and facial region awareness in one elegant flow.',
  },
  {
    icon: Droplets,
    title: 'Routine Intelligence',
    desc: 'Recommendations stay connected to your current session and refresh when your profile changes.',
  },
  {
    icon: Zap,
    title: 'Fast AI Feedback',
    desc: 'Consultation responses and image-guided analysis arrive with minimal friction and better context.',
  },
  {
    icon: Microscope,
    title: 'Dermal Insight',
    desc: 'Hydration, porosity, and skin-health indicators are surfaced in a way that is easy to absorb.',
  },
  {
    icon: ShieldCheck,
    title: 'Trustworthy Workflows',
    desc: 'Authentication, sessions, profile data, and API connections remain exactly where your app expects them.',
  },
  {
    icon: Cpu,
    title: 'Premium Workspace',
    desc: 'Every screen now feels like part of the same polished product instead of isolated utilities.',
  },
];

const faqs = [
  {
    q: 'Is RoboMedic a replacement for a doctor?',
    a: 'No. It is an AI assistant for aesthetic guidance and skincare support. Medical concerns should still go to a licensed clinician.',
  },
  {
    q: 'Will my current sessions and flows still work?',
    a: 'Yes. The redesign keeps your existing routes, flows, integrations, and business logic in place.',
  },
  {
    q: 'Can I use it on mobile too?',
    a: 'Yes. The redesigned layouts keep the premium feel while adapting cleanly for smaller screens.',
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getThemePreference(localStorage.getItem('robo_user_email')));
  const featureStats = useMemo(
    () => [
      { label: 'Response feel', value: 'Fluid' },
      { label: 'Analysis flow', value: 'Connected' },
      { label: 'Visual system', value: 'Unified' },
    ],
    [],
  );

  useEffect(() => {
    const syncTheme = () => setThemeMode(getThemePreference(localStorage.getItem('robo_user_email')));

    window.addEventListener('storage', syncTheme);
    window.addEventListener(themePreferenceEventName, syncTheme as EventListener);

    return () => {
      window.removeEventListener('storage', syncTheme);
      window.removeEventListener(themePreferenceEventName, syncTheme as EventListener);
    };
  }, []);

  const handleThemeModeChange = useCallback((nextMode: ThemeMode) => {
    setThemeMode(nextMode);
    setThemePreference(nextMode, localStorage.getItem('robo_user_email'));
  }, []);

  return (
    <main className="page-shell">
      <div className="app-shell">
        <div className="top-nav">
          <div className="top-nav__inner surface-panel">
            <button type="button" className="brand-lockup" onClick={() => navigate('/')}>
              <span className="brand-lockup__mark">
                <ScanFace size={20} />
              </span>
              <span className="brand-lockup__text">
                <strong>RoboMedic</strong>
                <span>Clinical AI, refined</span>
              </span>
            </button>

            <div className="nav-links" aria-label="Primary">
              {navItems.map((item) => (
                <a key={item.label} href={item.href}>
                  {item.label}
                </a>
              ))}
            </div>

            <div className="nav-actions">
              <div className="theme-switcher" aria-label="Theme preference">
                <button type="button" className={themeMode === 'light' ? 'is-active' : ''} onClick={() => handleThemeModeChange('light')} title="Light theme">
                  <Sun size={15} />
                </button>
                <button type="button" className={themeMode === 'dark' ? 'is-active' : ''} onClick={() => handleThemeModeChange('dark')} title="Dark theme">
                  <Moon size={15} />
                </button>
                <button type="button" className={themeMode === 'system' ? 'is-active' : ''} onClick={() => handleThemeModeChange('system')} title="System theme">
                  Auto
                </button>
              </div>
              {isAuthenticated ? (
                <GradientButton onClick={() => navigate('/chat')} style={{ minHeight: 44 }}>
                  Open Workspace
                </GradientButton>
              ) : (
                <>
                  <GradientButton variant="ghost" onClick={() => navigate('/login')} style={{ minHeight: 44 }}>
                    Sign In
                  </GradientButton>
                  <GradientButton onClick={() => navigate('/register')} style={{ minHeight: 44 }}>
                    Get Started
                  </GradientButton>
                </>
              )}
              <button
                type="button"
                className="icon-button"
                aria-label="Toggle navigation"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                style={{ display: 'inline-flex' }}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="floating-panel"
              style={{ position: 'fixed', left: 16, right: 16, top: 88, width: 'auto' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="theme-switcher theme-switcher--mobile" aria-label="Theme preference">
                  <button type="button" className={themeMode === 'light' ? 'is-active' : ''} onClick={() => handleThemeModeChange('light')}>
                    <Sun size={15} />
                    Light
                  </button>
                  <button type="button" className={themeMode === 'dark' ? 'is-active' : ''} onClick={() => handleThemeModeChange('dark')}>
                    <Moon size={15} />
                    Dark
                  </button>
                  <button type="button" className={themeMode === 'system' ? 'is-active' : ''} onClick={() => handleThemeModeChange('system')}>
                    Auto
                  </button>
                </div>
                {navItems.map((item) => (
                  <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </a>
                ))}
                <GradientButton onClick={() => navigate(isAuthenticated ? '/chat' : '/register')}>
                  {isAuthenticated ? 'Open Workspace' : 'Create Account'}
                </GradientButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="hero-grid">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="eyebrow">
              <Sparkles size={16} color="var(--accent-blue)" />
              Premium AI skincare workspace
            </div>
            <h1>
              A cleaner, calmer way to explore <span className="gradient-text">facial intelligence</span>
            </h1>
            <p>
              RoboMedic now feels like a premium product throughout: quieter surfaces, clearer hierarchy, softer motion, and a more focused path from analysis to recommendations.
            </p>
            <div className="hero-actions">
              <GradientButton onClick={() => navigate(isAuthenticated ? '/chat' : '/register')}>
                {isAuthenticated ? 'Open Chat Workspace' : 'Start Your Analysis'}
                <ArrowRight size={18} />
              </GradientButton>
              <GradientButton variant="secondary" onClick={() => navigate('/login')}>
                {isAuthenticated ? 'Manage Account' : 'Sign In'}
              </GradientButton>
            </div>
            {/* <div className="hero-theme-card">
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Choose your viewing mode</div>
                <p style={{ fontSize: '0.92rem' }}>Switch the site appearance here too. It stays synced with the workspace setting.</p>
              </div>
              <div className="chip-toggle chip-toggle--compact">
                <button type="button" className={themeMode === 'light' ? 'is-active' : ''} onClick={() => handleThemeModeChange('light')}>Light</button>
                <button type="button" className={themeMode === 'dark' ? 'is-active' : ''} onClick={() => handleThemeModeChange('dark')}>Dark</button>
                <button type="button" className={themeMode === 'system' ? 'is-active' : ''} onClick={() => handleThemeModeChange('system')}>System</button>
              </div>
            </div> */}
            <div className="hero-metrics">
              {featureStats.map((item) => (
                <span key={item.label} className="metric-pill">
                  <strong style={{ color: 'var(--text-primary)' }}>{item.value}</strong>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="hero-preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <div className="hero-preview__window surface-panel">
              <GlassCard className="hero-preview__card">
                <div className="hero-preview__header">
                  <div className="hero-preview__meta">
                    <div className="hero-preview__meta-label">Live consultation</div>
                    <h3 className="hero-preview__meta-title">Face analysis</h3>
                  </div>
                  <div className="metric-pill">
                    <Activity size={14} color="var(--accent-green)" />
                    Healthy signal
                  </div>
                </div>
                <div className="hero-preview__canvas">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="hero-preview__scan"
                  >
                    <ScanFace size={72} />
                  </motion.div>
                  <div className="metric-pill hero-preview__pill hero-preview__pill--top">
                    <Sparkles size={14} color="var(--accent-blue)" />
                    Texture mapped
                  </div>
                  <div className="metric-pill hero-preview__pill hero-preview__pill--bottom">
                    <ShieldCheck size={14} color="var(--accent-green)" />
                    Session secured
                  </div>
                </div>
              </GlassCard>

              <div className="hero-preview__stack">
                <GlassCard className="workspace-card hero-preview__card">
                  <div className="eyebrow" style={{ marginBottom: 14 }}>
                    <Droplets size={16} color="var(--accent-blue)" />
                    Daily routine
                  </div>
                  <div className="hero-preview__list">
                    {['Gentle cleanser', 'Niacinamide serum', 'Barrier moisturizer', 'Mineral SPF 50'].map((item) => (
                      <div key={item} className="routine-card">
                        <div className="routine-card__title">{item}</div>
                        <div className="routine-card__meta">Recommended in-session</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="hero-preview__card">
                  <div className="eyebrow" style={{ marginBottom: 14 }}>
                    <Zap size={16} color="var(--accent-blue)" />
                    Design priorities
                  </div>
                  <div className="hero-preview__priority-list">
                    {['More breathing room', 'Sharper visual hierarchy', 'Connected controls'].map((item) => (
                      <div key={item} className="hero-preview__priority-item">
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{item}</span>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="section-shell">
          <div className="section-heading">
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                <ShieldCheck size={16} color="var(--accent-blue)" />
                Feature set preserved
              </div>
              <h2>Everything still works, but now it feels intentional.</h2>
            </div>
            <p style={{ maxWidth: 340 }}>
              Existing systems remain in place while the interface gets cleaner cards, richer states, and more product-like polish.
            </p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, desc }, index) => (
              <GlassCard key={title} className="feature-card" delay={index * 0.05}>
                <div className="feature-icon">
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: 10 }}>{title}</h3>
                <p>{desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section id="about" className="section-shell">
          <div className="step-grid">
            <GlassCard>
              <div className="eyebrow" style={{ marginBottom: 16 }}>
                <Cpu size={16} color="var(--accent-blue)" />
                Workflow
              </div>
              <h2 style={{ fontSize: '2.4rem', marginBottom: 16 }}>A calmer path from intake to insight.</h2>
              <div className="workflow-list">
                {[
                  ['Start', 'Create or resume a consultation without losing session context.'],
                  ['Analyze', 'Upload an image, ask questions, and let the AI enrich the session.'],
                  ['Refine', 'Review metrics, routines, and recommendations in one connected workspace.'],
                ].map(([title, desc], index) => (
                  <div key={title} className="workflow-step">
                    <div className="workflow-step__index">
                      {index + 1}
                    </div>
                    <div className="workflow-step__body">
                      <div className="workflow-step__title">{title}</div>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard id="results" className="stats-card">
              <div className="eyebrow" style={{ marginBottom: 16 }}>
                <Activity size={16} color="var(--accent-green)" />
                Experience outcomes
              </div>
              <div className="insight-grid">
                {[ 
                  ['Desktop', 'Airy layouts and persistent context'],
                  ['Mobile', 'Reflowed cards and touch-friendly controls'],
                  ['States', 'Polished hover, focus, loading, active, and disabled'],
                ].map(([title, desc]) => (
                  <div key={title} className="outcome-card">
                    <div className="outcome-card__title">{title}</div>
                    <p style={{ fontSize: '0.9rem' }}>{desc}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        <section id="faq" className="section-shell">
          <div className="section-heading">
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                <Sparkles size={16} color="var(--accent-blue)" />
                Questions
              </div>
              <h2>Common concerns, answered cleanly.</h2>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <GlassCard key={faq.q} delay={index * 0.04}>
                <div className="faq-row">
                  <span className="faq-icon">
                    <ChevronRight size={18} />
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: 6 }}>{faq.q}</h3>
                    <p>{faq.a}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <footer className="site-footer">
          <div className="glass-card site-footer__panel">
            <div className="brand-lockup">
              <span className="brand-lockup__mark">
                <ScanFace size={20} />
              </span>
              <span className="brand-lockup__text">
                <strong>RoboMedic</strong>
                <span>Premium care guidance, without changing your core stack</span>
              </span>
            </div>
            <div className="site-footer__copy">(c) 2026 RoboMedic AI. Informational support only, not a medical diagnosis.</div>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default LandingPage;
