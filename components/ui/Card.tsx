
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  border?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
  draggable?: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  blur = false,
  padding = 'md',
  hover = false,
  border = true,
  onClick,
  onContextMenu,
  draggable,
  onDragStart
}) => {
  const baseClasses = 'transition-none';
  const themeClasses = blur
    ? 'backdrop-blur-xl bg-[var(--bg-card)]/80'
    : 'bg-[var(--bg-card)]';

  const borderClasses = border ? 'border border-[var(--border-color)]' : '';
  const radiusClasses = 'rounded';
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
      onContextMenu={onContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      style={{ color: 'var(--text-main)' }}
    >
      {children}
    </div>
  );
};

export default Card;
