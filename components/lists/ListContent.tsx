import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  onOpenQuickAdd?: () => void;
}

const ListContent: React.FC<ListContentProps> = ({ project, tasks, selectedTaskId, onSelectTask, onBack, isMobile, onOpenQuickAdd }) => {
  const { addTask, updateTask, updateProject, addProjectSection, renameProjectSection, deleteProjectSection, deleteTask, toggleTaskStatus } = useApp();
  const [quickTaskValue, setQuickTaskValue] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [shouldEditLastSection, setShouldEditLastSection] = useState(false);

  const sectionInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const viewMode = project.viewMode || 'list';
  const showCompleted = project.showCompleted || false;
  const showDetails = project.showDetails || false;
  const sortBy = project.sortBy || 'priority';

  // Автоматичне фокусування на новій секції
  useEffect(() => {
    if (shouldEditLastSection && project.sections && project.sections.length > 0) {
      const lastSection = project.sections[project.sections.length - 1];
      setEditingSectionId(lastSection.id);
      setInputValue(lastSection.title);
      setShouldEditLastSection(false);
      // Фокус відбудеться через реф в рендері
    }
  }, [project.sections, shouldEditLastSection]);

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
    const todayStr = new Date().toLocaleDateString('en-CA');
    filteredTasks.forEach(t => {
      if (!t.scheduledDate) {
        groups['Без дати'].push(t);
      } else {
        const taskDateStr = new Date(t.scheduledDate).toLocaleDateString('en-CA');
        if (taskDateStr === todayStr) groups['Сьогодні'].push(t);
        else if (taskDateStr > todayStr) groups['Майбутнє'].push(t);
        else {
          const label = new Date(t.scheduledDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
          if (!groups[label]) groups[label] = [];
          groups[label].push(t);
        }
      }
    });
    return groups;
  }, [filteredTasks]);

  const sections: ProjectSectionData[] = (project?.sections && project.sections.length > 0) ? project.sections : [{ id: 'actions', title: 'Загальне' }];

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
    addProjectSection(project.id, 'Нова секція');
    setShouldEditLastSection(true);
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
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] h-full overflow-hidden relative">
      <ListHeader
        project={project}
        tasks={tasks}
        taskCount={filteredTasks.length}
        isMobile={isMobile}
        onBack={onBack}
        onUpdateProject={updateProject}
        onAddSection={handleAddSectionAction}
      />

      {viewMode === 'list' && !isMobile && (
        <div className="mb-1">
          <QuickAddTask
            value={quickTaskValue}
            onChange={setQuickTaskValue}
            onSubmit={handleAddTask}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 space-y-1.5 pb-32 pt-0">
        {viewMode === 'list' ? (
          <>
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
                          onBlur={() => { if (inputValue.trim()) renameProjectSection(project.id, section.id, inputValue); setEditingSectionId(null); }}
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
                        <div className="py-4 text-center text-[8px] font-bold text-slate-300 uppercase tracking-widest mx-2">Секція порожня</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {!isSystem && (
              <button
                onClick={handleAddSectionAction}
                className="w-full mt-4 py-3 border border-dashed border-[var(--border-color)] opacity-40 rounded-xl text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:opacity-100 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                <span>Додати секцію</span>
              </button>
            )}
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {Object.entries(timelineGroups).filter(([_, items]) => items.length > 0).map(([label, items]) => (
              <div key={label} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <span className="text-[10px] font-black uppercase text-primary tracking-[0.2em] shrink-0">{label}</span>
                  <div className="h-[1px] flex-1 bg-primary/10"></div>
                </div>
                <div className="grid grid-cols-1 gap-1.5 px-1">
                  {items.map(renderTask)}
                </div>
              </div>
            ))}
            {Object.values(timelineGroups).every(items => items.length === 0) && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                <i className="fa-solid fa-calendar-xmark text-5xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Немає запланованих завдань</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isMobile && onOpenQuickAdd && (
        <button
          onClick={onOpenQuickAdd}
          className="fixed bottom-20 right-4 w-12 h-12 rounded-2xl bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-[1000] border border-[var(--border-color)] active:scale-95 transition-all"
          title="Додати завдання"
        >
          <i className="fa-solid fa-plus text-lg"></i>
        </button>
      )}
    </div>
  );
};

export default ListContent;