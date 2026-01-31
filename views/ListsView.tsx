
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Project, Task, TaskStatus } from '../types';
import Typography from '../components/ui/Typography';
import TaskDetails from '../components/TaskDetails';
import { useResizer } from '../hooks/useResizer';

// Sub-components
import ExplorerNode from '../components/lists/ExplorerNode';
import ListHeader from '../components/lists/ListHeader';
import QuickAddTask from '../components/lists/QuickAddTask';
import TaskItem from '../components/lists/TaskItem';

const EXPANDED_NODES_KEY = '12tr_sidebar_expanded_nodes';

const ListsView: React.FC = () => {
  const {
    projects, tasks, addTask, updateProject, deleteProject, addProject,
    addProjectSection, deleteProjectSection, renameProjectSection, updateTask, deleteTask, toggleTaskStatus
  } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [creatingIn, setCreatingIn] = useState<{ parentId: string | undefined; type: 'folder' | 'list' } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [quickTaskValue, setQuickTaskValue] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [activeMenuSection, setActiveMenuSection] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const sectionInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(EXPANDED_NODES_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(EXPANDED_NODES_KEY, JSON.stringify(Array.from(expandedFolders)));
  }, [expandedFolders]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSection(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { detailsWidth, startResizing, isResizing } = useResizer(350, 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const folders = useMemo(() =>
    projects.filter(p => p &&
      (p.type === 'folder' || p.type === 'list' || !p.type) &&
      p.description !== 'FOLDER_NOTE' &&
      p.description !== 'SYSTEM_PLANNER_CONFIG'
    ),
  [projects]);

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const toggleSection = (sectionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(collapsedSections);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    setCollapsedSections(next);
  };

  const startCreation = (type: 'folder' | 'list', parentId?: string) => {
    if (parentId) {
      const next = new Set(expandedFolders);
      next.add(parentId);
      setExpandedFolders(next);
    }
    setCreatingIn({ parentId, type });
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleFinishCreation = () => {
    if (!creatingIn || !inputValue.trim()) {
      setCreatingIn(null);
      return;
    }
    const id = addProject({
      name: inputValue.trim(),
      type: creatingIn.type,
      color: creatingIn.type === 'folder' ? 'var(--text-muted)' : 'var(--primary)',
      isStrategic: false,
      parentFolderId: creatingIn.parentId,
      sections: creatingIn.type === 'list' ? [{ id: 'actions', title: 'Завдання' }] : []
    });
    if (creatingIn.type === 'list') setSelectedProjectId(id);
    setCreatingIn(null);
  };

  const handleRenameNode = (project: Project) => {
    if (!inputValue.trim()) {
      setEditingNodeId(null);
      return;
    }
    updateProject({ ...project, name: inputValue.trim() });
    setEditingNodeId(null);
  };

  const handleAddTaskAndEdit = (projectId: string, sectionId: string) => {
    const id = addTask('', 'tasks', projectId, sectionId);
    setEditingTaskId(id);
    setInputValue('');
    setTimeout(() => taskInputRef.current?.focus(), 50);
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

  const handleFinishSectionRename = (projectId: string, sectionId: string) => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      renameProjectSection(projectId, sectionId, trimmed);
    }
    setEditingSectionId(null);
  };

  const handleQuickAddAtTop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskValue.trim() || !selectedProjectId) return;

    const sections = activeProject?.sections || [{ id: 'actions', title: 'Завдання' }];
    const targetSectionId = sections[0]?.id || 'actions';

    addTask(quickTaskValue.trim(), 'tasks', selectedProjectId, targetSectionId);
    setQuickTaskValue('');
  };

  const handleMoveNode = (sourceId: string, targetId: string | undefined) => {
    if (sourceId === targetId) return;
    const sourceNode = projects.find(p => p.id === sourceId);
    if (!sourceNode) return;

    let tempId = targetId;
    while (tempId) {
      if (tempId === sourceId) return;
      const parent = projects.find(p => p.id === tempId);
      tempId = parent?.parentFolderId;
    }

    updateProject({ ...sourceNode, parentFolderId: targetId });
  };

  const handleDeleteSectionPrompt = (projectId: string, sectionId: string, sectionTitle: string) => {
    const sectionTasks = tasks.filter(t => t.projectId === projectId && (t.projectSection as any) === sectionId && !t.isDeleted);
    if (sectionTasks.length === 0) {
      if (confirm(`Видалити порожню секцію "${sectionTitle}"?`)) {
        deleteProjectSection(projectId, sectionId);
      }
      return;
    }
    const choice = confirm(`Секція "${sectionTitle}" містить ${sectionTasks.length} завдань.\n\nНатисніть "OK", щоб перемістити завдання в основний список і видалити секцію.\nНатисніть "Скасувати", щоб видалити секцію РАЗОМ із завданнями.`);
    if (choice) {
      deleteProjectSection(projectId, sectionId);
    } else {
      if (confirm('Ви впевнені, що хочете видалити секцію ТА ВСІ її завдання назавжди?')) {
        sectionTasks.forEach(t => deleteTask(t.id, true));
        deleteProjectSection(projectId, sectionId);
      }
    }
    setActiveMenuSection(null);
  };

  const activeProject = projects.find(p => p && p.id === selectedProjectId);
  const projectTasks = tasks.filter(t => t && t.projectId === selectedProjectId && !t.isDeleted);
  const sections = activeProject?.sections || [{ id: 'actions', title: 'Завдання' }];

  const renderExplorer = () => (
    <aside className={`${isMobile && selectedProjectId ? 'hidden' : 'w-full md:w-64'} bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col shrink-0 h-full`}>
      <header className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/[0.02]">
        <Typography variant="tiny" className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[8px]">Провідник Списків</Typography>
        <div className="flex gap-1">
          <button onClick={() => startCreation('folder')} className="w-8 h-8 rounded hover:bg-black/5 flex items-center justify-center text-[10px] text-[var(--text-muted)]" title="Нова папка"><i className="fa-solid fa-folder-plus"></i></button>
          <button onClick={() => startCreation('list')} className="w-8 h-8 rounded hover:bg-black/5 flex items-center justify-center text-[10px] text-[var(--text-muted)]" title="Новий список"><i className="fa-solid fa-plus"></i></button>
        </div>
      </header>
      <div
        className="flex-1 overflow-y-auto custom-scrollbar py-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const sourceProjectId = e.dataTransfer.getData('projectId');
          if (sourceProjectId) handleMoveNode(sourceProjectId, undefined);
        }}
      >
        {folders.filter(p => !p.parentFolderId).map(rootProject => (
          <ExplorerNode
            key={rootProject.id}
            project={rootProject}
            level={0}
            expandedFolders={expandedFolders}
            selectedProjectId={selectedProjectId}
            editingNodeId={editingNodeId}
            inputValue={inputValue}
            creatingIn={creatingIn}
            dragOverNodeId={dragOverNodeId}
            onToggle={toggleFolder}
            onSelect={setSelectedProjectId}
            onStartCreation={startCreation}
            onFinishCreation={handleFinishCreation}
            onStartRename={(p) => { setEditingNodeId(p.id); setInputValue(p.name); setTimeout(() => inputRef.current?.focus(), 50); }}
            onDelete={(id) => { if (confirm('Видалити?')) deleteProject(id); }}
            onMoveNode={handleMoveNode}
            onUpdateTask={updateTask}
            setInputValue={setInputValue}
            handleRenameNode={handleRenameNode}
            inputRef={inputRef}
            allTasks={tasks}
            allProjects={projects}
          />
        ))}

        {creatingIn && !creatingIn.parentId && (
          <div className="flex items-center gap-2 py-2 px-3 border-l-2 border-[var(--primary)]/30 bg-[var(--primary)]/5" style={{ paddingLeft: '8px' }}>
            <div className="w-4 shrink-0" />
            <i className={`fa-solid ${creatingIn.type === 'folder' ? 'fa-folder' : 'fa-file-lines'} text-[11px] w-4 text-center text-[var(--primary)]/50`}></i>
            <input
              ref={inputRef}
              autoFocus
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={handleFinishCreation}
              onKeyDown={e => e.key === 'Enter' && handleFinishCreation()}
              placeholder="Назва..."
              className="flex-1 bg-[var(--bg-main)] border border-[var(--primary)]/50 rounded px-2 text-[11px] font-bold h-6 outline-none shadow-sm"
            />
          </div>
        )}

        {!creatingIn && folders.length === 0 && (
          <div className="px-6 py-10 text-center opacity-20 italic text-[10px]">Створіть свій перший список...</div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative text-[var(--text-main)]">
      <div className={`flex flex-1 overflow-hidden transition-all duration-300 h-full`}>
        
        {renderExplorer()}

        <main className={`flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] h-full ${isMobile && !selectedProjectId ? 'hidden' : 'flex'}`}>
          {activeProject ? (
            <>
              <ListHeader
                project={activeProject}
                taskCount={projectTasks.length}
                isMobile={isMobile}
                onBack={() => setSelectedProjectId(null)}
                onUpdateProject={updateProject}
                onAddSection={addProjectSection}
              />

              <QuickAddTask
                value={quickTaskValue}
                onChange={setQuickTaskValue}
                onSubmit={handleQuickAddAtTop}
              />

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8 pb-32 pt-8">
                {sections.map(section => {
                  const sectionItems = projectTasks.filter(t => (t.projectSection as any) === section.id || (section.id === 'actions' && !t.projectSection));
                  const isCollapsed = collapsedSections.has(section.id);
                  const isSectionEditing = editingSectionId === section.id;

                  return (
                    <div
                      key={section.id}
                      className="space-y-3"
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const taskId = e.dataTransfer.getData('taskId');
                        if (taskId) {
                          const t = tasks.find(x => x.id === taskId);
                          if (t) updateTask({ ...t, projectId: activeProject.id, projectSection: section.id as any, isDeleted: false });
                        }
                      }}
                    >
                      <div className="flex items-center group/sec relative h-6">
                        <div className="flex items-center gap-2 flex-1 pl-[10px]">
                          {isSectionEditing ? (
                            <input
                              ref={sectionInputRef}
                              autoFocus
                              value={inputValue}
                              onChange={e => setInputValue(e.target.value)}
                              onBlur={() => handleFinishSectionRename(activeProject.id, section.id)}
                              onKeyDown={e => e.key === 'Enter' && handleFinishSectionRename(activeProject.id, section.id)}
                              className="text-[9px] font-black uppercase text-[var(--text-main)] tracking-[0.2em] bg-transparent border-b border-[var(--primary)] outline-none px-0"
                            />
                          ) : (
                            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-[0.2em] opacity-80 shrink-0">{section.title}</span>
                          )}
                          <div className="h-[1px] flex-1 bg-[var(--border-color)] opacity-30"></div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/sec:opacity-100 transition-opacity pr-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddTaskAndEdit(activeProject.id, section.id); }}
                            className="w-6 h-6 rounded hover:bg-black/5 flex items-center justify-center text-[9px] text-[var(--primary)]"
                            title="Додати завдання"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                          <button
                            onClick={(e) => toggleSection(section.id, e)}
                            className="w-6 h-6 rounded hover:bg-black/5 flex items-center justify-center text-[9px] text-[var(--text-muted)]"
                            title={isCollapsed ? "Розгорнути" : "Згорнути"}
                          >
                            <i className={`fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                          </button>
                          <div className="relative" ref={activeMenuSection === section.id ? menuRef : null}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMenuSection(activeMenuSection === section.id ? null : section.id); }}
                              className="w-6 h-6 rounded hover:bg-black/5 flex items-center justify-center text-[9px] text-[var(--text-muted)]"
                            >
                              <i className="fa-solid fa-ellipsis"></i>
                            </button>

                            {activeMenuSection === section.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl rounded-lg py-1 z-50 animate-in fade-in zoom-in-95">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInputValue(section.title);
                                    setEditingSectionId(section.id);
                                    setActiveMenuSection(null);
                                    setTimeout(() => sectionInputRef.current?.focus(), 50);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-black/5 text-[9px] font-bold uppercase flex items-center gap-2"
                                >
                                  <i className="fa-solid fa-pencil opacity-40"></i> Назва
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSectionPrompt(activeProject.id, section.id, section.title);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-500 text-[9px] font-bold uppercase flex items-center gap-2"
                                >
                                  <i className="fa-solid fa-trash-can opacity-40"></i> Видалити
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          {sectionItems.map(task => (
                            <TaskItem
                              key={task.id}
                              task={task}
                              isSelected={selectedTaskId === task.id}
                              isEditing={editingTaskId === task.id}
                              inputValue={inputValue}
                              onSelect={setSelectedTaskId}
                              onToggleStatus={toggleTaskStatus}
                              onDelete={deleteTask}
                              onInputChange={setInputValue}
                              onFinishEdit={handleFinishTaskEdit}
                              inputRef={taskInputRef}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-10 pointer-events-none grayscale">
              <i className="fa-solid fa-folder-tree text-9xl mb-8"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest">Оберіть або створіть список</Typography>
              <Typography variant="body" className="mt-4 text-xs font-bold">Ваша база знань та планів чекає на структуру</Typography>
            </div>
          )}
        </main>
      </div>

      <div
        className={`bg-[var(--bg-card)] shrink-0 relative transition-none border-l border-[var(--border-color)] flex flex-col ${selectedTaskId ? 'z-[100]' : 'hidden lg:flex'}`}
        style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0 }}
      >
        {!isMobile && (
          <div
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[100] transition-colors -ml-0.5 ${isResizing ? 'bg-[var(--primary)]' : 'bg-transparent hover:bg-[var(--primary)]/20'}`}
            title="Тягніть для зміни розміру"
          />
        )}

        <div className="w-full h-full flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-mountain-sun text-9xl mb-8 text-[var(--text-main)]"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest text-[var(--text-muted)]">Оберіть квест</Typography>
              <Typography variant="body" className="mt-4 text-xs font-bold text-[var(--text-muted)]">Деталі завдання з’являться тут</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListsView;
