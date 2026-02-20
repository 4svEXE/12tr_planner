
import React, { useState } from 'react';
import { Task, Project } from '../../types';

interface NoteExplorerNodeProps {
  id: string;
  name: string;
  type: 'folder' | 'note';
  level: number;
  expandedFolders: Set<string>;
  selectedId: string | null;
  editingId: string | null;
  inputValue: string;
  creatingIn: { parentId: string | undefined; type: 'folder' | 'note' } | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onStartCreation: (type: 'folder' | 'note', parentId: string) => void;
  onFinishCreation: () => void;
  onStartRename: (id: string, name: string) => void;
  onFinishRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (sourceId: string, sourceType: 'folder' | 'note', targetFolderId: string | undefined) => void;
  setInputValue: (val: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  allNotes: Task[];
  allFolders: Project[];
}

const NoteExplorerNode: React.FC<NoteExplorerNodeProps> = ({
  id, name, type, level, expandedFolders, selectedId, editingId, inputValue,
  creatingIn, onToggle, onSelect, onStartCreation, onFinishCreation, onStartRename, onFinishRename,
  onDelete, onMove, setInputValue, inputRef, allNotes, allFolders
}) => {
  const isFolder = type === 'folder';
  const isExpanded = expandedFolders.has(id);
  const isSelected = selectedId === id;
  const isEditing = editingId === id;
  const [isDragOver, setIsDragOver] = useState(false);

  const childFolders = allFolders.filter(f => f.parentFolderId === id);
  const childNotes = allNotes.filter(n => n.projectId === id);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('nodeId', id);
    e.dataTransfer.setData('nodeType', type);
    // Visual tweak for Ghost image
    const dragGhost = e.currentTarget as HTMLElement;
    dragGhost.style.opacity = '0.5';
    setTimeout(() => dragGhost.style.opacity = '1', 0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const sourceId = e.dataTransfer.getData('nodeId');
    const sourceType = e.dataTransfer.getData('nodeType') as 'folder' | 'note';
    if (isFolder && sourceType === 'note') {
      onMove(sourceId, sourceType, id);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={(e) => { 
          if (isFolder) {
            e.preventDefault(); 
            e.stopPropagation();
            setIsDragOver(true);
          }
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => isFolder ? onToggle(id) : onSelect(id)}
        className={`flex items-center gap-2 py-1 px-3 cursor-pointer group transition-all border-l-2 relative ${
          isSelected
            ? 'bg-[var(--primary)]/12 border-[var(--primary)] text-[var(--text-main)]'
            : isDragOver
              ? 'bg-[var(--primary)]/5 border-[var(--primary)]/50'
              : 'border-transparent text-[var(--text-main)] hover:bg-[var(--bg-main)]/70'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {isFolder ? (
          <div className="w-4 flex justify-center shrink-0">
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[7px] opacity-60 transition-transform duration-200 ${isExpanded ? '' : '-rotate-9'} `}></i>
          </div>
        ) : (
          <div className="w-4 shrink-0" />
        )}
        
        <i className={`fa-solid ${isFolder ? (isExpanded ? 'fa-folder-open' : 'fa-folder') : 'fa-note-sticky'} text-[11px] w-4 text-center transition-colors ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] opacity-70 group-hover:opacity-100'}`}></i>

        {isEditing ? (
          <input
            ref={inputRef}
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onBlur={() => onFinishRename(id, inputValue)}
            onKeyDown={e => e.key === 'Enter' && onFinishRename(id, inputValue)}
            className="flex-1 bg-[var(--bg-card)] border border-[var(--primary)]/30 rounded px-1 text-[11px] font-bold h-6 outline-none text-[var(--text-main)] shadow-sm"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`text-[11px] font-bold truncate flex-1 tracking-tight transition-opacity ${isFolder ? 'opacity-80' : ''} ${isSelected ? 'opacity-100' : 'group-hover:opacity-100'}`}>{name}</span>
        )}

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
          {isFolder && (
            <button onClick={(e) => { e.stopPropagation(); onStartCreation('note', id); }} className="w-6 h-6 hover:bg-[var(--bg-main)] rounded flex items-center justify-center text-[9px] text-[var(--text-muted)] hover:text-[var(--primary)]" title="Додати нотатку"><i className="fa-solid fa-plus"></i></button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onStartRename(id, name); }} className="w-6 h-6 hover:bg-[var(--bg-main)] rounded flex items-center justify-center text-[9px] text-[var(--text-muted)] hover:text-[var(--text-main)]" title="Перейменувати"><i className="fa-solid fa-pencil"></i></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="w-6 h-6 hover:bg-rose-500/10 hover:text-rose-500 rounded flex items-center justify-center text-[9px] text-[var(--text-muted)]" title="Видалити"><i className="fa-solid fa-trash-can"></i></button>
        </div>
      </div>

      {isExpanded && isFolder && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {childFolders.map(cf => (
            <NoteExplorerNode 
              key={cf.id}
              id={cf.id}
              name={cf.name}
              type="folder"
              level={level + 1}
              expandedFolders={expandedFolders}
              selectedId={selectedId}
              editingId={editingId}
              inputValue={inputValue}
              creatingIn={creatingIn}
              onToggle={onToggle}
              onSelect={onSelect}
              onStartCreation={onStartCreation}
              onFinishCreation={onFinishCreation}
              onStartRename={onStartRename}
              onFinishRename={onFinishRename}
              onDelete={onDelete}
              onMove={onMove}
              setInputValue={setInputValue}
              inputRef={inputRef}
              allNotes={allNotes}
              allFolders={allFolders}
            />
          ))}
          {childNotes.map(cn => (
            <NoteExplorerNode 
              key={cn.id}
              id={cn.id}
              name={cn.title}
              type="note"
              level={level + 1}
              expandedFolders={expandedFolders}
              selectedId={selectedId}
              editingId={editingId}
              inputValue={inputValue}
              creatingIn={creatingIn}
              onToggle={onToggle}
              onSelect={onSelect}
              onStartCreation={onStartCreation}
              onFinishCreation={onFinishCreation}
              onStartRename={onStartRename}
              onFinishRename={onFinishRename}
              onDelete={onDelete}
              onMove={onMove}
              setInputValue={setInputValue}
              inputRef={inputRef}
              allNotes={[]}
              allFolders={[]}
            />
          ))}
          {creatingIn && creatingIn.parentId === id && creatingIn.type === 'note' && (
            <div className="flex items-center gap-2 py-1 px-3 border-l-2 border-[var(--primary)] animate-in slide-in-from-left-1 duration-200" style={{ paddingLeft: `${(level + 1) * 12 + 20}px` }}>
              <i className="fa-solid fa-note-sticky text-[11px] w-4 text-center text-[var(--primary)]"></i>
              <input
                ref={inputRef}
                autoFocus
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onBlur={onFinishCreation}
                onKeyDown={e => {
                   if (e.key === 'Enter') {
                     onFinishCreation();
                   }
                }}
                placeholder="Назва..."
                className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-2 text-[11px] font-bold h-6 outline-none text-[var(--text-main)] shadow-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteExplorerNode;
