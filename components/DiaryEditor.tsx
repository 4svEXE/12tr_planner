import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';
import Button from './ui/Button';

interface Block {
  id: string;
  type: 'heading' | 'text' | 'task' | 'quote' | 'bullet' | 'number';
  content: string;
  checked?: boolean;
}

interface DiaryEditorProps {
  id?: string;
  date: string;
  onClose: () => void;
}

const EditableBlock: React.FC<{
  block: Block;
  index: number;
  isFocused: boolean;
  onUpdate: (updates: Partial<Block>) => void;
  onKeyDown: (e: React.KeyboardEvent, currentHTML: string) => void;
  onFocus: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  allBlocks: Block[];
}> = ({ block, index, isFocused, onUpdate, onKeyDown, onFocus, onContextMenu, allBlocks }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== block.content) {
      contentRef.current.innerHTML = block.content;
    }
  }, [block.id]);

  useEffect(() => {
    if (isFocused && contentRef.current && document.activeElement !== contentRef.current) {
      contentRef.current.focus();
    }
  }, [isFocused]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onUpdate({ content: e.currentTarget.innerHTML });
  };

  let typeClass = "";
  if (block.type === 'heading') typeClass = "text-lg md:text-xl font-black text-slate-900 leading-tight";
  if (block.type === 'text') typeClass = "text-sm font-medium text-slate-600 leading-relaxed";
  if (block.type === 'quote') typeClass = "text-sm font-medium italic text-slate-500 border-l-4 border-orange-200 pl-3 py-1 bg-orange-50/30 rounded-r-lg";
  if (block.type === 'task') typeClass = `text-sm font-bold transition-all ${block.checked ? 'line-through text-slate-300 opacity-60' : 'text-slate-700'}`;
  if (block.type === 'bullet' || block.type === 'number') typeClass = "text-sm text-slate-700 font-medium";

  return (
    <div className="flex items-start gap-2 md:gap-3 w-full group/row mb-1">
      <div className="w-5 flex flex-col items-center opacity-0 group-hover/row:opacity-100 transition-opacity pt-1 shrink-0">
         <button onClick={() => onUpdate({ id: 'DELETE_BLOCK' })} className="text-slate-200 hover:text-rose-500 p-1"><i className="fa-solid fa-xmark text-[10px]"></i></button>
      </div>

      <div className="flex-1 min-w-0 flex items-start gap-2 md:gap-3">
        {block.type === 'task' && (
          <button 
            onClick={() => onUpdate({ checked: !block.checked })} 
            className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-all ${block.checked ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-200 bg-white hover:border-orange-400 shadow-sm'}`}
          >
            {block.checked && <i className="fa-solid fa-check text-[10px]"></i>}
          </button>
        )}

        {block.type === 'bullet' && (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0 shadow-inner" />
        )}

        {block.type === 'number' && (
          <span className="text-[10px] font-black text-orange-400 mt-1 shrink-0 w-4 text-right">
            {allBlocks.slice(0, index + 1).filter(b => b.type === 'number').length}.
          </span>
        )}

        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          placeholder={block.type === 'heading' ? 'Заголовок...' : 'Напишіть щось...'}
          onInput={handleInput}
          onKeyDown={(e) => onKeyDown(e, contentRef.current?.innerHTML || '')}
          onFocus={onFocus}
          onContextMenu={onContextMenu}
          className={`focus:ring-0 outline-none w-full bg-transparent empty:before:content-[attr(placeholder)] empty:before:text-slate-200 block-input transition-all ${typeClass}`}
        />
      </div>
    </div>
  );
};

