import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';

interface Block {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'text' | 'task' | 'quote' | 'bullet' | 'number' | 'divider' | 'callout';
  content: string;
  checked?: boolean;
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
  { id: 'h2', label: 'Заголовок 2', icon: 'fa-heading', desc: 'Середній розділ' },
  { id: 'h3', label: 'Заголовок 3', icon: 'fa-heading', desc: 'Малий розділ' },
  { id: 'bullet', label: 'Список', icon: 'fa-list-ul', desc: 'Класичний маркер' },
  { id: 'task', label: 'Чек-бокс', icon: 'fa-square-check', desc: 'Справи' },
  { id: 'quote', label: 'Цитата', icon: 'fa-quote-left', desc: 'Важливе виділення' },
  { id: 'divider', label: 'Роздільник', icon: 'fa-minus', desc: 'Лінія' },
];

const EditableBlock: React.FC<{
  block: Block;
  index: number;
  isFocused: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onKeyDown: (e: React.KeyboardEvent, block: Block, currentHTML: string) => void;
  onFocus: () => void;
  onAddBlock: (type: Block['type']) => void;
  onContextMenu: (e: React.MouseEvent, block: Block) => void;
  isSelected: boolean;
  onMouseDown: (id: string) => void;
  onMouseEnter: (id: string) => void;
}> = ({ block, index, isFocused, onUpdate, onKeyDown, onFocus, onAddBlock, onContextMenu, isSelected, onMouseDown, onMouseEnter }) => {
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
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    onUpdate({ content: html });

    // Тригер '+' замість '/'
    if (html.endsWith('+')) {
      setShowSlashMenu(true);
      setSelectedIndex(0);
    } else if (showSlashMenu && !html.includes('+')) {
      setShowSlashMenu(false);
    }
  };

  const selectBlockType = (type: Block['type']) => {
    const newContent = block.content.replace(/\+$/, '');
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
      case 'h1': return "text-2xl font-black mb-4 mt-8";
      case 'h2': return "text-xl font-black mb-3 mt-6";
      case 'h3': return "text-lg font-bold mb-2 mt-4";
      case 'quote': return "border-l-4 border-[var(--primary)] pl-5 italic text-slate-500 my-4 py-2 bg-black/[0.02]";
      case 'task': return `text-sm flex items-center gap-3 py-1 ${block.checked ? 'line-through opacity-50' : ''}`;
      case 'bullet': return "text-sm flex items-start gap-4 py-1";
      case 'divider': return "h-px bg-[var(--border-color)] my-8 w-full";
      default: return "text-sm leading-relaxed opacity-90 py-1";
    }
  };

  return (
    <div
      className={`relative group/block w-full flex items-start ${isFocused || isSelected ? 'z-30' : 'z-10'} -ml-10 transition-colors duration-100 ${isSelected ? 'bg-indigo-500/10' : ''}`}
      onContextMenu={(e) => onContextMenu(e, block)}
      onMouseDown={() => onMouseDown(block.id)}
      onMouseEnter={() => onMouseEnter(block.id)}
    >
      <div className="w-10 flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-opacity">
        <button
          onClick={() => setShowSlashMenu(!showSlashMenu)}
          className="w-6 h-6 rounded-md hover:bg-black/5 text-[var(--text-muted)] flex items-center justify-center transition-all"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3 w-full">
          {block.type === 'task' && (
            <button onClick={() => onUpdate({ checked: !block.checked })} className={`custom-checkbox border-2 mt-0.5 flex items-center justify-center transition-all ${block.checked ? 'bg-emerald-500 border-emerald-500 text-white shadow-inner' : 'border-[var(--border-color)] bg-black/5'}`}>
              {block.checked && <i className="fa-solid fa-check text-[10px]"></i>}
            </button>
          )}

          {block.type === 'bullet' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-2 shrink-0" />}

          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={block.type === 'text' ? "Пишіть тут... ('+' для меню)" : ""}
            onInput={handleInput}
            onKeyDown={internalKeyDown}
            onFocus={onFocus}
            className={`focus:ring-0 outline-none w-full bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--text-muted)] empty:before:opacity-30 empty:before:italic block-input ${getBlockStyle()}`}
          />
        </div>
      </div>

      {showSlashMenu && (
        <div className="absolute top-full left-10 mt-2 w-64 bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)] rounded-2xl py-2 z-[100] tiktok-blur animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          <div className="px-4 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-[var(--border-color)] mb-1">Інструменти</div>
          <div className="max-h-80 overflow-y-auto no-scrollbar">
            {BLOCK_TYPES.map((t, i) => (
              <button key={t.id} onClick={() => selectBlockType(t.id as Block['type'])} onMouseEnter={() => setSelectedIndex(i)} className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-all ${selectedIndex === i ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <i className={`fa-solid ${t.icon} text-[10px] w-4 text-center`}></i>
                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-tight leading-none">{t.label}</div>
                  <div className={`text-[7px] font-bold ${selectedIndex === i ? 'text-white/60' : 'text-slate-400'}`}>{t.desc}</div>
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
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, blockId: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartId, setSelectionStartId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentId(id);
  }, [id]);

  useEffect(() => {
    const content = standaloneMode ? initialContent : diary?.find(e => e.id === currentId)?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        setBlocks(Array.isArray(parsed) ? parsed : [{ id: 'b1', type: 'text', content }]);
      } catch (e) {
        setBlocks([{ id: 'b1', type: 'text', content: content || '' }]);
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
  };

  useEffect(() => {
    if (blocks.length === 0) return;
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
      addBlock(block.id, (block.type === 'bullet' || block.type === 'task') ? block.type : 'text');
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
  };

  const handleContextMenu = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    if (selectedIds.size <= 1) {
      setSelectedIds(new Set([block.id]));
    }
    setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id });
  };

  const handleMouseDown = (id: string) => {
    setIsSelecting(true);
    setSelectionStartId(id);
    setSelectedIds(new Set([id]));
  };

  const handleMouseEnter = (id: string) => {
    if (!isSelecting || !selectionStartId) return;

    const startIdx = blocks.findIndex(b => b.id === selectionStartId);
    const endIdx = blocks.findIndex(b => b.id === id);
    const min = Math.min(startIdx, endIdx);
    const max = Math.max(startIdx, endIdx);

    const newSelected = new Set(blocks.slice(min, max + 1).map(b => b.id));
    setSelectedIds(newSelected);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const applyBulkFormat = (type: Block['type']) => {
    setBlocks(prev => prev.map(b => selectedIds.has(b.id) ? { ...b, type } : b));
    setContextMenu(null);
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    setBlocks(prev => {
      const remaining = prev.filter(b => !selectedIds.has(b.id));
      return remaining.length > 0 ? remaining : [{ id: 'b1', type: 'text', content: '' }];
    });
    setSelectedIds(new Set());
    setContextMenu(null);
  };

  return (
    <div
      className="h-full flex flex-col bg-transparent relative select-text"
      onClick={() => { if (!isSelecting) { setContextMenu(null); if (selectedIds.size > 0 && !isSelecting) setSelectedIds(new Set()); } }}
      onMouseUp={handleMouseUp}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-2">
        <div className="w-full space-y-1">
          {blocks.map((block, idx) => (
            <EditableBlock
              key={block.id}
              block={block}
              index={idx}
              isFocused={focusedBlockId === block.id}
              isSelected={selectedIds.has(block.id)}
              onUpdate={(u) => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, ...u } : b))}
              onKeyDown={handleKeyDown}
              onFocus={() => { setFocusedBlockId(block.id); setSelectedIds(new Set([block.id])); }}
              onAddBlock={(type) => addBlock(block.id, type)}
              onContextMenu={handleContextMenu}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
            />
          ))}
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-[1000] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-2xl py-2 w-56 tiktok-blur animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-4 py-1.5 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-[var(--border-color)] mb-1">Форматування</div>
          {BLOCK_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => { applyBulkFormat(t.id as any); }}
              className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-black/5 hover:text-indigo-600 transition-colors"
            >
              <i className={`fa-solid ${t.icon} w-4 text-center text-[10px]`}></i>
              <span className="text-[11px] font-bold uppercase tracking-tight">
                {selectedIds.size > 1 ? `Всі як ${t.label}` : t.label}
              </span>
            </button>
          ))}
          <div className="h-px bg-[var(--border-color)] my-1"></div>
          <button onClick={deleteSelected} className="w-full text-left px-4 py-2 flex items-center gap-3 text-rose-500 hover:bg-rose-50">
            <i className="fa-solid fa-trash-can w-4 text-center text-[10px]"></i>
            <span className="text-[11px] font-bold uppercase tracking-tight">
              {selectedIds.size > 1 ? `Видалити обране (${selectedIds.size})` : 'Видалити'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DiaryEditor;