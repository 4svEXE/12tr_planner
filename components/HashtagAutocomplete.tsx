
import React, { useState, useEffect, useRef } from 'react';
import { Tag } from '../types';
import { useApp } from '../contexts/AppContext';

interface HashtagAutocompleteProps {
  value: string;
  onChange: (newValue: string) => void;
  onSelectTag: (tagName: string) => void;
  placeholder?: string;
  className?: string;
}

const HashtagAutocomplete: React.FC<HashtagAutocompleteProps> = ({ 
  value, onChange, onSelectTag, placeholder, className 
}) => {
  const { tags, addTag } = useApp();
  const [showPopover, setShowPopover] = useState(false);
  const [filter, setFilter] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
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
    <div className="relative w-full">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        className={className}
        rows={1}
      />
      
      {showPopover && (
        <div className="absolute z-[60] bottom-full mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 tiktok-blur">
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => selectTag(tag.name)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }}></div>
                <span className="text-sm font-bold text-slate-700">#{tag.name}</span>
              </button>
            ))}
            
            {filter && !tags.some(t => t.name === filter) && (
              <button
                onClick={createNew}
                className="w-full flex items-center gap-3 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-colors text-left"
              >
                <i className="fa-solid fa-plus text-xs"></i>
                <span className="text-sm font-black italic">Створити мітку "{filter}"</span>
              </button>
            )}
            
            {filteredTags.length === 0 && !filter && (
              <div className="p-3 text-xs text-slate-400 text-center font-medium">Почніть вводити назву тегу...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HashtagAutocomplete;
