
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
    <div className="space-y-6">
      <section className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Typography variant="tiny" className="text-orange-500 mb-2 block font-black uppercase tracking-[0.2em]">Оперативне Досьє</Typography>
              <p className="text-sm md:text-base font-bold text-slate-700 leading-relaxed italic">
                {person.description || "Контекст знайомства не зафіксовано."}
              </p>
            </div>
            <div className="text-right shrink-0">
               <div className="text-[28px] font-black leading-none text-orange-600">{person.rating || 0}</div>
               <div className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Карма</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[7px] font-black uppercase text-slate-400 block mb-1">Вік</span>
              <span className="text-xs font-black text-slate-700">{age ? `${age} років` : 'Не вказано'}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[7px] font-black uppercase text-slate-400 block mb-1">Тип зв'язку</span>
              <span className="text-xs font-black text-orange-600 uppercase tracking-widest">{person.status}</span>
            </div>
          </div>
        </div>
      </section>

      <Card padding="md" className="bg-slate-50/50 border-dashed border-slate-200">
        <div className="text-center py-4">
          <i className="fa-solid fa-circle-info text-slate-300 text-xl mb-2"></i>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Основні факти та інтерактивні питання перенесено у вкладку "ДЕТАЛІ" для системного аналізу.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default DossierTab;
