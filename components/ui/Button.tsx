
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
    primary: 'bg-orange-600 text-white shadow-lg shadow-orange-100 hover:bg-orange-700',
    secondary: 'bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100',
    ghost: 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    white: 'bg-white text-slate-900 border border-slate-100 shadow-sm hover:bg-slate-50'
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
