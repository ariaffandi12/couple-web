
import React, { useState, useMemo } from 'react';
import { User, Saving, GalleryPhoto, Message, Role } from '../types';
import { 
  Shield, Check, X, Trash2, Users, Wallet, Image as ImageIcon, Search, 
  ChevronRight, Edit2, Key, UserPlus, Database, Activity, 
  ArrowUpRight, BarChart4, MessageSquare, AlertTriangle, Save, LogIn
} from 'lucide-react';

interface AdminPageProps {
  user: User;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  savings: Saving[];
  setSavings: React.Dispatch<React.SetStateAction<Saving[]>>;
  photos: GalleryPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<GalleryPhoto[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  user, users, setUsers, savings, setSavings, photos, setPhotos, messages, setMessages 
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'savings' | 'gallery'>('stats');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Stats Calculations
  const stats = useMemo(() => {
    const totalCapital = savings.filter(s => s.status === 'accepted').reduce((acc, s) => acc + s.amount, 0);
    const pendingAmount = savings.filter(s => s.status === 'pending').reduce((acc, s) => acc + s.amount, 0);
    return {
      totalUsers: users.length,
      totalMessages: messages.length,
      totalPhotos: photos.length,
      totalCapital,
      pendingAmount,
      pendingSavingsCount: savings.filter(s => s.status === 'pending').length,
    };
  }, [users, messages, photos, savings]);

  // Filtering
  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.userId.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Handlers
  const handleUpdateSavingStatus = (id: string, status: 'accepted' | 'rejected') => {
    setSavings(prev => prev.map(s => s.savingId === id ? { ...s, status } : s));
  };

  const handleDeleteUser = (uid: string) => {
    if (uid === user.uid) return alert("You cannot delete yourself.");
    if (window.confirm('CRITICAL ACTION: Permanently delete this user and all their associated data?')) {
      setUsers(prev => prev.filter(u => u.uid !== uid));
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.uid === editingUser.uid ? editingUser : u));
    setEditingUser(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg neon-pink">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Command Center</h1>
            <p className="text-slate-400 text-sm">Unrestricted access to the Aura Couple Ecosystem.</p>
          </div>
        </div>

        <nav className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          {[
            { id: 'stats', label: 'Overview', icon: BarChart4 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'savings', label: 'Finance', icon: Wallet },
            { id: 'gallery', label: 'Gallery', icon: ImageIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-pink-500 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.id === 'savings' && stats.pendingSavingsCount > 0 && (
                <span className="bg-white text-pink-500 px-1.5 rounded-full text-[10px] animate-pulse">
                  {stats.pendingSavingsCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Overview Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" />
            <StatCard title="System Capital" value={`Rp ${stats.totalCapital.toLocaleString()}`} icon={Wallet} color="emerald" />
            <StatCard title="Total Messages" value={stats.totalMessages} icon={MessageSquare} color="purple" />
            <StatCard title="Gallery Assets" value={stats.totalPhotos} icon={ImageIcon} color="pink" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* System Health / Storage */}
            <div className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/10 blur-3xl rounded-full transition-all group-hover:scale-150 duration-700"></div>
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Database className="text-pink-400" size={20} /> System Resources
               </h3>
               <div className="space-y-6">
                  <ResourceItem label="Database Usage" progress={45} color="bg-pink-500" />
                  <ResourceItem label="Cloud Storage" progress={22} color="bg-purple-500" />
                  <ResourceItem label="API Load" progress={12} color="bg-emerald-500" />
               </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-3xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="text-blue-400" size={20} /> Recent System Logs
              </h3>
              <div className="space-y-4">
                 <LogItem message="New user registration: @romeo" type="success" time="2 mins ago" />
                 <LogItem message="Saving proof uploaded by @maria" type="info" time="15 mins ago" />
                 <LogItem message="Admin login: @admin" type="warning" time="1 hour ago" />
                 <LogItem message="Mass gallery deletion by Admin" type="danger" time="3 hours ago" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, @ID, or email..." 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:ring-2 focus:ring-pink-500/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(u => (
              <div key={u.uid} className="glass rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all flex flex-col group relative">
                <div className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                  {u.role}
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img src={u.photoUrl} className="w-16 h-16 rounded-2xl border-2 border-white/10 shadow-lg object-cover" alt="" />
                  <div className="overflow-hidden">
                    <h4 className="text-lg font-bold text-white truncate">{u.displayName}</h4>
                    <p className="text-xs text-slate-500 font-medium truncate">{u.userId}</p>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">{u.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-auto">
                   <button 
                     onClick={() => setEditingUser(u)}
                     className="py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-all"
                   >
                     <Edit2 size={14} /> Edit Data
                   </button>
                   <button 
                     onClick={() => handleDeleteUser(u.uid)}
                     disabled={u.uid === user.uid}
                     className="py-2.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 rounded-xl text-xs font-bold text-red-500 flex items-center justify-center gap-2 transition-all"
                   >
                     <Trash2 size={14} /> Purge
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finance Tab */}
      {activeTab === 'savings' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-white">Financial Ledgers</h3>
                 <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Overview</span>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-900/50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                       <tr>
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Evidence</th>
                          <th className="px-6 py-4">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {savings.map(s => (
                          <tr key={s.savingId} className="hover:bg-white/5 transition-all text-sm group">
                             <td className="px-6 py-4 font-mono text-[10px] text-slate-600">#{s.savingId.slice(-8)}</td>
                             <td className="px-6 py-4">
                                <span className="font-bold text-slate-200">{s.userName}</span>
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-emerald-400 font-bold">Rp {s.amount.toLocaleString()}</span>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                  s.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' :
                                  s.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>
                                   {s.status}
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <img src={s.proofImage} className="w-8 h-8 rounded-lg object-cover cursor-pointer border border-white/10" alt="proof" />
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex gap-2">
                                   {s.status === 'pending' ? (
                                     <>
                                        <button onClick={() => handleUpdateSavingStatus(s.savingId, 'accepted')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><Check size={14}/></button>
                                        <button onClick={() => handleUpdateSavingStatus(s.savingId, 'rejected')} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><X size={14}/></button>
                                     </>
                                   ) : (
                                     <button onClick={() => setSavings(prev => prev.filter(x => x.savingId !== s.savingId))} className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                                   )}
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="space-y-6 animate-in fade-in">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map(p => (
                <div key={p.photoId} className="aspect-square relative group rounded-2xl overflow-hidden border border-white/10">
                   <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
                   <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-center">
                      <p className="text-[10px] font-bold text-white truncate w-full">{p.title}</p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest">{p.uploaderName}</p>
                      <button 
                        onClick={() => setPhotos(prev => prev.filter(x => x.photoId !== p.photoId))}
                        className="mt-2 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all"
                      >
                         <Trash2 size={14} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-xl glass p-8 rounded-[2.5rem] border border-white/20 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <UserPlus className="text-pink-500" /> Administrative Override
                 </h2>
                 <button onClick={() => setEditingUser(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Display Name</label>
                       <input 
                         type="text" 
                         value={editingUser.displayName}
                         onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white focus:ring-2 focus:ring-pink-500/50 outline-none"
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">User Handle (@)</label>
                       <input 
                         type="text" 
                         value={editingUser.username}
                         onChange={(e) => setEditingUser({...editingUser, username: e.target.value, userId: `@${e.target.value}`})}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white focus:ring-2 focus:ring-pink-500/50 outline-none"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Email Access</label>
                       <input 
                         type="email" 
                         value={editingUser.email}
                         onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white focus:ring-2 focus:ring-pink-500/50 outline-none"
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Override Password</label>
                       <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                            type="text" 
                            value={editingUser.password}
                            onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-5 text-white focus:ring-2 focus:ring-pink-500/50 outline-none"
                          />
                       </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Access Level (Role)</label>
                    <div className="flex gap-4">
                       <button 
                         type="button"
                         onClick={() => setEditingUser({...editingUser, role: 'user'})}
                         className={`flex-1 py-3 rounded-2xl border font-bold text-sm transition-all ${editingUser.role === 'user' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                       >
                         User (Standard)
                       </button>
                       <button 
                         type="button"
                         onClick={() => setEditingUser({...editingUser, role: 'admin'})}
                         className={`flex-1 py-3 rounded-2xl border font-bold text-sm transition-all ${editingUser.role === 'admin' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                       >
                         Admin (Root)
                       </button>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-all"
                    >
                      Discard Changes
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-gradient-to-tr from-pink-500 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-pink-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> Apply Override
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

// UI Components
const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colors: any = {
    blue: 'text-blue-400 bg-blue-500/20 border-l-blue-500',
    emerald: 'text-emerald-400 bg-emerald-500/20 border-l-emerald-500',
    purple: 'text-purple-400 bg-purple-500/20 border-l-purple-500',
    pink: 'text-pink-400 bg-pink-500/20 border-l-pink-500',
  };
  return (
    <div className={`glass p-6 rounded-3xl border border-white/10 border-l-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <Icon size={24} />
        <ArrowUpRight size={16} className="opacity-40" />
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
    </div>
  );
};

const ResourceItem = ({ label, progress, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-xs font-bold">
      <span className="text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-white">{progress}%</span>
    </div>
    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
      <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

const LogItem = ({ message, type, time }: any) => {
  const colors: any = {
    success: 'text-emerald-500 bg-emerald-500/10',
    info: 'text-blue-500 bg-blue-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    danger: 'text-red-500 bg-red-500/10',
  };
  return (
    <div className="flex items-start justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
       <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${colors[type].split(' ')[0]}`}></div>
          <p className="text-xs text-slate-300 font-medium">{message}</p>
       </div>
       <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap ml-4">{time}</span>
    </div>
  );
};

export default AdminPage;
