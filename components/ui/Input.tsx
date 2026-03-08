
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    variant?: 'default' | 'ghost';
    label?: string;
    icon?: string;
    error?: string;
    wrapperClassName?: string;
}

/**
 * Universal Input component for 12TR Planner.
 *
 * variant="default" — standard form input with background, height 36px, padding.
 * variant="ghost"   — transparent, no padding, no border. Use for inline/embedded fields
 *                     (mindmap nodes, list items, etc). Adds class 'ui-ghost-input' to
 *                     bypass the global CSS !important override in index.html.
 *
 * See UI_GUIDELINES.md for full usage rules.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    variant = 'default',
    label,
    icon,
    error,
    wrapperClassName = '',
    className = '',
    ...props
}, ref) => {
    if (variant === 'ghost') {
        return (
            <input
                ref={ref}
                {...props}
                // ui-ghost-input is excluded from the global input CSS override in index.html
                className={`ui-ghost-input bg-transparent border-none p-0 focus:ring-0 outline-none ${className}`}
            />
        );
    }

    return (
        <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
            {label && (
                <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    {label}
                </label>
            )}
            <div className="relative flex items-center">
                {icon && (
                    <i className={`fa-solid ${icon} absolute left-3 text-[11px] text-[var(--text-muted)] pointer-events-none`}></i>
                )}
                <input
                    ref={ref}
                    {...props}
                    className={`w-full rounded-[var(--radius)] bg-[var(--bg-input)] text-[var(--text-main)] border border-transparent focus:border-[var(--primary)]/40 focus:ring-0 outline-none transition-none text-[13px] ${icon ? 'pl-8 pr-3' : 'px-3'} py-0 h-9 ${error ? 'border-rose-400' : ''} ${className}`}
                />
            </div>
            {error && (
                <span className="text-[10px] font-bold text-rose-500">{error}</span>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
