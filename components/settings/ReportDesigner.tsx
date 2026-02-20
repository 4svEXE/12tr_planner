
import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { ReportQuestion, ReportQuestionType, ReportPreset } from '../../types';
import Typography from '../ui/Typography';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const QUESTION_TYPES: { val: ReportQuestionType; label: string; short: string; icon: string; color: string }[] = [
  { val: 'mood', label: 'Настрій та Енергія', short: 'Настрій', icon: 'fa-face-smile', color: 'text-amber-500' },
  { val: 'gratitude_people', label: 'Вдячність людям', short: 'Люди', icon: 'fa-users', color: 'text-sky-500' },
  { val: 'gratitude_self', label: 'Вдячність собі', short: 'Собі', icon: 'fa-heart', color: 'text-rose-500' },
  { val: 'positive_events', label: 'Позитивні події', short: 'Позитив', icon: 'fa-sun', color: 'text-orange-500' },
  { val: 'habits', label: 'Аналіз звичок', short: 'Звички', icon: 'fa-repeat', color: 'text-emerald-500' },
  { val: 'victory', label: 'Перемога дня', short: 'Перемога', icon: 'fa-trophy', color: 'text-yellow-500' },
  { val: 'ideas', label: 'Ідеї та інсайти', short: 'Ідеї', icon: 'fa-lightbulb', color: 'text-indigo-500' },
  { val: 'text', label: 'Довільний текст', short: 'Текст', icon: 'fa-align-left', color: 'text-slate-400' },
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
    <div className="space-y-12 animate-in fade-in duration-500 pb-24 px-1">
      {/* SECTION 1: THE EDITOR */}
      <section className="space-y-6">
        <header className="flex justify-between items-end px-1">
          <div>
            <Typography variant="h3" className="text-sm uppercase font-black tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-pen-ruler text-primary"></i> Активний Дизайн
            </Typography>
            <Typography variant="tiny" className="text-[var(--text-muted)]">Ці питання з'являться у вечірньому візарді</Typography>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveCurrentAsPreset}
              className="px-3 py-1.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)]/20 transition-all border border-[var(--primary)]/10 shadow-sm"
            >
              Зберегти
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
                className={`transition-all duration-200 ${isDragged ? 'opacity-30 scale-95' : 'opacity-100'} flex items-center gap-1 group/item`}
              >
                {!isEditing && (
                  <div className="cursor-grab active:cursor-grabbing text-[var(--text-muted)]/20 hover:text-[var(--text-muted)] p-1.5 shrink-0 transition-colors">
                    <i className="fa-solid fa-grip-vertical text-xs"></i>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Card padding="none" className={`group overflow-hidden transition-all border-theme ${isEditing ? 'ring-2 ring-primary/40 border-primary shadow-2xl' : 'hover:border-primary/20 shadow-sm bg-[var(--bg-card)]'}`}>
                    <div className="flex items-stretch min-h-[64px]">
                      <div className={`w-1.5 shrink-0 ${typeInfo?.color.replace('text-', 'bg-') || 'bg-slate-200'}`}></div>
                      <div className="flex-1 p-2 md:p-3 flex items-center gap-2 md:gap-4">
                        {/* Handle moved outside */}

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
                              <input
                                autoFocus
                                value={q.text}
                                onChange={e => updateQuestion(q.id, { text: e.target.value })}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[var(--text-main)] placeholder:opacity-30"
                                placeholder="Текст питання..."
                              />
                              <div className="grid grid-cols-4 gap-1">
                                {QUESTION_TYPES.map(type => (
                                  <button
                                    key={type.val}
                                    onClick={() => updateQuestion(q.id, { type: type.val })}
                                    className={`h-12 rounded-lg border text-[7px] font-black uppercase transition-all flex flex-col items-center justify-center gap-0.5 ${q.type === type.val ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--primary)]/30'}`}
                                  >
                                    <i className={`fa-solid ${type.icon} text-[10px]`}></i>
                                    <span className="truncate w-full text-center px-0.5">{type.short}</span>
                                  </button>
                                ))}
                              </div>
                              <div className="flex justify-between items-center pt-3 mt-2 border-t border-[var(--border-color)]/30">
                                <div className="flex items-center gap-4">
                                  <button onClick={() => updateQuestion(q.id, { required: !q.required })} className="flex items-center gap-2 group">
                                    <div className={`w-8 h-4 rounded-full relative transition-all ${q.required ? 'bg-rose-500' : 'bg-[var(--text-muted)]/20'}`}>
                                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${q.required ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase ${q.required ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>Обов'язкове</span>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                                    className="flex items-center gap-1.5 text-rose-500/60 hover:text-rose-500 transition-colors"
                                  >
                                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Видалити</span>
                                  </button>
                                </div>
                                <button onClick={() => setEditingId(null)} className="px-4 py-1.5 bg-[var(--primary)] text-white rounded-lg text-[8px] font-black uppercase shadow-lg hover:brightness-110">ЗБЕРЕГТИ</button>
                              </div>
                            </div>
                          ) : (
                            <div onClick={() => setEditingId(q.id)} className="cursor-pointer group/q">
                              <div className="flex items-center gap-2 mb-1">
                                <i className={`fa-solid ${typeInfo?.icon} text-[10px] ${typeInfo?.color}`}></i>
                                <Typography variant="h3" className="text-[11px] md:text-[13px] font-black uppercase tracking-tight group-hover:text-primary transition-colors truncate text-[var(--text-main)]">{q.text}</Typography>
                                {q.required && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></div>}
                              </div>
                              <Badge variant="slate" className="text-[6px] opacity-60 tracking-widest">{typeInfo?.label}</Badge>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </Card>
                </div>
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
          <Typography variant="tiny" className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-primary"></i> Доступні Шаблони
          </Typography>
          <Badge variant="slate" className="text-[8px] uppercase">{allPresets.length} ВАРІАНТІВ</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allPresets.map(preset => {
            const isSystem = preset.id === 'system_default';
            return (
              <Card key={preset.id} className={`p-5 border-theme hover:border-[var(--primary)]/30 transition-all group relative overflow-hidden bg-[var(--bg-card)] shadow-sm hover:shadow-xl ${isSystem ? 'border-amber-100/30 bg-amber-50/[0.01]' : ''}`}>
                {isSystem && (
                  <div className="absolute top-0 left-0 bg-amber-500 text-white text-[6px] font-black uppercase px-2 py-0.5 rounded-br-lg tracking-widest z-20 shadow-sm">SYSTEM</div>
                )}
                <div className="absolute top-[-20%] right-[-10%] p-2 opacity-[0.03] rotate-12 group-hover:opacity-[0.06] transition-all pointer-events-none">
                  <i className={`fa-solid ${isSystem ? 'fa-shield-halved' : 'fa-magic-wand-sparkles'} text-[120px]`}></i>
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <Typography variant="h3" className={`text-[13px] font-black uppercase tracking-tight mb-1 truncate pr-2 ${isSystem ? 'text-amber-500' : 'text-[var(--text-main)]'}`}>{preset.name}</Typography>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-[var(--primary)]/60 uppercase">{preset.questions.length} КРОКІВ</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleApplyPreset(preset)}
                        className="w-10 h-10 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 hover:scale-110 active:scale-95 transition-all"
                        title="Завантажити в редактор"
                      >
                        <i className="fa-solid fa-copy text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {preset.questions.slice(0, 4).map((pq, pi) => (
                        <div key={pi} className="w-6 h-6 rounded-lg bg-[var(--bg-main)] border-2 border-[var(--bg-card)] flex items-center justify-center shadow-sm">
                          <i className={`fa-solid ${QUESTION_TYPES.find(t => t.val === pq.type)?.icon} text-[8px] text-[var(--text-muted)]`}></i>
                        </div>
                      ))}
                      {preset.questions.length > 4 && (
                        <div className="w-6 h-6 rounded-lg bg-[var(--bg-main)] border-2 border-[var(--bg-card)] flex items-center justify-center text-[7px] font-black text-[var(--text-muted)] shadow-sm">+{preset.questions.length - 4}</div>
                      )}
                    </div>

                    {!isSystem ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleRenamePreset(preset.id, preset.name)} className="w-7 h-7 rounded-xl bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all border border-[var(--border-color)]">
                          <i className="fa-solid fa-pencil text-[9px]"></i>
                        </button>
                        <button onClick={() => { if (confirm('Видалити цей шаблон?')) deleteReportPreset(preset.id); }} className="w-7 h-7 rounded-xl bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center transition-all border border-[var(--border-color)]">
                          <i className="fa-solid fa-trash-can text-[9px]"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="h-7 flex items-center px-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
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
