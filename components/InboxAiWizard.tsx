import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Priority } from '../types';
import Typography from './ui/Typography';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface AiDecision {
  id: string;
  category: string;
  priority: string;
  status: string;
  tags: string[];
  reason: string;
  decomposition?: {
    subtasks?: string[];
    habits?: string[];
    events?: { title: string; date: string }[];
    people?: { name: string; status: string; note: string }[];
  };
  profileImpact?: {
    bioUpdate?: string;
    roleUpdate?: string;
    newGoal?: string;
    newBelief?: string;
    workStyleUpdate?: string;
    newFocusBlocker?: string;
  };
}

interface InboxAiWizardProps {
  decisions: AiDecision[];
  onClose: () => void;
  onConfirm: (selectedIds: Set<string>) => void;
}

const InboxAiWizard: React.FC<InboxAiWizardProps> = ({ decisions, onClose, onConfirm }) => {
  const { tasks } = useApp();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(decisions.map(d => d.id)));

  const toggleDecision = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const getCategoryLabel = (id: string) => {
    if (id === 'tasks') return 'Дія';
    if (id === 'notes') return 'Нотатка';
    if (id === 'project') return 'Проєкт';
    return id;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 tiktok-blur">
      <div className="absolute inset-0 bg-slate-950/60" onClick={onClose}></div>
      <Card className="w-full max-w-2xl max-h-[85vh] bg-white border-none shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 rounded-[2.5rem]">
        <header className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
               <i className="fa-solid fa-sparkles text-xl"></i>
            </div>
            <div>
               <Typography variant="h2" className="text-2xl mb-1 tracking-tight">Стратегічний розбір</Typography>
               <Typography variant="tiny" className="text-slate-400">ШІ провів глибоку декомпозицію твоїх вхідних</Typography>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-900 transition-all"><i className="fa-solid fa-xmark"></i></button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
           {decisions.map(d => {
             const task = tasks.find(t => t.id === d.id);
             if (!task) return null;
             const isSelected = selectedIds.has(d.id);
             const hasImpacts = d.decomposition || d.profileImpact;

             return (
               <div 
                key={d.id} 
                onClick={() => toggleDecision(d.id)}
                className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer group flex items-start gap-5 ${isSelected ? 'bg-white border-orange-200 shadow-xl ring-1 ring-orange-100' : 'bg-slate-50/50 border-transparent opacity-60 grayscale'}`}
               >
                 <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${isSelected ? 'bg-orange-600 border-orange-600 text-white shadow-inner' : 'bg-white border-slate-200 text-transparent'}`}>
                    <i className="fa-solid fa-check text-[12px]"></i>
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <Typography variant="h3" className="text-base mb-2 truncate group-hover:text-orange-600 transition-colors">{task.title}</Typography>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                       <Badge variant="orange" className="text-[7px] py-0 px-1.5 uppercase font-black">{getCategoryLabel(d.category)}</Badge>
                       <Badge variant="indigo" className="text-[7px] py-0 px-1.5 uppercase font-black">{d.priority}</Badge>
                       {d.tags.map(tag => <span key={tag} className="text-[8px] font-black text-slate-400 uppercase tracking-widest">#{tag}</span>)}
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 leading-relaxed mb-4">
                       "{d.reason}"
                    </div>

                    {isSelected && hasImpacts && (
                        <div className="space-y-4 mt-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2">
                           {d.decomposition && (
                             <div className="space-y-3">
                                <Typography variant="tiny" className="text-slate-400 mb-2 uppercase font-black text-[7px]">Вплив на екосистему:</Typography>
                                <div className="flex flex-wrap gap-2">
                                   {d.decomposition.subtasks?.map((st, i) => <div key={i} className="bg-slate-100 px-2 py-1 rounded text-[9px] font-bold">+ Підквест</div>)}
                                   {d.decomposition.people?.map((p, i) => <div key={i} className="bg-sky-50 text-sky-700 px-2 py-1 rounded text-[9px] font-bold"><i className="fa-solid fa-user-plus mr-1"></i> {p.name}</div>)}
                                   {d.decomposition.events?.map((ev, i) => <div key={i} className="bg-pink-50 text-pink-700 px-2 py-1 rounded text-[9px] font-bold"><i className="fa-solid fa-calendar mr-1"></i> Подія</div>)}
                                </div>
                             </div>
                           )}

                           {d.profileImpact && (
                             <div className="space-y-3">
                                <Typography variant="tiny" className="text-orange-500 mb-2 uppercase font-black text-[7px]">Зміни Героя:</Typography>
                                <div className="flex flex-wrap gap-2">
                                   {d.profileImpact.bioUpdate && <Badge variant="orange" className="text-[7px]">Оновлення Bio</Badge>}
                                   {d.profileImpact.roleUpdate && <Badge variant="orange" className="text-[7px]">Нова роль</Badge>}
                                   {d.profileImpact.newBelief && <Badge variant="indigo" className="text-[7px]">Нове переконання</Badge>}
                                   {d.profileImpact.newFocusBlocker && <Badge variant="rose" className="text-[7px]">Focus-blocker</Badge>}
                                </div>
                             </div>
                           )}
                        </div>
                    )}
                 </div>
               </div>
             );
           })}
        </div>

        <footer className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4 sticky bottom-0 z-10">
           <Button variant="ghost" className="flex-1 py-4" onClick={onClose}>СКАСУВАТИ</Button>
           <Button 
            variant="primary" 
            className="flex-[2] py-4 shadow-xl shadow-orange-200"
            disabled={selectedIds.size === 0}
            onClick={() => onConfirm(selectedIds)}
           >
             ВПРОВАДИТИ СТРАТЕГІЮ ({selectedIds.size})
           </Button>
        </footer>
      </Card>
    </div>
  );
};

export default InboxAiWizard;