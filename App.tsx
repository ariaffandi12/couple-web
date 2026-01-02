
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, Saving, GalleryPhoto, Message } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import SavingsPage from './pages/SavingsPage';
import GalleryPage from './pages/GalleryPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';
import { db } from './services/databaseService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { Heart as HeartIcon, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Memoized load function to prevent unnecessary re-renders
  const loadBackgroundData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      console.log("AuraCouple: Menyinkronkan seluruh data...");
      const [usersData, savingsData, messagesData, photosData] = await Promise.all([
        db.getUsers().catch(() => []),
        db.getSavings().catch(() => []),
        db.getMessages().catch(() => []),
        db.getPhotos().catch(() => [])
      ]);

      setUsers(usersData);
      setSavings(savingsData);
      setMessages(messagesData);
      setPhotos(photosData);
      console.log(`AuraCouple: Berhasil memuat ${messagesData.length} riwayat pesan.`);
    } catch (err) {
      console.error("AuraCouple Sync Error:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (loading && mounted) {
        console.warn("AuraCouple: Menunggu database terlalu lama, paksa buka aplikasi.");
        setLoading(false);
      }
    }, 5000);

    const initApp = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setInitError("Konfigurasi database tidak valid.");
          setLoading(false);
        }
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          const profile = await db.getProfile(session.user.id);
          if (mounted) {
            if (profile) {
              setCurrentUser(profile);
              await loadBackgroundData();
            } else {
              console.warn("Sesi aktif tanpa profil, keluar otomatis.");
              await supabase.auth.signOut();
            }
          }
        }
      } catch (error: any) {
        console.error("App Init Error:", error);
        if (mounted) setInitError(error.message);
      } finally {
        if (mounted) {
          setLoading(true); // Biarkan tetap true jika profile baru mau dimuat
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Aura Auth Event: ${event}`);
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await db.getProfile(session.user.id);
        if (mounted && profile) {
          setCurrentUser(profile);
          loadBackgroundData();
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setCurrentUser(null);
          setUsers([]);
          setMessages([]);
          setSavings([]);
          setPhotos([]);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [loadBackgroundData]);

  // SYSTEM REALTIME: Inti dari pengiriman pesan antar pengguna
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;

    console.log(`AuraRealtime: Menghubungkan ke jalur pesan untuk ${currentUser.displayName}...`);

    // Gunakan nama channel unik per user untuk reliabilitas tinggi
    const channel = supabase
      .channel(`auracouple-chat-${currentUser.uid}`)
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        (payload) => {
          const m = payload.new;
          console.log("AuraRealtime: Ada data masuk!", m);

          // Cek apakah pesan ini milik percakapan user saat ini
          if (m.chat_id && m.chat_id.includes(currentUser.uid)) {
            const newMsg: Message = {
              messageId: m.id,
              chatId: m.chat_id,
              senderId: m.sender_id || 'aura-ai',
              text: m.text,
              timestamp: new Date(m.created_at).getTime(),
              isAi: m.is_ai,
              metadata: m.metadata
            };
            
            setMessages(prev => {
              // Hindari duplikasi jika pesan sudah ada (optimistic update)
              if (prev.some(x => x.messageId === newMsg.messageId)) return prev;
              console.log("AuraRealtime: Pesan baru diterima dan ditambahkan ke layar.");
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`AuraRealtime Status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log("AuraRealtime: SIAP menerima pesan dari pasangan!");
        }
        if (status === 'CHANNEL_ERROR') {
          console.error("AuraRealtime: Gagal berlangganan. Pastikan Realtime aktif di dashboard Supabase.");
        }
      });
    
    return () => { 
      console.log("AuraRealtime: Memutuskan jalur pesan.");
      supabase.removeChannel(channel); 
    };
  }, [currentUser]);

  const login = (user: User) => {
    setCurrentUser(user);
    loadBackgroundData();
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error", err);
      setCurrentUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-pink-500">
            <HeartIcon size={24} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-white font-romantic text-2xl mb-1">AuraCouple</p>
          <p className="text-slate-500 animate-pulse text-xs font-bold uppercase tracking-widest">Menghubungkan Hati...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="relative min-h-screen bg-[#0f172a]">
        <Routes>
          <Route 
            path="/login" 
            element={!currentUser ? <Login onLogin={login} onRegister={(u) => setUsers(prev => [...prev, u])} users={users} /> : <Navigate to="/" />} 
          />
          
          {currentUser ? (
            <Route element={<Layout user={currentUser} onLogout={logout} />}>
              <Route path="/" element={<Dashboard user={currentUser} users={users} savings={savings} />} />
              <Route path="/chat" element={<ChatPage user={currentUser} users={users} messages={messages} setMessages={setMessages} />} />
              <Route path="/chat/:partnerId" element={<ChatPage user={currentUser} users={users} messages={messages} setMessages={setMessages} />} />
              <Route path="/savings" element={<SavingsPage user={currentUser} savings={savings} setSavings={setSavings} />} />
              <Route path="/gallery" element={<GalleryPage user={currentUser} photos={photos} setPhotos={setPhotos} />} />
              {currentUser.role === 'admin' && (
                <Route path="/admin" element={<AdminPage 
                  user={currentUser} 
                  users={users}
                  setUsers={setUsers}
                  savings={savings} 
                  setSavings={setSavings} 
                  photos={photos} 
                  setPhotos={setPhotos}
                  messages={messages}
                  setMessages={setMessages}
                />} />
              )}
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>

        {initError && (
          <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] glass border-red-500/30 p-6 rounded-[2rem] shadow-2xl z-[9999]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white mb-1">Koneksi Bermasalah</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{initError}</p>
                <button onClick={() => window.location.reload()} className="text-[10px] font-bold text-white bg-red-500 px-4 py-2 rounded-xl">Coba Lagi</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
