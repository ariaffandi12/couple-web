import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { User, Message } from './types';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import SavingsPage from './pages/SavingsPage';
import GalleryPage from './pages/GalleryPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';

import { db } from './services/databaseService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

import { Heart as HeartIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // ===============================
  // LOAD USER & AUTH
  // ===============================
  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.error('Supabase belum dikonfigurasi');
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await db.getUser(sessionUser.id);
      setUser(profile || null);
      setLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setUser(null);
          setMessages([]);
          return;
        }

        const profile = await db.getUser(session.user.id);
        setUser(profile || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ===============================
  // LOAD USERS & MESSAGES
  // ===============================
  const loadInitialData = useCallback(async () => {
    if (!user) return;

    const [allUsers, allMessages] = await Promise.all([
      db.getAllUsers(),
      db.getMessagesByUser(user.uid),
    ]);

    setUsers(allUsers);
    setMessages(allMessages);
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ===============================
  // LOADING SCREEN (ANTI STUCK)
  // ===============================
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0e1621] text-white">
        <HeartIcon size={64} className="text-pink-500 animate-pulse mb-4" />
        <p className="text-sm text-slate-400">
          Menemukan ruang cinta...
        </p>
      </div>
    );
  }

  // ===============================
  // ROUTING
  // ===============================
  return (
    <Router>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <Route
            path="/"
            element={<Layout user={user} />}
          >
            <Route index element={<Dashboard />} />
            <Route
              path="chat"
              element={
                <ChatPage
                  user={user}
                  users={users}
                  messages={messages}
                  setMessages={setMessages}
                />
              }
            />
            <Route
              path="chat/:partnerId"
              element={
                <ChatPage
                  user={user}
                  users={users}
                  messages={messages}
                  setMessages={setMessages}
                />
              }
            />
            <Route path="savings" element={<SavingsPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
};

export default App;
