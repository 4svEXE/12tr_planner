import React, { useState } from 'react';
import { Task, MindmapNode, MindmapEdge } from '../types';
import { useApp } from '../contexts/AppContext';
import Input from './ui/Input';

interface MindmapListViewProps {
    task: Task;
}

const MindmapListView: React.FC<MindmapListViewProps> = ({ task }) => {
    const { updateTask } = useApp();
    const nodes = task.mindmapData?.nodes || [];
    const edges = task.mindmapData?.edges || [];

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(nodes.map(n => n.id)));

    const toggleExpand = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const updateNode = (id: string, updates: Partial<MindmapNode>) => {
        const newNodes = nodes.map(n => n.id === id ? { ...n, ...updates } : n);
        updateTask({
            ...task,
            mindmapData: {
                ...task.mindmapData!,
                nodes: newNodes
            }
        });
    };

    const addNewNode = (parentId?: string, type: 'task' | 'note' = 'task') => {
        const id = 'node_' + Math.random().toString(36).substring(2, 9);
        // Position it somewhat reasonably if they switch to canvas later
        const parent = nodes.find(n => n.id === parentId);
        const newNode: MindmapNode = {
            id,
            text: type === 'task' ? 'Нове завдання' : 'Нова секція',
            x: parent ? parent.x + 200 : 200,
            y: parent ? parent.y + 100 : 200,
            width: 140,
            height: 60,
            type
        };

        const newNodes = [...nodes, newNode];
        const newEdges = [...edges];
        if (parentId) {
            newEdges.push({
                id: 'edge_' + Math.random().toString(36).substring(2, 9),
                sourceId: parentId,
                targetId: id
            });
        }

        updateTask({
            ...task,
            mindmapData: {
                ...(task.mindmapData || { nodes: [], edges: [] }),
                nodes: newNodes,
                edges: newEdges
            }
        });

        if (parentId) {
            setExpandedNodes(prev => new Set([...prev, parentId]));
        }
    };

    const deleteNode = (id: string) => {
        const newNodes = nodes.filter(n => n.id !== id);
        const newEdges = edges.filter(e => e.sourceId !== id && e.targetId !== id);
        updateTask({
            ...task,
            mindmapData: {
                ...task.mindmapData!,
                nodes: newNodes,
                edges: newEdges
            }
        });
    };

    const renderItem = (node: MindmapNode, depth = 0) => {
        const children = edges
            .filter(e => e.sourceId === node.id)
            .map(e => nodes.find(n => n.id === e.targetId))
            .filter(Boolean) as MindmapNode[];

        const isTask = node.type === 'task';
        const isCompleted = node.completed && isTask;
        const isExpanded = expandedNodes.has(node.id);

        return (
            <div key={node.id} className="space-y-1">
                <div
                    className="group flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-black/5 transition-all"
                    style={{ marginLeft: depth * 24 }}
                >
                    <button
                        onClick={() => toggleExpand(node.id)}
                        className={`w-6 h-6 flex items-center justify-center rounded-lg hover:bg-black/5 transition-transform ${isExpanded && children.length > 0 ? 'rotate-90' : ''}`}
                    >
                        {children.length > 0 ? (
                            <i className="fa-solid fa-chevron-right text-[10px] opacity-40"></i>
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        )}
                    </button>

                    {isTask && (
                        <button
                            onClick={() => updateNode(node.id, { completed: !node.completed })}
                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'}`}
                        >
                            {isCompleted && <i className="fa-solid fa-check text-[10px]"></i>}
                        </button>
                    )}

                    <Input
                        variant="ghost"
                        value={node.text}
                        onChange={(e) => updateNode(node.id, { text: e.target.value })}
                        className={`flex-1 text-[13px] font-bold ${isCompleted ? 'line-through text-slate-400 opacity-50' : 'text-slate-700 dark:text-slate-200'}`}
                        placeholder="Введіть текст..."
                    />

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                            onClick={() => addNewNode(node.id, 'task')}
                            className="w-7 h-7 rounded-lg hover:bg-emerald-50 text-emerald-500 flex items-center justify-center"
                            title="Додати підзавдання"
                        >
                            <i className="fa-solid fa-plus"></i>
                        </button>
                        <button
                            onClick={() => deleteNode(node.id)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 text-rose-400 flex items-center justify-center"
                        >
                            <i className="fa-solid fa-trash-can text-[11px]"></i>
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="space-y-1">
                        {children.map(child => renderItem(child, depth + 1))}
                        <button
                            onClick={() => addNewNode(node.id, 'task')}
                            className="flex items-center gap-2 py-1.5 px-3 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-emerald-50/50 transition-all text-[10px] font-bold"
                            style={{ marginLeft: (depth + 1) * 24 + 32 }}
                        >
                            <i className="fa-solid fa-plus text-[8px]"></i>
                            <span>Додати квест до цього списку...</span>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const targets = new Set(edges.map(e => e.targetId));
    const roots = nodes.filter(n => !targets.has(n.id) || n.id === 'root');

    return (
        <div className="flex flex-col h-full bg-transparent overflow-y-auto no-scrollbar p-4 space-y-6">
            <div className="space-y-2">
                {roots.map(root => renderItem(root))}
            </div>

            <div className="pt-4 border-t border-black/5 flex flex-col gap-2">
                <button
                    onClick={() => addNewNode(undefined, 'task')}
                    className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"
                >
                    <i className="fa-solid fa-plus"></i>
                    <span>Додати завдання</span>
                </button>
                <button
                    onClick={() => addNewNode(undefined, 'note')}
                    className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"
                >
                    <i className="fa-solid fa-layer-group"></i>
                    <span>Додати секцію</span>
                </button>
            </div>
        </div>
    );
};

export default MindmapListView;
