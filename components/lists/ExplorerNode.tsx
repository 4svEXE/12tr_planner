import React, { useState } from 'react';
import { Project, Task } from '../../types';

interface ExplorerNodeProps {
  project: Project;
  level: number;
  expandedFolders: Set<string>;
  selectedProjectId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string | null) => void;
  onAddChild: (parentId: string, type: 'folder' | 'list') => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onDeleteSection: (pId: string, sId: string) => void;
  onMoveNode: (sourceId: string, targetId: string | undefined) => void;
  onUpdateTask: (task: any) => void;
  allTasks: Task[];
  allProjects: Project[];
}

const ExplorerNode: React.FC<ExplorerNodeProps> = ({
  project, level, expandedFolders, selectedProjectId, 
  onToggle, onSelect, onAddChild, onEdit, onDelete, onMoveNode, onUpdateTask, 
  allTasks, allProjects
}) => {
  const isFolder = project.type === 'folder';
  const isExpanded = expandedFolders.has(project.id);
  const isSelected = selectedProjectId === project.id;
  const [isLocalDragOver, setIsLocalDragOver] = useState(false);

  const children = allProjects.filter(p => p.parentFolderId === project.id);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFolder) setIsLocalDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLocalDragOver(false);
    
    const taskId = e.dataTransfer.getData('taskId');
    const sourceProjectId = e.dataTransfer.getData('projectId');

    if (taskId && !isFolder) {
      const t = allTasks.find(x => x.id === taskId);
      if (t) onUpdateTask({ ...t, projectId: project.id, projectSection: 'actions', isDeleted: false });
    } else if (sourceProjectId && isFolder && sourceProjectId !== project.id) {
      onMoveNode(sourceProjectId, project.id);
    }
  };

  const displayEmoji = project.description && project.description.startsWith('EMOJI:') 
    ? project.description.replace('EMOJI:', '') 
    : (isFolder ? (isExpanded ? '📂' : '📁') : '📝');

  return (
    <div className="flex flex-col">
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('projectId', project.id);
          e.currentTarget.style.opacity = '0.4';
        }}
        onDragEnd={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsLocalDragOver(false)}
        onDrop={handleDrop}
        onClick={() => isFolder ? onToggle(project.id) : onSelect(project.id)}
        className={`flex items-center py-1.5 px-3 cursor-pointer group transition-all relative rounded-xl mx-0.5 h-8 ${
          isSelected
            ? 'text-[var(--primary)]'
            : isLocalDragOver
              ? 'bg-[var(--primary)]/5 border-dashed border-2 border-[var(--primary)]'
              : 'text-[var(--text-main)] hover:bg-black/5'
        }`}
        style={{ marginLeft: `${level * 12}px` }}
      >
        {isFolder ? (
          <div className="w-3 flex justify-center shrink-0 mr-1 transition-transform duration-200">
            <i className={`fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} text-[7px] ${isSelected ? 'text-[var(--primary)]' : 'text-slate-400'}`}></i>
          </div>
        ) : (
          <div className="w-3 mr-1 shrink-0" />
        )}
        
        <span className="text-[12px] w-5 text-center shrink-0 mr-1 filter grayscale-[0.5] group-hover:grayscale-0 transition-all">
          {displayEmoji}
        </span>

        <span className={`text-[12px] font-bold truncate flex-1 tracking-tight h-full flex items-center ${isSelected ? 'border-b-2 border-[var(--primary)]' : ''}`}>{project.name}</span>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
          {isFolder && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onAddChild(project.id, 'folder'); }} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] ${isSelected ? 'hover:bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-black/10 text-slate-400'}`} title="Нова папка"><i className="fa-solid fa-folder-plus"></i></button>
              <button onClick={(e) => { e.stopPropagation(); onAddChild(project.id, 'list'); }} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] ${isSelected ? 'hover:bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-black/10 text-slate-400'}`} title="Новий список"><i className="fa-solid fa-plus"></i></button>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); onEdit(project); }} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] ${isSelected ? 'hover:bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-black/10 text-slate-400'}`} title="Налаштування"><i className="fa-solid fa-gear"></i></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(project.id); }} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] ${isSelected ? 'hover:bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-rose-500/10 hover:text-rose-500 text-slate-400'}`} title="Видалити"><i className="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {children.map(child => (
            <ExplorerNode
              key={child.id}
              project={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              selectedProjectId={selectedProjectId}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onDeleteSection={() => {}}
              onMoveNode={onMoveNode}
              onUpdateTask={onUpdateTask}
              allTasks={allTasks}
              allProjects={allProjects}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorerNode;