
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project, Task, TaskStatus, ProjectSection } from '../types';
import Card from '../components/ui/Card';
import Typography from '../components/ui/Typography';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import TaskDetails from '../components/TaskDetails';
import HabitStatsSidebar from '../components/HabitStatsSidebar';
import { useResizer } from '../hooks/useResizer';
import { planProjectStrategically } from '../services/geminiService';
import StructureView from './StructureView';
import PlannerView from './PlannerView';
import GoalCard from '../components/projects/GoalCard';

const GoalModal: React.FC<{
  onClose: () => void,
  onSave: (data: any, autoPlan: boolean) => void,
  initialData?: Project,
  aiEnabled: boolean
}> = ({ onClose, onSave, initialData, aiEnabled }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || '#f97316');
  const [sphere, setSphere] = useState<Project['sphere']>(initialData?.sphere || 'career');
  const [leadMeasure, setLeadMeasure] = useState(initialData?.leadMeasure || '');
  const [lagMeasure, setLagMeasure] = useState(initialData?.lagMeasure || '');
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [autoPlan, setAutoPlan] = useState(false);

  const spheres = [
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse' },
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins' },
    { key: 'education', label: 'Навчання', icon: 'fa-book-open-reader' },
    { key: 'relationships', label: 'Стосунки', icon: 'fa-people-group' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch' },
  ];

  const handleSave = () => {
    const dateObj = new Date(startDate);
    dateObj.setHours(0, 0, 0, 0);
    onSave({
      name, description, color, sphere,
      startDate: dateObj.getTime(),
      leadMeasure, lagMeasure
    }, autoPlan);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <Card className="w-full max-w-lg relative z-10 shadow-2xl p-5 md:p-6 rounded-[2rem] bg-card animate-in zoom-in-95 duration-200 border-theme overflow-y-auto max-h-[90vh]">
        <Typography variant="h2" className="mb-4 text-lg">
          {initialData ? 'Редагувати Ціль' : 'Нова Стратегічна Ціль'}
        </Typography>
        <div className="space-y-4">
          <div>
            <label className="text-[8px] font-black uppercase text-muted mb-1 block tracking-widest">Назва цілі (Lag Measure Title)</label>
            <input autoComplete="off" autoCorrect="off" spellCheck="false" inputMode="text" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Напр: Досягти фінансової свободи" className="w-full h-8 bg-[var(--bg-input)] border border-[var(--border-color)] !rounded-[4px] px-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black uppercase text-rose-500 mb-1 block tracking-widest">Lag Measure (Результат)</label>
              <input autoComplete="off" autoCorrect="off" spellCheck="false" inputMode="text" value={lagMeasure} onChange={e => setLagMeasure(e.target.value)} placeholder="Напр: $10,000 капіталу" className="w-full h-8 bg-[var(--bg-input)] border border-[var(--border-color)] !rounded-[4px] px-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase text-emerald-600 mb-1 block tracking-widest">Lead Measure (Дія)</label>
              <input autoComplete="off" autoCorrect="off" spellCheck="false" inputMode="text" value={leadMeasure} onChange={e => setLeadMeasure(e.target.value)} placeholder="Напр: 2 години аналізу/день" className="w-full h-8 bg-[var(--bg-input)] border border-[var(--border-color)] !rounded-[4px] px-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[8px] font-black uppercase text-muted mb-1 block tracking-widest">Дата старту (W1)</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-8 bg-[var(--bg-input)] border border-[var(--border-color)] !rounded-[4px] px-2 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase text-muted mb-1 block tracking-widest">Колір фокусу</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="flex-1 h-8 p-0.5 bg-[var(--bg-input)] border border-[var(--border-color)] !rounded-[4px] cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all" />
                <div className="w-4 h-4 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: color }}></div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-muted mb-1 block tracking-widest">Сфера життя</label>
            <div className="grid grid-cols-3 gap-1.5">
              {spheres.map(s => (
                <button key={s.key} onClick={() => setSphere(s.key as any)} className={`p-1 !rounded-[4px] border-2 transition-all flex flex-col items-center gap-0.5 ${sphere === s.key ? 'border-primary bg-primary/10 text-primary' : 'border-theme bg-main text-muted hover:border-primary/30'}`}>
                  <i className={`fa-solid ${s.icon} text-[9px]`}></i>
                  <span className="text-[6px] font-black uppercase">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[8px] font-black uppercase mb-1 block tracking-widest transition-colors" style={{ color: color }}>Візія</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Опишіть бажаний результат..."
              className="w-full bg-[var(--bg-input)] border !rounded-[4px] p-2 text-xs font-bold outline-none transition-all h-24 resize-none shadow-inner"
              style={{
                borderColor: `${color}40`,
                borderLeftWidth: '3px',
                borderLeftColor: color
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${color}15`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = `${color}40`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {aiEnabled && !initialData && (
            <div className="p-2 bg-indigo-50 !rounded-[4px] border border-indigo-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center shadow-lg"><i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i></div>
                <div>
                  <div className="text-[8px] font-black uppercase text-indigo-700 leading-none">AI Стратег</div>
                </div>
              </div>
              <button onClick={() => setAutoPlan(!autoPlan)} className={`w-8 h-4 rounded-full transition-all relative ${autoPlan ? 'bg-indigo-600' : 'bg-muted/20'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoPlan ? 'right-0.5' : 'left-0.5'}`}></div>
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="white" className="flex-1 h-10 !rounded-[4px] font-black text-[9px]" onClick={onClose}>ВІДМІНА</Button>
            <Button disabled={!name.trim()} className="flex-[2] h-10 !rounded-[4px] shadow-xl font-black text-[9px]" onClick={handleSave}>
              {initialData ? 'ЗБЕРЕГТИ' : 'ВСТАНОВИТИ ЦІЛЬ'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ProjectsView: React.FC = () => {
  const {
    projects, tasks, aiEnabled, addProject, updateProject, deleteProject,
    toggleTaskStatus, toggleHabitStatus, setActiveTab, setPlannerProjectId, updateTask
  } = useApp();

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Project | null>(null);
  const [activeTab, setActiveTabLocal] = useState<'active' | 'archived'>('active');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedSphere, setSelectedSphere] = useState<string>('all');

  const { detailsWidth, startResizing, isResizing } = useResizer(400, 800);
  const [isMobile] = useState(window.innerWidth < 1024);

  const goals = useMemo(() =>
    projects.filter(p => {
      const matchesStatus = activeTab === 'archived' ? p.status === 'archived' : p.status === 'active';
      const matchesType = p.type === 'goal';
      const matchesSphere = selectedSphere === 'all' || p.sphere === selectedSphere;
      return matchesType && matchesStatus && matchesSphere;
    }), [projects, activeTab, selectedSphere]);

  const spheres = [
    { key: 'health', label: 'Здоров\'я', icon: 'fa-heart-pulse' },
    { key: 'career', label: 'Кар\'єра', icon: 'fa-briefcase' },
    { key: 'finance', label: 'Фінанси', icon: 'fa-coins' },
    { key: 'education', label: 'Навчання', icon: 'fa-book-open-reader' },
    { key: 'relationships', label: 'Стосунки', icon: 'fa-people-group' },
    { key: 'rest', label: 'Відпочинок', icon: 'fa-couch' },
  ];

  const handleSaveGoal = async (data: any, autoPlan: boolean) => {
    if (editingGoal) {
      updateProject({ ...editingGoal, ...data });
      setEditingGoal(null);
    } else {
      const newId = addProject({ ...data, type: 'goal', isStrategic: true });
      // AI planning logic...
    }
    setIsAdding(false);
  };

  const handlePlannerClick = (id: string) => {
    setPlannerProjectId(id);
    setActiveTab('planner');
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="p-4 md:p-8 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="w-full sm:w-auto">
            <Typography variant="h1" className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-tight">Стратегічні Цілі</Typography>
            <div className="flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)] mt-3 w-max">
              <button
                onClick={() => setActiveTabLocal('active')}
                className={`px-4 py-2 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-md' : 'text-[var(--text-muted)]'}`}
              >
                Активні
              </button>
              <button
                onClick={() => setActiveTabLocal('archived')}
                className={`px-4 py-2 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'archived' ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-md' : 'text-[var(--text-muted)]'}`}
              >
                Архів
              </button>
            </div>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            icon="fa-plus"
            className="w-full sm:w-auto rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest py-3.5 shadow-xl shadow-orange-500/20"
          >
            НОВА ЦІЛЬ
          </Button>
        </header>

        <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] px-4 md:px-8 py-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedSphere('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${selectedSphere === 'all' ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 border border-transparent'}`}
            >
              <i className="fa-solid fa-layer-group"></i>
              ВСІ
            </button>
            {spheres.map(s => {
              const count = projects.filter(p => p.type === 'goal' && p.sphere === s.key && (activeTab === 'archived' ? p.status === 'archived' : p.status === 'active')).length;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedSphere(s.key)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${selectedSphere === s.key ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 border border-transparent'}`}
                >
                  <i className={`fa-solid ${s.icon}`}></i>
                  {s.label}
                  {count > 0 && <span className={`ml-1 text-[8px] font-black px-1.5 py-0.5 rounded-md ${selectedSphere === s.key ? 'bg-[var(--primary)] text-white' : 'bg-black/5 text-[var(--text-muted)]'}`}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 gap-4 pb-32">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isExpanded={selectedGoalId === goal.id}
                onToggle={() => setSelectedGoalId(selectedGoalId === goal.id ? null : goal.id)}
                onTaskClick={setSelectedTaskId}
                onHabitClick={setSelectedHabitId}
                onSubProjectClick={(id) => setSelectedGoalId(id)}
                onPlannerClick={handlePlannerClick}
                onEdit={setEditingGoal}
                selectedTaskId={selectedTaskId}
                selectedHabitId={selectedHabitId}
              />
            ))}
            {goals.length === 0 && (
              <div className="py-20 text-center opacity-10 flex flex-col items-center">
                <i className="fa-solid fa-flag-checkered text-7xl mb-6"></i>
                <Typography variant="h2" className="text-xl font-black uppercase tracking-widest">Цілей не знайдено</Typography>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`bg-[var(--bg-card)] shrink-0 relative transition-none border-l border-[var(--border-color)] flex flex-col ${selectedTaskId || selectedHabitId ? '' : 'hidden lg:flex'}`}
        style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0, zIndex: 110 }}
      >
        {!isMobile && (
          <div onMouseDown={startResizing} className={`absolute left-0 top-0 bottom-0 w-[1px] cursor-col-resize hover:bg-[var(--primary)] transition-colors z-[100] ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}></div>
        )}
        <div className="w-full h-full flex flex-col overflow-hidden">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : selectedHabitId ? (
            <HabitStatsSidebar
              habit={tasks.find(t => t.id === selectedHabitId)!}
              onClose={() => setSelectedHabitId(null)}
              onUpdate={(u) => updateTask({ ...tasks.find(t => t.id === selectedHabitId)!, ...u })}
              onToggleStatus={toggleHabitStatus}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-compass text-9xl mb-8"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest">Оберіть елемент</Typography>
            </div>
          )}
        </div>
      </div>

      {(isAdding || editingGoal) && (
        <GoalModal
          onClose={() => { setIsAdding(false); setEditingGoal(null); }}
          onSave={handleSaveGoal}
          initialData={editingGoal || undefined}
          aiEnabled={aiEnabled || false}
        />
      )}
    </div>
  );
};

export default ProjectsView;
