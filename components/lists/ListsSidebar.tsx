
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import Typography from '../ui/Typography';
import MiniCalendar from '../sidebar/MiniCalendar';
import ExplorerNode from './ExplorerNode';

interface ListsSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  isMobile: boolean;
}

const EXPANDED_NODES_KEY = '12tr_sidebar_expanded_nodes';

const ListsSidebar: React.FC<ListsSidebarProps> = ({ selectedProjectId, onSelectProject, isMobile }) => {
  const { projects, tasks, addProject, updateProject, deleteProject, deleteProjectSection, updateTask, setActiveTab } = useApp();
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [creatingIn, setCreatingIn] = useState<{ parentId: string | undefined; type: 'folder' | 'list' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(EXPANDED_NODES_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(EXPANDED_NODES_KEY, JSON.stringify(Array.from(expandedFolders)));
  }, [expandedFolders]);

  const folders = useMemo(() =>
    projects.filter(p => p &&
      (p.type === 'folder' || p.type === 'list' || !p.type) &&
      p.description !== 'SYSTEM_PLANNER_CONFIG'
    ),
  [projects]);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startCreation = (type: 'folder' | 'list', parentId?: string) => {
    if (parentId) {
      setExpandedFolders(prev => new Set(prev).add(parentId));
    }
    setCreatingIn({ parentId, type });
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
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
    if (creatingIn.type === 'list') onSelectProject(id);
    setCreatingIn(null);
  };

  const handleRenameNode = (project: any) => {
    if (!inputValue.trim()) {
      setEditingNodeId(null);
      return;
    }
    updateProject({ ...project, name: inputValue.trim() });
    setEditingNodeId(null);
  };

  return (
    <aside className={`${isMobile && selectedProjectId ? 'hidden' : 'w-full md:w-64'} bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.01)]`}>
      <header className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-black/[0.01] shrink-0">
        <Typography variant="tiny" className="font-black text-[var(--text-muted)] uppercase tracking-[0.2em] text-[8px]">Провідник Знань</Typography>
        <div className="flex gap-1">
          <button onClick={() => startCreation('folder')} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[10px] text-[var(--text-muted)]" title="Нова папка"><i className="fa-solid fa-folder-plus"></i></button>
          <button onClick={() => startCreation('list')} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-[10px] text-[var(--text-muted)]" title="Новий список"><i className="fa-solid fa-plus"></i></button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-1">
        
        {/* System Fixed Items */}
        <div className="space-y-0.5 mb-4">
            <button 
              onClick={() => onSelectProject('system_inbox')} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${selectedProjectId === 'system_inbox' ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold' : 'text-[var(--text-main)] hover:bg-black/5'}`}
            >
              <i className="fa-solid fa-inbox text-blue-500 text-[12px] w-4 text-center"></i>
              <span className="text-[11px] truncate flex-1 text-left uppercase font-bold">Вхідні</span>
              <span className="text-[8px] font-black opacity-40 px-1.5 py-0.5 rounded-full bg-black/5">{tasks.filter(t => !t.projectId && t.category !== 'note' && !t.isDeleted).length}</span>
            </button>

            <button 
              onClick={() => onSelectProject('system_notes')} 
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${selectedProjectId === 'system_notes' ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold' : 'text-[var(--text-main)] hover:bg-black/5'}`}
            >
              <i className="fa-solid fa-note-sticky text-indigo-500 text-[12px] w-4 text-center"></i>
              <span className="text-[11px] truncate flex-1 text-left uppercase font-bold">Нотатки</span>
              <span className="text-[8px] font-black opacity-40 px-1.5 py-0.5 rounded-full bg-black/5">{tasks.filter(t => !t.projectId && t.category === 'note' && !t.isDeleted).length}</span>
            </button>
        </div>

        <div className="px-3 mb-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">Колекції</span>
        </div>

        <div className="space-y-0.5" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
          const sourceProjectId = e.dataTransfer.getData('projectId');
          if (sourceProjectId) updateProject({ ...projects.find(p => p.id === sourceProjectId)!, parentFolderId: undefined });
        }}>
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
              dragOverNodeId={null} 
              onToggle={toggleFolder} 
              onSelect={onSelectProject} 
              onStartCreation={startCreation} 
              onFinishCreation={handleFinishCreation} 
              onStartRename={(p) => { setEditingNodeId(p.id); setInputValue(p.name); setTimeout(() => inputRef.current?.focus(), 100); }} 
              onDelete={(id) => { if (confirm('Видалити?')) deleteProject(id); }} 
              onDeleteSection={deleteProjectSection} 
              onMoveNode={(src, target) => updateProject({ ...projects.find(p => p.id === src)!, parentFolderId: target })} 
              onUpdateTask={updateTask} 
              setInputValue={setInputValue} 
              handleRenameNode={handleRenameNode} 
              inputRef={inputRef} 
              allTasks={tasks} 
              allProjects={projects} 
            />
          ))}

          {creatingIn && !creatingIn.parentId && (
            <div className="flex items-center gap-3 py-2 px-3 bg-[var(--primary)]/5 rounded-xl border-l-4 border-[var(--primary)]">
               <i className={`fa-solid ${creatingIn.type === 'folder' ? 'fa-folder' : 'fa-file-lines'} text-[11px] w-4 text-center text-[var(--primary)]/50`}></i>
               <input
                  ref={inputRef}
                  autoFocus
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onBlur={handleFinishCreation}
                  onKeyDown={e => e.key === 'Enter' && handleFinishCreation()}
                  placeholder="Назва..."
                  className="flex-1 bg-transparent border-none p-0 text-[11px] font-bold outline-none"
                />
            </div>
          )}
        </div>
      </div>

      {/* System Archives Area - Теги, Готово, Корзина */}
      <div className="mt-auto border-t border-[var(--border-color)] bg-black/[0.02]">
        <div className="p-3">
          <span className="text-[7px] font-black uppercase text-[var(--text-muted)] opacity-50 px-2 block mb-2">Системний архів</span>
          <div className="grid grid-cols-1 gap-0.5">
            <button onClick={() => setActiveTab('hashtags')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)] transition-all">
              <i className="fa-solid fa-hashtag w-4 text-center opacity-60"></i>
              <span>Теги</span>
            </button>
            <button onClick={() => setActiveTab('completed')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)] transition-all">
              <i className="fa-solid fa-check-double w-4 text-center opacity-60"></i>
              <span>Готово</span>
            </button>
            <button onClick={() => setActiveTab('trash')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)] transition-all">
              <i className="fa-solid fa-trash-can w-4 text-center opacity-60"></i>
              <span>Корзина</span>
            </button>
          </div>
        </div>
        
        <div className="p-3 pt-0">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-2 shadow-sm">
             <MiniCalendar />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ListsSidebar;
