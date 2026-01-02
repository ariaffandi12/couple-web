
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Message } from '../types';
import { 
  Send, 
  Sparkles, 
  Smile, 
  Image as ImageIcon, 
  Loader2, 
  ChevronLeft, 
  Heart as HeartIcon, 
  Search, 
  X, 
  CheckCheck,
  MoreVertical,
  Paperclip,
  ShieldCheck,
  UserPlus,
  Trash2,
  Tv,
  Play,
  Youtube,
  Upload,
  MonitorPlay,
  Volume2,
  UserCheck
} from 'lucide-react';
import { getAiResponse } from '../services/geminiService';
import { db } from '../services/databaseService';

interface ChatPageProps {
  user: User;
  users: User[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatPage: React.FC<ChatPageProps> = ({ user, users, messages, setMessages }) => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNobarModal, setShowNobarModal] = useState(false);
  const [activeNobar, setActiveNobar] = useState<{url: string, type: 'youtube' | 'local', startTime: number} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const CHAT_ID_SEPARATOR = '::';

  const partner = useMemo(() => users.find(u => u.username === partnerId), [users, partnerId]);
  
  const activeChatId = useMemo(() => {
    if (!partner) return null;
    return [user.uid, partner.uid].sort().join(CHAT_ID_SEPARATOR);
  }, [user.uid, partner]);

  const chatMessages = useMemo(() => 
    activeChatId ? messages.filter(m => m.chatId === activeChatId) : [], 
  [messages, activeChatId]);

