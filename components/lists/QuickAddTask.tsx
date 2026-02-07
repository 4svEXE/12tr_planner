
import React from 'react';

interface QuickAddTaskProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ value, onChange, onSubmit }) => {
  return (
    <div className="px-4 md:px-6 pt-2 pb-2">
      <form onSubmit={onSubmit} className="relative group">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Додати квест до цього списку..."
          className="w-full bg-black/[0.03] hover:bg-black/[0.05] focus:bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--primary)]/30 rounded py-0 px-3 text-[12px] font-bold transition-all outline-none text-[var(--text-main)] shadow-sm min-h-[26px] h-[26px]"
        />
      </form>
    </div>
  );
};

export default QuickAddTask;
