
import React from 'react';

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'tiny';
  children: React.ReactNode;
  className?: string;
  italic?: boolean;
  onDoubleClick?: React.MouseEventHandler<HTMLDivElement>;
}

const Typography: React.FC<TypographyProps> = ({ variant, children, className = '', italic = false, onDoubleClick }) => {
  const baseClasses = italic ? 'italic' : '';
  
  const variants = {
    h1: 'text-4xl font-black tracking-tighter font-heading',
    h2: 'text-2xl font-black tracking-tight font-heading',
    h3: 'text-lg font-bold font-heading',
    body: 'text-sm font-medium leading-relaxed',
    caption: 'text-xs font-bold uppercase tracking-widest text-slate-400',
    tiny: 'text-[10px] font-black uppercase tracking-widest'
  };

  return (
    <div 
      className={`${variants[variant]} ${baseClasses} ${className}`}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </div>
  );
};

export default Typography;
