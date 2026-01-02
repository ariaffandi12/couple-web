
import React, { useState } from 'react';
import { User } from '../types';
import { Heart, UserPlus, LogIn, ChevronRight, User as UserIcon, AtSign, AlertCircle, Mail, Lock, Eye, EyeOff, Sparkles, Wallet, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { db } from '../services/databaseService';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  users: User[];
}

type AuthStep = 'welcome' | 'auth';

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, users }) => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ displayName: '', username: '', email: '', password: '' });

  const validateEmail = (email: string) => {
    return email.toLowerCase().match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error("Email atau password salah.");
        }
        throw authError;
      }

      if (!data.user) throw new Error("Gagal mengambil data user.");

      const profile = await db.getProfile(data.user.id);
      if (!profile) throw new Error("Profil tidak ditemukan. Pastikan Anda sudah terdaftar dengan benar.");

      onLogin(profile);
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!registerData.displayName || !registerData.username || !registerData.email || !registerData.password) 
        throw new Error('Semua kolom harus diisi.');
      
      if (!validateEmail(registerData.email)) 
        throw new Error('Email tidak valid.');

      if (registerData.password.length < 6)
        throw new Error('Password minimal 6 karakter.');

      // 1. Buat akun di Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error("Gagal mendaftarkan user.");

      // Beri jeda sebentar (500ms) agar Supabase internal punya waktu commit data user
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Simpan detail profil ke tabel 'profiles'
      try {
        const profile = await db.createProfile(data.user.id, registerData.username, registerData.displayName);
        
        if (!profile) throw new Error("Gagal menyimpan profil.");

        setError("Pendaftaran berhasil! Mengalihkan...");
        
        setTimeout(() => {
          onRegister(profile);
          onLogin(profile);
        }, 1000);
      } catch (profileErr: any) {
        console.error("Profile creation error:", profileErr);
        throw profileErr;
      }
      
    } catch (err: any) {
      console.error("Register error:", err);
      // Bersihkan pesan error teknis agar lebih mudah dipahami user
      let friendlyError = err.message;
      if (friendlyError.includes('violates foreign key constraint')) {
        friendlyError = "Gagal menyambungkan profil. Hubungi Admin untuk mematikan 'Email Confirmation' di Supabase.";
      }
      setError(friendlyError || 'Pendaftaran gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-pink-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]"></div>

        <div className="max-w-4xl w-full z-10 text-center space-y-12">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-[2.5rem] shadow-2xl neon-pink mb-6 transform hover:rotate-6 transition-transform">
              <Heart fill="white" size={48} className="text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl font-romantic font-bold tracking-tight bg-gradient-to-r from-pink-400 via-white to-purple-400 bg-clip-text text-transparent">
              AuraCouple
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Ruang pribadi yang intim untuk Anda dan pasangan untuk saling terhubung, bertumbuh, dan menciptakan kenangan abadi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="glass p-8 rounded-[2rem] border border-white/10 hover:border-pink-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Cari Pasangan</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Cari ID Aura pasanganmu dan mulailah obrolan di ruang rahasia.</p>
            </div>
            <div className="glass p-8 rounded-[2rem] border border-white/10 hover:border-purple-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                <Wallet size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Tabungan Bersama</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Mulai menabung untuk masa depan indah bersama dengan sistem transparan.</p>
            </div>
            <div className="glass p-8 rounded-[2rem] border border-white/10 hover:border-indigo-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Privasi Terjamin</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Semua chat, foto, dan kenangan disimpan dengan aman di ruang pribadi kalian.</p>
            </div>
          </div>

          <div className="pt-8">
            <button 
              onClick={() => setStep('auth')}
              className="px-12 py-5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-[2rem] font-bold text-lg shadow-2xl hover:shadow-pink-500/40 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 mx-auto"
            >
              Mulai Sekarang <ChevronRight size={24} />
            </button>
            <p className="mt-6 text-slate-500 text-sm font-medium">Sudah punya akun? <button onClick={() => { setStep('auth'); setIsRegistering(false); }} className="text-pink-400 hover:text-pink-300 underline underline-offset-4">Masuk di sini</button></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a] overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:1s]"></div>

      <div className="w-full max-w-md glass p-8 rounded-[2.5rem] border border-white/10 z-10 shadow-2xl transition-all duration-500 relative">
        <button 
          onClick={() => setStep('welcome')}
          className="absolute top-8 left-8 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          &larr; Kembali
        </button>
        
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-3xl mb-6 neon-pink transform hover:rotate-12 transition-transform duration-500">
            <Heart className="text-white fill-white" size={40} />
          </div>
          <h1 className="text-4xl font-romantic font-bold text-white mb-2 tracking-tight">AuraCouple</h1>
          <p className="text-slate-400 text-sm">Masuk ke ruang pribadi cinta kalian.</p>
        </div>

        <div className="flex p-1 bg-white/5 rounded-2xl mb-8 border border-white/5">
          <button 
            disabled={isLoading}
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${!isRegistering ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button 
            disabled={isLoading}
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${isRegistering ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <UserPlus size={16} /> Register
          </button>
        </div>

        {error && (
          <div className={`mb-6 flex items-center gap-3 p-4 border rounded-2xl text-xs animate-in slide-in-from-top-2 ${error.includes('berhasil') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {!isRegistering ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  disabled={isLoading}
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-slate-700 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  disabled={isLoading}
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-slate-700 disabled:opacity-50"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-pink-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Masuk ke Ruang Pribadi"} <ChevronRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    disabled={isLoading}
                    required
                    type="text"
                    placeholder="Romeo"
                    value={registerData.displayName}
                    onChange={(e) => setRegisterData({...registerData, displayName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Aura ID (@)</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    disabled={isLoading}
                    required
                    type="text"
                    placeholder="romeo24"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({...registerData, username: e.target.value.replace(/\s/g, '').toLowerCase()})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  disabled={isLoading}
                  required
                  type="email"
                  placeholder="romeo@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  disabled={isLoading}
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 karakter"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all disabled:opacity-50"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-pink-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Mulai Perjalanan Cinta"} <ChevronRight size={18} />
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-[10px] text-slate-600 font-medium tracking-widest uppercase">
          <p>&copy; 2024 AuraCouple Space • Koneksi Aman Berenkripsi</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
