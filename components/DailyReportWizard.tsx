
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import Typography from './ui/Typography';
import Button from './ui/Button';
import Card from './ui/Card';
import { ReportQuestion } from '../types';

interface DailyReportWizardProps {
  onClose: () => void;
}

const DailyReportWizard: React.FC<DailyReportWizardProps> = ({ onClose }) => {
  const { reportTemplate, updateReportTemplate, saveDiaryEntry } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState<ReportQuestion[]>(reportTemplate);

  const totalPages = useMemo(() => {
    const pages = reportTemplate.map(q => q.page);
    return pages.length > 0 ? Math.max(...pages) : 1;
  }, [reportTemplate]);

  const questionsOnCurrentPage = useMemo(() => {
    return reportTemplate.filter(q => q.page === currentPage);
  }, [reportTemplate, currentPage]);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleFinish = () => {
    const today = new Date().toISOString().split('T')[0];
    let markdown = `# Звіт дня: ${new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    
    reportTemplate.sort((a, b) => a.page - b.page).forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        markdown += `#### ${q.text}\n> ${answer.replace(/\n/g, '\n> ')}\n\n`;
      }
    });

    saveDiaryEntry(today, markdown);
    onClose();
  };

  // Template Editor logic
  const handleAddQuestion = () => {
    const newId = `q_${Date.now()}`;
    setEditingQuestions([...editingQuestions, { id: newId, text: '', page: currentPage }]);
  };

  const handleUpdateQuestion = (id: string, text: string, page: number) => {
    setEditingQuestions(editingQuestions.map(q => q.id === id ? { ...q, text, page } : q));
  };

  const handleRemoveQuestion = (id: string) => {
    setEditingQuestions(editingQuestions.filter(q => q.id !== id));
  };

  const saveTemplateChanges = () => {
    updateReportTemplate(editingQuestions);
    setIsEditingTemplate(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 tiktok-blur">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <Card className="w-full max-w-2xl max-h-[90vh] bg-[var(--bg-card)] border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 rounded-[2.5rem]">
        
        {/* Progress Bar */}
        {!isEditingTemplate && (
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--bg-main)] z-20">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-500"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            ></div>
          </div>
        )}

        <header className="p-6 md:p-8 pb-4 flex justify-between items-start shrink-0 border-b border-slate-50 bg-[var(--bg-card)] z-10">
          <div>
            <Typography variant="tiny" className="text-[var(--primary)] mb-1 font-black">
              {isEditingTemplate ? 'Налаштування звіту' : `Крок ${currentPage} з ${totalPages}`}
            </Typography>
            <Typography variant="h2" className="text-xl md:text-2xl">
              {isEditingTemplate ? 'Редактор шаблону' : 'Як минув твій день?'}
            </Typography>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (isEditingTemplate) setEditingQuestions(reportTemplate);
                setIsEditingTemplate(!isEditingTemplate);
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isEditingTemplate ? 'bg-[var(--primary)] text-white shadow-lg' : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:bg-orange-50'}`}
              title="Редагувати питання"
            >
              <i className="fa-solid fa-gear text-sm"></i>
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-500 transition-all">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 pt-4">
          {isEditingTemplate ? (
            <div className="space-y-4 pb-4">
              <Typography variant="body" className="text-[var(--text-muted)] mb-4 italic text-xs">Налаштуйте структуру вашого щоденного огляду.</Typography>
              {editingQuestions.map((q) => (
                <div key={q.id} className="flex gap-3 items-start bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border-color)] group/q transition-all hover:border-[var(--primary)]/30">
                   <div className="flex flex-col items-center gap-1 shrink-0">
                      <input 
                        type="number" 
                        min="1" 
                        value={q.page} 
                        onChange={e => handleUpdateQuestion(q.id, q.text, parseInt(e.target.value) || 1)}
                        className="w-10 bg-white border border-[var(--border-color)] rounded-lg p-1 text-center text-[10px] font-black"
                      />
                      <span className="text-[7px] font-black text-slate-300 uppercase">Стор.</span>
                   </div>
                   <textarea 
                     value={q.text}
                     onChange={e => handleUpdateQuestion(q.id, e.target.value, q.page)}
                     placeholder="Ваше питання..."
                     className="flex-1 bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none resize-none min-h-[40px] leading-tight"
                   />
                   <button onClick={() => handleRemoveQuestion(q.id)} className="text-slate-200 hover:text-rose-500 transition-colors pt-1">
                      <i className="fa-solid fa-trash-can text-xs"></i>
                   </button>
                </div>
              ))}
              <button 
                onClick={handleAddQuestion}
                className="w-full py-4 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all bg-slate-50/50 hover:bg-white"
              >
                + Додати питання
              </button>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {questionsOnCurrentPage.map(q => (
                <div key={q.id} className="space-y-3">
                  <label className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest leading-relaxed block">
                    {q.text}
                  </label>
                  <textarea 
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Ваша відповідь..."
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[1.5rem] p-5 text-sm font-medium focus:ring-4 focus:ring-orange-100 transition-all outline-none min-h-[100px] md:min-h-[140px]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="p-6 md:p-8 border-t border-[var(--border-color)] bg-[var(--bg-main)]/30 flex justify-between items-center gap-4 shrink-0">
          {isEditingTemplate ? (
            <div className="flex gap-3 w-full">
              <Button variant="ghost" className="flex-1 py-3.5 rounded-2xl" onClick={() => setIsEditingTemplate(false)}>СКАСУВАТИ</Button>
              <Button variant="primary" className="flex-[2] py-3.5 rounded-2xl shadow-lg" onClick={saveTemplateChanges}>ЗБЕРЕГТИ ШАБЛОН</Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                 <Button 
                   variant="ghost" 
                   className="px-4 md:px-6 rounded-2xl text-[10px] font-black tracking-widest" 
                   onClick={handleBack}
                   disabled={currentPage === 1}
                 >
                   НАЗАД
                 </Button>
                 {Object.keys(answers).length > 0 && (
                   <button 
                     onClick={handleFinish}
                     className="px-4 md:px-6 py-2 rounded-2xl text-[9px] font-black uppercase text-emerald-600 hover:bg-emerald-50 transition-colors"
                   >
                     ЗБЕРЕГТИ ТА ВИЙТИ
                   </button>
                 )}
              </div>
              <Button 
                variant="primary" 
                className="flex-1 py-4 rounded-2xl shadow-xl shadow-orange-200 text-[10px] font-black tracking-widest uppercase" 
                onClick={handleNext}
              >
                {currentPage >= totalPages ? 'ЗАВЕРШИТИ' : 'ДАЛІ'}
              </Button>
            </>
          )}
        </footer>
      </Card>
    </div>
  );
};

export default DailyReportWizard;
