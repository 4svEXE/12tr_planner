import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';

interface Block {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'text' | 'task' | 'quote' | 'bullet' | 'number' | 'divider' | 'callout';
  content: string;
  checked?: boolean;
  indent?: number;
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
  onKeyDown: (e: React.KeyboardEvent, block: Block, currentHTML: string, currentText: string) => void;
  onFocus: () => void;
  onAddBlock: (type: Block['type']) => void;
  onContextMenu: (e: React.MouseEvent, block: Block) => void;
  isSelected: boolean;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
  onMouseEnter: (id: string) => void;
  onMoveFocus: (id: string, direction: 'up' | 'down') => void;
}> = ({ block, index, isFocused, onUpdate, onKeyDown, onFocus, onAddBlock, onContextMenu, isSelected, onMouseDown, onMouseEnter, onMoveFocus }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [floatingMenu, setFloatingMenu] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== block.content && !isFocused) {
      contentRef.current.innerHTML = block.content;
    }
  }, [block.content, isFocused]);

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
    setTimeout(() => onMoveFocus(block.id, 'up'), 10); // Trigger refocus
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 20);
  };

  const internalKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % BLOCK_TYPES.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length); return; }
      if (e.key === 'Enter') { e.preventDefault(); selectBlockType(BLOCK_TYPES[selectedIndex].id as Block['type']); return; }
      if (e.key === 'Escape') { setShowSlashMenu(false); return; }
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && contentRef.current) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const parentRect = contentRef.current.getBoundingClientRect();
        if (e.key === 'ArrowUp' && rect.top <= parentRect.top + 10) {
          onMoveFocus(block.id, 'up');
        } else if (e.key === 'ArrowDown' && rect.bottom >= parentRect.bottom - 10) {
          onMoveFocus(block.id, 'down');
        }
      }
    }
    onKeyDown(e, block, contentRef.current?.innerHTML || '', contentRef.current?.innerText || '');
  };

  const handleMouseUpSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0 && contentRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setFloatingMenu({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    } else {
      setFloatingMenu(null);
    }
  };

  const internalFormatText = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      onUpdate({ content: contentRef.current.innerHTML });
    }
    setFloatingMenu(null);
  };

  const getBlockStyle = () => {
    switch (block.type) {
      case 'h1': return "text-[26px] font-bold tracking-tight leading-tight text-[var(--text-main)]";
      case 'h2': return "text-[22px] font-bold tracking-tight leading-snug text-[var(--text-main)]";
      case 'h3': return "text-[18px] font-semibold leading-normal text-[var(--text-main)]";
      case 'quote': return "italic text-[var(--text-muted)] font-normal leading-relaxed";
      case 'task': return `text-[14px] font-normal ${block.checked ? 'line-through opacity-50' : 'text-[var(--text-main)]'}`;
      case 'bullet': return "text-[14px] font-normal text-[var(--text-main)]";
      case 'divider': return "w-full opacity-40";
      default: return "text-[14px] leading-[1.4] opacity-90 font-normal text-[var(--text-main)] tracking-normal";
    }
  };

  const getWrapperStyle = () => {
    const indentLevel = block.indent || 0;
    const paddingLeft = indentLevel * 24;
    let marginStyle = "";
    switch (block.type) {
      case 'h1': marginStyle = "mb-3 mt-6"; break;
      case 'h2': marginStyle = "mb-2 mt-4"; break;
      case 'h3': marginStyle = "mb-1.5 mt-3"; break;
      case 'quote': marginStyle = "my-4 py-2 px-6 bg-[var(--primary)]/[0.04] border-l-[4px] border-[var(--primary)] rounded-r-2xl"; break;
      case 'divider': marginStyle = "my-6 h-px bg-[var(--border-color)]"; break;
      default: marginStyle = "py-0.5"; break;
    }
    return { marginStyle, paddingLeft };
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      // Basic cleaning to remove script tags or potentially destructive styles
      // but keeping basic formatting (b, i, u, span, colors)
      const cleanHtml = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");

      document.execCommand('insertHTML', false, cleanHtml);
    } else {
      document.execCommand('insertText', false, text);
    }
  };

  const { marginStyle, paddingLeft } = getWrapperStyle();

  return (
    <div
      className={`relative group/block w-full flex items-start ${isFocused || isSelected ? 'z-30' : 'z-10'} transition-colors duration-100 ${isSelected ? 'bg-indigo-500/10' : ''} ${marginStyle}`}
      style={{ paddingLeft: `${paddingLeft}px` }}
      onContextMenu={(e) => onContextMenu(e, block)}
      onMouseDown={(e) => onMouseDown(block.id, e)}
      onMouseEnter={() => onMouseEnter(block.id)}
      data-block-id={block.id}
    >
      <div className="w-8 flex items-center justify-center shrink-0 min-h-[1.4em] select-none">
        <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center h-full">
          <button
            onClick={() => setShowSlashMenu(!showSlashMenu)}
            className="w-6 h-6 rounded-md hover:bg-black/5 text-[var(--text-muted)] flex items-center justify-center transition-all"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex items-start gap-2 h-full">
        {block.type === 'task' && (
          <div className="flex items-center min-h-[1.4em] shrink-0 select-none">
            <button onClick={() => onUpdate({ checked: !block.checked })} className={`custom-checkbox w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${block.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-color)] bg-black/5'}`}>
              {block.checked && <i className="fa-solid fa-check text-[10px]"></i>}
            </button>
          </div>
        )}
        {block.type === 'bullet' && (
          <div className="flex items-center min-h-[1.4em] shrink-0 select-none">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={block.type === 'text' ? (index === 0 ? "Пишіть тут... ('+' для меню)" : "Пишіть тут...") : ""}
            onInput={handleInput}
            onKeyDown={internalKeyDown}
            onFocus={onFocus}
            onMouseUp={handleMouseUpSelection}
            onPaste={handlePaste}
            className={`focus:ring-0 outline-none w-full bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--text-muted)] empty:before:italic block-input ${getBlockStyle()} ${index === 0 ? 'empty:before:opacity-30' : 'empty:before:opacity-0 group-hover/block:empty:before:opacity-20 transition-all'} [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:ml-1`}
          />
        </div>
      </div>

      {floatingMenu && (
        <div
          className="fixed z-[200] bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl shadow-2xl flex items-center p-1.5 gap-1 animate-in fade-in zoom-in-95 duration-150 tiktok-blur"
          style={{ top: floatingMenu.y - 50, left: floatingMenu.x - 110 }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button onClick={() => internalFormatText('bold')} className="w-9 h-9 rounded-lg hover:bg-black/5 transition-colors flex items-center justify-center">
            <i className="fa-solid fa-bold text-[11px]"></i>
          </button>
          <button onClick={() => internalFormatText('italic')} className="w-9 h-9 rounded-lg hover:bg-black/5 transition-colors flex items-center justify-center">
            <i className="fa-solid fa-italic text-[11px]"></i>
          </button>
          <button onClick={() => internalFormatText('underline')} className="w-9 h-9 rounded-lg hover:bg-black/5 transition-colors flex items-center justify-center">
            <i className="fa-solid fa-underline text-[11px]"></i>
          </button>
          <div className="w-px h-5 bg-[var(--border-color)] mx-1"></div>
          <button onClick={() => internalFormatText('backColor', '#fbbf24')} className="w-9 h-9 rounded-lg hover:bg-amber-500/10 transition-colors flex items-center justify-center">
            <i className="fa-solid fa-highlighter text-[11px] text-amber-500"></i>
          </button>
          <button onClick={() => internalFormatText('removeFormat')} className="w-9 h-9 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center justify-center text-rose-500">
            <i className="fa-solid fa-eraser text-[11px]"></i>
          </button>
        </div>
      )}

      {showSlashMenu && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)] rounded-2xl py-2 z-[100] tiktok-blur animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
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
  const [bulkMenu, setBulkMenu] = useState<{ x: number, y: number } | null>(null);

  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => { setCurrentId(id); }, [id]);

  useEffect(() => {
    const content = standaloneMode ? initialContent : diary?.find(e => e.id === currentId)?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        setBlocks(Array.isArray(parsed) ? parsed : [{ id: 'b1', type: 'text', content }]);
      } catch (e) { setBlocks([{ id: 'b1', type: 'text', content: content || '' }]); }
    } else { setBlocks([{ id: 'b1', type: 'text', content: '' }]); }
  }, [currentId, initialContent, standaloneMode, diary]);

  const handleManualSave = () => {
    // Перевірка на "порожність": якщо є хоча б один блок з текстом або спеціальним типом
    const isActuallyEmpty = blocks.every(b => {
      const cleanContent = b.content.replace(/<[^>]*>?/gm, '').trim();
      return cleanContent === '' && b.type !== 'divider' && b.type !== 'task' && b.type !== 'bullet';
    });

    if (isActuallyEmpty) return;

    const contentStr = JSON.stringify(blocks);
    if (standaloneMode) { onContentChange?.(contentStr); }
    else {
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

  const addBlock = (afterId: string, type: Block['type'] = 'text', indent: number = 0) => {
    const newBlock: Block = { id: Math.random().toString(36).substr(2, 9), type, content: '', checked: false, indent };
    const idx = blocks.findIndex(b => b.id === afterId);
    const next = [...blocks];
    next.splice(idx + 1, 0, newBlock);
    setBlocks(next);
    setFocusedBlockId(newBlock.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block, currentHTML: string, currentText: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const cleanText = currentText.trim();
      if ((block.type === 'bullet' || block.type === 'task') && cleanText === '') {
        setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type: 'text' } : b));
      } else { addBlock(block.id, (block.type === 'bullet' || block.type === 'task') ? block.type : 'text', block.indent); }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const delta = e.shiftKey ? -1 : 1;
      setBlocks(prev => prev.map(b => {
        if (b.id === block.id) {
          const newIndent = Math.max(0, Math.min(8, (b.indent || 0) + delta));
          return { ...b, indent: newIndent };
        }
        return b;
      }));
    }
    if (e.key === 'Backspace' && (currentHTML === '' || currentHTML === '<br>')) {
      e.preventDefault();
      if (block.type !== 'text') { setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type: 'text' } : b)); }
      else if (blocks.length > 1) {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx > 0) setFocusedBlockId(blocks[idx - 1].id);
        setBlocks(p => p.filter(b => b.id !== block.id));
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    if (selectedIds.size <= 1) { setSelectedIds(new Set([block.id])); }
    setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id });
  };

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).isContentEditable) return;
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

  const handleMoveFocus = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === id);
    if (direction === 'up' && idx > 0) { setFocusedBlockId(blocks[idx - 1].id); }
    else if (direction === 'down' && idx < blocks.length - 1) { setFocusedBlockId(blocks[idx + 1].id); }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isSelecting && selectedIds.size > 1) { setBulkMenu({ x: e.clientX, y: e.clientY }); }
    setIsSelecting(false);
  };

  const applyBulkFormat = (type: Block['type']) => {
    setBlocks(prev => prev.map(b => selectedIds.has(b.id) ? { ...b, type } : b));
    setContextMenu(null);
    if (focusedBlockId) {
      setTimeout(() => {
        const el = document.querySelector(`[data-block-id="${focusedBlockId}"] .block-input`) as HTMLElement;
        el?.focus();
      }, 50);
    }
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
      onClick={() => { if (!isSelecting) { setContextMenu(null); setBulkMenu(null); if (selectedIds.size > 0 && !isSelecting) setSelectedIds(new Set()); } }}
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
              onMoveFocus={handleMoveFocus}
            />
          ))}
        </div>
      </div>
      {contextMenu && (
        <div className="fixed z-[1000] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-xl py-2 w-56 tiktok-blur animate-in fade-in zoom-in-95 duration-150 overflow-hidden" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className="px-4 py-1.5 text-[8px] font-black uppercase text-slate-400 tracking-widest border-b border-[var(--border-color)] mb-1">Форматування</div>
          {BLOCK_TYPES.map(t => (
            <button key={t.id} onClick={() => { applyBulkFormat(t.id as any); }} className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-black/5 hover:text-indigo-600 transition-colors">
              <i className={`fa-solid ${t.icon} w-4 text-center text-[10px]`}></i>
              <span className="text-[11px] font-bold uppercase tracking-tight">{selectedIds.size > 1 ? `Всі як ${t.label}` : t.label}</span>
            </button>
          ))}
          <div className="h-px bg-[var(--border-color)] my-1"></div>
          <button onClick={deleteSelected} className="w-full text-left px-4 py-2 flex items-center gap-3 text-rose-500 hover:bg-rose-50">
            <i className="fa-solid fa-trash-can w-4 text-center text-[10px]"></i>
            <span className="text-[11px] font-bold uppercase tracking-tight">{selectedIds.size > 1 ? `Видалити обране (${selectedIds.size})` : 'Видалити'}</span>
          </button>
        </div>
      )}
      {bulkMenu && selectedIds.size > 1 && (
        <div className="fixed z-[1000] bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl shadow-2xl flex items-center p-1.5 gap-1 animate-in fade-in zoom-in-95 duration-150 tiktok-blur" style={{ top: bulkMenu.y - 60, left: bulkMenu.x - 110 }}>
          {BLOCK_TYPES.map(t => (
            <button key={t.id} onClick={() => applyBulkFormat(t.id as any)} title={t.label} className="w-9 h-9 rounded-lg hover:bg-black/5 transition-colors flex items-center justify-center">
              <i className={`fa-solid ${t.icon} text-[11px]`}></i>
            </button>
          ))}
          <div className="w-px h-5 bg-[var(--border-color)] mx-1"></div>
          <button onClick={deleteSelected} className="w-9 h-9 rounded-lg hover:bg-rose-500/10 transition-colors flex items-center justify-center text-rose-500">
            <i className="fa-solid fa-trash-can text-[11px]"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default DiaryEditor;