const DiaryEditor: React.FC<DiaryEditorProps> = ({ id, date, onClose }) => {
  const { diary, saveDiaryEntry } = useApp();
  const [currentId, setCurrentId] = useState<string | undefined>(id);
  const [localDate, setLocalDate] = useState(date);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [floatingMenu, setFloatingMenu] = useState<{ x: number, y: number, visible: boolean }>({ x: 0, y: 0, visible: false });
  
  const saveTimeoutRef = useRef<number | null>(null);
  const existingEntry = useMemo(() => diary.find(e => e.id === currentId), [diary, currentId]);

  useEffect(() => {
    if (existingEntry) {
      try {
        const parsed = JSON.parse(existingEntry.content);
        if (Array.isArray(parsed)) setBlocks(parsed);
        else throw new Error();
      } catch (e) {
        const lines = existingEntry.content.split('\n').filter(l => l.trim() !== '');
        const initialBlocks: Block[] = lines.map(l => ({
          id: Math.random().toString(36).substr(2, 9),
          type: l.startsWith('#') ? 'heading' : 'text',
          content: l.replace(/^#+\s*/, ''),
          checked: false
        }));
        setBlocks(initialBlocks.length > 0 ? initialBlocks : [{ id: 'b1', type: 'text', content: '' }]);
      }
    } else {
      setBlocks([{ id: 'b-init', type: 'text', content: '' }]);
    }
  }, [currentId]);

  const handleManualSave = (isAutoSave = false) => {
    const contentStr = JSON.stringify(blocks);
    const hasContent = blocks.some(b => b.content.trim() !== '' && b.content !== '<br>');
    
    // ВАЖЛИВО: Якщо це автозбереження і контенту немає, просто нічого не робимо
    // Раніше тут був виклик onClose(), який закривав порожній новий запис через 3 секунди
    if (!hasContent && !currentId) {
        return;
    }
    
    const savedId = saveDiaryEntry(localDate, contentStr, currentId);
    if (!currentId) setCurrentId(savedId);
    setIsSaving(false);
    return savedId;
  };

  const handleSaveAndClose = () => {
    handleManualSave();
    onClose();
  };

  useEffect(() => {
    if (blocks.length === 0) return;
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => handleManualSave(true), 3000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [blocks, localDate]);

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    if (updates.id === 'DELETE_BLOCK') {
       if (blocks.length > 1) setBlocks(prev => prev.filter(b => b.id !== blockId));
       return;
    }
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...updates } : b));
  };

  const addBlock = (afterId: string, type: Block['type'] = 'text') => {
    const newBlock: Block = { id: Math.random().toString(36).substr(2, 9), type, content: '', checked: false };
    const idx = blocks.findIndex(b => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    setBlocks(newBlocks);
    setFocusedBlockId(newBlock.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block, currentHTML: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const nextType = (['task', 'bullet', 'number'].includes(block.type)) ? block.type : 'text';
      addBlock(block.id, nextType);
    }
    if (e.key === 'Backspace' && (currentHTML === '' || currentHTML === '<br>') && blocks.length > 1) {
      e.preventDefault();
      const idx = blocks.findIndex(b => b.id === block.id);
      if (idx > 0) setFocusedBlockId(blocks[idx - 1].id);
      setBlocks(p => p.filter(b => b.id !== block.id));
    }
  };

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    setFloatingMenu(prev => ({ ...prev, visible: false }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      e.preventDefault();
      const x = Math.min(e.clientX, window.innerWidth - 150);
      setFloatingMenu({ x, y: e.clientY, visible: true });
    }
  };

  useEffect(() => {
    const hideMenu = () => setFloatingMenu(p => ({ ...p, visible: false }));
    window.addEventListener('click', hideMenu);
    return () => window.removeEventListener('click', hideMenu);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white relative">
      <header className="p-3 md:p-4 border-b border-slate-50 flex justify-between items-center bg-white/90 backdrop-blur-md shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2 md:gap-3">
          <input type="date" value={localDate} onChange={e => setLocalDate(e.target.value)} className="bg-transparent border-none text-orange-600 font-black uppercase text-[10px] tracking-widest focus:ring-0 p-0 cursor-pointer" />
          <div className="h-3 w-px bg-slate-100 hidden sm:block"></div>
          <Typography variant="tiny" className="text-slate-300 font-black uppercase text-[8px] tracking-widest hidden sm:block">Щоденник</Typography>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center transition-all hover:text-slate-900 active:scale-95"><i className="fa-solid fa-xmark"></i></button>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-2 md:px-4 py-1.5 bg-slate-50/50 flex items-center gap-0.5 overflow-x-auto no-scrollbar border-b border-slate-50 shrink-0">
           <button onClick={() => focusedBlockId && updateBlock(focusedBlockId, {type: 'heading'})} title="Заголовок" className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-orange-600 transition-all"><i className="fa-solid fa-heading text-xs"></i></button>
           <button onClick={() => focusedBlockId && updateBlock(focusedBlockId, {type: 'text'})} title="Текст" className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-orange-600 transition-all"><i className="fa-solid fa-paragraph text-xs"></i></button>
           <button onClick={() => focusedBlockId && updateBlock(focusedBlockId, {type: 'task'})} title="Завдання" className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-orange-600 transition-all"><i className="fa-solid fa-square-check text-xs"></i></button>
           <button onClick={() => focusedBlockId && updateBlock(focusedBlockId, {type: 'bullet'})} title="Список" className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-orange-600 transition-all"><i className="fa-solid fa-list-ul text-xs"></i></button>
           <button onClick={() => focusedBlockId && updateBlock(focusedBlockId, {type: 'number'})} title="Нумерація" className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-orange-600 transition-all"><i className="fa-solid fa-list-ol text-xs"></i></button>
           <button onClick={() => focusedBlockId && updateBlock(focusedBlockId, {type: 'quote'})} title="Цитата" className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-orange-600 transition-all"><i className="fa-solid fa-quote-left text-xs"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-1 bg-white">
           {blocks.map((block, idx) => (
             <EditableBlock 
               key={block.id}
               block={block}
               index={idx}
               allBlocks={blocks}
               isFocused={focusedBlockId === block.id}
               onUpdate={(updates) => updateBlock(block.id, updates)}
               onKeyDown={(e, content) => handleKeyDown(e, block, content)}
               onFocus={() => setFocusedBlockId(block.id)}
               onContextMenu={handleContextMenu}
             />
           ))}
        </div>

        {floatingMenu.visible && (
          <div 
            className="fixed z-[200] bg-slate-900 text-white p-1 rounded-xl shadow-2xl flex items-center gap-1 tiktok-blur animate-in fade-in zoom-in-95 scale-90"
            style={{ top: floatingMenu.y - 45, left: floatingMenu.x }}
          >
             <button onMouseDown={e => { e.preventDefault(); applyFormat('bold'); }} className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"><i className="fa-solid fa-bold text-xs"></i></button>
             <button onMouseDown={e => { e.preventDefault(); applyFormat('italic'); }} className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"><i className="fa-solid fa-italic text-xs"></i></button>
             <button onMouseDown={e => { e.preventDefault(); applyFormat('underline'); }} className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors text-orange-400"><i className="fa-solid fa-underline text-xs"></i></button>
             <button onMouseDown={e => { e.preventDefault(); applyFormat('hiliteColor', '#fef08a'); }} className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors text-yellow-300"><i className="fa-solid fa-highlighter text-xs"></i></button>
          </div>
        )}

        <footer className="p-3 md:p-4 border-t border-slate-50 flex items-center justify-between bg-white/90 backdrop-blur-md shrink-0 mb-safe">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-orange-400 animate-pulse' : 'bg-emerald-400'}`}></div>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{isSaving ? 'Збереження' : 'Збережено'}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="text-[9px] rounded-xl px-4 md:px-6 shadow-orange-100" onClick={handleSaveAndClose}>ЗБЕРЕГТИ ТА ЗАКРИТИ</Button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DiaryEditor;