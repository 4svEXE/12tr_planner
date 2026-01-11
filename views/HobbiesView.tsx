
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from '../components/ui/Typography';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

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

  const saveRename = (oldName: string) => {
    if (editValue.trim() && editValue !== oldName) {
      renameHobby(oldName, editValue.trim());
    }
    setEditingHobbyId(null);
  };

  const sortedHobbies = useMemo(() => [...hobbies].sort((a, b) => (hobbyUsage[b.name] || 0) - (hobbyUsage[a.name] || 0)), [hobbies, hobbyUsage]);

  return (
    <div className="p-4 md:p-8 h-full bg-main overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Typography variant="h1" className="text-2xl md:text-3xl">Хобі</Typography>
            <Typography variant="tiny" className="text-muted mt-1">Соціальні інтереси та дозвілля</Typography>
          </div>
          
          <form onSubmit={handleAddHobby} className="flex gap-2">
            <input 
              type="text" 
              value={newHobbyName}
              onChange={(e) => setNewHobbyName(e.target.value)}
              placeholder="нове хобі..." 
              className="px-4 py-2 bg-card border border-theme rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all w-48 text-main"
            />
            <Button type="submit" size="sm">ДОДАТИ</Button>
          </form>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedHobbies.map(hobby => (
            <Card 
              key={hobby.id} 
              padding="none"
              className="bg-card border-theme p-5 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" style={{ backgroundColor: hobby.color || 'var(--primary)' }}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  {editingHobbyId === hobby.id ? (
                    <input 
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveRename(hobby.name)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(hobby.name)}
                      className="w-full bg-main border-b-2 border-primary font-bold text-main outline-none p-0"
                    />
                  ) : (
                    <Typography variant="h3" className="uppercase tracking-wider truncate">
                      {hobby.name}
                    </Typography>
                  )}
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button onClick={() => { setEditingHobbyId(hobby.id); setEditValue(hobby.name); }} className="w-7 h-7 rounded-lg bg-main text-muted hover:text-primary flex items-center justify-center transition-all"><i className="fa-solid fa-pencil text-[10px]"></i></button>
                  <button onClick={() => confirm(`Видалити хобі "${hobby.name}"?`) && deleteHobby(hobby.name)} className="w-7 h-7 rounded-lg bg-main text-muted hover:text-rose-500 flex items-center justify-center transition-all"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-0.5">
                   <span className="text-[8px] font-black text-muted uppercase tracking-widest">Союзників</span>
                   <div className="text-xl font-black text-main">{hobbyUsage[hobby.name] || 0}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-main flex items-center justify-center text-primary border border-theme shadow-inner">
                  <i className="fa-solid fa-star text-[10px]"></i>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-theme space-y-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {people.filter(p => p.hobbies.includes(hobby.name)).slice(0, 3).map(p => (
                  <div key={p.id} className="text-[10px] text-muted flex items-center gap-2 truncate font-medium">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} className="w-4 h-4 rounded-full bg-main border border-theme" />
                    {p.name}
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

export default HobbiesView;
