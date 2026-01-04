
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, TaskStatus, Priority, Project } from '../types';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import TaskDetails from '../components/TaskDetails';

const NotesView: React.FC = () => {
  const { tasks, updateTask, deleteTask, detailsWidth, setDetailsWidth, addProject, updateProject, deleteProject, projects } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderValue, setEditingFolderValue] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      if (t.category !== 'note' || t.status === TaskStatus.DONE) return false;
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
    const newNote: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNoteTitle,
      status: TaskStatus.INBOX,
      priority: Priority.NUI,
      difficulty: 1,
      xp: 10,
      tags: [],
      category: 'note',
      projectId: (activeFolder !== 'all' && !systemFolders.find(f => f.id === activeFolder)) ? activeFolder : undefined,
      createdAt: Date.now(),
      habitHistory: {}
    };
    updateTask(newNote);
    setNewNoteTitle('');
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    addProject({
      name: newFolderName.trim(),
      color: '#f97316',
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
    <div className="h-screen flex bg-slate-50 overflow-hidden relative">
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-white border-r border-slate-100 flex flex-col p-4 shrink-0">
          <div className="mb-6">
            <Typography variant="h3" className="text-base mb-1">База знань</Typography>
            <Typography variant="tiny" className="text-slate-300 lowercase text-[8px]">твоя цифрова пам'ять</Typography>
          </div>

          <div className="mb-6">
            <form onSubmit={handleAddNote}>
              <input 
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="+ Новий запис..."
                className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-tight focus:ring-2 focus:ring-orange-200 outline-none"
              />
            </form>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-0.5">
              <Typography variant="tiny" className="text-slate-300 mb-2 ml-1 text-[7px] uppercase">Система</Typography>
              {systemFolders.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFolder(f.id)}
                  onDragOver={(e) => onDragOverFolder(e, f.id)}
                  onDrop={(e) => onDropNoteInFolder(e, f.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                    activeFolder === f.id ? 'bg-orange-50 text-orange-600' : 
                    dragOverFolderId === f.id ? 'bg-orange-100 ring-1 ring-orange-300' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <i className={`fa-solid ${f.icon} w-3 text-center`}></i>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between mb-2 px-1">
                <Typography variant="tiny" className="text-slate-300 text-[7px] uppercase">Папки</Typography>
                <i onClick={() => setIsAddingFolder(true)} className="fa-solid fa-plus-circle text-[10px] text-slate-300 hover:text-orange-500 cursor-pointer"></i>
              </div>
              
              {isAddingFolder && (
                <form onSubmit={handleCreateFolder} className="px-1 mb-2">
                  <input 
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Назва..."
                    className="w-full bg-slate-50 border border-orange-100 rounded-lg py-1 px-2 text-[9px] font-bold outline-none"
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
                        className="w-full bg-white border border-orange-200 rounded-lg py-1 px-2 text-[9px] font-black uppercase"
                      />
                    ) : (
                      <button
                        onClick={() => setActiveFolder(folder.id)}
                        onDragOver={(e) => onDragOverFolder(e, folder.id)}
                        onDrop={(e) => onDropNoteInFolder(e, folder.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          activeFolder === folder.id ? 'bg-orange-50 text-orange-600' : 
                          dragOverFolderId === folder.id ? 'bg-orange-100 ring-1 ring-orange-300' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <i className="fa-solid fa-folder w-3 text-center"></i>
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover/folder:opacity-100">
                          <i onClick={(e) => startEditingFolder(e, folder)} className="fa-solid fa-pen text-[7px] hover:text-orange-500"></i>
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

        <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <header className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
               <Typography variant="h3" className="text-slate-900 text-sm">{systemFolders.find(f => f.id === activeFolder)?.label || noteFolders.find(f => f.id === activeFolder)?.name || activeFolder}</Typography>
               <Badge variant="slate" className="text-[7px] py-0 px-1.5">{filteredNotes.length}</Badge>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className={`grid gap-3 pb-20 ${selectedTaskId ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
              {filteredNotes.map(note => {
                const isSelected = selectedTaskId === note.id;
                return (
                  <div 
                    key={note.id}
                    draggable
                    onDragStart={(e) => onDragStartNote(e, note.id)}
                    onClick={() => setSelectedTaskId(note.id)}
                    className={`group bg-white p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between min-h-[110px] relative ${
                      isSelected ? 'border-orange-400 ring-2 ring-orange-50 shadow-sm' : 'border-slate-100 hover:border-orange-200 hover:shadow-md'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-1">
                        <Typography variant="h3" className="text-slate-900 leading-tight truncate pr-4 text-[12px]">{note.title}</Typography>
                        <i onClick={(e) => { e.stopPropagation(); deleteTask(note.id); }} className="fa-solid fa-trash-can text-[7px] text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-medium text-slate-400 line-clamp-2 leading-relaxed">
                          {note.content || "Без опису..."}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-50">
                        <span className="text-[7px] font-black uppercase text-slate-200">{new Date(note.createdAt).toLocaleDateString('uk-UA')}</span>
                        {note.tags.length > 0 && <span className="text-[7px] font-bold text-orange-400">#{note.tags[0]}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {selectedTaskId && (
          <div className="flex h-full animate-in slide-in-from-right duration-300 border-l border-slate-100">
            <div onMouseDown={startResizing} className={`w-[1px] h-full cursor-col-resize hover:bg-orange-500 z-[100] ${isResizing ? 'bg-orange-500' : 'bg-slate-100'}`}></div>
            <div style={{ width: detailsWidth }} className="h-full bg-white relative shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
              <TaskDetails 
                task={tasks.find(t => t.id === selectedTaskId)!} 
                onClose={() => setSelectedTaskId(null)} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesView;
