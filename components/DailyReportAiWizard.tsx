
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { AiSuggestion, TaskStatus } from '../types';
import Typography from './ui/Typography';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface DailyReportAiWizardProps {
  suggestions: AiSuggestion[];
  onClose: () => void;
}

const DailyReportAiWizard: React.FC<DailyReportAiWizardProps> = ({ suggestions, onClose }) => {
  const { addTask, addProject } = useApp();
  const [items, setItems] = useState(suggestions.map((s, i) => ({ ...s, tempId: i, selected: true })));

  const toggleSelection = (tempId: number) => {
    setItems(items.map(it => it.tempId === tempId ? { ...it, selected: !it.selected } : it));
  };

  const updateItem = (tempId: number, field: string, value: string) => {
    setItems(items.map(it => it.tempId === tempId ? { ...it, [field]: value } : it));
  };

  const handleApply = () => {
    items.filter(it => it.selected).forEach(it => {
      switch (it.type) {
        case 'task':
          addTask(it.title, 'tasks', undefined, 'actions', false, undefined, undefined, TaskStatus.NEXT_ACTION);
          break;
        case 'project':
          addProject({ name: it.title, color: 'var(--primary)', isStrategic: true, type: 'goal', sphere: 'career' });
          break;
        case 'habit':
          addTask(it.title, 'tasks', undefined, 'habits');
          break;
        case 'note':
          addTask(it.title, 'note', undefined, 'actions');
          break;
        case 'achievement':
          addTask(`🏆 Досягнення: ${it.title}`, 'note', undefined, 'actions');
          break;
      }
    });
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return 'fa-bolt';
      case 'project': return 'fa-flag-checkered';
      case 'habit': return 'fa-repeat';
      case 'note': return 'fa-note-sticky';
      case 'achievement': return 'fa-trophy';
      default: return 'fa-sparkles';
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 tiktok-blur">
      <div className="absolute inset-0 bg-slate-950/60" onClick={onClose}></div>
      <Card className="w-full max-w-2xl h-full md:h-auto md:max-h-[85vh] bg-white border-none shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 md:rounded-[2.5rem]">
        <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
               <i className="fa-solid fa-sparkles text-xl"></i>
            </div>
            <div>
               <Typography variant="h2" className="text-2xl mb-1 tracking-tight">AI Пропозиції</Typography>
               <Typography variant="tiny" className="text-slate-400">На основі твого ретроспективного звіту</Typography>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-4">
          {items.map(it => (
            <div 
              key={it.tempId}
              className={`p-5 rounded-[1.8rem] border-2 transition-all ${it.selected ? 'bg-white border-indigo-100 shadow-xl ring-1 ring-indigo-50' : 'bg-slate-50 border-transparent opacity-50 grayscale'}`}
            >
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => toggleSelection(it.tempId)}
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${it.selected ? 'bg-indigo-600 border-indigo-600 text-white shadow-inner' : 'bg-white border-slate-200 text-transparent'}`}
                >
                  <i className="fa-solid fa-check text-[10px]"></i>
                </button>
                
                <div className="flex-1 space-y-3">
                   <div className="flex items-center justify-between">
                      <Badge variant="indigo" icon={getTypeIcon(it.type)} className="text-[7px] py-0 px-2 uppercase font-black">{it.type}</Badge>
                   </div>
                   
                   <input 
                    value={it.title}
                    onChange={e => updateItem(it.tempId, 'title', e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-black uppercase text-slate-800 focus:ring-0 outline-none"
                   />

                   <div className="bg-slate-50 p-3 rounded-xl italic text-[10px] text-slate-500 leading-relaxed border border-slate-100">
                      "{it.reason}"
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="p-8 border-t border-slate-50 bg-slate-50/50 flex gap-4 shrink-0">
           <Button variant="ghost" className="flex-1 py-4" onClick={onClose}>СКАСУВАТИ</Button>
           <Button 
            variant="primary" 
            className="flex-[2] py-4 shadow-xl shadow-indigo-200 bg-indigo-600 uppercase font-black tracking-widest text-[10px]"
            onClick={handleApply}
           >
             ВПРОВАДИТИ ОБРАНЕ ({items.filter(i => i.selected).length})
           </Button>
        </footer>
      </Card>
    </div>
  );
};

export default DailyReportAiWizard;
