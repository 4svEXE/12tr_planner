
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  // Added draggable and onDragStart props to Card component
  draggable?: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  blur = false, 
  padding = 'md',
  hover = false,
  onClick,
  draggable,
  onDragStart
}) => {
  // Використовуємо змінні теми замість жорстких кольорів Tailwind
  const baseClasses = 'border transition-all duration-300';
  const themeClasses = blur 
    ? 'backdrop-blur-xl bg-[var(--bg-card)]/80' 
    : 'bg-[var(--bg-card)]';
  
  const borderClasses = 'border-[var(--border-color)]';
  const radiusClasses = 'rounded-[var(--radius)]';
  const hoverClasses = hover ? 'hover:shadow-lg hover:border-[var(--primary)]/30' : 'shadow-sm';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div 
      className={`${baseClasses} ${themeClasses} ${borderClasses} ${radiusClasses} ${hoverClasses} ${paddings[padding]} ${className}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      style={{ color: 'var(--text-main)' }}
    >
      {children}
    </div>
  );
};

export default Card;