
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Typography from '../components/ui/Typography';

const AuthView: React.FC = () => {
  const { login, continueAsGuest, loading, setIsAuthModalOpen } = useAuth();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 max-w-md w-full px-8 py-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl text-center flex flex-col items-center animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button 
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all group"
        >
          <i className="fa-solid fa-xmark text-sm group-hover:scale-125 transition-transform"></i>
        </button>

        <div className="w-24 h-24 bg-gradient-to-tr from-orange-500 to-rose-500 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-xl shadow-orange-500/20 mb-8">
           <i className="fa-solid fa-bolt-lightning"></i>
        </div>
        
        <Typography variant="h1" className="text-white text-4xl mb-2 font-black tracking-tighter">12TR ENGINE</Typography>
        <Typography variant="tiny" className="text-orange-500 font-bold tracking-[0.3em] mb-8 uppercase">Cloud Synchronization</Typography>
        
        <div className="space-y-4 mb-10 px-4">
           <p className="text-slate-400 text-sm leading-relaxed">
             Підключіть аккаунт Google, щоб ваші квести, прогрес та AI-аналітика були доступні на всіх ваших пристроях.
           </p>
        </div>

        <div className="w-full space-y-3 px-4">
          <button 
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white text-slate-900 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all shadow-xl"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch animate-spin"></i>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                <span>Увійти через Google</span>
              </>
            )}
          </button>

          <button 
            onClick={continueAsGuest}
            className="w-full py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Залишитись в офлайн режимі
          </button>
        </div>

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
