
import React, { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../contexts/AppContext';

interface HashtagsProps {
  tasks: Task[];
}

const Hashtags: React.FC<HashtagsProps> = ({ tasks }) => {
  const { tags, addTag, renameTag, deleteTag } = useApp();
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const tagCounts = tasks.flatMap(t => t.tags).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Отримуємо всі теги, навіть ті, що не використовуються в жодному завданні
  const sortedTags = [...tags].sort((a, b) => (tagCounts[b.name] || 0) - (tagCounts[a.name] || 0));

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      addTag(newTagName.trim());
      setNewTagName('');
    }
  };

  const startEditing = (tag: any) => {
    setEditingTagId(tag.id);
    setEditValue(tag.name);
  };

  const saveRename = (oldName: string) => {
    if (editValue.trim() && editValue !== oldName) {
      renameTag(oldName, editValue.trim());
    }
    setEditingTagId(null);
  };

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50 transition-none overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Хештеги та Теги</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Керування категоріями та мітками завдань</p>
          </div>
          
          <form onSubmit={handleAddTag} className="flex gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">#</span>
              <input 
                type="text" 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="новий тег..." 
                className="pl-7 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all w-48 shadow-sm"
              />
            </div>
            <button 
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all"
            >
              ДОДАТИ
            </button>
          </form>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {sortedTags.map(tag => (
            <div 
              key={tag.id} 
              className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md hover:border-orange-100 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: tag.color }}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  {editingTagId === tag.id ? (
                    <input 
                      type="text" 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveRename(tag.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(tag.name);
                        if (e.key === 'Escape') setEditingTagId(null);
                      }}
                      className="w-full bg-slate-50 border-b-2 border-orange-500 font-bold text-slate-800 outline-none p-0 uppercase"
                      autoFocus
                    />
                  ) : (
                    <h3 className="font-black text-slate-800 uppercase tracking-wider truncate flex items-center gap-2">
                      <span className="text-slate-300">#</span>{tag.name}
                    </h3>
                  )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button 
                    onClick={() => startEditing(tag)}
                    className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 flex items-center justify-center transition-all"
                    title="Перейменувати"
                  >
                    <i className="fa-solid fa-pencil text-[10px]"></i>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Ви впевнені, що хочете видалити тег #${tag.name} звідусіль?`)) {
                        deleteTag(tag.name);
                      }
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all"
                    title="Видалити"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Використано</div>
                   <div className="text-lg font-black text-slate-900">{tagCounts[tag.name] || 0} разів</div>
                </div>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: tag.color }}
                >
                  <i className="fa-solid fa-tag text-[10px]"></i>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {tasks.filter(t => t.tags.includes(tag.name)).slice(0, 3).map(task => (
                  <div key={task.id} className="text-[10px] text-slate-500 flex items-center gap-2 truncate font-medium">
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    {task.title}
                  </div>
                ))}
                {(tagCounts[tag.name] || 0) > 3 && (
                  <div className="text-[9px] text-slate-300 italic font-bold">ще {(tagCounts[tag.name] || 0) - 3}...</div>
                )}
                {!(tagCounts[tag.name]) && (
                  <div className="text-[10px] text-slate-300 italic">Не використовується</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-orange-50/30 rounded-3xl p-8 border border-orange-100/50 text-center">
          <i className="fa-solid fa-sparkles text-orange-400 text-3xl mb-4"></i>
          <h3 className="text-lg font-black text-slate-900 mb-2">Авто-тегування з AI</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">Дозвольте асистенту проаналізувати ваші вхідні та автоматично додати відповідні мітки для кращої організації.</p>
          <button className="bg-white border border-orange-200 text-orange-600 px-8 py-3 rounded-2xl text-xs font-black hover:bg-orange-50 transition-all shadow-sm">ЗАПУСТИТИ АНАЛІЗ</button>
        </div>
      </div>
    </div>
  );
};

export default Hashtags;
