
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { 
  Home, 
  MessageSquare, 
  Wallet, 
  Image as ImageIcon, 
  Settings, 
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/savings', label: 'Savings', icon: Wallet },
    { path: '/gallery', label: 'Gallery', icon: ImageIcon },
  ];

  if (user.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: Settings });
  }

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0f172a] text-slate-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-white/10 p-6 fixed h-full z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center neon-pink">
            <span className="font-romantic text-2xl text-white">A</span>
          </div>
          <h1 className="text-2xl font-romantic font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            AuraCouple
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-400 border border-pink-500/30'
                  : 'hover:bg-white/5 text-slate-400'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-6">
            <img src={user.photoUrl} alt={user.displayName} className="w-10 h-10 rounded-full border border-pink-500/50" />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.userId}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 flex justify-around items-center h-16 px-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${
              location.pathname === item.path ? 'text-pink-400' : 'text-slate-500'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] mt-1 uppercase tracking-wider font-bold">{item.label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full text-slate-500"
        >
          <LogOut size={20} />
          <span className="text-[10px] mt-1 uppercase tracking-wider font-bold">Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
