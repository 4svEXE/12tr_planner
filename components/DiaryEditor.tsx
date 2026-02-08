
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';

interface Block {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'text' | 'task' | 'quote' | 'bullet' | 'divider' | 'callout';
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
  { id: 'text', label: 'Текст', icon: 'fa-font', desc: 'Просто пишіть...' },
  { id: 'h1', label: 'Заголовок 1', icon: 'fa-heading', desc: 'Великий розділ' },
  { id: 'h2', label: 'Заголовок 2', icon: 'fa-heading', desc: 'Середній розділ', size: 'text-[10px]' },
  { id: 'task', label: 'To-do список', icon: 'fa-square-check', desc: 'Відстежуйте завдання' },
  { id: 'bullet', label: 'Список', icon: 'fa-list-ul', desc: 'Простий список' },
  { id: 'quote', label: 'Цитата', icon: 'fa-quote-left', desc: 'Виділіть думку' },
  { id: 'callout', label: 'Callout', icon: 'fa-lightbulb', desc: 'Важливе зауваження' },
  { id: 'divider', label: 'Розділювач', icon: 'fa-minus', desc: 'Лінія розділу' },
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
      // Move cursor to end
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

    // Slash command detection
    if (html.endsWith('/')) {
      setShowSlashMenu(true);
      setSelectedIndex(0);
    } else if (showSlashMenu && !html.includes('/')) {
      setShowSlashMenu(false);
    }

