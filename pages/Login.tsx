
import React, { useState } from 'react';
import { supabase } from '../supabase';

interface LoginProps {
  onBack: () => void;
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const email = username.includes('@') ? username : `${username.toLowerCase().trim()}@admin.com`;
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ 
        email: email, 
        password 
      });
      
      if (authError) {
        setError(`FALHA: ${authError.message.toUpperCase()}`);
        setLoading(false);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError('FALHA NA COMUNICAÇÃO COM O SERVIDOR.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="mb-8 flex items-center text-slate-500 hover:text-white uppercase text-[10px] font-black tracking-widest transition-colors">
          <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          Voltar ao Catálogo
        </button>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg shadow-yellow-500/20">
              <span className="text-slate-950 font-black text-2xl italic">MR</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acesso Admin</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Usuário</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-sm outline-none text-white focus:ring-2 focus:ring-yellow-500 transition-all font-bold" 
                placeholder="Ex: admin" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
            </div>
            
            <div className="space-y-1 relative">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 pr-12 text-sm outline-none text-white focus:ring-2 focus:ring-yellow-500 transition-all font-bold" 
                  placeholder="********" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-yellow-500 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-slate-900"
                />
                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-300 transition-colors">Lembrar de mim</span>
              </label>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center animate-fadeIn">
                <p className="text-red-500 text-[9px] font-black uppercase">{error}</p>
              </div>
            )}

            <button disabled={loading} className="w-full bg-yellow-500 text-slate-950 font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-yellow-500/10">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
