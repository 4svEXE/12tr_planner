
import React, { useState, useMemo, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import { useResizer } from '../hooks/useResizer';
import TaskDetails from '../components/TaskDetails';
import Button from '../components/ui/Button';

interface HashtagsProps {
  tasks: Task[];
}

const Hashtags: React.FC<HashtagsProps> = ({ tasks }) => {
  const { tags, addTag, renameTag, deleteTag, toggleTaskStatus } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { isResizing, startResizing, detailsWidth } = useResizer(350, 900);

  const tagCounts = useMemo(() => tasks.flatMap(t => t.tags).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [tasks]);

  const sortedTags = useMemo(() => [...tags].sort((a, b) => (tagCounts[b.name] || 0) - (tagCounts[a.name] || 0)), [tags, tagCounts]);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      addTag(newTagName.trim());
      setNewTagName('');
    }
  };

  const saveRename = (oldName: string) => {
    if (editValue.trim() && editValue !== oldName) {
      renameTag(oldName, editValue.trim());
    }
    setEditingTagId(null);
  };

  const toggleCollapsed = (tagId: string) => {
    setCollapsed(prev => ({ ...prev, [tagId]: !prev[tagId] }));
  };

  return (
    <div className="h-full flex bg-main overflow-hidden relative text-main">
      <div className={`flex flex-col flex-1 min-w-0 z-10 transition-all ${isMobile && selectedTaskId ? 'hidden' : 'h-full'}`}>
        <header className="px-6 pt-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <i className="fa-solid fa-tags text-xl"></i>
              </div>
              <div>
                <Typography variant="h1" className="text-2xl font-black tracking-tight text-main">Теги</Typography>
                <Typography variant="tiny" className="text-muted opacity-60 uppercase tracking-[0.2em] text-[8px]">Організація контекстів життя</Typography>
              </div>
            </div>

            <form onSubmit={handleAddTag} className="flex gap-2">
              <div className="relative flex-1 md:w-48">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold">#</span>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="новий тег..."
                  className="w-full pl-7 pr-4 py-2 bg-card border border-theme rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all text-main shadow-sm"
                />
              </div>
              <Button type="submit" size="sm" className="rounded-xl shadow-lg shadow-primary/10">ДОДАТИ</Button>
            </form>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 max-w-4xl mx-auto w-full pb-32 mt-8">
          {sortedTags.map(tag => {
            const tagTasks = tasks.filter(t => t.tags.includes(tag.name));
            const isCollapsed = collapsed[tag.id];

            return (
              <div key={tag.id} className="mb-6 group">
                <div
                  className="flex items-center gap-3 py-2 cursor-pointer select-none group/header"
                  onClick={() => toggleCollapsed(tag.id)}
                >
                  <i className={`fa-solid fa-chevron-right text-[8px] text-muted transition-transform duration-300 ${!isCollapsed ? 'rotate-90 text-primary' : 'opacity-40'}`}></i>

                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {editingTagId === tag.id ? (
                      <input
                        autoFocus
                        value={editValue}
                        onClick={e => e.stopPropagation()}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveRename(tag.name)}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename(tag.name)}
                        className="bg-main border-b-2 border-primary font-black text-main outline-none p-0 uppercase text-[12px] tracking-widest w-full max-w-[200px]"
                      />
                    ) : (
                      <span className="text-[12px] font-black uppercase text-main tracking-widest flex items-center gap-1.5">
                        <span className="text-primary/40 font-bold">#</span>
                        {tag.name}
                      </span>
                    )}

                    <div className="opacity-0 group-hover/header:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTagId(tag.id); setEditValue(tag.name); }}
                        className="w-6 h-6 rounded-md hover:bg-black/5 text-muted hover:text-primary flex items-center justify-center transition-all"
                      >
                        <i className="fa-solid fa-pencil text-[9px]"></i>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); confirm(`Видалити тег #${tag.name}?`) && deleteTag(tag.name); }}
                        className="w-6 h-6 rounded-md hover:bg-rose-500/10 text-muted hover:text-rose-500 flex items-center justify-center transition-all"
                      >
                        <i className="fa-solid fa-trash-can text-[9px]"></i>
                      </button>
                    </div>
                  </div>

                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary transition-all group-hover/header:bg-primary group-hover/header:text-white">
                    {tagTasks.length}
                  </span>
                </div>

                {!isCollapsed && (
                  <div className="space-y-1 mt-1 border-t border-theme/30 pt-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    {tagTasks.length > 0 ? (
                      tagTasks.map(task => {
                        const isSelected = selectedTaskId === task.id;
                        const isDone = task.status === TaskStatus.DONE;

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer group/item relative border rounded-xl transition-all shadow-sm
                              ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-card border-theme hover:border-primary/20'}`}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-inner' : 'border-theme bg-black/5 hover:border-primary'}`}
                            >
                              {isDone && <i className="fa-solid fa-check text-[7px]"></i>}
                            </button>

                            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                              <span className={`text-[11px] font-bold truncate leading-tight tracking-tight transition-all ${isDone ? 'line-through text-muted opacity-50' : 'text-main'}`}>
                                {task.title}
                              </span>

                              <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                {task.content && task.content !== "[]" && (
                                  <i className="fa-regular fa-file-lines text-muted text-[10px]"></i>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed border-theme rounded-2xl opacity-20">
                        <i className="fa-solid fa-ghost text-4xl mb-2"></i>
                        <p className="text-[10px] font-bold uppercase tracking-widest">Немає квестів з цим тегом</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`bg-card shrink-0 relative transition-none border-l border-theme flex flex-col ${selectedTaskId ? '' : 'hidden lg:flex'}`}
        style={!isMobile ? { width: detailsWidth } : { width: '100vw', position: 'fixed', inset: 0, zIndex: 100 }}
      >
        {!isMobile && (
          <div
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[100] transition-colors -ml-0.5 ${isResizing ? 'bg-primary' : 'bg-transparent hover:bg-primary/20'}`}
            title="Тягніть для зміни розміру"
          />
        )}

        <div className="w-full h-full flex flex-col">
          {selectedTaskId ? (
            <TaskDetails task={tasks.find(t => t.id === selectedTaskId)!} onClose={() => setSelectedTaskId(null)} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center opacity-10 grayscale pointer-events-none select-none">
              <i className="fa-solid fa-mountain-sun text-9xl mb-8 text-main"></i>
              <Typography variant="h2" className="text-2xl font-black uppercase tracking-widest text-muted">Оберіть квест</Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hashtags;
