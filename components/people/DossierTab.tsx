
import React, { useMemo } from 'react';
import { Person, Interaction } from '../../types';
import Typography from '../ui/Typography';
import Card from '../ui/Card';

interface DossierTabProps {
  person: Person;
  onUpdate: (p: Person) => void;
  onAddInteraction: (summary: string, ratingImpact: number, type: Interaction['type']) => void;
}

const DossierTab: React.FC<DossierTabProps> = ({ person, onUpdate }) => {
  const age = useMemo(() => {
    if (!person.birthDate) return null;
    const birthDate = new Date(person.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }, [person.birthDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Typography variant="tiny" className="text-[var(--primary)] mb-2 block font-black uppercase tracking-[0.2em]">Оперативне Досьє</Typography>
              <p className="text-sm md:text-base font-bold text-[var(--text-main)] leading-relaxed italic opacity-80">
                {person.description || "Контекст знайомства не зафіксовано."}
              </p>
            </div>
            <div className="text-right shrink-0">
               <div className="text-[28px] font-black leading-none text-[var(--primary)]">{person.rating || 0}</div>
               <div className="text-[8px] font-black uppercase text-[var(--text-muted)] tracking-widest">Карма</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
              <span className="text-[7px] font-black uppercase text-[var(--text-muted)] block mb-1 tracking-widest">Вік</span>
              <span className="text-xs font-black text-[var(--text-main)]">{age ? `${age} років` : 'Не вказано'}</span>
            </div>
            <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
              <span className="text-[7px] font-black uppercase text-[var(--text-muted)] block mb-1 tracking-widest">Тип зв'язку</span>
              <span className="text-xs font-black text-[var(--primary)] uppercase tracking-widest">{person.status}</span>
            </div>
          </div>
        </div>
      </section>

      <Card padding="md" className="bg-[var(--bg-main)]/50 border-dashed border-[var(--border-color)]">
        <div className="text-center py-4">
          <i className="fa-solid fa-circle-info text-[var(--text-muted)] opacity-30 text-xl mb-2"></i>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
            Основні факти та інтерактивні питання перенесено у вкладку "ДЕТАЛІ" для системного аналізу.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default DossierTab;
