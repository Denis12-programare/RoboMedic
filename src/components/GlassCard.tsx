import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
  id?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  delay = 0,
  style,
  id,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay }}
      className={`glass-card ${className}`.trim()}
      id={id}
      style={{
        padding: '24px',
        height: '100%',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
