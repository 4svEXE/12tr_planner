import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Typography from '../components/ui/Typography';

type AuthMode = 'login' | 'register' | 'reset';

const AuthView: React.FC = () => {
  const { login, loginWithEmail, registerWithEmail, sendResetEmail, continueAsGuest, loading, setIsAuthModalOpen } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Паролі не збігаються');
          return;
        }
        if (password.length < 6) {
          setError('Пароль має бути не менше 6 символів');
          return;
        }
        await registerWithEmail(email, password);
      } else if (mode === 'reset') {
        await sendResetEmail(email);
        setSuccess('Інструкції надіслано на вашу пошту');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('user-not-found')) setError('Користувача не знайдено');
      else if (msg.includes('wrong-password')) setError('Невірний пароль');
      else if (msg.includes('email-already-in-use')) setError('Цей email вже використовується');
      else if (msg.includes('invalid-email')) setError('Некоректний email');
      else setError('Помилка автентифікації. Спробуйте ще раз.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (err) {
      setError('Не вдалося увійти через Google');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 backdrop-blur-2xl animate-in fade-in duration-500 p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="relative z-10 max-w-md w-full px-6 py-10 md:px-10 md:py-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_32px_120px_rgba(0,0,0,0.6)] text-center flex flex-col items-center animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all group"
        >
          <i className="fa-solid fa-xmark text-sm group-hover:scale-125 transition-transform"></i>
        </button>

        {/* Branding */}
        <div className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-rose-600 rounded-[1.8rem] flex items-center justify-center text-white text-4xl shadow-2xl shadow-orange-500/30 mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
           <i className="fa-solid fa-bolt-lightning"></i>
        </div>
        
        <Typography variant="h1" className="text-white text-3xl mb-1 font-black tracking-tighter">12TR ENGINE</Typography>
        <Typography variant="tiny" className="text-orange-400 font-bold tracking-[0.3em] mb-8 uppercase opacity-80">
          {mode === 'login' ? 'Вхід до системи' : mode === 'register' ? 'Новий Гравець' : 'Відновлення доступу'}
        </Typography>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 mb-6 animate-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </p>
          </div>
        )}
        {success && (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 mb-6 animate-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <i className="fa-solid fa-circle-check"></i> {success}
            </p>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 mb-8">
          <div className="space-y-1.5 text-left">
            <label className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Email адреса</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs"></i>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="pilot@12tr.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white text-sm font-bold outline-none focus:bg-white/10 focus:border-orange-500/50 transition-all shadow-inner"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div className="space-y-1.5 text-left animate-in slide-in-from-bottom-2">
              <label className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Пароль</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs"></i>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white text-sm font-bold outline-none focus:bg-white/10 focus:border-orange-500/50 transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5 text-left animate-in slide-in-from-bottom-2">
              <label className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Підтвердіть пароль</label>
              <div className="relative">
                <i className="fa-solid fa-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-xs"></i>
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white text-sm font-bold outline-none focus:bg-white/10 focus:border-orange-500/50 transition-all shadow-inner"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end px-2">
              <button 
                type="button"
                onClick={() => setMode('reset')}
                className="text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
              >
                Забули пароль?
              </button>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-orange-500 active:scale-95 transition-all shadow-xl shadow-orange-900/20 disabled:opacity-50 group overflow-hidden relative"
          >
            {loading ? (
              <i className="fa-solid fa-circle-notch animate-spin"></i>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-3">
                {mode === 'login' ? 'Увійти' : mode === 'register' ? 'Створити акаунт' : 'Надіслати лінк'}
                <i className="fa-solid fa-arrow-right-long group-hover:translate-x-1 transition-transform"></i>
              </span>
            )}
          </button>
        </form>

        {/* Auth Mode Toggle */}
        <div className="w-full space-y-6">
          <div className="flex items-center gap-4 text-white/10">
            <div className="h-px flex-1 bg-current"></div>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">АБО</span>
            <div className="h-px flex-1 bg-current"></div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-4 bg-white text-slate-900 py-4 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all shadow-lg group"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
              Вхід з Google
            </button>

            {mode === 'login' ? (
              <button 
                onClick={() => { setMode('register'); setError(null); }}
                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all"
              >
                Немає акаунту? <span className="text-orange-500">Реєстрація</span>
              </button>
            ) : (
              <button 
                onClick={() => { setMode('login'); setError(null); }}
                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all"
              >
                Вже є акаунт? <span className="text-orange-500">Увійти</span>
              </button>
            )}

            <button 
              onClick={continueAsGuest}
              className="w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/5 transition-all border border-white/5"
            >
              Автономний режим (Офлайн)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;