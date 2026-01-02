
import React, { useState } from 'react';
import { User, Saving } from '../types';
import { Search, Heart, Wallet, Image as ImageIcon, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
  users: User[];
  savings: Saving[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, users, savings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const filteredUsers = users.filter(u => 
    u.uid !== user.uid && (
      u.userId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalSavings = savings
    .filter(s => s.status === 'accepted')
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Hello, {user.displayName} <span className="animate-pulse">✨</span></h1>
          <p className="text-slate-400 mt-1">Ready for some romantic moments today?</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search @username to chat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
          />
          {searchTerm && (
            <div className="absolute top-full mt-2 w-full glass rounded-2xl p-2 z-10 border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {filteredUsers.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {filteredUsers.map(u => (
                    <Link 
                      key={u.uid} 
                      to={`/chat/${u.username}`} 
                      className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/5"
                    >
                      <img src={u.photoUrl} alt={u.displayName} className="w-10 h-10 rounded-full border border-pink-500/20" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{u.displayName}</p>
                        <p className="text-xs text-slate-500">{u.userId}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-700" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-center text-xs text-slate-500">No users found with "{searchTerm}"</p>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border-l-4 border-l-pink-500 relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-pink-500/10 blur-2xl rounded-full group-hover:scale-150 transition-all duration-700"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-pink-500/20 rounded-2xl text-pink-400">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-bold text-slate-300">Total Savings</h3>
          </div>
          <p className="text-3xl font-bold text-white">Rp {totalSavings.toLocaleString()}</p>
          <Link to="/savings" className="mt-4 text-xs font-bold text-pink-400 hover:text-pink-300 uppercase tracking-widest flex items-center gap-1">
            Manage Savings <TrendingUp size={12} />
          </Link>
        </div>

        <div className="glass p-6 rounded-3xl border-l-4 border-l-purple-500 relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-purple-500/10 blur-2xl rounded-full group-hover:scale-150 transition-all duration-700"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-slate-300">Discovery</h3>
          </div>
          <p className="text-3xl font-bold text-white">Find Love</p>
          <div className="mt-4 text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
            Search IDs above <Sparkles size={12} />
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border-l-4 border-l-blue-500 relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-blue-500/10 blur-2xl rounded-full group-hover:scale-150 transition-all duration-700"></div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
              <ImageIcon size={24} />
            </div>
            <h3 className="font-bold text-slate-300">Gallery</h3>
          </div>
          <p className="text-3xl font-bold text-white">Shared Space</p>
          <Link to="/gallery" className="mt-4 text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1">
            View Gallery <ImageIcon size={12} />
          </Link>
        </div>
      </div>

      {/* Featured Card */}
      <div className="relative group overflow-hidden rounded-[2.5rem] shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1516589174184-c685266e430c?auto=format&fit=crop&w=1200&q=80" 
          alt="Couple cover" 
          className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-1000 brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent"></div>
        <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="bg-pink-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Daily Insight</span>
            <h2 className="text-4xl font-romantic font-bold text-white mb-4 leading-tight">"Love is not about finding the perfect person, but by learning to see an imperfect person perfectly."</h2>
          </div>
          <button 
            onClick={() => navigate('/chat')}
            className="bg-white text-slate-950 font-bold px-8 py-4 rounded-2xl hover:bg-pink-100 transition-all transform active:scale-95 shadow-xl whitespace-nowrap"
          >
            Start Conversation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
