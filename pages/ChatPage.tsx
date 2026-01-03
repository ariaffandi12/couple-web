import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { User, Message } from "../types";
import { supabase } from "../services/supabase";
import { getAiResponse } from "../services/geminiService";
import {
  Send,
  Smile,
  Image as ImageIcon,
  ChevronLeft,
  Heart as HeartIcon,
  Search,
  X,
  CheckCheck,
  MoreVertical,
  Paperclip,
  Trash2,
  Tv,
  Play,
  Youtube,
  Upload,
  MonitorPlay
} from "lucide-react";

interface ChatPageProps {
  user: User;
  users: User[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const CHAT_ID_SEPARATOR = "::";

const ChatPage: React.FC<ChatPageProps> = ({ user, users, messages, setMessages }) => {
  const { partnerId } = useParams();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNobarModal, setShowNobarModal] = useState(false);
  const [activeNobar, setActiveNobar] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const partner = useMemo(
    () => users.find(u => u.username === partnerId),
    [users, partnerId]
  );

  const activeChatId = useMemo(() => {
    if (!partner) return null;
    return [user.uid, partner.uid].sort().join(CHAT_ID_SEPARATOR);
  }, [user.uid, partner]);

  const chatMessages = useMemo(
    () => (activeChatId ? messages.filter(m => m.chatId === activeChatId) : []),
    [messages, activeChatId]
  );

  /* =======================
     LOAD CHAT (OFFLINE)
  ======================= */
  useEffect(() => {
    if (!activeChatId) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", activeChatId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(
          data.map(m => ({
            messageId: m.id,
            chatId: m.chat_id,
            senderId: m.sender_id,
            text: m.text,
            timestamp: new Date(m.created_at).getTime(),
            metadata: m.metadata
          }))
        );
      }
    };

    loadMessages();
  }, [activeChatId]);

  /* =======================
     REALTIME LISTENER
  ======================= */
  useEffect(() => {
    if (!activeChatId) return;

    const channel = supabase
      .channel(`chat-${activeChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${activeChatId}`
        },
        payload => {
          const m = payload.new;
          setMessages(prev => [
            ...prev,
            {
              messageId: m.id,
              chatId: m.chat_id,
              senderId: m.sender_id,
              text: m.text,
              timestamp: new Date(m.created_at).getTime(),
              metadata: m.metadata
            }
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatId]);

  /* =======================
     AUTO SCROLL
  ======================= */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [chatMessages, activeNobar, isTyping]);

  /* =======================
     SEND MESSAGE
  ======================= */
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const text = inputText;
    setInputText("");

    await supabase.from("messages").insert({
      chat_id: activeChatId,
      sender_id: user.uid,
      text,
      metadata: null
    });

    if (text.toLowerCase().startsWith("@aura")) {
      setIsTyping(true);
      const aiText = await getAiResponse(text.slice(5).trim());

      await supabase.from("messages").insert({
        chat_id: activeChatId,
        sender_id: "aura-ai",
        text: aiText,
        metadata: { isAi: true }
      });

      setIsTyping(false);
    }
  };

  /* =======================
     NOBAR
  ======================= */
  const startNobarSession = async (url: string, type: "youtube" | "local") => {
    if (!activeChatId) return;
    const startTime = Date.now();

    await supabase.from("messages").insert({
      chat_id: activeChatId,
      sender_id: user.uid,
      text: "Let's watch together 🍿",
      metadata: {
        type: "nobar_invite",
        videoUrl: url,
        videoType: type,
        startTime
      }
    });

    setActiveNobar({ url, type, startTime });
    setShowNobarModal(false);
  };

  const getYoutubeEmbedUrl = (url: string, startTime: number) => {
    const id = url.split("v=")[1]?.substring(0, 11);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&start=${elapsed}`;
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="h-full flex">
      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#0e1621]">
        {!partner ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40">
            <HeartIcon size={64} />
            <p className="mt-4">Pilih pasangan untuk mulai chat</p>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="h-16 flex items-center justify-between px-4 bg-[#17212b]">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("/chat")} className="md:hidden">
                  <ChevronLeft />
                </button>
                <img src={partner.photoUrl} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-white font-bold">{partner.displayName}</p>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
              <button onClick={() => setShowNobarModal(true)}>
                <Tv />
              </button>
            </div>

            {/* CHAT BODY */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map(msg => {
                const isMe = msg.senderId === user.uid;

                if (msg.metadata?.type === "nobar_invite") {
                  return (
                    <div key={msg.messageId} className="text-center">
                      <button
                        onClick={() =>
                          setActiveNobar({
                            url: msg.metadata.videoUrl,
                            type: msg.metadata.videoType,
                            startTime: msg.metadata.startTime
                          })
                        }
                        className="bg-pink-500 text-white px-4 py-2 rounded-xl"
                      >
                        🎬 Join Nobar
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={msg.messageId} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`px-4 py-2 rounded-xl max-w-xs ${isMe ? "bg-pink-500 text-white" : "bg-[#182533] text-white"}`}>
                      {msg.metadata?.isAi && (
                        <p className="text-xs text-pink-200">Aura AI</p>
                      )}
                      <p>{msg.text}</p>
                      <div className="text-[10px] opacity-50 flex justify-end gap-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                        {isMe && <CheckCheck size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && <p className="text-xs text-pink-400">Aura is typing...</p>}
            </div>

            {/* INPUT */}
            <form onSubmit={handleSendMessage} className="p-4 flex gap-2 bg-[#17212b]">
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type message..."
                className="flex-1 bg-[#242f3d] rounded-xl px-4 text-white"
              />
              <button className="bg-pink-500 p-3 rounded-xl text-white">
                <Send />
              </button>
            </form>
          </>
        )}
      </div>

      {/* NOBAR PLAYER */}
      {activeNobar && (
        <div className="fixed inset-0 bg-black z-50">
          {activeNobar.type === "youtube" ? (
            <iframe
              src={getYoutubeEmbedUrl(activeNobar.url, activeNobar.startTime)}
              className="w-full h-full"
              allow="autoplay"
            />
          ) : (
            <video ref={videoRef} src={activeNobar.url} controls autoPlay className="w-full h-full" />
          )}
          <button onClick={() => setActiveNobar(null)} className="absolute top-4 right-4 text-white">
            <X />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
