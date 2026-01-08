import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { analyzeDailyReport } from '../services/geminiService';
import { AiSuggestion, TaskStatus, Priority } from '../types';

interface DiaryEditorProps {
  id?: string;
  date: string;
  onClose: () => void;
}

const DiaryEditor: React.FC<DiaryEditorProps> = ({ id, date, onClose }) => {
  const { 
    diary, saveDiaryEntry, character, addTask, addProject, 
    updateCharacter, updateTask 
  } = useApp();
  
  // Якщо ID немає, ми створюємо новий запис
  const [currentId, setCurrentId] = useState<string | undefined>(id);
  const existingEntry = useMemo(() => diary.find(e => e.id === currentId), [diary, currentId]);
  
  const [content, setContent] = useState(existingEntry?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  
  const saveTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formattedDate = new Date(date).toLocaleDateString('uk-UA', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const isReport = content.includes('# Звіт дня') || content.includes('####');

  useEffect(() => {
    // Зберігаємо автоматично при зміні контенту
    if (content !== (existingEntry?.content || '')) {
      setIsSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = window.setTimeout(() => {
        const savedId = saveDiaryEntry(date, content, currentId);
        if (!currentId) setCurrentId(savedId); // Запам'ятовуємо ID для нових записів
        setIsSaving(false);
      }, 1000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content, date, saveDiaryEntry, existingEntry?.content, currentId]);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setSuggestions([]);
    try {
      const result = await analyzeDailyReport(content, character);
      const suggestionsWithId = result.map((s: any) => ({ ...s, id: Math.random().toString(36).substr(2, 9) }));
      setSuggestions(suggestionsWithId);
      setSelectedSuggestions(new Set(suggestionsWithId.map((s: any) => s.id)));
    } catch (e) {
      console.error(e);
      alert('Помилка аналізу. Перевірте зʼєднання.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestions = () => {
    const toApply = suggestions.filter(s => selectedSuggestions.has(s.id));
    
    toApply.forEach(s => {
      switch (s.type) {
        case 'task':
          addTask(s.title, 'unsorted', undefined, 'actions');
          break;
        case 'project':
          addProject({ name: s.title, color: '#f97316', description: s.description || s.reason, isStrategic: true, type: 'goal' });
          break;
        case 'habit':
          addTask(s.title, 'tasks', undefined, 'habits');
          break;
        case 'achievement':
          const newAch = { id: Math.random().toString(36).substr(2, 9), title: s.title, description: s.reason, icon: 'fa-star', unlockedAt: Date.now() };
          updateCharacter({ achievements: [...character.achievements, newAch] });
          break;
        case 'note':
          addTask(s.title, 'notes', undefined, 'actions');
          break;
      }
    });

    setSuggestions([]);
    alert(`Впроваджено ${toApply.length} пропозицій!`);
  };

  const toggleSuggestion = (id: string) => {
    const next = new Set(selectedSuggestions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSuggestions(next);
  };

  const handleToolbarAction = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);
    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setContent(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + prefix.length + selectedText.length + suffix.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const renderMarkdown = (text: string) => {
    // @ts-ignore
    const rawHtml = window.marked ? window.marked.parse(text || "_Порожній запис..._") : text;
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
          {isReport && (
            <button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${isAnalyzing ? 'animate-pulse' : ''}`}
            >
              <i className={`fa-solid ${isAnalyzing ? 'fa-circle-notch animate-spin' : 'fa-sparkles'} text-orange-400`}></i>
              {isAnalyzing ? 'Аналізую...' : 'Проаналізувати ШІ'}
            </button>
          )}

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-2">
            <button onClick={() => setIsPreview(false)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isPreview ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Редактор</button>
            <button onClick={() => setIsPreview(true)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isPreview ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>Огляд</button>
          </div>

          <Button variant="primary" className="rounded-2xl px-8 shadow-orange-200" onClick={onClose}>ГОТОВО</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 md:p-12 bg-white flex flex-col items-center">
          {!isPreview && (
            <div className="w-full max-w-3xl mb-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar px-4 rounded-xl">
              <button onClick={() => handleToolbarAction('**', '**')} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm text-slate-500"><i className="fa-solid fa-bold text-xs"></i></button>
              <button onClick={() => handleToolbarAction('_', '_')} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm text-slate-500"><i className="fa-solid fa-italic text-xs"></i></button>
              <button onClick={() => handleToolbarAction('# ')} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm text-slate-500"><i className="fa-solid fa-heading text-xs"></i></button>
              <div className="w-px h-4 bg-slate-200 mx-1"></div>
              <button onClick={() => handleToolbarAction('- ')} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm text-slate-500"><i className="fa-solid fa-list-ul text-xs"></i></button>
              <button onClick={() => handleToolbarAction('> ')} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm text-slate-500"><i className="fa-solid fa-quote-left text-xs"></i></button>
            </div>
          )}

          <div className="max-w-3xl mx-auto w-full flex-1">
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
                placeholder="Сьогодні був надзвичайний день..."
                className="w-full h-full min-h-[500px] bg-transparent border-none focus:ring-0 text-lg font-medium text-slate-800 leading-relaxed placeholder:text-slate-100 resize-none"
              />
            )}
          </div>
        </main>

        {suggestions.length > 0 && (
          <aside className="w-96 bg-slate-50 border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            <header className="p-6 border-b border-slate-200 bg-white">
              <Typography variant="h3" className="text-slate-900 mb-1 flex items-center gap-2">
                <i className="fa-solid fa-wand-magic-sparkles text-orange-500"></i> AI Пропозиції
              </Typography>
              <Typography variant="tiny" className="text-slate-400">ШІ проаналізував твій звіт дня</Typography>
            </header>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {suggestions.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => toggleSuggestion(s.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedSuggestions.has(s.id) ? 'bg-white border-orange-200 shadow-lg ring-1 ring-orange-100' : 'bg-slate-100/50 border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${selectedSuggestions.has(s.id) ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                       <i className="fa-solid fa-check text-[10px]"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={s.type === 'task' ? 'orange' : s.type === 'habit' ? 'indigo' : 'emerald'} className="text-[7px] py-0">{s.type}</Badge>
                        <span className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{s.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed italic mb-2">"{s.reason}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="p-6 bg-white border-t border-slate-100">
               <Button 
                variant="primary" 
                className="w-full py-4 rounded-2xl shadow-xl shadow-orange-100 font-black tracking-widest text-[10px]"
                onClick={handleApplySuggestions}
                disabled={selectedSuggestions.size === 0}
               >
                 ВПРОВАДИТИ ОБРАНЕ ({selectedSuggestions.size})
               </Button>
               <button onClick={() => setSuggestions([])} className="w-full mt-3 text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">СКАСУВАТИ АНАЛІЗ</button>
            </footer>
          </aside>
        )}
      </div>

      <style>{`
        .markdown-container h4 { font-size: 0.9rem; font-weight: 900; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #f97316; text-transform: uppercase; letter-spacing: 0.05em; }
        .markdown-container blockquote { border-left: 4px solid #f1f5f9; padding-left: 1.5rem; font-style: normal; color: #475569; background: #f8fafc; padding: 1rem 1.5rem; border-radius: 1rem; margin: 0.5rem 0 1.5rem 0; font-weight: 500; }
        .bg-indigo-500 { background-color: #6366f1; }
      `}</style>
    </div>
  );
};

export default DiaryEditor;
import { useMemo } from 'react';
