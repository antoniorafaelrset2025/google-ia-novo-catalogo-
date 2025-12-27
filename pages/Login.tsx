
import React, { useState } from 'react';
import { supabase } from '../supabase';

interface LoginProps {
  onBack: () => void;
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const logoUrl = "https://vytaqltyavifnddqrrfo.supabase.co/storage/v1/object/public/assets/logo_mr.jpg";

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
        setError(authError.message === "Invalid login credentials" ? "DADOS INVÁLIDOS" : authError.message.toUpperCase());
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError('ERRO DE CONEXÃO.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="mb-8 flex items-center text-slate-600 hover:text-yellow-500 uppercase text-[10px] font-black tracking-widest transition-colors group">
          <svg className="w-3 h-3 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          Sair
        </button>

        <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-500"></div>
          
          <div className="text-center mb-10">
            <div className="w-24 h-24 rounded-full border-2 border-yellow-500 overflow-hidden mx-auto mb-6 bg-slate-950 flex items-center justify-center">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Área Restrita</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Usuário</label>
              <input 
                type="text" 
                required 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-yellow-500 outline-none transition-all" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Senha</label>
              <input 
                type="password" 
                required 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-yellow-500 outline-none transition-all" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            {error && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                {error}
              </p>
            )}

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-yellow-500 text-slate-950 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              {loading ? 'Acessando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
