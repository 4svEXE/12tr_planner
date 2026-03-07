import React, { useState, useEffect } from 'react';
import { Task, TableColumn, TableRow } from '../types';
import { useApp } from '../contexts/AppContext';

interface TableEditorProps {
    task: Task;
}

const TableEditor: React.FC<TableEditorProps> = ({ task }) => {
    const { updateTask } = useApp();

    // Default data if new
    const initialColumns: TableColumn[] = task.tableData?.columns || [
        { id: 'col_1', name: 'Назва', type: 'text', width: 150 },
        { id: 'col_2', name: 'Опис', type: 'text', width: 250 }
    ];
    const initialRows: TableRow[] = task.tableData?.rows || [
        { id: 'row_1', cells: { col_1: '', col_2: '' } }
    ];

    const [columns, setColumns] = useState<TableColumn[]>(initialColumns);
    const [rows, setRows] = useState<TableRow[]>(initialRows);

    useEffect(() => {
        if (task.tableData) {
            setColumns(task.tableData.columns);
            setRows(task.tableData.rows);
        }
    }, [task.tableData]);

    // Debounce save
    useEffect(() => {
        const handler = setTimeout(() => {
            updateTask({
                ...task,
                tableData: { columns, rows }
            });
        }, 500);
        return () => clearTimeout(handler);
    }, [columns, rows]);

    const addColumn = () => {
        const newColId = 'col_' + Math.random().toString(36).substring(2, 9);
        setColumns([...columns, { id: newColId, name: 'Новий стовпець', type: 'text', width: 150 }]);
        setRows(rows.map(r => ({ ...r, cells: { ...r.cells, [newColId]: '' } })));
    };

    const removeColumn = (colId: string) => {
        if (columns.length <= 1) return;
        setColumns(columns.filter(c => c.id !== colId));
        setRows(rows.map(r => {
            const newCells = { ...r.cells };
            delete newCells[colId];
            return { ...r, cells: newCells };
        }));
    };

    const addRow = () => {
        const newRowId = 'row_' + Math.random().toString(36).substring(2, 9);
        const newCells: Record<string, any> = {};
        columns.forEach(c => newCells[c.id] = '');
        setRows([...rows, { id: newRowId, cells: newCells }]);
    };

    const removeRow = (rowId: string) => {
        setRows(rows.filter(r => r.id !== rowId));
    };

    const updateCell = (rowId: string, colId: string, value: string) => {
        setRows(rows.map(r =>
            r.id === rowId
                ? { ...r, cells: { ...r.cells, [colId]: value } }
                : r
        ));
    };

    const updateColumnName = (colId: string, name: string) => {
        setColumns(columns.map(c =>
            c.id === colId ? { ...c, name } : c
        ));
    };

    return (
        <div className="w-full h-full p-2 flex flex-col gap-2 overflow-auto custom-scrollbar">
            <div className="flex gap-2 mb-2 sticky top-0 bg-[var(--bg-main)] z-10 p-2 shadow-sm rounded-xl border border-[var(--border-color)]">
                <button
                    onClick={addRow}
                    className="px-3 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold uppercase rounded hover:bg-opacity-90 transition shadow-sm flex items-center gap-1.5"
                >
                    <i className="fa-solid fa-plus"></i> Рядок
                </button>
                <button
                    onClick={addColumn}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded hover:bg-slate-200 transition border border-slate-200 flex items-center gap-1.5"
                >
                    <i className="fa-solid fa-plus"></i> Стовпець
                </button>
            </div>

            <div className="min-w-max border border-[var(--border-color)] bg-white rounded-xl overflow-hidden shadow-sm">
                {/* Header Record */}
                <div className="flex border-b border-[var(--border-color)] bg-slate-50">
                    <div className="w-8 shrink-0 flex items-center justify-center border-r border-[var(--border-color)] text-[10px] text-slate-400">#</div>
                    {columns.map(col => (
                        <div
                            key={col.id}
                            className="relative shrink-0 border-r border-[var(--border-color)] last:border-r-0 group"
                            style={{ width: col.width || 150 }}
                        >
                            <input
                                type="text"
                                value={col.name}
                                onChange={e => updateColumnName(col.id, e.target.value)}
                                className="w-full bg-transparent px-3 py-2 text-[11px] font-black outline-none focus:bg-white text-slate-700 uppercase tracking-tight"
                                placeholder="Стовпець"
                            />
                            {columns.length > 1 && (
                                <button
                                    onClick={() => removeColumn(col.id)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-rose-50 text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <i className="fa-solid fa-xmark text-[10px]"></i>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Data Rows */}
                {rows.map((row, idx) => (
                    <div key={row.id} className="flex border-b border-[var(--border-color)] last:border-b-0 hover:bg-slate-50/50 group">
                        <div className="w-8 shrink-0 flex flex-col items-center justify-center border-r border-[var(--border-color)] text-[10px] text-slate-400 bg-slate-50 relative">
                            <span className="group-hover:opacity-0 transition-opacity">{idx + 1}</span>
                            <button
                                onClick={() => removeRow(row.id)}
                                className="absolute inset-0 flex items-center justify-center bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Видалити рядок"
                            >
                                <i className="fa-solid fa-trash text-[10px]"></i>
                            </button>
                        </div>
                        {columns.map(col => (
                            <div
                                key={`${row.id}-${col.id}`}
                                className="shrink-0 border-r border-[var(--border-color)] last:border-r-0 p-1"
                                style={{ width: col.width || 150 }}
                            >
                                <textarea
                                    value={row.cells[col.id] || ''}
                                    onChange={e => updateCell(row.id, col.id, e.target.value)}
                                    className="w-full bg-transparent p-1.5 text-xs outline-none resize-none focus:bg-white focus:ring-1 focus:ring-indigo-100 rounded text-[var(--text-main)] min-h-[32px]"
                                    rows={Math.max(1, (row.cells[col.id] || '').split('\n').length)}
                                    placeholder="..."
                                />
                            </div>
                        ))}
                    </div>
                ))}

                {rows.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-[11px] font-bold uppercase">
                        Таблиця порожня. Додайте перший рядок!
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableEditor;
