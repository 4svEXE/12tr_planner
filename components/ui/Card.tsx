
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  // Added optional onClick prop to handle click events on the Card's container div
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  blur = false, 
  padding = 'md',
  hover = false,
  onClick
}) => {
  const baseClasses = 'rounded-[2rem] border border-slate-100 transition-all';
  const blurClasses = blur ? 'tiktok-blur' : 'bg-white';
  const hoverClasses = hover ? 'hover:shadow-xl hover:shadow-slate-200/50 hover:border-orange-100' : 'shadow-sm';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div 
      className={`${baseClasses} ${blurClasses} ${hoverClasses} ${paddings[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
