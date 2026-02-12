import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';

interface Block {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'text' | 'task' | 'quote' | 'bullet' | 'number' | 'divider' | 'callout';
  content: string;
  checked?: boolean;
  metadata?: {
    icon?: string;
  };
}

interface DiaryEditorProps {
  id?: string;
  date: string;
  onClose: () => void;
  standaloneMode?: boolean;
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const BLOCK_TYPES = [
  { id: 'h1', label: 'Заголовок 1', icon: 'fa-heading', desc: 'Великий розділ' },
  { id: 'h2', label: 'Заголовок 2', icon: 'fa-heading', desc: 'Середній розділ', size: 'text-[10px]' },
  { id: 'h3', label: 'Заголовок 3', icon: 'fa-heading', desc: 'Малий розділ', size: 'text-[8px]' },
  { id: 'bullet', label: 'Маркований список', icon: 'fa-list-ul', desc: 'Класичний список' },
  { id: 'number', label: 'Нумерований список', icon: 'fa-list-ol', desc: 'Порядковий список' },
  { id: 'task', label: 'Перевірте елемент', icon: 'fa-square-check', desc: 'Чек-ліст підзадач' },
  { id: 'quote', label: 'Цитата', icon: 'fa-quote-left', desc: 'Виділити текстом' },
  { id: 'divider', label: 'Горизонтальна лінія', icon: 'fa-minus', desc: 'Роздільник блоків' },
  { id: 'attachment', label: 'Вкладення', icon: 'fa-paperclip', desc: 'Додати файл', action: 'attach' },
  { id: 'subtask', label: 'Підзадача', icon: 'fa-diagram-predecessor', desc: 'Додати внутрішню дію', action: 'subtask' },
  { id: 'tag', label: 'Мітка', icon: 'fa-tag', desc: 'Прив\'язати тег', action: 'tag' },
];

const EditableBlock: React.FC<{
  block: Block;
  index: number;
  isFocused: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onKeyDown: (e: React.KeyboardEvent, block: Block, currentHTML: string) => void;
  onFocus: () => void;
  onAddBlock: (type: Block['type']) => void;
}> = ({ block, index, isFocused, onUpdate, onKeyDown, onFocus, onAddBlock }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== block.content) {
      contentRef.current.innerHTML = block.content;
    }
  }, [block.id, block.content]);

  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    onUpdate({ content: html });

    if (html.endsWith('/')) {
      setShowSlashMenu(true);
      setSelectedIndex(0);
    } else if (showSlashMenu && !html.includes('/')) {
      setShowSlashMenu(false);
    }
  };

  const selectBlockType = (type: Block['type']) => {
    const newContent = block.content.replace(/\/$/, '');
    onUpdate({ type, content: newContent });
    setShowSlashMenu(false);
  };

  const internalKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % BLOCK_TYPES.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length); return; }
      if (e.key === 'Enter') { e.preventDefault(); selectBlockType(BLOCK_TYPES[selectedIndex].id as Block['type']); return; }
      if (e.key === 'Escape') { setShowSlashMenu(false); return; }
    }
    onKeyDown(e, block, contentRef.current?.innerHTML || '');
  };

  const getBlockStyle = () => {
    switch (block.type) {
      case 'h1': return "text-[18px] font-bold mb-2 mt-4 text-[var(--text-main)]";
      case 'h2': return "text-[16px] font-bold mb-1.5 mt-3 text-[var(--text-main)] opacity-90";
      case 'h3': return "text-[14px] font-bold mb-1 mt-2 text-[var(--text-main)] opacity-80";
      case 'quote': return "border-l-[3px] border-[var(--primary)]/30 pl-4 italic text-[var(--text-muted)] my-3 py-1 bg-[var(--bg-main)]/30 rounded-r-lg";
      case 'task': return `text-[13px] font-medium flex items-center gap-3 py-1 ${block.checked ? 'line-through text-[var(--text-muted)] opacity-50' : 'text-[var(--text-main)]'}`;
      case 'bullet': return "text-[13px] font-medium flex items-start gap-3 py-1 text-[var(--text-main)]";
      case 'number': return "text-[13px] font-medium flex items-start gap-3 py-1 text-[var(--text-main)]";
      case 'divider': return "h-px bg-[var(--border-color)] my-6 w-full";
      default: return "text-[13px] font-medium leading-relaxed text-[var(--text-main)] opacity-80 py-1";
    }
  };

  return (
    <div className={`relative group/block w-full flex items-start ${isFocused ? 'z-30' : 'z-10'}`}>
      <div className="absolute -left-6 top-1.5 flex items-center opacity-0 group-hover/block:opacity-100 transition-opacity">
        <button onClick={() => onAddBlock('text')} className="w-5 h-5 rounded hover:bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
          <i className="fa-solid fa-plus text-[9px]"></i>
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 w-full">
          {block.type === 'task' && (
            <button 
              onClick={() => onUpdate({ checked: !block.checked })} 
              className={`w-4 h-4 rounded border mt-1 shrink-0 transition-all flex items-center justify-center ${block.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--primary)]'}`}
            >
              {block.checked && <i className="fa-solid fa-check text-[8px]"></i>}
            </button>
          )}
          
          {block.type === 'bullet' && (
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-40 mt-2.5 shrink-0" />
          )}

          {block.type === 'number' && (
            <span className="text-[11px] font-black text-[var(--text-muted)] opacity-40 mt-1.5 shrink-0 w-4">{index + 1}.</span>
          )}

          <div 
            ref={contentRef} 
            contentEditable 
            suppressContentEditableWarning 
            data-placeholder={block.type === 'text' ? "Додати опис... ('/' для меню)" : ""} 
            onInput={handleInput} 
            onKeyDown={internalKeyDown} 
            onFocus={onFocus}
            className={`focus:ring-0 outline-none w-full bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--text-muted)] empty:before:opacity-30 empty:before:italic block-input ${getBlockStyle()}`}
          />
        </div>
      </div>

      {showSlashMenu && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--bg-card)] shadow-[0_10px_40px_rgba(0,0,0,0.25)] border border-[var(--border-color)] rounded-2xl py-2 z-[100] tiktok-blur animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          <div className="px-4 py-1 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1 opacity-50">Форматування</div>
          <div className="max-h-72 overflow-y-auto no-scrollbar">
            {BLOCK_TYPES.map((t, i) => (
              <button 
                key={t.id} 
                onClick={() => selectBlockType(t.id as Block['type'])}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${selectedIndex === i ? 'bg-black/5' : ''}`}
              >
                <i className={`fa-solid ${t.icon} w-4 text-center text-[var(--text-muted)] text-[10px] ${selectedIndex === i ? 'text-[var(--primary)]' : ''}`}></i>
                <div className="flex-1 min-w-0">
                   <div className={`text-[12px] font-bold truncate ${selectedIndex === i ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>{t.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DiaryEditor: React.FC<DiaryEditorProps> = ({ id, date, onClose, standaloneMode = false, initialContent, onContentChange }) => {
  const { diary, saveDiaryEntry } = useApp();
  const [currentId, setCurrentId] = useState<string | undefined>(id);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentId(id);
  }, [id]);

  const parseMarkdownToBlocks = (md: string): Block[] => {
    if (!md) return [{ id: 'b1', type: 'text', content: '' }];
    const lines = md.split('\n');
    return lines.map((line, i) => {
      let type: Block['type'] = 'text';
      let content = line.trim();
      let checked = false;

      if (line.startsWith('# ')) { type = 'h1'; content = line.replace('# ', ''); }
      else if (line.startsWith('## ')) { type = 'h2'; content = line.replace('## ', ''); }
      else if (line.startsWith('### ')) { type = 'h3'; content = line.replace('### ', ''); }
      else if (line.startsWith('- [x] ')) { type = 'task'; content = line.replace('- [x] ', ''); checked = true; }
      else if (line.startsWith('- [ ] ')) { type = 'task'; content = line.replace('- [ ] ', ''); }
      else if (line.startsWith('- ')) { type = 'bullet'; content = line.replace('- ', ''); }
      else if (line.startsWith('> ')) { type = 'quote'; content = line.replace('> ', ''); }
      else if (line === '---') { type = 'divider'; content = ''; }

      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
      return { id: `b-${i}-${Math.random()}`, type, content: content || '<br>', checked };
    }).filter(b => b.content !== '' || b.type === 'divider');
  };

  useEffect(() => {
    const content = standaloneMode ? initialContent : diary?.find(e => e.id === currentId)?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        setBlocks(Array.isArray(parsed) ? parsed : parseMarkdownToBlocks(content));
      } catch (e) {
        setBlocks(parseMarkdownToBlocks(content));
      }
    } else {
      setBlocks([{ id: 'b1', type: 'text', content: '' }]);
    }
  }, [currentId, initialContent, standaloneMode, diary]);

  const handleManualSave = () => {
    if (blocks.length === 0) return;
    const contentStr = JSON.stringify(blocks);
    if (standaloneMode) {
      onContentChange?.(contentStr);
    } else {
      const savedId = saveDiaryEntry(date, contentStr, currentId);
      if (!currentId) setCurrentId(savedId);
    }
    setIsSaving(false);
  };

  useEffect(() => {
    if (blocks.length === 0) return;
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(handleManualSave, 1000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [blocks]);

  const addBlock = (afterId: string, type: Block['type'] = 'text') => {
    const newBlock: Block = { id: Math.random().toString(36).substr(2, 9), type, content: '', checked: false };
    const idx = blocks.findIndex(b => b.id === afterId);
    const next = [...blocks];
    next.splice(idx + 1, 0, newBlock);
    setBlocks(next);
    setFocusedBlockId(newBlock.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block, currentHTML: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const nextType = (block.type === 'bullet' || block.type === 'task' || block.type === 'number') ? block.type : 'text';
      addBlock(block.id, nextType);
    }
    if (e.key === 'Backspace' && (currentHTML === '' || currentHTML === '<br>')) {
      e.preventDefault();
      if (block.type !== 'text') {
        setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type: 'text' } : b));
      } else if (blocks.length > 1) {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx > 0) setFocusedBlockId(blocks[idx - 1].id);
        setBlocks(p => p.filter(b => b.id !== block.id));
      }
    }
    if (e.key === 'ArrowUp') {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx > 0) { e.preventDefault(); setFocusedBlockId(blocks[idx-1].id); }
    }
    if (e.key === 'ArrowDown') {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx < blocks.length - 1) { e.preventDefault(); setFocusedBlockId(blocks[idx+1].id); }
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative">
      {/* Додано pl-2 для падінгу зліва 8 пікселів */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-2 pl-2">
        <div className="space-y-0.5">
          {blocks.map((block, idx) => (
            <EditableBlock 
              key={block.id} 
              block={block} 
              index={idx} 
              isFocused={focusedBlockId === block.id} 
              onUpdate={(u) => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, ...u } : b))} 
              onKeyDown={handleKeyDown} 
              onFocus={() => setFocusedBlockId(block.id)} 
              onAddBlock={(type) => addBlock(block.id, type)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiaryEditor;