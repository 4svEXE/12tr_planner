
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
    h1: 'text-4xl font-semibold font-heading',
    h2: 'text-2xl font-semibold font-heading',
    h3: 'text-lg font-medium font-heading',
    body: 'text-sm font-normal leading-relaxed',
    caption: 'text-xs font-medium uppercase tracking-wide opacity-60',
    tiny: 'text-[10px] font-semibold uppercase tracking-wider'
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