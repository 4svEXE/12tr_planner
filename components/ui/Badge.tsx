
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'emerald' | 'rose' | 'slate' | 'yellow';
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', icon, className = '', style }) => {
  const variants = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    slate: 'bg-slate-50 text-slate-500 border-slate-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100'
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${variants[variant]} ${className}`}
      style={style}
    >
      {icon && <i className={`fa-solid ${icon}`}></i>}
      {children}
    </span>
  );
};

export default Badge;
