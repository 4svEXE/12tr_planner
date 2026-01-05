
import React, { useState, useEffect, useRef } from 'react';
import { Tag } from '../types';
import { useApp } from '../contexts/AppContext';

interface HashtagAutocompleteProps {
  value: string;
  onChange: (newValue: string) => void;
  onSelectTag: (tagName: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
}

const HashtagAutocomplete: React.FC<HashtagAutocompleteProps> = ({ 
  value, onChange, onSelectTag, onEnter, placeholder, className 
}) => {
  const { tags, addTag } = useApp();
  const [showPopover, setShowPopover] = useState(false);
  const [filter, setFilter] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use simple input if h- is provided, otherwise would need more complex logic.
  // For now, we switch the global component to use input as it's mostly used for single-line titles.
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);
    onChange(val);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !showPopover) {
      if (onEnter) {
        e.preventDefault();
        onEnter();
      }
    }
  };

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

  const selectTag = (tagName: string) => {
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const words = textBefore.split(/\s/);
    words[words.length - 1] = `#${tagName} `;
    const newVal = words.join(' ') + textAfter;
    
    onChange(newVal);
    onSelectTag(tagName);
    setShowPopover(false);
    inputRef.current?.focus();
  };

  const createNew = () => {
    const newTag = addTag(filter);
    selectTag(newTag.name);
  };

  return (
    <div className="relative w-full h-full flex items-center overflow-visible">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} outline-none`}
      />
      
      {showPopover && (
        <div className="absolute z-[100] bottom-full mb-1 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 tiktok-blur">
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => selectTag(tag.name)}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }}></div>
                <span className="text-[10px] font-bold text-slate-700 truncate">#{tag.name}</span>
              </button>
            ))}
            
            {filter && !tags.some(t => t.name === filter) && (
              <button
                onClick={createNew}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-left"
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