    // Markdown detection
    if (html === '#&nbsp;' || html === '# ') onUpdate({ type: 'h1', content: '' });
    if (html === '##&nbsp;' || html === '## ') onUpdate({ type: 'h2', content: '' });
    if (html === '[]&nbsp;' || html === '[] ') onUpdate({ type: 'task', content: '' });
    if (html === '-&nbsp;' || html === '- ') onUpdate({ type: 'bullet', content: '' });
    if (html === '&gt;&nbsp;' || html === '> ') onUpdate({ type: 'quote', content: '' });
  };

  const selectBlockType = (type: Block['type']) => {
    const newContent = block.content.replace(/\/$/, '');
    onUpdate({ type, content: newContent });
    setShowSlashMenu(false);
  };

  const internalKeyDown = (e: React.KeyboardEvent) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % BLOCK_TYPES.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectBlockType(BLOCK_TYPES[selectedIndex].id as Block['type']);
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }
    onKeyDown(e, block, contentRef.current?.innerHTML || '');
  };

  const getBlockStyle = () => {
    switch (block.type) {
      case 'h1': return "text-3xl font-black mb-4 mt-6 text-[var(--text-main)] tracking-tight";
      case 'h2': return "text-2xl font-black mb-3 mt-5 text-[var(--text-main)] tracking-tight";
      case 'h3': return "text-xl font-bold mb-2 mt-4 text-[var(--text-main)]";
      case 'quote': return "border-l-4 border-[var(--primary)]/30 pl-5 italic text-lg opacity-90 my-4 text-[var(--text-main)] py-1";
      case 'callout': return "bg-[var(--primary)]/5 border border-[var(--primary)]/10 p-4 rounded-2xl my-4 flex gap-4 text-[var(--text-main)] font-medium";
      case 'task': return `text-[15px] font-medium flex items-center gap-3 py-1 ${block.checked ? 'line-through opacity-30' : 'text-[var(--text-main)]'}`;
      case 'bullet': return "text-[15px] font-medium flex items-start gap-3 py-1 text-[var(--text-main)]";
      case 'divider': return "h-px bg-[var(--border-color)] my-6 w-full";
      default: return "text-[16px] font-medium leading-relaxed text-[var(--text-main)] py-1.5";
    }
  };

  return (
    <div className={`relative group/block w-full flex items-start ${isFocused ? 'z-30' : 'z-10'}`}>
      {/* Side Controls (Notion Style) */}
      <div className="absolute -left-12 top-1.5 flex items-center opacity-0 group-hover/block:opacity-100 transition-opacity">
        <button onClick={() => onAddBlock('text')} className="w-6 h-6 rounded hover:bg-black/5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)]">
          <i className="fa-solid fa-plus text-[10px]"></i>
        </button>
        <div className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] cursor-grab active:cursor-grabbing opacity-40">
          <i className="fa-solid fa-grip-vertical text-[10px]"></i>
        </div>
      </div>

      <div className={`flex-1 min-w-0 ${block.type === 'callout' ? getBlockStyle() : ''}`}>
        {block.type === 'callout' && (
          <div className="shrink-0 text-xl pt-0.5">💡</div>
        )}
        
        <div className="flex items-start gap-3 w-full">
          {block.type === 'task' && (
            <button 
              onClick={() => onUpdate({ checked: !block.checked })} 
              className={`w-5 h-5 rounded border mt-0.5 shrink-0 transition-all flex items-center justify-center ${block.checked ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm' : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[var(--primary)]'}`}
            >
              {block.checked && <i className="fa-solid fa-check text-[10px]"></i>}
            </button>
          )}
          
          {block.type === 'bullet' && (
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/40 mt-3 shrink-0" />
          )}

          <div 
            ref={contentRef} 
            contentEditable 
            suppressContentEditableWarning 
            data-placeholder={block.type === 'text' ? "Пишіть '/' для команд..." : "Пусто..."} 
            onInput={handleInput} 
            onKeyDown={internalKeyDown} 
            onFocus={onFocus}
            className={`focus:ring-0 outline-none w-full bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--text-muted)] empty:before:opacity-20 block-input ${block.type === 'callout' ? 'bg-transparent' : getBlockStyle()}`}
          />
        </div>
      </div>

      {showSlashMenu && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)] rounded-2xl py-2 z-[100] animate-in fade-in zoom-in-95 duration-200 tiktok-blur overflow-hidden">
          <div className="px-3 py-1.5 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50">Базові блоки</div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {BLOCK_TYPES.map((t, i) => (
              <button 
                key={t.id} 
                onClick={() => selectBlockType(t.id as Block['type'])}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${selectedIndex === i ? 'bg-[var(--primary)]/10' : 'hover:bg-black/5'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] shadow-sm ${selectedIndex === i ? 'text-[var(--primary)] border-[var(--primary)]/20' : ''}`}>
                  <i className={`fa-solid ${t.icon} text-xs ${t.size || ''}`}></i>
                </div>
                <div>
                   <div className="text-[11px] font-black text-[var(--text-main)] leading-none mb-1">{t.label}</div>
                   <div className="text-[9px] font-medium text-[var(--text-muted)] leading-none">{t.desc}</div>
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
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  
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
    saveTimeoutRef.current = window.setTimeout(handleManualSave, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [blocks]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setToolbarPos(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPos({ top: rect.top - 50 + window.scrollY, left: rect.left + rect.width / 2 - 60 + window.scrollX });
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const formatText = (cmd: string) => {
    document.execCommand(cmd, false);
    if (focusedBlockId) {
      const el = document.activeElement as HTMLElement;
      if (el && el.contentEditable === 'true') {
        setBlocks(prev => prev.map(b => b.id === focusedBlockId ? { ...b, content: el.innerHTML } : b));
      }
    }
  };

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
      // If we are in a list, continue the list
      const nextType = (block.type === 'bullet' || block.type === 'task') ? block.type : 'text';
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
    if (e.key === 'ArrowUp' && (window.getSelection()?.anchorOffset === 0)) {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx > 0) { e.preventDefault(); setFocusedBlockId(blocks[idx-1].id); }
    }
    if (e.key === 'ArrowDown' && (window.getSelection()?.anchorOffset === block.content.length)) {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx < blocks.length - 1) { e.preventDefault(); setFocusedBlockId(blocks[idx+1].id); }
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] relative transition-colors duration-300">
      {toolbarPos && (
        <div 
          className="fixed z-[200] flex bg-slate-900 text-white p-1.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-1 duration-200 border border-white/10 tiktok-blur"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          <button onMouseDown={(e) => { e.preventDefault(); formatText('bold'); }} className="w-8 h-8 hover:bg-white/10 rounded-lg transition-colors"><i className="fa-solid fa-bold text-xs"></i></button>
          <button onMouseDown={(e) => { e.preventDefault(); formatText('italic'); }} className="w-8 h-8 hover:bg-white/10 rounded-lg transition-colors"><i className="fa-solid fa-italic text-xs"></i></button>
          <button onMouseDown={(e) => { e.preventDefault(); formatText('strikethrough'); }} className="w-8 h-8 hover:bg-white/10 rounded-lg transition-colors"><i className="fa-solid fa-strikethrough text-xs"></i></button>
          <div className="w-px h-4 bg-white/20 mx-1 self-center"></div>
          <button onMouseDown={(e) => { e.preventDefault(); formatText('underline'); }} className="w-8 h-8 hover:bg-white/10 rounded-lg transition-colors"><i className="fa-solid fa-underline text-xs"></i></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-16 pt-10 pb-40">
        <div className="max-w-4xl mx-auto space-y-1">
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
      
      <footer className="px-6 py-3 border-t border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)]/80 backdrop-blur z-20">
        <div className="flex items-center gap-3">
           <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-[var(--primary)] animate-pulse' : 'bg-emerald-400 opacity-40'}`}></div>
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50">{isSaving ? 'Синхронізація...' : 'Збережено локально'}</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-black text-[var(--text-muted)] opacity-30 uppercase tracking-widest">
           <span>{blocks.length} блоків</span>
           <div className="w-px h-3 bg-[var(--border-color)]"></div>
           <span>Markdown Ready</span>
        </div>
      </footer>
    </div>
  );
};

export default DiaryEditor;
