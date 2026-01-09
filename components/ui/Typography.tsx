
import React from 'react';

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'tiny';
  children: React.ReactNode;
  className?: string;
  italic?: boolean;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
  // Added onClick prop to Typography component
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const Typography: React.FC<TypographyProps> = ({ variant, children, className = '', italic = false, onDoubleClick, onClick }) => {
  const baseClasses = italic ? 'italic' : '';
  
  const variants = {
    h1: 'text-4xl font-black tracking-tighter font-heading',
    h2: 'text-2xl font-black tracking-tight font-heading',
    h3: 'text-lg font-bold font-heading',
    body: 'text-sm font-medium leading-relaxed',
    caption: 'text-xs font-bold uppercase tracking-widest opacity-60',
    tiny: 'text-[10px] font-black uppercase tracking-widest'
  };

  // Використовуємо CSS-змінну --text-main
  return (
    <div 
      className={`${variants[variant]} ${baseClasses} ${className}`}
      style={{ color: 'var(--text-main)' }}
      onDoubleClick={onDoubleClick}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Typography;