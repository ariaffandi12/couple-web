import React, { useEffect, useState, useCallback } from 'react';
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
import { Heart, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const loadAllData = useCallback(async (uid: string) => {
    const [u, m, s, p] = await Promise.all([
      db.getAllUsers(),
      db.getMessagesByUser(uid),
      db.getSavings(),
      db.getPhotos()
    ]);

    setUsers(u);
    setMessages(m);
    setSavings(s);
    setPhotos(p);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setInitError('Supabase belum dikonfigurasi');
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (session?.user) {
          const profile = await db.getUser(session.user.id);
          if (!profile) {
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          setCurrentUser(profile);
          await loadAllData(profile.uid);
        }
      } catch (e: any) {
        setInitError(e.message);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await db.getUser(session.user.id);
          if (profile) {
            setCurrentUser(profile);
            loadAllData(profile.uid);
          }
        } else {
          setCurrentUser(null);
          setUsers([]);
          setMessages([]);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [loadAllData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-pink-500 font-bold">Menghubungkan Hati...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!currentUser ? <Login /> : <Navigate to="/" />}
        />

        {currentUser ? (
          <Route element={<Layout user={currentUser} />}>
            <Route path="/" element={<Dashboard user={currentUser} users={users} />} />
            <Route
              path="/chat"
              element={
                <ChatPage
                  user={currentUser}
                  users={users}
                  messages={messages}
                  setMessages={setMessages}
                />
              }
            />
            <Route
              path="/chat/:partnerId"
              element={
                <ChatPage
                  user={currentUser}
                  users={users}
                  messages={messages}
                  setMessages={setMessages}
                />
              }
            />
            <Route path="/savings" element={<SavingsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            {currentUser.role === 'admin' && <Route path="/admin" element={<AdminPage />} />}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>

      {initError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-xl">
          <ShieldCheck /> {initError}
        </div>
      )}
    </Router>
  );
};

export default App;
