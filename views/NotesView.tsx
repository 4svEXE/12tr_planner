
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
    { id: 'all', label: 'Усі записи', icon: 'fa-layer-group' },
    { id: 'dreams', label: 'Мрії', icon: 'fa-cloud-moon' },
    { id: 'ideas', label: 'Ідеї', icon: 'fa-lightbulb' },
    { id: 'achievements', label: 'Ачівки', icon: 'fa-trophy' },
    { id: 'someday', label: 'Можливо колись', icon: 'fa-hourglass-start' },
  ];

  const filteredNotes = useMemo(() => {
    return tasks.filter(t => {
      if (t.category !== 'note' || t.status === TaskStatus.DONE || t.isDeleted) return false;
      if (activeFolder === 'all') return true;
      return t.projectId === activeFolder;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, activeFolder]);

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

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    
    const projectId = (activeFolder !== 'all' && !systemFolders.find(f => f.id === activeFolder)) ? activeFolder : undefined;
    
    const newId = addTask(
        newNoteTitle.trim(),
        'note',
        projectId,
        'actions'
    );
    
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

  const startEditingFolder = (e: React.MouseEvent, folder: Project) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderValue(folder.name);
  };

  const saveFolderRename = (folder: Project) => {
    if (editingFolderValue.trim() && editingFolderValue !== folder.name) {
      updateProject({ ...folder, name: editingFolderValue.trim() });
    }
    setEditingFolderId(null);
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    if (confirm('Видалити папку? Нотатки збережуться.')) {
      deleteProject(folderId);
      if (activeFolder === folderId) setActiveFolder('all');
    }
  };

  const onDragStartNote = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(folderId);
  };

  const onDropNoteInFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) updateTask({ ...task, projectId: folderId === 'all' ? undefined : folderId });
  };

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative">
      <div className={`flex flex-1 overflow-hidden transition-all duration-300 ${isMobile && selectedTaskId ? '-translate-x-full absolute' : 'translate-x-0 relative'}`}>
        <aside className="hidden md:flex w-56 bg-[var(--bg-card)] border-r border-[var(--border-color)] flex-col p-4 shrink-0">
          <div className="mb-6">
            <Typography variant="h3" className="text-base mb-1">База знань</Typography>
            <Typography variant="tiny" className="text-[var(--text-muted)] lowercase text-[8px]">твоя цифрова пам'ять</Typography>
          </div>

          <div className="mb-6">
            <form onSubmit={handleAddNote}>
              <input 
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="+ Новий запис..."
                className="w-full bg-[var(--bg-main)] border-none rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-[var(--primary)]/20 outline-none text-[var(--text-main)]"
              />
            </form>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-0.5">
              <Typography variant="tiny" className="text-[var(--text-muted)] mb-2 ml-1 text-[7px] uppercase">Система</Typography>
              {systemFolders.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFolder(f.id)}
                  onDragOver={(e) => onDragOverFolder(e, f.id)}
                  onDrop={(e) => onDropNoteInFolder(e, f.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeFolder === f.id ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 
                    dragOverFolderId === f.id ? 'bg-[var(--primary)]/20 ring-1 ring-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                  }`}
                >
                  <i className={`fa-solid ${f.icon} w-3 text-center`}></i>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between mb-2 px-1">
                <Typography variant="tiny" className="text-[var(--text-muted)] text-[7px] uppercase">Папки</Typography>
                <i onClick={() => setIsAddingFolder(true)} className="fa-solid fa-plus-circle text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer"></i>
              </div>
              
              {isAddingFolder && (
                <form onSubmit={handleCreateFolder} className="px-1 mb-2">
                  <input 
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Назва..."
                    className="w-full bg-[var(--bg-main)] border border-[var(--primary)]/20 rounded-lg py-1 px-2 text-[9px] font-bold outline-none text-[var(--text-main)]"
                    onBlur={() => !newFolderName && setIsAddingFolder(false)}
                  />
                </form>
              )}

              {noteFolders.map(folder => {
                const isEditing = editingFolderId === folder.id;
                return (
                  <div key={folder.id} className="relative group/folder">
                    {isEditing ? (
                      <input 
                        autoFocus
                        value={editingFolderValue}
                        onChange={(e) => setEditingFolderValue(e.target.value)}
                        onBlur={() => saveFolderRename(folder)}
                        onKeyDown={(e) => e.key === 'Enter' && saveFolderRename(folder)}
                        className="w-full bg-[var(--bg-card)] border border-[var(--primary)]/30 rounded-lg py-1 px-2 text-[9px] font-black uppercase text-[var(--text-main)]"
                      />
                    ) : (
                      <button
                        onClick={() => setActiveFolder(folder.id)}
                        onDragOver={(e) => onDragOverFolder(e, folder.id)}
                        onDrop={(e) => onDropNoteInFolder(e, folder.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          activeFolder === folder.id ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 
                          dragOverFolderId === folder.id ? 'bg-[var(--primary)]/20 ring-1 ring-[var(--primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <i className="fa-solid fa-folder w-3 text-center"></i>
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover/folder:opacity-100">
                          <i onClick={(e) => startEditingFolder(e, folder)} className="fa-solid fa-pen text-[7px] hover:text-[var(--primary)]"></i>
                          <i onClick={(e) => handleDeleteFolder(e, folder.id)} className="fa-solid fa-trash text-[7px] hover:text-rose-500"></i>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)]">
          <header className="px-4 md:px-6 py-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3">
               <div className="flex flex-col">
                  <Typography variant="h3" className="text-[var(--text-main)] text-sm md:text-base leading-none mb-1">
                    {systemFolders.find(f => f.id === activeFolder)?.label || noteFolders.find(f => f.id === activeFolder)?.name || activeFolder}
                  </Typography>
                  <Typography variant="tiny" className="text-[var(--text-muted)] text-[7px] uppercase tracking-widest">{filteredNotes.length} записів</Typography>
               </div>
            </div>
            
            {isMobile && (
              <Button size="sm" onClick={() => {
                const title = prompt('Назва нотатки:');
                if (title) {
                  const id = addTask(title, 'note', activeFolder !== 'all' ? activeFolder : undefined);
                  setSelectedTaskId(id);
                }
              }} className="rounded-xl px-4 py-2 text-[8px] tracking-widest font-black uppercase shadow-lg">НОВА</Button>
            )}
            
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
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6">
            <div className={`grid gap-3 md:gap-4 pb-32 ${selectedTaskId ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
              {filteredNotes.map(note => {
                const isSelected = selectedTaskId === note.id;
                let previewText = "Без опису...";
                try {
                   const blocks = JSON.parse(note.content || "[]");
                   previewText = blocks.find((b: any) => b.content.trim() !== '' && b.content !== '<br>')?.content?.replace(/<[^>]*>?/gm, '') || "Без опису...";
                } catch(e) {
                   previewText = note.content || "Без опису...";
                }

                return (
                  <Card 
                    key={note.id}
                    padding="none"
                    onClick={() => setSelectedTaskId(note.id)}
                    className={`group bg-[var(--bg-card)] p-4 rounded-[2rem] border transition-all cursor-pointer flex flex-col justify-between min-h-[140px] relative ${
                      isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/5 shadow-xl' : 'border-[var(--border-color)] hover:border-[var(--primary)]/30 hover:shadow-md'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <Typography variant="h3" className="text-[var(--text-main)] leading-tight truncate pr-4 text-[13px] uppercase tracking-tight">{note.title}</Typography>
                        <button onClick={(e) => { e.stopPropagation(); if(confirm('Видалити нотатку?')) deleteTask(note.id); }} className="w-6 h-6 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-medium text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                          {previewText}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-[var(--border-color)]">
                        <span className="text-[7px] font-black uppercase text-[var(--text-muted)] opacity-50">{new Date(note.createdAt).toLocaleDateString('uk-UA')}</span>
                        {note.tags.length > 0 && (
                          <div className="flex gap-1">
                             <span className="text-[7px] font-black text-[var(--primary)] uppercase">#{note.tags[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {filteredNotes.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center opacity-20 grayscale pointer-events-none">
                   <i className="fa-solid fa-note-sticky text-7xl mb-4"></i>
                   <Typography variant="h2" className="text-xl uppercase font-black tracking-widest">Тут порожньо</Typography>
                   <Typography variant="body" className="mt-2 text-xs">Ваші думки чекають на фіксацію</Typography>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* DETAILS PANEL / EDITOR */}
      <div className={`flex h-full border-l border-[var(--border-color)] z-[110] bg-[var(--bg-card)] shrink-0 transition-all duration-300 ${isMobile ? (selectedTaskId ? 'fixed inset-0 w-full translate-x-0' : 'fixed inset-0 w-full translate-x-full') : ''}`}>
        {!isMobile && (
          <div onMouseDown={startResizing} className={`w-[1.5px] h-full cursor-col-resize hover:bg-[var(--primary)] z-[120] transition-colors ${isResizing ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'}`}></div>
        )}
        <div style={{ width: isMobile ? '100vw' : detailsWidth }} className="h-full bg-[var(--bg-card)] relative overflow-hidden flex flex-col shadow-2xl">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            !isMobile && (
               <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-5 grayscale pointer-events-none select-none">
                  <i className="fa-solid fa-note-sticky text-9xl mb-8"></i>
                  <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest">Обрати запис</Typography>
               </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesView;
