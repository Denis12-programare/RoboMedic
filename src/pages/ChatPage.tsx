import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ScanFace, 
  Send, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  User, 
  MessageSquare, 
  Sparkles,
  Zap,
  Droplets,
  Activity,
  Plus,
  Heart,
  Calendar,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Types ---
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'analysis' | 'recommendation';
  data?: any;
}

// --- Chat Page Component ---
const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm RoboMedic, your intelligent aesthetic assistant. How can I help you today? You can ask me about skincare routines, facial analysis, or specific skin concerns.",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleLogout = () => {
    localStorage.removeItem('robo_auth');
    navigate('/login');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(userMsg.text),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 2000);
  };

  const getBotResponse = (input: string): string => {
    const text = input.toLowerCase();
    if (text.includes('acne')) return "Based on your interest in acne, I recommend a routine focused on salicylic acid and non-comedogenic hydration. I've updated your 'Recommended Routine' widget with some options.";
    if (text.includes('wrinkle') || text.includes('aging')) return "For concerns regarding fine lines or wrinkles, focus on retinoids and peptides. Ensure you use SPF 50 daily as prevention is key.";
    if (text.includes('hello') || text.includes('hi')) return "Hello there! I'm ready to analyze your skin or provide beauty advice. Would you like to start a new face scan?";
    return "That's an interesting question. To give you a more precise answer, would you like to upload a photo for a quick skin analysis?";
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      background: 'var(--bg-dark)',
      overflow: 'hidden',
      color: 'white'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '300px',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.02)',
        padding: '24px 16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScanFace size={20} />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>RoboMedic</span>
        </div>

        <button style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          marginBottom: '24px',
          cursor: 'pointer'
        }}>
          <Plus size={20} />
          New Analysis
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', padding: '0 8px' }}>HISTORY</span>
          {[
            { title: 'Morning Skin Check', date: '2 hours ago' },
            { title: 'Acne Treatment Plan', date: 'Yesterday' },
            { title: 'Anti-aging routine', date: 'Mar 18' },
            { title: 'Hydration Analysis', date: 'Mar 15' },
          ].map((chat, i) => (
            <div key={i} style={{
              padding: '12px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent'
            }} onMouseEnter={(e) => i !== 0 && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={(e) => i !== 0 && (e.currentTarget.style.background = 'transparent')}>
              <MessageSquare size={18} color={i === 0 ? 'var(--primary)' : 'var(--text-muted)'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{chat.date}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px', cursor: 'pointer', borderRadius: '10px' }} onClick={handleLogout}>
            <LogOut size={18} color="#ef4444" />
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#ef4444' }}>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Header */}
        <header style={{
          height: '70px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          background: 'rgba(3, 7, 18, 0.5)',
          backdropFilter: 'var(--glass-blur)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ fontSize: '1rem', fontWeight: '600' }}>Active Analysis Session</div>
             <div style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.7rem', fontWeight: 'bold' }}>LIVE</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Search size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            <Settings size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
              <User size={20} />
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  display: 'flex',
                  gap: '12px',
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: msg.sender === 'user' ? 'var(--secondary)' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}>
                  {msg.sender === 'user' ? <User size={16} /> : <ScanFace size={16} />}
                </div>
                <div style={{
                  padding: '16px 20px',
                  borderRadius: msg.sender === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                  background: msg.sender === 'user' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: msg.sender === 'user' ? 'rgba(139, 92, 246, 0.2)' : 'var(--glass-border)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6'
                }}>
                  {msg.text}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ alignSelf: 'flex-start', display: 'flex', gap: '12px' }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScanFace size={16} />
                </div>
                <div style={{ padding: '16px 20px', borderRadius: '4px 20px 20px 20px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--glass-border)', display: 'flex', gap: '4px' }}>
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px 30px 30px' }}>
          <form onSubmit={handleSend} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            padding: '8px 8px 8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'var(--glass-blur)'
          }}>
            <ImageIcon size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
            <input 
              type="text" 
              placeholder="Ask RoboMedic about your skin..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'white',
                outline: 'none',
                fontSize: '0.95rem'
              }}
            />
            <button type="submit" style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 15px var(--primary-glow)'
            }}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>

      {/* Widgets Area */}
      <aside style={{
        width: '350px',
        borderLeft: '1px solid var(--glass-border)',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto',
        background: 'rgba(3, 7, 18, 0.3)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} color="var(--primary)" />
          Face Analysis
        </h3>

        {/* Skin Score Widget */}
        <div style={{
          padding: '24px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))',
          border: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>SKIN HEALTH SCORE</div>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px' }}>
             <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle 
                  cx="60" cy="60" r="54" fill="none" stroke="url(#gradient)" strokeWidth="8" 
                  strokeDasharray="339.29"
                  initial={{ strokeDashoffset: 339.29 }}
                  animate={{ strokeDashoffset: 339.29 * (1 - 0.82) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
             </svg>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>82</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EXCELLENT</div>
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
             <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>74%</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>HYDRATION</div>
             </div>
             <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)' }} />
             <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>12%</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>POROSITY</div>
             </div>
          </div>
        </div>

        {/* Routine Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>RECOMMENDED ROUTINE</h4>
             <Calendar size={16} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             {[
               { icon: <Droplets size={16} />, title: 'Gentle Cleanser', time: 'Morning & Night' },
               { icon: <Sparkles size={16} />, title: 'Vitamin C Serum', time: 'Morning' },
               { icon: <Zap size={16} />, title: 'Retinol 0.5%', time: 'Night' },
               { icon: <Heart size={16} />, title: 'SPF 50+ Shield', time: 'Daily' },
             ].map((item, i) => (
               <div key={i} style={{ 
                 padding: '12px', 
                 borderRadius: '14px', 
                 background: 'rgba(255,255,255,0.02)', 
                 border: '1px solid var(--glass-border)',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '12px'
               }}>
                 <div style={{ color: 'var(--primary)' }}>{item.icon}</div>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{item.title}</div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.time}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Daily Tip */}
        <div style={{ 
          marginTop: 'auto', 
          padding: '20px', 
          borderRadius: '20px', 
          background: 'rgba(6, 182, 212, 0.05)', 
          border: '1px dashed rgba(6, 182, 212, 0.3)',
          position: 'relative'
        }}>
           <Sparkles size={20} color="var(--primary)" style={{ marginBottom: '10px' }} />
           <h5 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>Daily Beauty Tip</h5>
           <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
             Double cleansing at night ensures all pollutants and sunscreen are removed, preventing premature aging and congestion.
           </p>
        </div>
      </aside>
    </div>
  );
};

export default ChatPage;
