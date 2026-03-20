import React from 'react';
import { motion } from 'framer-motion';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

const GradientButton: React.FC<GradientButtonProps> = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  type = 'button',
  style
}) => {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`btn-${variant} ${className}`}
      style={{
        padding: '12px 28px',
        borderRadius: '50px',
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
        border: variant === 'outline' ? '2px solid var(--primary)' : 'none',
        background: variant === 'primary' 
          ? 'linear-gradient(135deg, var(--primary), var(--secondary))' 
          : variant === 'secondary' 
          ? 'var(--glass-bg)' 
          : 'transparent',
        color: variant === 'outline' ? 'var(--primary)' : 'var(--text-primary)',
        backdropFilter: variant === 'secondary' ? 'var(--glass-blur)' : 'none',
        boxShadow: variant === 'primary' ? '0 10px 20px -5px var(--primary-glow)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'var(--transition)',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {children}
    </motion.button>
  );
};

export default GradientButton;
