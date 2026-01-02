import { User, Message, Saving, GalleryPhoto } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const db = {
  getAllUsers: async (): Promise<User[]> => {
    if (!isSupabaseConfigured) return [];
    const { data } = await supabase.from('profiles').select('*');
    return (
      data?.map(p => ({
        uid: p.id,
        username: p.username,
        userId: `@${p.username}`,
        displayName: p.display_name,
        email: '',
        password: '',
        photoUrl: p.photo_url,
        role: p.role,
        createdAt: Date.now()
      })) || []
    );
  },

  getUser: async (uid: string): Promise<User | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (!data) return null;

    return {
      uid: data.id,
      username: data.username,
      userId: `@${data.username}`,
      displayName: data.display_name,
      email: '',
      password: '',
      photoUrl: data.photo_url,
      role: data.role,
      createdAt: Date.now()
    };
  },

  getMessagesByUser: async (uid: string): Promise<Message[]> => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`chat_id.like.%${uid}%`)
      .order('created_at');

    return (
      data?.map(m => ({
        messageId: m.id,
        chatId: m.chat_id,
        senderId: m.sender_id || 'ai',
        text: m.text,
        timestamp: new Date(m.created_at).getTime(),
        isAi: m.is_ai,
        metadata: m.metadata
      })) || []
    );
  },

  saveMessage: async (m: Message) => {
    await supabase.from('messages').insert({
      id: m.messageId,
      chat_id: m.chatId,
      sender_id: m.senderId,
      text: m.text,
      created_at: new Date(m.timestamp).toISOString()
    });
  },

  getSavings: async (): Promise<Saving[]> => [],
  getPhotos: async (): Promise<GalleryPhoto[]> => []
};
