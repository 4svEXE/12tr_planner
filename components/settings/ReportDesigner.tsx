
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ReportQuestion, ReportQuestionType, ReportPreset } from '../../types';
import Typography from '../ui/Typography';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const QUESTION_TYPES: { val: ReportQuestionType; label: string; icon: string; color: string }[] = [
  { val: 'mood', label: 'Настрій та Енергія', icon: 'fa-face-smile', color: 'text-amber-500' },
  { val: 'gratitude_people', label: 'Вдячність людям', icon: 'fa-users', color: 'text-sky-500' },
  { val: 'gratitude_self', label: 'Вдячність собі', icon: 'fa-heart', color: 'text-rose-500' },
  { val: 'positive_events', label: 'Позитивні події', icon: 'fa-sun', color: 'text-orange-500' },
  { val: 'habits', label: 'Аналіз звичок', icon: 'fa-repeat', color: 'text-emerald-500' },
  { val: 'victory', label: 'Перемога дня', icon: 'fa-trophy', color: 'text-yellow-500' },
  { val: 'ideas', label: 'Ідеї та інсайти', icon: 'fa-lightbulb', color: 'text-indigo-500' },
  { val: 'text', label: 'Довільний текст', icon: 'fa-align-left', color: 'text-slate-400' },
];

const SYSTEM_DEFAULT_PRESET: ReportPreset = {
  id: 'system_default',
  name: 'Стандартний 12TR',
  questions: [
    { id: 'sq1', text: 'Як пройшов день?', type: 'mood', required: true },
    { id: 'sq2', text: 'Кому ви вдячні сьогодні?', type: 'gratitude_people', required: false },
    { id: 'sq3', text: 'Головна перемога дня', type: 'victory', required: true },
    { id: 'sq4', text: 'Нові ідеї чи плани?', type: 'ideas', required: false }
  ],
  updatedAt: Date.now()
};

