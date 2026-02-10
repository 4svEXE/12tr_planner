
import React, { useState, useEffect, useRef } from 'react';
import { Tag } from '../types';
import { useApp } from '../contexts/AppContext';

interface HashtagAutocompleteProps {
  value: string;
  onChange: (newValue: string) => void;
  onSelectTag: (tagName: string) => void;
  onEnter?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  mode?: 'text' | 'tags'; // 'text' потребує #, 'tags' - ні
}

const HashtagAutocomplete: React.FC<HashtagAutocompleteProps> = ({ 
  value, onChange, onSelectTag, onEnter, onBlur, placeholder, className, autoFocus = false, mode = 'text'
}) => {
  const { tags, addTag } = useApp();
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
      if (showPopover && filteredTags.length > 0) {
        e.preventDefault();
        selectTag(filteredTags[0].name);
      } else if (onEnter) {
        e.preventDefault();
        onEnter();
      }
    }
    if (e.key === 'Escape') {
      setShowPopover(false);
    }
  };

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

  const selectTag = (tagName: string) => {
    if (mode === 'tags') {
      onSelectTag(tagName);
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
    onSelectTag(tagName);
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
        className={`${className} outline-none h-6 w-full`}
      />
      
      {showPopover && (
        <div className="absolute z-[100] top-full mt-1 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 tiktok-blur animate-in slide-in-from-top-2 duration-200">
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredTags.length > 0 ? filteredTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selectTag(tag.name); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }}></div>
                <span className="text-[10px] font-bold text-slate-700 truncate">#{tag.name}</span>
              </button>
            )) : (
               <div className="p-2 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">Немає тегів</div>
            )}
            
            {filter && !tags.some(t => t.name === filter) && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); createNew(); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-left border-t border-slate-50 mt-1"
              >
                <i className="fa-solid fa-plus text-[8px]"></i>
                <span className="text-[10px] font-black italic">Створити "#{filter}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagAutocomplete;
