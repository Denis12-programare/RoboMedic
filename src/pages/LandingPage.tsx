import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  ScanFace, 
  ChevronRight, 
  Menu,
  X,
  ArrowRight,
  Droplets,
  Zap,
  Microscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';

// --- Navbar Component ---
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '20px 5%',
      transition: 'var(--transition)',
      background: isScrolled ? 'rgba(3, 7, 18, 0.8)' : 'transparent',
      backdropFilter: isScrolled ? 'var(--glass-blur)' : 'none',
      borderBottom: isScrolled ? '1px solid var(--glass-border)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px var(--primary-glow)'
        }}>
          <ScanFace color="white" size={24} />
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }} className="gradient-text">
          RoboMedic
        </span>
      </div>

      {/* Desktop Menu */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }} className="desktop-menu">
        {['Features', 'About', 'Results', 'FAQ'].map((item) => (
          <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize: '0.95rem', fontWeight: '500', opacity: 0.8, transition: 'var(--transition)' }}>
            {item}
          </a>
        ))}
        <GradientButton onClick={() => navigate('/login')} variant="secondary" style={{ padding: '8px 20px' }}>
          Login
        </GradientButton>
        <GradientButton onClick={() => navigate('/register')}>
          Analyze Face
        </GradientButton>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', cursor: 'pointer' }}>
        {mobileMenuOpen ? <X /> : <Menu />}
      </div>
    </nav>
  );
};

// --- Hero Section ---
const Hero = () => {
  const navigate = useNavigate();
  return (
    <section style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '120px 5% 60px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'var(--primary)',
        filter: 'blur(150px)',
        opacity: 0.15,
        borderRadius: '50%',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '500px',
        height: '500px',
        background: 'var(--secondary)',
        filter: 'blur(150px)',
        opacity: 0.1,
        borderRadius: '50%',
        zIndex: -1
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', maxWidth: '900px' }}
      >
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '8px 16px', 
          borderRadius: '50px', 
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          marginBottom: '24px',
          color: 'var(--primary)',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          <Sparkles size={16} />
          <span>Next-Gen Facial AI is Here</span>
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 8vw, 5rem)', 
          lineHeight: 1.1, 
          fontWeight: 800, 
          marginBottom: '24px',
          letterSpacing: '-2px'
        }}>
          Your Intelligent <br />
          <span className="gradient-text">Aesthetic Guardian</span>
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-muted)', 
          marginBottom: '40px',
          maxWidth: '650px',
          marginInline: 'auto'
        }}>
          Unlock clinical-grade facial analysis and personalized skincare routines powered by RoboMedic's advanced neural networks.
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <GradientButton onClick={() => navigate('/register')} style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
            Get Started Free
            <ArrowRight size={20} />
          </GradientButton>
          <GradientButton variant="secondary" onClick={() => navigate('/login')} style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
            Try Live Demo
          </GradientButton>
        </div>
      </motion.div>

      {/* Floating UI elements simulation */}
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ marginTop: '80px', position: 'relative' }}
      >
        <div style={{ 
          width: 'min(90vw, 1000px)', 
          aspectRatio: '16/9', 
          borderRadius: '32px',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
           {/* Mock interface content */}
           <div style={{ display: 'flex', gap: '20px', padding: '40px', width: '100%' }}>
              <div style={{ flex: 1, height: '300px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScanFace size={80} opacity={0.1} />
                </div>
                <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '10px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', fontSize: '0.8rem' }}>
                  Analyzing Face Map...
                </div>
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', padding: '10px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', fontSize: '0.8rem' }}>
                  Score: 92%
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ height: '40px', width: '60%', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ height: '80px', width: '100%', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }} />
                <div style={{ height: '80px', width: '100%', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }} />
                <div style={{ height: '40px', width: '40%', borderRadius: '10px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', opacity: 0.5 }} />
              </div>
           </div>
        </div>
      </motion.div>
    </section>
  );
};

// --- Features Section ---
const Features = () => {
  const features = [
    {
      icon: <ScanFace size={32} />,
      title: "Facial Mapping",
      desc: "Detailed 3D analysis of your facial structure and skin texture."
    },
    {
      icon: <Droplets size={32} />,
      title: "Skincare Sync",
      desc: "Real-time product recommendations based on your current skin state."
    },
    {
      icon: <Zap size={32} />,
      title: "AI Detection",
      desc: "Instant identification of acne, pores, wrinkles, and dark circles."
    },
    {
      icon: <Microscope size={32} />,
      title: "Dermal Insights",
      desc: "Deep analysis of hydration levels and epidermal health."
    },
    {
      icon: <ShieldCheck size={32} />,
      title: "Medical Precision",
      desc: "Validated algorithms ensuring professional-grade accuracy."
    },
    {
      icon: <Sparkles size={32} />,
      title: "Aesthetic Path",
      desc: "Personalized roadmap for your aesthetic goals and transformations."
    }
  ];

  return (
    <section id="features" style={{ padding: '100px 5%' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '16px' }}>Clinical Features</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Advanced technology meets skincare expertise.</p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '30px',
        maxWidth: '1200px',
        marginInline: 'auto'
      }}>
        {features.map((f, i) => (
          <GlassCard key={i} delay={i * 0.1}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '16px', 
              background: 'rgba(255,255,255,0.03)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '20px',
              color: 'var(--primary)'
            }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{f.title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};

// --- How It Works ---
const HowItWorks = () => {
  const steps = [
    { title: "Scan", desc: "Take a high-res photo or use your camera for a 10-second live scan." },
    { title: "Analyze", desc: "RoboMedic processes 5,000+ facial data points in under 3 seconds." },
    { title: "Prescribe", desc: "Receive a personalized aesthetic roadmap and product routine." }
  ];

  return (
    <section id="about" style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.01)' }}>
      <div style={{ maxWidth: '1200px', marginInline: 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 500px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '24px' }}>The Intelligence <br /> Behind the Glow</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '40px' }}>
              RoboMedic uses state-of-the-art computer vision and dermatological datasets to provide insights previously only available in clinical settings.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ 
                    minWidth: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>{i + 1}</div>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.title}</h4>
                    <p style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ flex: '1 1 500px', position: 'relative' }}>
            <div style={{ 
              aspectRatio: '1', 
              borderRadius: '40px', 
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={120} opacity={0.2} className="pulse-animation" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- FAQ Section ---
const FAQ = () => {
  const faqs = [
    { q: "Is RoboMedic a replacement for a doctor?", a: "No, RoboMedic is an AI assistant designed to provide aesthetic guidance. For medical conditions, always consult a board-certified dermatologist." },
    { q: "How accurate is the skin analysis?", a: "Our models have been trained on over 2 million clinical images, achieving a 94% correlation with professional dermatologist assessments." },
    { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption and HIPAA-compliant data handling practices to ensure your privacy." }
  ];

  return (
    <section id="faq" style={{ padding: '100px 5%' }}>
      <div style={{ maxWidth: '800px', marginInline: 'auto' }}>
        <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '50px' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {faqs.map((f, i) => (
            <GlassCard key={i}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ChevronRight size={20} color="var(--primary)" />
                {f.q}
              </h3>
              <p style={{ color: 'var(--text-muted)', paddingLeft: '30px' }}>{f.a}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Footer ---
const Footer = () => (
  <footer style={{ padding: '80px 5% 40px', borderTop: '1px solid var(--glass-border)', marginTop: '100px' }}>
    <div style={{ maxWidth: '1200px', marginInline: 'auto', display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'space-between' }}>
      <div style={{ maxWidth: '300px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScanFace color="white" size={18} />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>RoboMedic</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Empowering aesthetic confidence through clinical AI intelligence.
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '60px' }}>
        <div>
          <h4 style={{ marginBottom: '20px' }}>Platform</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>Home</span>
            <span>Analysis</span>
            <span>Routines</span>
            <span>Products</span>
          </div>
        </div>
        <div>
          <h4 style={{ marginBottom: '20px' }}>Company</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>About</span>
            <span>Science</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </div>
    
    <div style={{ maxWidth: '1200px', marginInline: 'auto', marginTop: '60px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
      © 2026 RoboMedic AI. For informational purposes only. Not a substitute for professional medical advice.
    </div>
  </footer>
);

// --- Main Page Component ---
const LandingPage: React.FC = () => {
  return (
    <main style={{ background: 'var(--bg-dark)' }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <Footer />
    </main>
  );
};

export default LandingPage;
