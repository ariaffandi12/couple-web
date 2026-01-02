import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  /** ===============================
   * Background data (NON BLOCKING)
   =============================== */
  const loadBackgroundData = async () => {
    try {
      const [u, s, m, p] = await Promise.all([
        db.getUsers().catch(() => []),
        db.getSavings().catch(() => []),
        db.getMessages().catch(() => []),
        db.getPhotos().catch(() => [])
      ]);
      setUsers(u);
      setSavings(s);
      setMessages(m);
      setPhotos(p);
    } catch (err) {
      console.error('Background data error:', err);
    }
  };

  /** ===============================
   * INIT APP (AUTH ONLY)
   =============================== */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!isSupabaseConfigured) {
        setInitError('Konfigurasi Supabase tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        // ✅ SELESAI LOADING DI SINI (JANGAN NUNGGU PROFILE)
        if (mounted) setLoading(false);

        if (session?.user) {
          // Load profile ASYNC (NON BLOCKING)
          db.getProfile(session.user.id)
            .then(profile => {
              if (!mounted) return;
              if (profile) {
                setCurrentUser(profile);
                loadBackgroundData();
              } else {
                supabase.auth.signOut();
                setCurrentUser(null);
              }
            })
            .catch(err => {
              console.error('Profile error:', err);
              supabase.auth.signOut();
              setCurrentUser(null);
            });
        }

      } catch (err: any) {
        console.error('Init error:', err);
        setInitError(err.message || 'Gagal inisialisasi');
        setLoading(false);
      }
    };

    init();

    /** ===============================
     * AUTH STATE LISTENER
     =============================== */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth Event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          // JANGAN BLOCK UI
          db.getProfile(session.user.id)
            .then(profile => {
              if (mounted && profile) {
                setCurrentUser(profile);
                loadBackgroundData();
              }
            });
        }

        if (event === 'SIGNED_OUT') {
          if (!mounted) return;
          setCurrentUser(null);
          setUsers([]);
          setSavings([]);
          setMessages([]);
          setPhotos([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /** ===============================
   * REALTIME CHAT
   =============================== */
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const m = payload.new;
          setMessages(prev => {
            if (prev.some(x => x.messageId === m.id)) return prev;
            return [
              ...prev,
              {
                messageId: m.id,
                chatId: m.chat_id,
                senderId: m.sender_id || 'aura-ai',
                text: m.text,
                timestamp: new Date(m.created_at).getTime(),
                isAi: m.is_ai,
                metadata: m.metadata
              }
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const login = (user: User) => {
    setCurrentUser(user);
    loadBackgroundData();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  /** ===============================
   * SPLASH
   =============================== */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs tracking-widest uppercase">
          Menyiapkan Ruang Cinta...
        </p>
      </div>
    );
  }

  /** ===============================
   * ROUTER
   =============================== */
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            !currentUser
              ? <Login onLogin={login} onRegister={u => setUsers(p => [...p, u])} users={users} />
              : <Navigate to="/" />
          }
        />

        {currentUser ? (
          <Route element={<Layout user={currentUser} onLogout={logout} />}>
            <Route path="/" element={<Dashboard user={currentUser} users={users} savings={savings} />} />
            <Route path="/chat" element={<ChatPage user={currentUser} users={users} messages={messages} setMessages={setMessages} />} />
            <Route path="/chat/:partnerId" element={<ChatPage user={currentUser} users={users} messages={messages} setMessages={setMessages} />} />
            <Route path="/savings" element={<SavingsPage user={currentUser} savings={savings} setSavings={setSavings} />} />
            <Route path="/gallery" element={<GalleryPage user={currentUser} photos={photos} setPhotos={setPhotos} />} />
            {currentUser.role === 'admin' && (
              <Route path="/admin" element={
                <AdminPage
                  user={currentUser}
                  users={users}
                  setUsers={setUsers}
                  savings={savings}
                  setSavings={setSavings}
                  photos={photos}
                  setPhotos={setPhotos}
                  messages={messages}
                  setMessages={setMessages}
                />
              } />
            )}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>

      {initError && (
        <div className="fixed bottom-6 right-6 bg-red-500 text-white px-4 py-3 rounded-xl">
          {initError}
        </div>
      )}
    </Router>
  );
};

export default App;