const ReportDesigner: React.FC = () => {
  const { 
    reportTemplate = [], 
    updateReportTemplate, 
    reportPresets = [], 
    addReportPreset, 
    updateReportPreset, 
    deleteReportPreset 
  } = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // --- ACTIONS FOR ACTIVE EDITOR ---

  const addQuestion = () => {
    const newQ: ReportQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      text: 'Нове питання...',
      type: 'text',
      required: false
    };
    updateReportTemplate([...reportTemplate, newQ]);
    setEditingId(newQ.id);
  };

  const updateQuestion = (id: string, updates: Partial<ReportQuestion>) => {
    updateReportTemplate(reportTemplate.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    if (confirm('Видалити це питання з активного звіту?')) {
      updateReportTemplate(reportTemplate.filter(q => q.id !== id));
    }
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const next = [...reportTemplate];
    const draggedItem = next[draggedIndex];
    next.splice(draggedIndex, 1);
    next.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    updateReportTemplate(next);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  // --- ACTIONS FOR PRESETS ---

  const handleSaveCurrentAsPreset = () => {
    const name = prompt('Назва вашого нового шаблону:');
    if (name) addReportPreset(name, reportTemplate);
  };

  const handleApplyPreset = (preset: ReportPreset) => {
    if (confirm(`Застосувати шаблон "${preset.name}"? Поточні питання в редакторі будуть замінені.`)) {
      updateReportTemplate(preset.questions);
      if (navigator.vibrate) navigator.vibrate(20);
    }
  };

  const handleRenamePreset = (id: string, oldName: string) => {
    const newName = prompt('Змінити назву шаблону на:', oldName);
    if (newName && newName !== oldName) updateReportPreset(id, { name: newName });
  };

  const allPresets = [SYSTEM_DEFAULT_PRESET, ...reportPresets];

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-24">
      {/* SECTION 1: THE EDITOR */}
      <section className="space-y-6">
        <header className="flex justify-between items-end px-1">
          <div>
            <Typography variant="h3" className="text-sm uppercase font-black tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-pen-ruler text-primary"></i> Активний Дизайн
            </Typography>
            <Typography variant="tiny" className="text-slate-400">Ці питання з'являться у вечірньому візарді</Typography>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSaveCurrentAsPreset}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
            >
              Зберегти в базу
            </button>
            <button 
              onClick={addQuestion}
              className="w-9 h-9 rounded-2xl bg-primary text-white shadow-xl shadow-orange-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <i className="fa-solid fa-plus text-sm"></i>
            </button>
          </div>
        </header>

        <div className="space-y-3">
          {reportTemplate.map((q, idx) => {
            const typeInfo = QUESTION_TYPES.find(t => t.val === q.type);
            const isEditing = editingId === q.id;
            const isDragged = draggedIndex === idx;

            return (
              <div 
                key={q.id}
                draggable={!isEditing}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-200 ${isDragged ? 'opacity-30 scale-95' : 'opacity-100'}`}
              >
                <Card padding="none" className={`overflow-hidden transition-all border-theme ${isEditing ? 'ring-2 ring-primary/40 border-primary shadow-2xl' : 'hover:border-primary/20 shadow-sm bg-white'}`}>
                  <div className="flex items-stretch min-h-[64px]">
                    <div className={`w-1.5 shrink-0 ${typeInfo?.color.replace('text-', 'bg-') || 'bg-slate-200'}`}></div>
                    <div className="flex-1 p-3 flex items-center gap-4">
                      {/* Handle */}
                      <div className="cursor-grab active:cursor-grabbing text-slate-200 hover:text-slate-400 p-1 shrink-0">
                         <i className="fa-solid fa-grip-vertical"></i>
                      </div>

                      <div className="flex-1 min-w-0">
                         {isEditing ? (
                           <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                              <input 
                                autoFocus 
                                value={q.text} 
                                onChange={e => updateQuestion(q.id, { text: e.target.value })} 
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-slate-800"
                                placeholder="Текст питання..."
                              />
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                 {QUESTION_TYPES.map(type => (
                                   <button 
                                      key={type.val} 
                                      onClick={() => updateQuestion(q.id, { type: type.val })}
                                      className={`px-2 py-2 rounded-xl border text-[8px] font-black uppercase transition-all flex flex-col items-center gap-1 ${q.type === type.val ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                   >
                                      <i className={`fa-solid ${type.icon} text-[10px]`}></i>
                                      <span className="truncate w-full text-center">{type.label.split(' ')[0]}</span>
                                   </button>
                                 ))}
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                 <button onClick={() => updateQuestion(q.id, { required: !q.required })} className="flex items-center gap-2 group">
                                    <div className={`w-8 h-4 rounded-full relative transition-all ${q.required ? 'bg-rose-500' : 'bg-slate-200'}`}>
                                       <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${q.required ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase ${q.required ? 'text-rose-500' : 'text-slate-400'}`}>Обов'язкове</span>
                                 </button>
                                 <button onClick={() => setEditingId(null)} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:brightness-110">ГОТОВО</button>
                              </div>
                           </div>
                         ) : (
                           <div onClick={() => setEditingId(q.id)} className="cursor-pointer group/q">
                              <div className="flex items-center gap-2 mb-1">
                                 <i className={`fa-solid ${typeInfo?.icon} text-[10px] ${typeInfo?.color}`}></i>
                                 <Typography variant="h3" className="text-[13px] font-black uppercase tracking-tight group-hover:text-primary transition-colors truncate">{q.text}</Typography>
                                 {q.required && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></div>}
                              </div>
                              <Badge variant="slate" className="text-[6px] opacity-60 tracking-widest">{typeInfo?.label}</Badge>
                           </div>
                         )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => removeQuestion(q.id)} 
                             className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                             title="Видалити питання"
                           >
                             <i className="fa-solid fa-trash-can text-[10px]"></i>
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
          
          {reportTemplate.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-theme rounded-[3rem] opacity-30 bg-black/[0.02] flex flex-col items-center">
               <i className="fa-solid fa-clipboard-question text-5xl mb-4"></i>
               <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-4">Редактор порожній</p>
               <button onClick={addQuestion} className="text-primary font-black uppercase text-[10px] hover:underline tracking-widest">+ Створити перше питання</button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: THE LIBRARY */}
      <section className="space-y-6">
         <div className="px-1 border-b border-theme pb-3 flex items-center justify-between">
           <Typography variant="tiny" className="text-slate-400 font-black uppercase tracking-[0.3em] flex items-center gap-2">
             <i className="fa-solid fa-layer-group text-primary"></i> Доступні Шаблони
           </Typography>
           <Badge variant="slate" className="text-[8px] uppercase">{allPresets.length} ВАРІАНТІВ</Badge>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allPresets.map(preset => {
              const isSystem = preset.id === 'system_default';
              return (
                <Card key={preset.id} className={`p-5 border-theme hover:border-indigo-300 transition-all group relative overflow-hidden bg-white shadow-sm hover:shadow-xl ${isSystem ? 'border-amber-100 bg-amber-50/[0.02]' : ''}`}>
                   {isSystem && (
                     <div className="absolute top-0 left-0 bg-amber-500 text-white text-[6px] font-black uppercase px-2 py-0.5 rounded-br-lg tracking-widest z-20 shadow-sm">SYSTEM</div>
                   )}
                   <div className="absolute top-[-20%] right-[-10%] p-2 opacity-[0.03] rotate-12 group-hover:opacity-[0.06] transition-all pointer-events-none">
                      <i className={`fa-solid ${isSystem ? 'fa-shield-halved' : 'fa-magic-wand-sparkles'} text-[120px]`}></i>
                   </div>
                   
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                         <div className="min-w-0">
                            <Typography variant="h3" className={`text-[13px] font-black uppercase tracking-tight mb-1 truncate pr-2 ${isSystem ? 'text-amber-800' : 'text-slate-900'}`}>{preset.name}</Typography>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-indigo-600/60 uppercase">{preset.questions.length} КРОКІВ</span>
                            </div>
                         </div>
                         <div className="flex gap-1 shrink-0">
                            <button 
                              onClick={() => handleApplyPreset(preset)} 
                              className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-110 active:scale-95 transition-all"
                              title="Завантажити в редактор"
                            >
                               <i className="fa-solid fa-copy text-xs"></i>
                            </button>
                         </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6">
                         <div className="flex -space-x-1.5 overflow-hidden">
                            {preset.questions.slice(0, 4).map((pq, pi) => (
                              <div key={pi} className="w-6 h-6 rounded-lg bg-slate-50 border-2 border-white flex items-center justify-center shadow-sm">
                                 <i className={`fa-solid ${QUESTION_TYPES.find(t => t.val === pq.type)?.icon} text-[8px] text-slate-400`}></i>
                              </div>
                            ))}
                            {preset.questions.length > 4 && (
                              <div className="w-6 h-6 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[7px] font-black text-slate-500 shadow-sm">+{preset.questions.length - 4}</div>
                            )}
                         </div>
                         
                         {!isSystem ? (
                           <div className="flex gap-1.5">
                              <button onClick={() => handleRenamePreset(preset.id, preset.name)} className="w-7 h-7 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all border border-slate-100">
                                 <i className="fa-solid fa-pencil text-[9px]"></i>
                              </button>
                              <button onClick={() => { if(confirm('Видалити цей шаблон?')) deleteReportPreset(preset.id); }} className="w-7 h-7 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all border border-slate-100">
                                 <i className="fa-solid fa-trash-can text-[9px]"></i>
                              </button>
                           </div>
                         ) : (
                           <div className="h-7 flex items-center px-3 bg-amber-50 rounded-xl border border-amber-100/50">
                              <i className="fa-solid fa-lock text-[8px] text-amber-300 mr-2"></i>
                              <span className="text-[7px] font-black text-amber-500/70 uppercase tracking-widest">Захищено</span>
                           </div>
                         )}
                      </div>
                   </div>
                </Card>
              );
            })}
         </div>
      </section>
    </div>
  );
};

export default ReportDesigner;
