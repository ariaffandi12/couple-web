
import React, { useState } from 'react';
import { User, Saving } from '../types';
import { 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface SavingsPageProps {
  user: User;
  savings: Saving[];
  setSavings: React.Dispatch<React.SetStateAction<Saving[]>>;
}

const SavingsPage: React.FC<SavingsPageProps> = ({ user, savings, setSavings }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'QRIS' | 'DANA'>('QRIS');

  const totalBalance = savings
    .filter(s => s.status === 'accepted')
    .reduce((sum, s) => sum + s.amount, 0);

  const pendingAmount = savings
    .filter(s => s.status === 'pending')
    .reduce((sum, s) => sum + s.amount, 0);

  // Chart data calculation
  const getChartData = () => {
    const acceptedSavings = savings
      .filter(s => s.status === 'accepted')
      .sort((a, b) => a.createdAt - b.createdAt);
    
    let cumulative = 0;
    return acceptedSavings.map(s => {
      cumulative += s.amount;
      return {
        date: new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        amount: cumulative
      };
    });
  };

  const handleSubmitSaving = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const newSaving: Saving = {
      savingId: Date.now().toString(),
      userId: user.uid,
      userName: user.displayName,
      amount: val,
      paymentMethod: method,
      proofImage: 'https://picsum.photos/seed/proof/400/600',
      status: 'pending',
      createdAt: Date.now(),
    };

    setSavings(prev => [newSaving, ...prev]);
    setShowAddForm(false);
    setAmount('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Our Future</h1>
          <p className="text-slate-400">Saving together for our biggest dreams.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold px-6 py-3 rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span>Add Savings</span>
        </button>
      </header>

      {/* Hero Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
            <Wallet size={120} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2">Total Combined Balance</p>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Rp {totalBalance.toLocaleString()}</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock size={16} className="text-amber-500" />
                <span>Rp {pendingAmount.toLocaleString()} Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-center items-center text-center">
           <div className="w-16 h-16 bg-pink-500/20 rounded-3xl flex items-center justify-center text-pink-400 mb-4">
              <BarChart3 size={32} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Goal Progress</h3>
           <p className="text-slate-400 text-sm mb-6">Our goal: Rp 50,000,000</p>
           <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((totalBalance / 50000000) * 100, 100)}%` }}
              ></div>
           </div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {Math.round((totalBalance / 50000000) * 100)}% Reached
           </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass rounded-[2.5rem] p-8 border border-white/10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Growth Over Time <TrendingUp className="text-emerald-400" size={20} />
          </h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold text-slate-400 border border-white/5">Weekly</button>
            <button className="px-4 py-2 bg-pink-500/20 rounded-xl text-xs font-bold text-pink-400 border border-pink-500/20">Monthly</button>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getChartData()}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
           <h3 className="text-xl font-bold text-white">Saving History</h3>
           <button className="text-xs font-bold text-pink-400 hover:underline uppercase tracking-widest">View All</button>
        </div>
        <div className="divide-y divide-white/10">
          {savings.length === 0 ? (
            <p className="p-10 text-center text-slate-500">No savings activity yet.</p>
          ) : (
            savings.map((s) => (
              <div key={s.savingId} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${s.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : s.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {s.status === 'accepted' ? <ArrowUpRight size={24} /> : s.status === 'rejected' ? <XCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <p className="font-bold text-white">Rp {s.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {new Date(s.createdAt).toLocaleDateString()} • {s.userName} ({s.paymentMethod})
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  s.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  s.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {s.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Saving Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-lg glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">New Savings Entry</h2>
              <p className="text-slate-400 text-sm mb-8">Deposit funds to our shared goal.</p>
              
              <form onSubmit={handleSubmitSaving} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Amount (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setMethod('QRIS')}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${method === 'QRIS' ? 'bg-pink-500/20 border-pink-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                    >
                      <span className="font-bold">QRIS</span>
                      <span className="text-[10px] opacity-60">Scan Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('DANA')}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${method === 'DANA' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                    >
                      <span className="font-bold">DANA</span>
                      <span className="text-[10px] opacity-60">Direct Transfer</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-dashed border-white/20 rounded-2xl flex flex-col items-center gap-3">
                   <ImageIcon className="text-slate-500" size={32} />
                   <p className="text-xs text-slate-500 font-medium">Upload proof of payment</p>
                   <button type="button" className="text-xs font-bold text-pink-400 hover:text-pink-300">Browse Files</button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-all"
                  >
                    Submit Entry
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const TrendingUp = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export default SavingsPage;
