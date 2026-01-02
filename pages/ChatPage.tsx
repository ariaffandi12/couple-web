import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { User, Message } from '../types';
import { db } from '../services/databaseService';

interface Props {
  user: User;
  users: User[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatPage: React.FC<Props> = ({ user, users, messages, setMessages }) => {
  const { partnerId } = useParams();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const partner = useMemo(
    () => users.find(u => u.username === partnerId),
    [users, partnerId]
  );

  const chatId = useMemo(() => {
    if (!partner) return null;
    return [user.uid, partner.uid].sort().join('::');
  }, [user.uid, partner]);

  const chatMessages = useMemo(
    () => messages.filter(m => m.chatId === chatId),
    [messages, chatId]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!text.trim() || !chatId) return;

    const msg: Message = {
      messageId: crypto.randomUUID(),
      chatId,
      senderId: user.uid,
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, msg]);
    setText('');

    await db.saveMessage(msg);
  };

  if (!partner) {
    return <div className="p-10 text-slate-500">Pilih chat</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">{partner.displayName}</div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map(m => (
          <div
            key={m.messageId}
            className={`max-w-xs p-3 rounded-xl ${
              m.senderId === user.uid
                ? 'ml-auto bg-pink-500 text-white'
                : 'bg-slate-800 text-white'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-xl"
          placeholder="Ketik pesan..."
        />
        <button onClick={sendMessage} className="bg-pink-500 px-4 rounded-xl">
          Kirim
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
