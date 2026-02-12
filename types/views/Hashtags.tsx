
import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface HashtagsProps {
  tasks: Task[];
}

const Hashtags: React.FC<HashtagsProps> = ({ tasks }) => {
  const { tags, addTag, renameTag, deleteTag } = useApp();
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  return (
    <div className="p-4 md:p-8 h-full bg-main overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Typography variant="h1" className="text-2xl md:text-3xl">Теги</Typography>
            <Typography variant="tiny" className="text-muted mt-1">Організація контекстів життя</Typography>
          </div>
          
          <form onSubmit={handleAddTag} className="flex gap-2">
            <div className="relative flex-1 md:w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold">#</span>
              <input 
                type="text" 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="новий тег..." 
                className="w-full pl-7 pr-4 py-2 bg-card border border-theme rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all text-main"
              />
            </div>
            <Button type="submit" size="sm">ДОДАТИ</Button>
          </form>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {sortedTags.map(tag => (
            <Card 
              key={tag.id} 
              padding="none"
              className="bg-card border-theme p-5 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" style={{ backgroundColor: tag.color || 'var(--primary)' }}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  {editingTagId === tag.id ? (
                    <input 
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveRename(tag.name)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(tag.name)}
                      className="w-full bg-main border-b-2 border-primary font-bold text-main outline-none p-0 uppercase"
                    />
                  ) : (
                    <Typography variant="h3" className="uppercase tracking-wider truncate flex items-center gap-2">
                      <span className="text-muted opacity-40">#</span>{tag.name}
                    </Typography>
                  )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button onClick={() => { setEditingTagId(tag.id); setEditValue(tag.name); }} className="w-7 h-7 rounded-lg bg-main text-muted hover:text-primary flex items-center justify-center transition-all"><i className="fa-solid fa-pencil text-[10px]"></i></button>
                  <button onClick={() => confirm(`Видалити тег #${tag.name}?`) && deleteTag(tag.name)} className="w-7 h-7 rounded-lg bg-main text-muted hover:text-rose-500 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-0.5">
                   <span className="text-[8px] font-black text-muted uppercase tracking-widest">Використано</span>
                   <div className="text-xl font-black text-main">{tagCounts[tag.name] || 0}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-main flex items-center justify-center text-primary shadow-inner border border-theme">
                  <i className="fa-solid fa-tag text-[10px]"></i>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-theme space-y-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {tasks.filter(t => t.tags.includes(tag.name)).slice(0, 3).map(task => (
                  <div key={task.id} className="text-[10px] text-muted flex items-center gap-2 truncate font-medium">
                    <div className="w-1 h-1 rounded-full bg-primary/30"></div>
                    {task.title}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hashtags;