  const sidebarData = useMemo(() => {
    const existingChatIds = new Set<string>();
    messages.forEach(m => {
      if (m.chatId.includes(user.uid)) existingChatIds.add(m.chatId);
    });

    const conversations = Array.from(existingChatIds).map(chatId => {
      const parts = chatId.split(CHAT_ID_SEPARATOR);
      const otherId = parts.find(id => id !== user.uid);
      const otherUser = users.find(u => u.uid === otherId);
      const lastMsg = messages
        .filter(m => m.chatId === chatId)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      return { partner: otherUser, lastMsg, chatId };
    }).filter(c => c.partner !== undefined) as { partner: User; lastMsg: Message; chatId: string }[];

    const filteredExisting = conversations.filter(c => 
      c.partner.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partner.userId.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.lastMsg.timestamp - a.lastMsg.timestamp);

    const existingPartnerUids = new Set(conversations.map(c => c.partner.uid));
    const globalResults = searchQuery.length > 0 
      ? users.filter(u => 
          u.uid !== user.uid && 
          !existingPartnerUids.has(u.uid) &&
          (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           u.userId.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : [];

    return { existing: filteredExisting, global: globalResults };
  }, [messages, users, user.uid, searchQuery]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, partnerId, activeNobar]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const currentInput = inputText;
    const userMessage: Message = {
      messageId: crypto.randomUUID(),
      chatId: activeChatId,
      senderId: user.uid,
      text: currentInput,
      timestamp: Date.now(),
    };

    // Optimistic Update: Tampilkan di UI dulu
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // PERBAIKAN: Simpan ke Database secara permanen
    try {
      await db.saveMessage(userMessage);
    } catch (err) {
      console.error("Gagal menyimpan pesan ke database:", err);
    }

    // Handle AI Response
    if (currentInput.toLowerCase().startsWith('@aura')) {
      setIsTyping(true);
      try {
        const aiResponseText = await getAiResponse(currentInput.slice(5).trim());
        const aiMessage: Message = {
          messageId: crypto.randomUUID(),
          chatId: activeChatId,
          senderId: 'aura-ai',
          text: aiResponseText,
          timestamp: Date.now(),
          isAi: true,
        };
        
        // Simpan pesan AI juga ke database agar riwayatnya permanen
        await db.saveMessage(aiMessage);
        setMessages(prev => [...prev, aiMessage]);
      } catch (aiErr) {
        console.error("AI Error:", aiErr);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleDeleteMessage = (id: string) => {
    if (window.confirm("Hapus pesan ini secara permanen?")) {
      // Dalam implementasi nyata, harusnya panggil API hapus di DB
      // Untuk sekarang kita filter di state dulu
      setMessages(prev => prev.filter(m => m.messageId !== id));
    }
  };

  const handleDeleteConversation = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Hapus seluruh riwayat chat dengan orang ini? (Hanya menghapus tampilan sesi ini)")) {
      setMessages(prev => prev.filter(m => m.chatId !== chatId));
      if (activeChatId === chatId) {
        navigate('/chat');
      }
    }
  };

  const startNobarSession = async (url: string, type: 'youtube' | 'local') => {
    if (!activeChatId) return;
    const startTime = Date.now();
    const nobarMsg: Message = {
      messageId: `nobar-${Date.now()}`,
      chatId: activeChatId,
      senderId: user.uid,
      text: `Let's watch a video together! 🍿`,
      timestamp: Date.now(),
      metadata: { type: 'nobar_invite', videoUrl: url, videoType: type, status: 'active', startTime: startTime }
    };
    
    await db.saveMessage(nobarMsg);
    setMessages(prev => [...prev, nobarMsg]);
    setActiveNobar({ url, type, startTime });
    setShowNobarModal(false);
  };

  const getYoutubeEmbedUrl = (url: string, startTime: number) => {
    try {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[7].length === 11) ? match[7] : null;
      if (videoId) {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&start=${elapsedSeconds}`;
      }
    } catch (e) {}
    return url;
  };

  return (
    <div className="h-[calc(100vh-100px)] flex glass rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
      <div className={`flex-col bg-[#17212b] border-r border-[#0e1621] z-20 ${partnerId ? 'hidden md:flex w-80 lg:w-96' : 'flex w-full'}`}>
        <div className="p-4 border-b border-[#0e1621]">
          <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Cari nama atau @AuraID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#242f3d] rounded-xl py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all border border-transparent focus:border-pink-500/20" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-[#17212b] rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sidebarData.existing.length > 0 && (
            <div className="py-2">
              {sidebarData.existing.map(({ partner: p, lastMsg, chatId }) => (
                <Link 
                  key={p.uid} 
                  to={`/chat/${p.username}`}
                  className={`flex items-center gap-3 p-4 transition-all hover:bg-[#232e3c] relative group ${partnerId === p.username ? 'bg-[#2b5278]' : ''}`}
                >
                  <img src={p.photoUrl} className="w-12 h-12 rounded-full border border-white/5" alt="" />
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{p.displayName}</h4>
                      <span className="text-[10px] text-slate-500">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{lastMsg.text}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteConversation(e, chatId)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-slate-500 hover:text-white hover:bg-red-500/80 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl bg-[#17212b] border border-white/5 z-20"
                  >
                    <Trash2 size={16} />
                  </button>
                </Link>
              ))}
            </div>
          )}

          {sidebarData.global.length > 0 && (
            <div className="py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5">Start New Chat</div>
              {sidebarData.global.map(u => (
                <Link 
                  key={u.uid} 
                  to={`/chat/${u.username}`}
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-3 p-4 hover:bg-[#232e3c] transition-all"
                >
                  <div className="relative">
                    <img src={u.photoUrl} className="w-12 h-12 rounded-full border border-pink-500/20" alt="" />
                    <div className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1 text-white border-2 border-[#17212b]">
                      <UserPlus size={10} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{u.displayName}</h4>
                    <p className="text-[10px] text-pink-400 font-bold">{u.userId}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-[#0e1621] z-10 ${!partnerId ? 'hidden md:flex' : 'flex'}`}>
        {!partnerId || !partner ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="w-24 h-24 bg-pink-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <HeartIcon size={48} className="text-pink-500" />
            </div>
            <h3 className="text-2xl font-romantic font-bold text-white">Select a Memory</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-2">Cari pasangan Anda atau mulai obrolan baru untuk menciptakan kenangan indah.</p>
          </div>
        ) : (
          <>
            <div className="h-16 px-4 border-b border-[#0e1621] bg-[#17212b] flex items-center justify-between z-10 shadow-lg">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/chat')} className="md:hidden text-slate-400"><ChevronLeft size={24}/></button>
                <img src={partner.photoUrl} className="w-10 h-10 rounded-full border border-pink-500/30 shadow-md" alt="" />
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{partner.displayName}</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter">Terhubung</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowNobarModal(true)}
                  className={`p-2.5 rounded-xl transition-all ${activeNobar ? 'bg-pink-500 text-white neon-pink shadow-pink-500/50' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                  <Tv size={20} />
                </button>
                <button className="p-2.5 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all"><MoreVertical size={20}/></button>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden relative">
              {activeNobar && (
                <div className="w-full bg-black border-b border-white/5 animate-in slide-in-from-top-4 duration-500 relative z-20 group">
                   <div className="aspect-video w-full max-h-[50vh] bg-slate-900 relative">
                      {activeNobar.type === 'youtube' ? (
                        <iframe 
                          key={`${activeNobar.url}-${activeNobar.startTime}`} 
                          src={getYoutubeEmbedUrl(activeNobar.url, activeNobar.startTime)}
                          className="w-full h-full border-none"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <video ref={videoRef} src={activeNobar.url} controls autoPlay className="w-full h-full object-contain" />
                      )}
                      <button onClick={() => setActiveNobar(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={16} /></button>
                   </div>
                </div>
              )}

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                {chatMessages.map((msg) => {
                  const isMe = msg.senderId === user.uid;
                  if (msg.metadata?.type === 'nobar_invite') {
                    return (
                      <div key={msg.messageId} className="flex justify-center my-4 animate-in zoom-in duration-300 relative group">
                        <div className="glass p-5 rounded-3xl border border-pink-500/30 max-w-xs w-full text-center shadow-2xl">
                           <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-500 mx-auto mb-4"><MonitorPlay size={32} /></div>
                           <h4 className="text-white font-bold mb-1">Movie Night Invite!</h4>
                           <p className="text-slate-400 text-xs mb-4">Click to join the synced session.</p>
                           <button onClick={() => setActiveNobar({url: msg.metadata!.videoUrl!, type: msg.metadata!.videoType!, startTime: msg.metadata!.startTime || Date.now() })} className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"><Play size={16} fill="white" /> Join Nobar</button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={msg.messageId} className={`flex group ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm transition-all relative ${isMe ? 'bg-pink-500 text-white rounded-tr-none' : 'bg-[#182533] text-slate-200 rounded-tl-none border border-white/5'}`}>
                          {msg.isAi && <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">Aura AI</p>}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-[9px] opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            {isMe && <CheckCheck size={10} className="text-pink-200" />}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteMessage(msg.messageId)} className={`p-1.5 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ${isMe ? 'mr-1' : 'ml-1'}`}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
                {isTyping && <div className="text-[10px] text-pink-500/80 font-bold animate-pulse px-2 italic">Aura is typing...</div>}
              </div>

              <div className="p-4 bg-[#17212b] border-t border-[#0e1621]">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                  <div className="flex-1 flex items-center bg-[#242f3d] rounded-2xl px-4 py-2 border border-white/5 shadow-inner">
                    <button type="button" className="text-slate-500 hover:text-white mr-2"><Smile size={20}/></button>
                    <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type a message or @aura..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white py-2" />
                    <button type="button" className="text-slate-500 hover:text-white ml-2"><Paperclip size={20}/></button>
                  </div>
                  <button type="submit" disabled={!inputText.trim()} className="p-3.5 bg-pink-500 text-white rounded-2xl shadow-lg hover:bg-pink-600 disabled:opacity-50 transition-all active:scale-95"><Send size={20} /></button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      {showNobarModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-md glass p-8 rounded-[2.5rem] border border-white/20 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Tv className="text-pink-500" /> Start Nobar</h2>
                <button onClick={() => setShowNobarModal(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Source: YouTube Link</label>
                   <div className="relative group">
                      <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 group-focus-within:scale-110 transition-transform" size={18} />
                      <input type="text" placeholder="Paste YouTube URL here..." onKeyDown={(e) => { if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value; if (val) startNobarSession(val, 'youtube'); } }} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-pink-500/50 outline-none transition-all" />
                   </div>
                </div>
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-slate-600"><span className="bg-slate-900 px-3">ATAU</span></div></div>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => startNobarSession('https://www.w3schools.com/html/mov_bbb.mp4', 'local')} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-pink-500/30 transition-all group"><ImageIcon className="text-pink-400" size={24} /><span className="text-xs font-bold text-slate-300">Galeri</span></button>
                   <button className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group"><Upload className="text-purple-400" size={24} /><span className="text-xs font-bold text-slate-300">Unggah File</span></button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
