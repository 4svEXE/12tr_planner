
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  icon,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    // Використовуємо --primary для фону та тіней
    primary: 'bg-[var(--primary)] text-white shadow-lg hover:brightness-110',
    secondary: 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20',
    ghost: 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    white: 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] shadow-sm hover:bg-[var(--bg-main)]'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
    icon: 'w-10 h-10 p-0'
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} 
      disabled={loading}
      {...props}
    >
      {loading ? (
        <i className="fa-solid fa-circle-notch animate-spin"></i>
      ) : (
        <>
          {icon && <i className={`fa-solid ${icon} ${size === 'icon' ? 'text-base' : 'text-xs'}`}></i>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
