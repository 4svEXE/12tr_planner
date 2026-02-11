import React, { useState, useEffect, useRef } from 'react';
import { Tag } from '../types';
import { useApp } from '../contexts/AppContext';

interface HashtagAutocompleteProps {
  value: string;
  onChange: (newValue: string) => void;
  onSelectTag: (tagName: string, personId?: string) => void;
  onEnter?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  mode?: 'text' | 'tags'; 
}

const HashtagAutocomplete: React.FC<HashtagAutocompleteProps> = ({ 
  value, onChange, onSelectTag, onEnter, onBlur, placeholder, className, autoFocus = false, mode = 'text'
}) => {
  const { tags, people = [], addTag } = useApp();
  const [showPopover, setShowPopover] = useState(false);
  const [filter, setFilter] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);
    onChange(val);
    updateSuggestions(val, pos);
  };

  const updateSuggestions = (val: string, pos: number) => {
    if (mode === 'tags') {
      if (val.trim().length > 0) {
        setFilter(val.trim().replace(/^#/, ''));
        setShowPopover(true);
      } else {
        setShowPopover(false);
      }
      return;
    }

    const textBeforeCursor = val.slice(0, pos);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('#')) {
      setFilter(lastWord.slice(1));
      setShowPopover(true);
    } else {
      setShowPopover(false);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);
    updateSuggestions(value, pos);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showPopover && filteredSuggestions.length > 0) {
        e.preventDefault();
        const first = filteredSuggestions[0];
        // FIX: Using type assertion to handle union type where personId is only present on 'person' items
        selectTag(first.name, (first as any).personId);
      } else if (onEnter) {
        e.preventDefault();
        onEnter();
      }
    }
    if (e.key === 'Escape') {
      setShowPopover(false);
    }
  };

  // Комбінуємо теги та людей
  const filteredSuggestions = React.useMemo(() => {
    const search = filter.toLowerCase();
    
    // Звичайні теги
    const tagMatches = tags
      .filter(t => t.name.toLowerCase().includes(search))
      .map(t => ({ name: t.name, color: t.color, icon: 'fa-tag', type: 'tag' as const }));

    // Люди як теги (Імя_Прізвище)
    const personMatches = people
      .filter(p => p.name.toLowerCase().includes(search.replace('_', ' ')))
      .map(p => ({ 
        name: p.name.trim().replace(/\s+/g, '_'), 
        color: 'var(--primary)', 
        icon: 'fa-user-ninja', 
        type: 'person' as const,
        personId: p.id,
        avatar: p.avatar
      }));

    return [...tagMatches, ...personMatches].sort((a, b) => a.name.length - b.name.length);
  }, [tags, people, filter]);

  const selectTag = (tagName: string, personId?: string) => {
    if (mode === 'tags') {
      onSelectTag(tagName, personId);
      onChange('');
      setShowPopover(false);
      return;
    }

    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const words = textBefore.split(/\s/);
    
    words[words.length - 1] = `#${tagName} `;
    const newVal = words.join(' ').replace(/\s\s+/g, ' ') + textAfter;
    
    onChange(newVal);
    onSelectTag(tagName, personId);
    setShowPopover(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const createNew = () => {
    if (!filter) return;
    const newTag = addTag(filter);
    selectTag(newTag.name);
  };

  return (
    <div className="relative w-full flex items-center overflow-visible">
      <input
        ref={inputRef}
        type="text"
        autoFocus={autoFocus}
        value={value}
        onChange={handleInput}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onBlur={() => {
            setTimeout(() => {
                setShowPopover(false);
                onBlur?.();
            }, 200);
        }}
        placeholder={placeholder}
        className={`${className} outline-none h-6 w-full text-[var(--text-main)] bg-transparent`}
      />
      
      {showPopover && (
        <div className="absolute z-[100] top-full mt-1 w-full min-w-[240px] bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-color)] p-2 tiktok-blur animate-in slide-in-from-top-2 duration-200">
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredSuggestions.length > 0 ? filteredSuggestions.map((item, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectTag(item.name, (item as any).personId); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 hover:bg-black/5 rounded-lg transition-colors text-left"
              >
                {item.type === 'person' && (item as any).avatar ? (
                  <img src={(item as any).avatar} className="w-5 h-5 rounded-full object-cover border border-[var(--border-color)]" />
                ) : (
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-black/5">
                    <i className={`fa-solid ${item.icon} text-[9px]`} style={{ color: item.color }}></i>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[var(--text-main)] truncate uppercase tracking-tight">#{item.name}</div>
                  {item.type === 'person' && <div className="text-[7px] font-black text-[var(--text-muted)] uppercase opacity-50">Союзник</div>}
                </div>
              </button>
            )) : (
               <div className="p-4 text-[10px] font-black text-[var(--text-muted)] text-center uppercase tracking-widest opacity-40">Збігів не знайдено</div>
            )}
            
            {filter && !filteredSuggestions.some(t => t.name === filter) && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); createNew(); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-lg transition-colors text-left border-t border-[var(--border-color)] mt-1"
              >
                <i className="fa-solid fa-plus text-[9px]"></i>
                <span className="text-[11px] font-black uppercase tracking-tight">Створити "#{filter}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagAutocomplete;