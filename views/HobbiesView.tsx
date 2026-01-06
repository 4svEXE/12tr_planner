
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';

const HobbiesView: React.FC = () => {
  const { hobbies, people, addHobby, renameHobby, deleteHobby } = useApp();
  const [newHobbyName, setNewHobbyName] = useState('');
  const [editingHobbyId, setEditingHobbyId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const hobbyUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    people.forEach(p => {
      p.hobbies.forEach(h => {
        counts[h] = (counts[h] || 0) + 1;
      });
    });
    return counts;
  }, [people]);

  const handleAddHobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHobbyName.trim()) {
      addHobby(newHobbyName.trim());
      setNewHobbyName('');
    }
  };

  const startEditing = (hobby: any) => {
    setEditingHobbyId(hobby.id);
    setEditValue(hobby.name);
  };

  const saveRename = (oldName: string) => {
    if (editValue.trim() && editValue !== oldName) {
      renameHobby(oldName, editValue.trim());
    }
    setEditingHobbyId(null);
  };

  const sortedHobbies = [...hobbies].sort((a, b) => (hobbyUsage[b.name] || 0) - (hobbyUsage[a.name] || 0));

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50 transition-none overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Каталог Хобі</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Інтереси твоїх союзників та соціальний клей</p>
          </div>
          
          <form onSubmit={handleAddHobby} className="flex gap-2">
            <input 
              type="text" 
              value={newHobbyName}
              onChange={(e) => setNewHobbyName(e.target.value)}
              placeholder="нове хобі..." 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all w-48 shadow-sm"
            />
            <button 
              type="submit"
              className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-orange-700 shadow-lg shadow-orange-100 transition-all"
            >
              ДОДАТИ
            </button>
          </form>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedHobbies.map(hobby => (
            <div 
              key={hobby.id} 
              className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md hover:border-orange-100 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: hobby.color }}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  {editingHobbyId === hobby.id ? (
                    <input 
                      type="text" 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveRename(hobby.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(hobby.name);
                        if (e.key === 'Escape') setEditingHobbyId(null);
                      }}
                      className="w-full bg-slate-50 border-b-2 border-orange-500 font-bold text-slate-800 outline-none p-0"
                      autoFocus
                    />
                  ) : (
                    <h3 className="font-black text-slate-800 uppercase tracking-wider truncate">
                      {hobby.name}
                    </h3>
                  )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button 
                    onClick={() => startEditing(hobby)}
                    className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 flex items-center justify-center transition-all"
                  >
                    <i className="fa-solid fa-pencil text-[10px]"></i>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Видалити хобі "${hobby.name}"? Це видалить його у всіх контактів.`)) {
                        deleteHobby(hobby.name);
                      }
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Союзників</div>
                   <div className="text-lg font-black text-slate-900">{hobbyUsage[hobby.name] || 0}</div>
                </div>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: hobby.color }}
                >
                  <i className="fa-solid fa-star text-[10px]"></i>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {people.filter(p => p.hobbies.includes(hobby.name)).slice(0, 3).map(p => (
                  <div key={p.id} className="text-[10px] text-slate-500 flex items-center gap-2 truncate font-medium">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-3 h-3 rounded-full" />
                    {p.name}
                  </div>
                ))}
                {(hobbyUsage[hobby.name] || 0) > 3 && (
                  <div className="text-[9px] text-slate-300 italic font-bold">ще {(hobbyUsage[hobby.name] || 0) - 3}...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HobbiesView;
import { useMemo } from 'react';
