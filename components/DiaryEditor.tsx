
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';
import Button from './ui/Button';
import { marked } from 'https://esm.sh/marked@12.0.0';

interface DiaryEditorProps {
  date: string;
  onClose: () => void;
}

const DiaryEditor: React.FC<DiaryEditorProps> = ({ date, onClose }) => {
  const { diary, saveDiaryEntry } = useApp();
  const existingEntry = diary.find(e => e.date === date);
  
  const [content, setContent] = useState(existingEntry?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formattedDate = new Date(date).toLocaleDateString('uk-UA', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Autosave logic
  useEffect(() => {
    if (content !== (existingEntry?.content || '')) {
      setIsSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = window.setTimeout(() => {
        saveDiaryEntry(date, content);
        setIsSaving(false);
      }, 1000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content, date, saveDiaryEntry, existingEntry?.content]);

  const handleToolbarAction = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);
    
    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setContent(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + prefix.length + selectedText.length + suffix.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    const rawHtml = marked.parse(text || "_Порожній запис..._");
    return { __html: rawHtml };
  };

  return (
    <div className="fixed inset-0 z-[120] bg-white flex flex-col animate-in slide-in-from-bottom-8 duration-300">
      <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div>
            <Typography variant="tiny" className="text-orange-500 mb-1">Редагування дня</Typography>
            <Typography variant="h3" className="text-slate-900">{formattedDate}</Typography>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
            <button 
              onClick={() => setIsPreview(false)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isPreview ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
            >
              Редактор
            </button>
            <button 
              onClick={() => setIsPreview(true)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isPreview ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
            >
              Огляд
            </button>
          </div>

          {isSaving ? (
            <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] flex items-center gap-2">
              <i className="fa-solid fa-circle-notch animate-spin"></i>
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] flex items-center gap-2">
              <i className="fa-solid fa-circle-check"></i>
            </span>
          )}
          <Button variant="primary" className="rounded-2xl px-8" onClick={onClose}>ГОТОВО</Button>
        </div>
      </header>

      {!isPreview && (
        <div className="px-8 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => handleToolbarAction('**', '**')} className="w-9 h-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all" title="Жирний"><i className="fa-solid fa-bold"></i></button>
          <button onClick={() => handleToolbarAction('_', '_')} className="w-9 h-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all" title="Курсив"><i className="fa-solid fa-italic"></i></button>
          <button onClick={() => handleToolbarAction('# ')} className="w-9 h-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all" title="Заголовок"><i className="fa-solid fa-heading"></i></button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={() => handleToolbarAction('- ')} className="w-9 h-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all" title="Список"><i className="fa-solid fa-list-ul"></i></button>
          <button onClick={() => handleToolbarAction('1. ')} className="w-9 h-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all" title="Нумерований список"><i className="fa-solid fa-list-ol"></i></button>
          <button onClick={() => handleToolbarAction('> ')} className="w-9 h-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all" title="Цитата"><i className="fa-solid fa-quote-left"></i></button>
          <button onClick={() => handleToolbarAction('--- \n')} className="w-9 h-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all" title="Розділювач"><i className="fa-solid fa-minus"></i></button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-8 md:p-20 bg-white">
        <div className="max-w-3xl mx-auto w-full min-h-full">
          {isPreview ? (
            <div 
              className="prose prose-slate prose-lg max-w-none markdown-container animate-in fade-in duration-300"
              dangerouslySetInnerHTML={renderMarkdown(content)}
            />
          ) : (
            <textarea
              ref={textareaRef}
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Сьогодні був надзвичайний день, тому що... (Використовуйте Markdown для структурування)"
              className="w-full h-full min-h-[500px] bg-transparent border-none focus:ring-0 text-lg md:text-xl font-medium text-slate-800 leading-relaxed placeholder:text-slate-100 resize-none"
            />
          )}
        </div>
      </main>

      <footer className="p-6 border-t border-slate-50 flex justify-center bg-slate-50/30">
        <div className="flex gap-12 text-slate-300 text-[10px] font-black uppercase tracking-[0.25em]">
          <div className="flex items-center gap-2">
             <i className="fa-solid fa-align-left"></i> {content.split(/\s+/).filter(w => w).length} слів
          </div>
          <div className="flex items-center gap-2">
             <i className="fa-solid fa-text-height"></i> {content.length} знаків
          </div>
        </div>
      </footer>

      <style>{`
        .markdown-container h1 { font-size: 2rem; font-weight: 900; margin-bottom: 1.5rem; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
        .markdown-container h2 { font-size: 1.5rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #334155; }
        .markdown-container p { margin-bottom: 1.25rem; color: #475569; line-height: 1.8; }
        .markdown-container ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .markdown-container ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .markdown-container blockquote { border-left: 4px solid #f97316; padding-left: 1.5rem; font-style: italic; color: #64748b; margin: 1.5rem 0; background: #fff7ed; padding: 1rem 1.5rem; border-radius: 0 1rem 1rem 0; }
        .markdown-container hr { border: none; border-top: 1px solid #f1f5f9; margin: 2rem 0; }
      `}</style>
    </div>
  );
};

export default DiaryEditor;
