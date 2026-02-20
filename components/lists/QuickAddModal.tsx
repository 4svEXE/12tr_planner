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
  const { addTask, updateTask, people = [] } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [associatedPersonId, setAssociatedPersonId] = useState<string | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (!title.trim()) return;

    const category = project.id === 'system_notes' ? 'note' : 'tasks';
    const pId = (project.id === 'system_inbox' || project.id === 'system_notes') ? undefined : project.id;

    const id = addTask(title.trim(), category, pId, 'actions');

    if (selectedDate || selectedTags.length > 0 || content.trim() || associatedPersonId) {
      const updates: any = {};
      if (selectedDate) updates.scheduledDate = selectedDate;
      if (selectedTags.length > 0) updates.tags = selectedTags;
      if (associatedPersonId) updates.personId = associatedPersonId;
      if (content.trim()) {
        updates.content = JSON.stringify([{ id: 'b1', type: 'text', content: content.trim() }]);
      }

      setTimeout(() => {
        updateTask({ id, ...updates } as any);
      }, 0);
    }

    if (navigator.vibrate) navigator.vibrate(10);
    onClose();
  };

  const toggleTag = (tagName: string, personId?: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
      if (personId && associatedPersonId === personId) setAssociatedPersonId(undefined);
    } else {
      setSelectedTags([...selectedTags, tagName]);
      if (personId) setAssociatedPersonId(personId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center no-print">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className={`w-full max-w-lg bg-[var(--bg-card)] rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] border-t border-[var(--border-color)] flex flex-col relative z-10 transition-all duration-500 ease-out animate-in slide-in-from-bottom-full ${isExpanded ? 'h-[85vh]' : 'h-auto max-h-[70vh]'
          }`}
      >
        <div
          className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full" />
        </div>

        <div className="px-6 pb-6 flex flex-col flex-1 overflow-hidden">
          <div className="relative group/input mb-6">
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Що потрібно зробити?"
              className="w-full text-xl font-bold border-none p-0 focus:ring-0 placeholder:text-[var(--text-muted)] opacity-50 focus:opacity-100 text-[var(--text-main)] bg-transparent transition-all duration-300"
            />
            <div className="absolute -bottom-1 left-0 w-1/4 h-[2px] bg-gradient-to-r from-[var(--primary)] to-transparent opacity-0 group-focus-within/input:opacity-100 group-focus-within/input:w-full transition-all duration-500 rounded-full shadow-[0_2px_10px_var(--primary)]" />
            <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-[var(--border-color)] opacity-20" />
          </div>

          {(isExpanded || content) && (
            <textarea
              ref={detailsRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Додати деталі..."
              className="w-full flex-1 bg-[var(--bg-input)] rounded-2xl p-4 text-sm font-medium border-none focus:ring-2 focus:ring-[var(--primary)]/10 resize-none mb-4 animate-in fade-in slide-in-from-top-2 text-[var(--text-main)]"
              onFocus={() => !isExpanded && setIsExpanded(true)}
            />
          )}

          {(selectedDate || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedDate && (
                <Badge variant="indigo" icon="fa-calendar-day" className="py-1 px-3">
                  {new Date(selectedDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                  <button onClick={() => setSelectedDate(undefined)} className="ml-2 opacity-50 hover:opacity-100"><i className="fa-solid fa-xmark"></i></button>
                </Badge>
              )}
              {selectedTags.map(tag => {
                const isPerson = people.some(p => p.name.trim().replace(/\s+/g, '_') === tag);
                return (
                  <Badge key={tag} variant={isPerson ? "orange" : "slate"} icon={isPerson ? "fa-user-ninja" : "fa-hashtag"} className="py-1 px-3">
                    {tag}
                    <button onClick={() => toggleTag(tag)} className="ml-2 opacity-50 hover:opacity-100"><i className="fa-solid fa-xmark"></i></button>
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mt-auto">
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedDate ? 'bg-indigo-50 text-indigo-600' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
                >
                  <i className="fa-regular fa-calendar text-lg"></i>
                </button>
                {showDatePicker && (
                  <TaskDatePicker
                    task={{ scheduledDate: selectedDate } as any}
                    onUpdate={(u) => { setSelectedDate(u.scheduledDate); setShowDatePicker(false); }}
                    onClose={() => setShowDatePicker(false)}
                  />
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedTags.length > 0 ? 'bg-amber-50 text-amber-600' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
                >
                  <i className="fa-solid fa-hashtag text-lg"></i>
                </button>
                {showTagPicker && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)] rounded-[1.5rem] p-3 z-50 animate-in zoom-in-95 origin-bottom-left tiktok-blur">
                    <HashtagAutocomplete
                      mode="tags"
                      value={tagInput}
                      onChange={setTagInput}
                      onSelectTag={(tag, pid) => { toggleTag(tag, pid); setTagInput(''); }}
                      placeholder="Пошук тегів чи людей..."
                      className="mb-2"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-black/5'}`}
              >
                <i className={`fa-solid ${isExpanded ? 'fa-compress' : 'fa-expand'} text-lg`}></i>
              </button>
            </div>

            <Button
              disabled={!title.trim()}
              onClick={handleAdd}
              className="h-12 px-8 rounded-2xl shadow-xl shadow-[var(--primary)]/20 font-black uppercase text-[10px] tracking-[0.2em]"
            >
              СТВОРИТИ
            </Button>
          </div>
        </div>

        <div className="h-4 md:h-0" />
      </div>
    </div>
  );
};

export default QuickAddModal;