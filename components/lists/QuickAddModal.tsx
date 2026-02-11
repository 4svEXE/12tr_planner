
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Project, TaskStatus, Priority } from '../../types';
import Typography from '../ui/Typography';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import TaskDatePicker from '../TaskDatePicker';
import HashtagAutocomplete from '../HashtagAutocomplete';

interface QuickAddModalProps {
  project: Project;
  onClose: () => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ project, onClose }) => {
  const { addTask, updateTask } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const tagPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (!title.trim()) return;
    
    const category = project.id === 'system_notes' ? 'note' : 'tasks';
    const pId = (project.id === 'system_inbox' || project.id === 'system_notes') ? undefined : project.id;
    
    // Створюємо таск
    const id = addTask(title.trim(), category, pId, 'actions');
    
    // Оновлюємо додаткові поля, якщо вони були вказані
    if (selectedDate || selectedTags.length > 0 || content.trim()) {
      // Отримуємо останній доданий таск (який ми тільки що створили)
      // Це трохи хак для AppContext який не повертає таск одразу, 
      // але в AppContext ми вже змінили addTask щоб він повертав ID
      const updates: any = {};
      if (selectedDate) updates.scheduledDate = selectedDate;
      if (selectedTags.length > 0) updates.tags = selectedTags;
      if (content.trim()) {
        // Формуємо простий блок для контенту
        updates.content = JSON.stringify([{ id: 'b1', type: 'text', content: content.trim() }]);
      }
      
      // Невеликий delay щоб таск з'явився в стейті
      setTimeout(() => {
        updateTask({ id, ...updates } as any);
      }, 0);
    }

    if (navigator.vibrate) navigator.vibrate(10);
    onClose();
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center no-print">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Bottom Sheet */}
      <div 
        className={`w-full max-w-lg bg-white rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] flex flex-col relative z-10 transition-all duration-500 ease-out animate-in slide-in-from-bottom-full ${
          isExpanded ? 'h-[85vh]' : 'h-auto max-h-[70vh]'
        }`}
      >
        {/* Handle / Swipe Indicator */}
        <div 
          className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="px-6 pb-6 flex flex-col flex-1 overflow-hidden">
          {/* Title Input */}
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Що потрібно зробити?"
            className="w-full text-lg font-bold border-none p-0 focus:ring-0 placeholder:text-slate-300 text-slate-800 mb-4 bg-transparent"
            onKeyDown={e => e.key === 'Enter' && !isExpanded && handleAdd()}
          />

          {/* Details / Content - Visible if expanded or has content */}
          {(isExpanded || content) && (
            <textarea
              ref={detailsRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Додати деталі..."
              className="w-full flex-1 bg-slate-50 rounded-2xl p-4 text-sm font-medium border-none focus:ring-2 focus:ring-primary/10 resize-none mb-4 animate-in fade-in slide-in-from-top-2"
              onFocus={() => !isExpanded && setIsExpanded(true)}
            />
          )}

          {/* Selected Meta Tags Row */}
          {(selectedDate || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedDate && (
                <Badge variant="indigo" icon="fa-calendar-day" className="py-1 px-3">
                  {new Date(selectedDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                  <button onClick={() => setSelectedDate(undefined)} className="ml-2 opacity-50 hover:opacity-100"><i className="fa-solid fa-xmark"></i></button>
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="slate" className="py-1 px-3">
                  #{tag}
                  <button onClick={() => toggleTag(tag)} className="ml-2 opacity-50 hover:opacity-100"><i className="fa-solid fa-xmark"></i></button>
                </Badge>
              ))}
            </div>
          )}

          {/* Tool Bar & Action Button */}
          <div className="flex items-center justify-between gap-4 mt-auto">
            <div className="flex items-center gap-1">
              <div className="relative" ref={datePickerRef}>
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedDate ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <i className="fa-regular fa-calendar text-lg"></i>
                </button>
                {showDatePicker && (
                  <div className="absolute bottom-full left-0 mb-2 scale-90 origin-bottom-left">
                    <TaskDatePicker 
                      task={{ scheduledDate: selectedDate } as any} 
                      onUpdate={(u) => { setSelectedDate(u.scheduledDate); setShowDatePicker(false); }} 
                      onClose={() => setShowDatePicker(false)} 
                    />
                  </div>
                )}
              </div>

              <div className="relative" ref={tagPickerRef}>
                <button 
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedTags.length > 0 ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <i className="fa-solid fa-hashtag text-lg"></i>
                </button>
                {showTagPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white shadow-2xl border border-slate-200 rounded-[1.5rem] p-3 z-50 animate-in zoom-in-95 origin-bottom-left">
                    <HashtagAutocomplete 
                      mode="tags" 
                      value={tagInput} 
                      onChange={setTagInput} 
                      onSelectTag={(tag) => { toggleTag(tag); setTagInput(''); }} 
                      placeholder="Пошук тегів..."
                      className="mb-2"
                    />
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <i className={`fa-solid ${isExpanded ? 'fa-compress' : 'fa-expand'} text-lg`}></i>
              </button>
            </div>

            <Button 
              disabled={!title.trim()}
              onClick={handleAdd}
              className="h-12 px-8 rounded-2xl shadow-xl shadow-orange-200"
            >
              СТВОРИТИ
            </Button>
          </div>
        </div>
        
        {/* Safe Area Padding for mobile keyboards */}
        <div className="h-4 md:h-0" />
      </div>
    </div>
  );
};

export default QuickAddModal;
