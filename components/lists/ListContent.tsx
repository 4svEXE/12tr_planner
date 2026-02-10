
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Project, Task, TaskStatus, Priority, ProjectSectionData } from '../../types';
import ListHeader from './ListHeader';
import QuickAddTask from './QuickAddTask';
import TaskItem from './TaskItem';
import Typography from '../ui/Typography';

interface ListContentProps {
  project: Project;
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  onBack: () => void;
  isMobile: boolean;
}

const ListContent: React.FC<ListContentProps> = ({ project, tasks, selectedTaskId, onSelectTask, onBack, isMobile }) => {
  const { addTask, updateTask, updateProject, addProjectSection, renameProjectSection, deleteProjectSection, deleteTask, toggleTaskStatus } = useApp();
  const [quickTaskValue, setQuickTaskValue] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  const sectionInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const viewMode = project.viewMode || 'list';
  const showCompleted = project.showCompleted || false;
  const showDetails = project.showDetails || false;
  const sortBy = project.sortBy || 'priority';

  const filteredTasks = useMemo<Task[]>(() => {
    let result = [...tasks];
    if (!showCompleted) {
      result = result.filter(t => t.status !== TaskStatus.DONE);
    }

    if (sortBy === 'priority') {
      const pOrder = { [Priority.UI]: 0, [Priority.UNI]: 1, [Priority.NUI]: 2, [Priority.NUNI]: 3 };
      result.sort((a, b) => (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'date') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    return result;
  }, [tasks, showCompleted, sortBy]);

  const timelineGroups = useMemo(() => {
    const groups: Record<string, Task[]> = {
      'Сьогодні': [],
      'Майбутнє': [],
      'Без дати': []
    };
    const today = new Date().setHours(0,0,0,0);

    filteredTasks.forEach(t => {
      if (!t.scheduledDate) {
        groups['Без дати'].push(t);
      } else {
        const d = new Date(t.scheduledDate).setHours(0,0,0,0);
        if (d === today) groups['Сьогодні'].push(t);
        else if (d > today) groups['Майбутнє'].push(t);
        else {
          const label = new Date(t.scheduledDate).toLocaleDateString('uk-UA', {day:'numeric', month:'short'});
          if (!groups[label]) groups[label] = [];
          groups[label].push(t);
        }
      }
    });
    return groups;
  }, [filteredTasks]);

  const sections: ProjectSectionData[] = project?.sections || [{ id: 'actions', title: 'Загальне' }];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskValue.trim()) return;
    const category = project.id === 'system_notes' ? 'note' : 'tasks';
    const pId = (project.id === 'system_inbox' || project.id === 'system_notes') ? undefined : project.id;
    addTask(quickTaskValue.trim(), category, pId, 'actions');
    setQuickTaskValue('');
  };

  const handleAddTaskAndEdit = (projectId: string, sectionId: string) => {
    const category = projectId === 'system_notes' ? 'note' : 'tasks';
    const pId = (projectId === 'system_inbox' || projectId === 'system_notes') ? undefined : projectId;
    const id = addTask('', category, pId, sectionId);
    setEditingTaskId(id);
    setInputValue('');
    setTimeout(() => taskInputRef.current?.focus(), 100);
  };

  const handleAddSectionAction = () => {
    const title = prompt('Назва нової секції:', 'Нова секція');
    if (title && title.trim()) {
      addProjectSection(project.id, title.trim());
    }
  };

  const handleFinishTaskEdit = (task: Task) => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      deleteTask(task.id, true);
    } else {
      updateTask({ ...task, title: trimmed });
    }
    setEditingTaskId(null);
  };

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDropToSection = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) updateTask({ ...task, projectSection: sectionId as any });
    }
  };

  const renderTask = (task: Task) => (
    <TaskItem 
      key={task.id} 
      task={task} 
      isSelected={selectedTaskId === task.id} 
      isEditing={editingTaskId === task.id} 
      inputValue={inputValue} 
      onSelect={onSelectTask} 
      onToggleStatus={toggleTaskStatus} 
      onDelete={deleteTask} 
      onInputChange={setInputValue} 
      onFinishEdit={handleFinishTaskEdit} 
      inputRef={taskInputRef}
      showDetails={showDetails} 
    />
  );

  const isSystem = project.id === 'system_inbox' || project.id === 'system_notes';

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] h-full overflow-hidden">
      <ListHeader 
        project={project} 
        tasks={tasks}
        taskCount={filteredTasks.length} 
        isMobile={isMobile} 
        onBack={onBack} 
        onUpdateProject={updateProject} 
        onAddSection={addProjectSection} 
      />
      
      {viewMode === 'list' && (
        <div className="mb-1">
          <QuickAddTask 
            value={quickTaskValue} 
            onChange={setQuickTaskValue} 
            onSubmit={handleAddTask} 
          />
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 space-y-1.5 pb-32 pt-0">
          {sections.map(section => {
            const sectionItems: Task[] = filteredTasks.filter(t => (t.projectSection as any) === section.id || (section.id === 'actions' && !t.projectSection));
            const isCollapsed = collapsedSections.has(section.id);
            const isSectionEditing = editingSectionId === section.id;

            return (
              <div key={section.id} className="space-y-0.5 mb-4 last:mb-0">
                <div 
                   onDragOver={e => e.preventDefault()}
                   onDrop={e => handleDropToSection(e, section.id)}
                   className="flex items-center group/sec relative h-8"
                >
                  <div className="flex items-center gap-2 flex-1 pl-2">
                    {isSectionEditing ? (
                      <input 
                        ref={sectionInputRef} 
                        autoFocus 
                        value={inputValue} 
                        onChange={e => setInputValue(e.target.value)} 
                        onBlur={() => { if(inputValue.trim()) renameProjectSection(project.id, section.id, inputValue); setEditingSectionId(null); }} 
                        onKeyDown={e => e.key === 'Enter' && (inputValue.trim() && renameProjectSection(project.id, section.id, inputValue), setEditingSectionId(null))} 
                        className="text-[9px] font-black uppercase text-[var(--text-main)] tracking-[0.15em] bg-transparent border-b border-[var(--primary)] outline-none px-0" 
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => { setEditingSectionId(section.id); setInputValue(section.title); }}
                        className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-[0.15em] opacity-80 shrink-0 cursor-text hover:text-[var(--text-main)] transition-colors"
                      >
                        {section.title}
                      </span>
                    )}
                    <div className="h-[1px] flex-1 bg-[var(--border-color)] opacity-20"></div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/sec:opacity-100 transition-opacity pr-2 shrink-0">
                    <button onClick={() => handleAddTaskAndEdit(project.id, section.id)} className="w-6 h-6 rounded hover:bg-black/5 flex items-center justify-center text-[9px] text-[var(--primary)]" title="Швидке завдання"><i className="fa-solid fa-plus"></i></button>
                    {!isSystem && section.id !== 'actions' && (
                      <button onClick={() => confirm(`Видалити секцію "${section.title}"? Завдання залишаться в списку.`) && deleteProjectSection(project.id, section.id)} className="w-6 h-6 rounded hover:bg-rose-50 flex items-center justify-center text-[9px] text-rose-400" title="Видалити секцію"><i className="fa-solid fa-trash-can"></i></button>
                    )}
                    <button onClick={() => toggleSection(section.id)} className="w-6 h-6 rounded hover:bg-black/5 flex items-center justify-center text-[9px] text-[var(--text-muted)]"><i className={`fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i></button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {sectionItems.map(renderTask)}
                    {sectionItems.length === 0 && (
                      <div className="py-2 text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest border border-dashed border-slate-100 rounded-lg mx-2">Секція порожня</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!isSystem && (
            <button 
              onClick={handleAddSectionAction}
              className="w-full mt-6 py-3 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 hover:bg-white transition-all group flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus-square group-hover:scale-110 transition-transform"></i>
              Додати нову секцію
            </button>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-4 p-4 md:p-6 custom-scrollbar bg-slate-50/40">
           {sections.map(section => {
              const sectionItems: Task[] = filteredTasks.filter(t => (t.projectSection as any) === section.id || (section.id === 'actions' && !t.projectSection));
              return (
                <div 
                  key={section.id} 
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDropToSection(e, section.id)}
                  className="w-[280px] md:w-[320px] shrink-0 flex flex-col bg-white border border-slate-200 p-3 h-full overflow-hidden rounded-2xl shadow-sm"
                >
                   <div className="flex items-center justify-between mb-4 px-2">
                      <div className="flex items-center gap-2 min-w-0">
                         <Typography variant="tiny" className="text-slate-600 font-black uppercase tracking-widest truncate">{section.title}</Typography>
                         <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">{sectionItems.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleAddTaskAndEdit(project.id, section.id)} className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><i className="fa-solid fa-plus text-[10px]"></i></button>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pb-10">
                      {sectionItems.map(renderTask)}
                      {sectionItems.length === 0 && (
                        <div className="py-16 text-center opacity-10 flex flex-col items-center select-none grayscale">
                           <i className="fa-solid fa-mountain-sun text-4xl mb-3"></i>
                           <span className="text-[9px] font-black uppercase tracking-widest">Горизонт чистий</span>
                        </div>
                      )}
                   </div>
                </div>
              );
           })}
           <button 
             onClick={handleAddSectionAction}
             className="w-12 shrink-0 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-300 transition-all group"
             title="Додати нову колонку"
           >
              <i className="fa-solid fa-plus text-xl group-hover:scale-125 transition-transform"></i>
           </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 py-8 bg-slate-50/30">
           <div className="max-w-3xl mx-auto space-y-12 pb-32 relative">
              <div className="absolute left-[7px] top-4 bottom-24 w-[2px] bg-slate-200"></div>

              {(Object.entries(timelineGroups) as [string, Task[]][]).map(([dateLabel, groupTasks]) => {
                if (groupTasks.length === 0) return null;
                return (
                  <div key={dateLabel} className="relative pl-8 space-y-4">
                     <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${dateLabel === 'Сьогодні' ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`}></div>
                     
                     <div className="flex items-center gap-3">
                        <Typography variant="tiny" className={`font-black uppercase tracking-widest ${dateLabel === 'Сьогодні' ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {dateLabel}
                        </Typography>
                        <div className="h-px flex-1 bg-slate-100"></div>
                     </div>

                     <div className="grid grid-cols-1 gap-2">
                        {groupTasks.map(renderTask)}
                     </div>
                  </div>
                );
              })}

              {filteredTasks.length === 0 && (
                <div className="py-20 text-center opacity-10 flex flex-col items-center">
                   <i className="fa-solid fa-timeline text-9xl mb-8"></i>
                   <Typography variant="h2" className="text-2xl uppercase font-black">Стрічка порожня</Typography>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ListContent;
