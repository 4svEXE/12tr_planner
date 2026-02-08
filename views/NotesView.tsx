
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task, Project } from '../types';
import Typography from '../components/ui/Typography';
import TaskDetails from '../components/TaskDetails';
import MiniCalendar from '../components/sidebar/MiniCalendar';
import { useResizer } from '../hooks/useResizer';
import NoteExplorerNode from '../components/notes/NoteExplorerNode';

const EXPANDED_NOTES_FOLDERS_KEY = '12tr_notes_expanded_folders';

const NotesView: React.FC = () => {
  const { 
    tasks, addTask, updateTask, deleteTask, 
    projects, addProject, updateProject, deleteProject,
    setActiveTab 
  } = useApp();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [creatingIn, setCreatingIn] = useState<{ parentId: string | undefined; type: 'folder' | 'note' } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { detailsWidth, startResizing, isResizing } = useResizer(300, 800);

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(EXPANDED_NOTES_FOLDERS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(EXPANDED_NOTES_FOLDERS_KEY, JSON.stringify(Array.from(expandedFolders)));
  }, [expandedFolders]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const noteFolders = useMemo(() => 
    projects.filter(p => p.description === 'FOLDER_NOTE' || p.type === 'folder'), 
  [projects]);

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const startCreation = (type: 'folder' | 'note', parentId?: string) => {
    if (type === 'folder' && parentId) return;
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

    if (creatingIn.type === 'folder') {
      addProject({
        name: inputValue.trim(),
        type: 'folder',
        color: 'var(--text-muted)',
        isStrategic: false,
        parentFolderId: undefined,
        description: 'FOLDER_NOTE'
      });
    } else {
      const newId = addTask(
        inputValue.trim(),
        'note',
        creatingIn.parentId,
        'actions'
      );
      setSelectedNoteId(newId);
    }
    setCreatingIn(null);
  };

  const handleRename = (id: string, name: string, isFolder: boolean) => {
    if (!name.trim()) {
      setEditingNodeId(null);
      return;
    }
    if (isFolder) {
      const folder = projects.find(p => p.id === id);
      if (folder) updateProject({ ...folder, name: name.trim() });
    } else {
      const note = tasks.find(t => t.id === id);
      if (note) updateTask({ ...note, title: name.trim() });
    }
    setEditingNodeId(null);
  };

  const handleMove = (sourceId: string, sourceType: 'folder' | 'note', targetFolderId: string | undefined) => {
    if (sourceType === 'note') {
      const note = tasks.find(t => t.id === sourceId);
      if (note) updateTask({ ...note, projectId: targetFolderId });
    } else {
      if (targetFolderId) return; 
      const folder = projects.find(p => p.id === sourceId);
      if (folder) updateProject({ ...folder, parentFolderId: undefined });
    }
  };

  const selectedNote = useMemo(() => tasks.find(t => t.id === selectedNoteId), [tasks, selectedNoteId]);
  const parentFolder = useMemo(() => selectedNote?.projectId ? noteFolders.find(f => f.id === selectedNote.projectId) : null, [selectedNote, noteFolders]);

  const filteredFolders = useMemo(() => {
    if (!searchTerm) return noteFolders.filter(f => !f.parentFolderId);
    return noteFolders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [noteFolders, searchTerm]);

  const filteredRootNotes = useMemo(() => {
    const notes = tasks.filter(t => t.category === 'note' && !t.projectId && !t.isDeleted);
    if (!searchTerm) return notes;
    return notes.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tasks, searchTerm]);

  return (
    <div className="h-screen flex bg-[var(--bg-main)] overflow-hidden relative">
      {/* EXPLORER ASIDE */}
      <aside className={`${isMobile && selectedNoteId ? 'hidden' : 'w-full md:w-72'} bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        <header className="p-4 border-b border-[var(--border-color)] space-y-3 bg-black/[0.01]">
          <div className="flex justify-between items-center">
            <Typography variant="tiny" className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[8px]">Дослідник знань</Typography>
            <div className="flex gap-0.5">
              <button onClick={() => startCreation('folder')} className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center text-[10px] text-[var(--text-muted)] transition-colors" title="Нова папка"><i className="fa-solid fa-folder-plus"></i></button>
              <button onClick={() => startCreation('note')} className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center text-[10px] text-[var(--text-muted)] transition-colors" title="Новий документ"><i className="fa-solid fa-file-circle-plus"></i></button>
            </div>
          </div>
          
          <div className="relative group">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] opacity-40 group-focus-within:opacity-100 transition-opacity"></i>
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Пошук нотаток..." 
              className="w-full h-7 bg-black/[0.03] border border-transparent focus:border-[var(--primary)]/30 focus:bg-white rounded-lg pl-8 pr-3 text-[11px] font-medium outline-none transition-all"
            />
          </div>
        </header>

        <div 
          className="flex-1 overflow-y-auto custom-scrollbar py-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const sourceId = e.dataTransfer.getData('nodeId');
            const sourceType = e.dataTransfer.getData('nodeType') as 'folder' | 'note';
            if (sourceId) handleMove(sourceId, sourceType, undefined);
          }}
        >
          {filteredFolders.map(folder => (
            <NoteExplorerNode 
              key={folder.id}
              id={folder.id}
              name={folder.name}
              type="folder"
              level={0}
              expandedFolders={expandedFolders}
              selectedId={selectedNoteId}
              editingId={editingNodeId}
              inputValue={inputValue}
              creatingIn={creatingIn}
              onToggle={toggleFolder}
              onSelect={setSelectedNoteId}
              onStartCreation={startCreation}
              onFinishCreation={handleFinishCreation}
              onStartRename={(id, name) => { setEditingNodeId(id); setInputValue(name); setTimeout(() => inputRef.current?.focus(), 50); }}
              onFinishRename={(id, name) => handleRename(id, name, true)}
              onDelete={(id) => { if(confirm('Видалити папку?')) deleteProject(id); }}
              onMove={handleMove}
              setInputValue={setInputValue}
              inputRef={inputRef}
              allNotes={tasks.filter(t => t.category === 'note' && !t.isDeleted)}
              allFolders={noteFolders}
            />
          ))}

          {filteredRootNotes.map(note => (
            <NoteExplorerNode 
              key={note.id}
              id={note.id}
              name={note.title}
              type="note"
              level={0}
              expandedFolders={expandedFolders}
              selectedId={selectedNoteId}
              editingId={editingNodeId}
              inputValue={inputValue}
              creatingIn={creatingIn}
              onToggle={() => {}}
              onSelect={setSelectedNoteId}
              onStartCreation={startCreation}
              onFinishCreation={handleFinishCreation}
              onStartRename={(id, name) => { setEditingNodeId(id); setInputValue(name); setTimeout(() => inputRef.current?.focus(), 50); }}
              onFinishRename={(id, name) => handleRename(id, name, false)}
              onDelete={(id) => { if(confirm('Видалити нотатку?')) deleteTask(id); }}
              onMove={handleMove}
              setInputValue={setInputValue}
              inputRef={inputRef}
              allNotes={[]}
              allFolders={[]}
            />
          ))}

          {creatingIn && !creatingIn.parentId && (
            <div className="flex items-center gap-2 py-1 px-3 border-l-2 border-[var(--primary)] animate-in slide-in-from-left-1 duration-200" style={{ paddingLeft: '20px' }}>
              <i className={`fa-solid ${creatingIn.type === 'folder' ? 'fa-folder' : 'fa-note-sticky'} text-[11px] w-4 text-center text-[var(--primary)]`}></i>
              <input
                ref={inputRef}
                autoFocus
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onBlur={handleFinishCreation}
                onKeyDown={e => e.key === 'Enter' && handleFinishCreation()}
                placeholder="Назва..."
                className="flex-1 bg-white border border-[var(--border-color)] rounded-md px-2 text-[11px] font-bold h-6 outline-none shadow-sm"
              />
            </div>
          )}
        </div>

        {/* BOTTOM WIDGET AREA */}
        <div className="mt-auto border-t border-[var(--border-color)] bg-black/[0.01] shrink-0">
          <div className="p-3">
            <MiniCalendar />
          </div>
          <nav className="px-2 pb-3 space-y-0.5">
            {[
              { id: 'hashtags', icon: 'fa-hashtag', label: 'Всі теги' },
              { id: 'trash', icon: 'fa-trash-can', label: 'Корзина' }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)] transition-all"
              >
                <i className={`fa-solid ${item.icon} w-3 text-center opacity-60`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* EDITOR AREA */}
      <main className={`flex-1 flex flex-col min-w-0 bg-[var(--bg-main)] h-full transition-all duration-300 relative ${isMobile && !selectedNoteId ? 'hidden' : 'flex'}`}>
        {selectedNoteId ? (
          <div className="h-full flex flex-col animate-in fade-in duration-500">
            {/* Breadcrumbs Header */}
            <header className="h-10 border-b border-[var(--border-color)] bg-white/50 backdrop-blur-sm px-6 flex items-center gap-2 shrink-0">
              {isMobile && (
                <button onClick={() => setSelectedNoteId(null)} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-slate-400 mr-2"><i className="fa-solid fa-chevron-left text-xs"></i></button>
              )}
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <i className="fa-solid fa-database opacity-40"></i>
                <i className="fa-solid fa-chevron-right text-[6px] opacity-30"></i>
                {parentFolder && (
                  <>
                    <span className="hover:text-[var(--primary)] cursor-pointer transition-colors" onClick={() => setSelectedNoteId(null)}>{parentFolder.name}</span>
                    <i className="fa-solid fa-chevron-right text-[6px] opacity-30"></i>
                  </>
                )}
                <span className="text-[var(--text-main)] truncate max-w-[200px]">{selectedNote?.title}</span>
              </div>
            </header>
            <div className="flex-1 overflow-hidden">
              <TaskDetails 
                task={selectedNote!} 
                onClose={() => setSelectedNoteId(null)} 
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none pointer-events-none grayscale opacity-10">
            <div className="relative mb-10">
               <i className="fa-solid fa-note-sticky text-[160px]"></i>
               <div className="absolute inset-0 flex items-center justify-center translate-y-4">
                  <i className="fa-solid fa-brain text-4xl text-white"></i>
               </div>
            </div>
            <Typography variant="h2" className="text-3xl font-black uppercase tracking-[0.3em]">Knowledge Base</Typography>
            <Typography variant="body" className="mt-4 text-xs font-bold uppercase tracking-[0.1em] opacity-60">Оберіть знання або створіть нові для архівації досвіду</Typography>
          </div>
        )}

        {/* Floating Action Button for Notes */}
        {!selectedNoteId && (
          <button
            onClick={() => startCreation('note')}
            className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all border-4 border-white"
            title="Нова нотатка"
          >
            <i className="fa-solid fa-plus text-2xl"></i>
          </button>
        )}
      </main>

      {/* RESIZABLE INSPECTOR */}
      {!isMobile && !selectedNoteId && (
        <div className="hidden lg:flex flex-col border-l border-[var(--border-color)] bg-[var(--bg-card)] shadow-[-4px_0_24px_rgba(0,0,0,0.01)]" style={{ width: detailsWidth }}>
          <div className="h-full w-full flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
             <section className="space-y-4">
                <Typography variant="tiny" className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[9px]">Статистика Бази</Typography>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-color)] text-center">
                      <div className="text-2xl font-black text-[var(--text-main)] leading-none mb-1">{tasks.filter(t => t.category === 'note' && !t.isDeleted).length}</div>
                      <div className="text-[7px] font-black uppercase text-[var(--text-muted)] opacity-60">Нотаток</div>
                   </div>
                   <div className="bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-color)] text-center">
                      <div className="text-2xl font-black text-[var(--text-main)] leading-none mb-1">{noteFolders.length}</div>
                      <div className="text-[7px] font-black uppercase text-[var(--text-muted)] opacity-60">Папок</div>
                   </div>
                </div>
             </section>

             <section className="space-y-4">
                <Typography variant="tiny" className="font-black text-[var(--text-muted)] uppercase tracking-widest text-[9px]">Недавні зміни</Typography>
                <div className="space-y-2">
                   {tasks.filter(t => t.category === 'note' && !t.isDeleted).sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 5).map(note => (
                     <div key={note.id} onClick={() => setSelectedNoteId(note.id)} className="p-3 bg-[var(--bg-main)] hover:bg-white rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)]/30 transition-all cursor-pointer group flex items-center gap-3">
                        <i className="fa-solid fa-file-lines text-[10px] text-[var(--text-muted)] group-hover:text-[var(--primary)]"></i>
                        <span className="text-[10px] font-bold text-[var(--text-main)] truncate flex-1 uppercase tracking-tight">{note.title}</span>
                     </div>
                   ))}
                </div>
             </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesView;
