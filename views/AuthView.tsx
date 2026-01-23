
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Typography from '../components/ui/Typography';
import Button from '../components/ui/Button';

const AuthView: React.FC = () => {
  const { login, loading } = useAuth();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      
      <div className="relative z-10 max-w-md w-full px-8 py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-orange-500 to-rose-500 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-xl shadow-orange-500/20 mb-8">
           <i className="fa-solid fa-bolt-lightning"></i>
        </div>
        
        <Typography variant="h1" className="text-white text-4xl mb-2 font-black tracking-tighter">12TR ENGINE</Typography>
        <Typography variant="tiny" className="text-orange-500 font-bold tracking-[0.3em] mb-8 uppercase">The Gamified Life OS</Typography>
        
        <div className="space-y-4 mb-10">
           <p className="text-slate-400 text-sm leading-relaxed">
             Ваш персональний стратегічний хаб. <br/> Увійдіть, щоб синхронізувати квести, цілі та прогрес героя між пристроями.
           </p>
        </div>

        <button 
          onClick={login}
          disabled={loading}
          className="w-full flex items-center justify-center gap-4 bg-white text-slate-900 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all shadow-xl"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          <span>Увійти через Google</span>
        </button>

        <div className="mt-8 flex gap-4 justify-center opacity-30">
           <i className="fa-solid fa-shield-halved text-white text-xs"></i>
           <i className="fa-solid fa-cloud-arrow-up text-white text-xs"></i>
           <i className="fa-solid fa-lock text-white text-xs"></i>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
