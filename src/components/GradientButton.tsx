import React from 'react';
import { motion } from 'framer-motion';

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
  disabled?: boolean;
}

const variantStyles: Record<NonNullable<GradientButtonProps['variant']>, React.CSSProperties> = {
  primary: {
    background: 'var(--gradient-primary)',
    color: 'var(--text-white)',
    boxShadow: '0 18px 32px rgba(10, 132, 255, 0.22)',
  },
  secondary: {
    background: 'var(--glass-background-strong)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border-soft)',
    boxShadow: 'var(--shadow-sm)',
  },
  outline: {
    background: 'color-mix(in srgb, var(--glass-background) 34%, transparent)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border-soft)',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
    boxShadow: 'none',
  },
};

const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  type = 'button',
  style,
  disabled = false,
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        minHeight: '50px',
        padding: '0.9rem 1.25rem',
        borderRadius: '18px',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-bold)',
        letterSpacing: '-0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...variantStyles[variant],
        opacity: disabled ? 0.58 : 1,
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
};

export default GradientButton;
