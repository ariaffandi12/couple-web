import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User, Message, Saving, GalleryPhoto } from '../types';

/* ===========================
   DATABASE SERVICE
=========================== */

export const db = {

  /* ===========================
     PROFILES
  =========================== */

  getUsers: async (): Promise<User[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error || !data) return [];

    return data.map(p => ({
      uid: p.id,
      username: p.username,
      userId: `@${p.username}`,
      displayName: p.display_name,
      email: '',
      password: '',
      photoUrl: p.photo_url,
      role: p.role,
      createdAt: new Date(p.created_at).getTime()
    }));
  },

  getProfile: async (uid: string): Promise<User | null> => {
    if (!isSupabaseConfigured) return null;

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
      createdAt: new Date(data.created_at).getTime()
    };
  },

  /* ===========================
     CHAT
  =========================== */

  getOrCreatePrivateChat: async (otherUserId: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return null;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;

    const chatId = [auth.user.id, otherUserId].sort().join('_');

    await supabase.from('chats').upsert({
      id: chatId,
      is_group: false
    });

    await supabase.from('chat_members').upsert([
      { chat_id: chatId, user_id: auth.user.id },
      { chat_id: chatId, user_id: otherUserId }
    ]);

    return chatId;
  },

  getChats: async () => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('chat_members')
      .select(`
        chat_id,
        chats (
          id,
          is_group,
          created_at
        )
      `);

    if (error || !data) return [];
    return data.map(c => c.chats);
  },

  /* ===========================
     MESSAGES
  =========================== */

  getMessagesByChat: async (chatId: string): Promise<Message[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map(m => ({
      messageId: m.id,
      chatId: m.chat_id,
      senderId: m.sender_id,
      text: m.text,
      timestamp: new Date(m.created_at).getTime(),
      isAi: m.is_ai,
      metadata: m.metadata
    }));
  },

  sendMessage: async (chatId: string, text: string): Promise<void> => {
    if (!isSupabaseConfigured) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: auth.user.id,
      text,
      is_ai: false,
      metadata: {}
    });

    if (error) console.error('Send message error:', error);
  },

  deleteMessageForMe: async (messageId: string) => {
    if (!isSupabaseConfigured) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    await supabase.from('messages')
      .update({ deleted_for: [auth.user.id] })
      .eq('id', messageId);
  },

  deleteMessageForEveryone: async (messageId: string) => {
    if (!isSupabaseConfigured) return;

    await supabase.from('messages')
      .update({
        text: 'Pesan ini telah dihapus',
        metadata: { deleted: true }
      })
      .eq('id', messageId);
  },

  /* ===========================
     SAVINGS
  =========================== */

  getSavings: async (): Promise<Saving[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('savings')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(s => ({
      savingId: s.id,
      userId: s.user_id,
      userName: s.profiles?.display_name || '',
      amount: Number(s.amount),
      paymentMethod: s.payment_method,
      proofImage: s.proof_image_url,
      status: s.status,
      createdAt: new Date(s.created_at).getTime()
    }));
  },

  saveSaving: async (saving: Saving): Promise<void> => {
    if (!isSupabaseConfigured) return;

    await supabase.from('savings').insert({
      user_id: saving.userId,
      amount: saving.amount,
      payment_method: saving.paymentMethod,
      proof_image_url: saving.proofImage,
      status: saving.status
    });
  },

  /* ===========================
     GALLERY
  =========================== */

  getPhotos: async (): Promise<GalleryPhoto[]> => {
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(p => ({
      photoId: p.id,
      imageUrl: p.image_url,
      title: p.title,
      caption: p.caption,
      uploadedBy: p.uploaded_by,
      uploaderName: p.profiles?.display_name || '',
      isPublic: p.is_public,
      createdAt: new Date(p.created_at).getTime()
    }));
  },

  savePhoto: async (photo: GalleryPhoto): Promise<void> => {
    if (!isSupabaseConfigured) return;

    await supabase.from('gallery_photos').insert({
      image_url: photo.imageUrl,
      title: photo.title,
      caption: photo.caption,
      uploaded_by: photo.uploadedBy,
      is_public: photo.isPublic
    });
  },

  deletePhoto: async (photoId: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    await supabase.from('gallery_photos').delete().eq('id', photoId);
  }
};
