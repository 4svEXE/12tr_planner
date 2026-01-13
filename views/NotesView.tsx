
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Priority, Project } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import TaskDetails from '../components/TaskDetails';
import Card from '../components/ui/Card';

const NotesView: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask, detailsWidth, setDetailsWidth, addProject, updateProject, deleteProject, projects } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderValue, setEditingFolderValue] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const noteFolders = useMemo(() => {
    return projects.filter(p => !p.isStrategic || p.description?.includes('FOLDER_NOTE'));
  }, [projects]);

  const systemFolders = [
    { id: 'all', label: 'Усі', icon: 'fa-layer-group', tag: null },
    { id: 'insights', label: 'Інсайти', icon: 'fa-brain', tag: 'insight' },
    { id: 'dreams', label: 'Мрії', icon: 'fa-cloud-moon', tag: 'dream' },
    { id: 'ideas', label: 'Ідеї', icon: 'fa-lightbulb', tag: 'idea' },
    { id: 'achievements', label: 'Ачівки', icon: 'fa-trophy', tag: 'achievement' },
    { id: 'someday', label: 'Можливо', icon: 'fa-hourglass-start', tag: 'someday' },
  ];

  const allAvailableFolders = useMemo(() => [
    ...systemFolders.map(f => ({ id: f.id, label: f.label, icon: f.icon, isSystem: true, tag: f.tag })),
    ...noteFolders.map(f => ({ id: f.id, label: f.name, icon: 'fa-folder', isSystem: false, tag: null }))
  ], [noteFolders]);

  const filteredNotes = useMemo(() => {
    return tasks.filter(t => {
      if (t.category !== 'note' || t.isDeleted) return false;
      
      const currentFolderObj = allAvailableFolders.find(f => f.id === activeFolder);
      if (!currentFolderObj) return false;

      if (activeFolder === 'all') return true;
      
      if (currentFolderObj.isSystem && currentFolderObj.tag) {
        return t.tags.includes(currentFolderObj.tag);
      }
      
      return t.projectId === activeFolder;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, activeFolder, allAvailableFolders]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300 && newWidth < 900) setDetailsWidth(newWidth);
  }, [isResizing, setDetailsWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = newNoteTitle.trim() || "Новий запис";
    
    const currentFolderObj = allAvailableFolders.find(f => f.id === activeFolder);
    let projectId: string | undefined = undefined;
    let initialTags: string[] = [];

    if (currentFolderObj) {
      if (currentFolderObj.isSystem && currentFolderObj.tag) {
        initialTags = [currentFolderObj.tag];
      } else if (!currentFolderObj.isSystem) {
        projectId = currentFolderObj.id;
      }
    }
    
    const newId = addTask(
        title,
        'note',
        projectId,
        'actions'
    );
    
    // Отримуємо створену таску, щоб оновити її теги
    if (initialTags.length > 0) {
      // Оскільки addTask не повертає об'єкт, а оновлює state,
      // ми покладаємося на те, що updateTask знайде її за ID в наступному циклі
      // Або ми можемо знайти її в поточному масиві через setTimeout або в самому Context
      const taskToUpdate = tasks.find(t => t.id === newId) || { id: newId, tags: [] };
      updateTask({ ...taskToUpdate as Task, id: newId, title, category: 'note', projectId, tags: initialTags, status: TaskStatus.INBOX, priority: Priority.NUI, createdAt: Date.now() });
    }
    
    setSelectedTaskId(newId);
    setNewNoteTitle('');
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    addProject({
      name: newFolderName.trim(),
      color: 'var(--primary)',
      isStrategic: false,
      description: 'FOLDER_NOTE'
    });
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative">
      <div className={`flex flex-1 overflow-hidden transition-all duration-300 ${isMobile && selectedTaskId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <aside className="hidden lg:flex w-56 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex-col p-4 shrink-0">
          <div className="mb-6">
            <Typography variant="h3" className="text-base mb-1 uppercase font-black">База знань</Typography>
            <Typography variant="tiny" className="text-[var(--text-muted)] lowercase text-[8px]">архів думок</Typography>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-0.5">
              <Typography variant="tiny" className="text-[var(--text-muted)] mb-2 ml-1 text-[7px] uppercase font-black opacity-50">Система</Typography>
              {systemFolders.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFolder(f.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeFolder === f.id ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                  }`}
                >
                  <i className={`fa-solid ${f.icon} w-3 text-center`}></i>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between mb-2 px-1">
                <Typography variant="tiny" className="text-[var(--text-muted)] text-[7px] uppercase font-black opacity-50">Папки</Typography>
                <i onClick={() => setIsAddingFolder(true)} className="fa-solid fa-plus-circle text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer"></i>
              </div>
              {noteFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeFolder === folder.id ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <i className="fa-solid fa-folder w-3 text-center"></i>
                    <span className="truncate">{folder.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)]">
          <header className="bg-[var(--bg-card)] border-b border-[var(--border-color)] flex flex-col z-10 shrink-0">
            <div className="px-4 md:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="flex flex-col">
                    <Typography variant="h3" className="text-[var(--text-main)] text-sm md:text-base leading-none mb-1 font-black uppercase">
                      {allAvailableFolders.find(f => f.id === activeFolder)?.label || 'Нотатки'}
                    </Typography>
                    <Typography variant="tiny" className="text-[var(--text-muted)] text-[7px] uppercase tracking-widest">{filteredNotes.length} записів</Typography>
                 </div>
              </div>
              
              {!isMobile && (
                <form onSubmit={handleAddNote} className="flex gap-2">
                   <input 
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Додати запис..."
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-1.5 px-4 text-[11px] font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]/10 w-48 text-[var(--text-main)]"
                  />
                </form>
              )}
            </div>

            <div className="lg:hidden px-4 pb-3 overflow-x-auto no-scrollbar flex items-center gap-2">
              {allAvailableFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap text-[9px] font-black uppercase tracking-wider transition-all border ${
                    activeFolder === folder.id 
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-md' 
                      : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)]'
                  }`}
                >
                  <i className={`fa-solid ${folder.icon} text-[8px]`}></i>
                  {folder.label}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6">
            <div className={`grid gap-2 md:gap-4 pb-32 ${selectedTaskId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {filteredNotes.map(note => {
                const isSelected = selectedTaskId === note.id;
                let previewText = "";
                try {
                   const blocks = JSON.parse(note.content || "[]");
                   previewText = blocks.find((b: any) => b.content.trim() !== '' && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '') || "";
                } catch(e) {
                   previewText = note.content || "";
                }

                return (
                  <Card 
                    key={note.id}
                    padding="none"
                    onClick={() => setSelectedTaskId(note.id)}
                    className={`group bg-[var(--bg-card)] transition-all cursor-pointer flex flex-col justify-between relative p-3 rounded-xl border ${
                      isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/5' : 'border-[var(--border-color)] hover:border-[var(--primary)]/30'
                    } ${isMobile ? 'min-h-[80px]' : 'min-h-[120px]'}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-1">
                        <Typography variant="h3" className={`text-[var(--text-main)] leading-tight truncate pr-4 font-black uppercase ${isMobile ? 'text-[10px]' : 'text-[12px]'}`}>{note.title}</Typography>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити?')) deleteTask(note.id); }} className="text-[var(--text-muted)] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                          <i className="fa-solid fa-trash-can text-[9px]"></i>
                        </button>
                      </div>
                      <p className={`font-medium text-[var(--text-muted)] line-clamp-2 leading-relaxed ${isMobile ? 'text-[9px]' : 'text-[10px]'}`}>
                        {previewText || "Немає вмісту..."}
                      </p>
                      <div className="mt-auto pt-2 flex justify-between items-center opacity-40">
                        <span className="text-[6px] font-black uppercase">{new Date(note.createdAt).toLocaleDateString('uk-UA')}</span>
                        <div className="flex gap-1">
                           {note.tags.map(t => <span key={t} className="text-[6px] font-black text-[var(--primary)] uppercase">#{t}</span>)}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {filteredNotes.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center opacity-10 grayscale pointer-events-none">
                   <i className="fa-solid fa-note-sticky text-6xl mb-4"></i>
                   <Typography variant="h2" className="text-sm uppercase font-black tracking-widest">Тут порожньо</Typography>
                </div>
              )}
            </div>
          </div>
          
          {isMobile && !selectedTaskId && (
            <button 
              onClick={() => handleAddNote()}
              className="fixed right-6 bottom-24 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-[140] active:scale-90 transition-all"
            >
              <i className="fa-solid fa-plus text-xl"></i>
            </button>
          )}
        </main>
      </div>

      <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${isMobile ? (selectedTaskId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isMobile && (
          <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-[var(--primary)] z-[120] transition-colors ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}></div>
        )}
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] relative flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : null}
        </div>
      </div>

      {isAddingFolder && isMobile && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 tiktok-blur animate-in fade-in">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsAddingFolder(false)}></div>
          <Card className="w-full max-w-sm relative z-10 p-6 rounded-3xl bg-card border-theme shadow-2xl">
             <Typography variant="h2" className="mb-6 text-xl uppercase font-black">Нова папка</Typography>
             <form onSubmit={handleCreateFolder} className="space-y-4">
               <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Назва..." className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)]/20 outline-none" />
               <div className="flex gap-2">
                 <Button variant="white" className="flex-1" onClick={() => setIsAddingFolder(false)}>ВІДМІНА</Button>
                 <Button type="submit" className="flex-1">СТВОРИТИ</Button>
               </div>
             </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotesView;
