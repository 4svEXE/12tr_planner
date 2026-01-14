
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';

interface Block {
  id: string;
  type: 'heading' | 'h2' | 'h3' | 'text' | 'task' | 'quote' | 'bullet' | 'number' | 'divider';
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

const EditableBlock: React.FC<{
  block: Block;
  index: number;
  isFocused: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onKeyDown: (e: React.KeyboardEvent, block: Block, currentHTML: string) => void;
  onFocus: () => void;
  allBlocks: Block[];
  onAddBlock: (type: Block['type']) => void;
}> = ({ block, index, isFocused, onUpdate, onKeyDown, onFocus, allBlocks, onAddBlock }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showInlineMenu, setShowInlineMenu] = useState(false);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== block.content) {
      contentRef.current.innerHTML = block.content;
    }
  }, [block.id]);

  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isFocused]);

  const getBlockStyle = () => {
    switch (block.type) {
      case 'heading': return "text-2xl font-black text-slate-900 mb-2 mt-4";
      case 'h2': return "text-xl font-black text-slate-800 mb-1.5 mt-3";
      case 'h3': return "text-lg font-bold text-slate-700 mb-1 mt-2";
      case 'quote': return "border-l-4 border-orange-200 pl-4 italic text-slate-500 my-2";
      case 'divider': return "h-px bg-slate-100 my-4 w-full";
      case 'task': return `text-[15px] font-medium ${block.checked ? 'line-through text-slate-300' : 'text-slate-800'}`;
      default: return "text-[15px] font-medium text-slate-700 leading-relaxed";
    }
  };
  
  if (block.type === 'divider') {
    return (
      <div className="relative group/divider pr-4" onClick={onFocus}>
        <div className="h-px bg-slate-100 my-4 w-full" />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-1 w-full group/row mb-1 relative pl-0.5">
      {/* Increased Inline Add Menu Trigger */}
      <div className="absolute -left-8 top-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity z-20">
        <button 
          onClick={() => setShowInlineMenu(!showInlineMenu)}
          className="w-7 h-7 rounded-lg bg-white text-slate-400 hover:text-orange-500 flex items-center justify-center border border-slate-100 shadow-sm hover:shadow-md transition-all"
        >
          <i className="fa-solid fa-plus text-xs"></i>
        </button>
        {showInlineMenu && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-xl border border-slate-100 rounded-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-3 py-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">Текст</div>
            <button onClick={() => { onAddBlock('text'); setShowInlineMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2"><i className="fa-solid fa-font opacity-40"></i> Текст</button>
            <button onClick={() => { onAddBlock('heading'); setShowInlineMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2"><i className="fa-solid fa-heading opacity-40"></i> Заголовок 1</button>
            <button onClick={() => { onAddBlock('h2'); setShowInlineMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2"><i className="fa-solid fa-heading opacity-40 text-[10px]"></i> Заголовок 2</button>
            <div className="px-3 py-1 mt-1 text-[8px] font-black text-slate-300 uppercase tracking-widest border-t border-slate-50">Списки</div>
            <button onClick={() => { onAddBlock('task'); setShowInlineMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2"><i className="fa-regular fa-square-check opacity-40"></i> Чек-бокс</button>
            <button onClick={() => { onAddBlock('bullet'); setShowInlineMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2"><i className="fa-solid fa-list-ul opacity-40"></i> Маркований</button>
            <button onClick={() => { onAddBlock('divider'); setShowInlineMenu(false); }} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-2"><i className="fa-solid fa-minus opacity-40"></i> Розділювач</button>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-start gap-3">
        {block.type === 'task' && (
          <button onClick={() => onUpdate({ checked: !block.checked })} 
            className={`w-4 h-4 rounded border mt-1.5 shrink-0 transition-colors ${block.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
            {block.checked && <i className="fa-solid fa-check text-[9px]"></i>}
          </button>
        )}
        {block.type === 'bullet' && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-3 shrink-0" />}
        {block.type === 'number' && <span className="text-xs font-bold text-slate-400 mt-1 shrink-0">{index + 1}.</span>}
        
        <div 
          ref={contentRef} 
          contentEditable 
          suppressContentEditableWarning 
          data-placeholder={block.type === 'text' ? "Натисніть '+' або введіть текст..." : ""} 
          onInput={(e) => onUpdate({ content: e.currentTarget.innerHTML })} 
          onKeyDown={(e) => onKeyDown(e, block, contentRef.current?.innerHTML || '')} 
          onFocus={onFocus}
          className={`focus:ring-0 outline-none w-full bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-slate-200 block-input ${getBlockStyle()}`}
        />
      </div>
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
    const content = standaloneMode ? initialContent : diary.find(e => e.id === currentId)?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        setBlocks(Array.isArray(parsed) ? parsed : [{ id: 'b1', type: 'text', content: content }]);
      } catch (e) {
        setBlocks([{ id: 'b1', type: 'text', content: content }]);
      }
    } else {
      setBlocks([{ id: 'b1', type: 'text', content: '' }]);
    }
  }, [id, currentId]);

  const handleManualSave = () => {
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

  // Floating Toolbar logic
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setToolbarPos(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPos({
        top: rect.top - 50 + window.scrollY,
        left: rect.left + rect.width / 2 - 60 + window.scrollX
      });
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  const formatText = (cmd: string) => {
    document.execCommand(cmd, false);
    // Force blocks update from DOM
    if (focusedBlockId) {
      const el = document.activeElement as HTMLElement;
      if (el && el.contentEditable === 'true') {
        const next = blocks.map(b => b.id === focusedBlockId ? { ...b, content: el.innerHTML } : b);
        setBlocks(next);
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
      addBlock(block.id, block.type === 'task' ? 'task' : 'text');
    }
    if (e.key === 'Backspace' && (currentHTML === '' || currentHTML === '<br>') && blocks.length > 1) {
      e.preventDefault();
      const idx = blocks.findIndex(b => b.id === block.id);
      if (idx > 0) setFocusedBlockId(blocks[idx - 1].id);
      setBlocks(p => p.filter(b => b.id !== block.id));
    }
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Floating Toolbar */}
      {toolbarPos && (
        <div 
          className="fixed z-[200] flex bg-slate-900 text-white p-1 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-1 duration-200"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          <button onMouseDown={(e) => { e.preventDefault(); formatText('bold'); }} className="w-8 h-8 hover:bg-white/10 rounded-lg"><i className="fa-solid fa-bold text-xs"></i></button>
          <button onMouseDown={(e) => { e.preventDefault(); formatText('italic'); }} className="w-8 h-8 hover:bg-white/10 rounded-lg"><i className="fa-solid fa-italic text-xs"></i></button>
          <button onMouseDown={(e) => { e.preventDefault(); formatText('strikethrough'); }} className="w-8 h-8 hover:bg-white/10 rounded-lg"><i className="fa-solid fa-strikethrough text-xs"></i></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 p-2 pl-8">
        {blocks.map((block, idx) => (
          <EditableBlock 
            key={block.id} 
            block={block} 
            index={idx} 
            allBlocks={blocks} 
            isFocused={focusedBlockId === block.id} 
            onUpdate={(u) => setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, ...u } : b))} 
            onKeyDown={handleKeyDown} 
            onFocus={() => setFocusedBlockId(block.id)} 
            onAddBlock={(type) => addBlock(block.id, type)}
          />
        ))}
      </div>
      <footer className="px-4 py-3 border-t border-slate-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur">
        <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`}></div>
           <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{isSaving ? 'Синхронізація' : 'Збережено'}</span>
        </div>
        <div className="flex gap-4">
          <button className="text-[9px] font-black uppercase text-slate-300 hover:text-slate-600 transition-colors">Коментарі</button>
        </div>
      </footer>
    </div>
  );
};

export default DiaryEditor;
