
import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    variant?: 'ghost' | 'emerald' | 'danger' | 'primary' | 'indigo';
    size?: 'xs' | 'sm' | 'md';
}

/**
 * IconButton — small icon-only action button for toolbars, list rows, etc.
 *
 * Always prefer this over raw <button className="w-6 h-6 rounded-lg hover:bg-...">
 * See UI_GUIDELINES.md for full usage rules.
 *
 * @example
 * <IconButton icon="fa-plus" variant="emerald" size="sm" onClick={...} title="Add" />
 * <IconButton icon="fa-trash-can" variant="danger" size="sm" />
 */
const IconButton: React.FC<IconButtonProps> = ({
    icon,
    variant = 'ghost',
    size = 'sm',
    className = '',
    ...props
}) => {
    const sizes = {
        xs: 'w-4 h-4 text-[7px]',
        sm: 'w-6 h-6 text-[9px]',
        md: 'w-8 h-8 text-[11px]',
    };

    const variants = {
        ghost: 'hover:bg-black/10 text-[var(--text-muted)] hover:text-[var(--text-main)]',
        emerald: 'hover:bg-emerald-50 text-emerald-500/60 hover:text-emerald-600',
        danger: 'hover:bg-rose-50 text-rose-500/60 hover:text-rose-600',
        primary: 'hover:bg-[var(--primary)]/10 text-[var(--primary)]/60 hover:text-[var(--primary)]',
        indigo: 'hover:bg-indigo-50 text-indigo-500/60 hover:text-indigo-600',
    };

    return (
        <button
            type="button"
            className={`flex items-center justify-center rounded-lg transition-colors ${sizes[size]} ${variants[variant]} ${className}`}
            {...props}
        >
            <i className={`fa-solid ${icon}`}></i>
        </button>
    );
};

export default IconButton;
