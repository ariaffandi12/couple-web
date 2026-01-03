
import { User, Message, Saving, GalleryPhoto } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const db = {
  // --- USERS / PROFILES ---
  getUsers: async (): Promise<User[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) return [];
    return data.map(p => ({
      uid: p.id,
      username: p.username,
      userId: `@${p.username}`,
      displayName: p.display_name,
      email: '', 
      password: '',
      photoUrl: p.photo_url || `https://picsum.photos/seed/${p.id}/200`,
      role: p.role,
      createdAt: new Date(p.created_at).getTime()
    }));
  },

  getProfile: async (uid: string): Promise<User | null> => {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle(); // Menggunakan maybeSingle agar tidak error jika tidak ada
    
    if (error || !data) return null;
    return {
      uid: data.id,
      username: data.username,
      userId: `@${data.username}`,
      displayName: data.display_name,
      email: '', 
      password: '',
      photoUrl: data.photo_url || `https://picsum.photos/seed/${data.id}/200`,
      role: data.role,
      createdAt: new Date(data.created_at).getTime()
    };
  },

  createProfile: async (uid: string, username: string, displayName: string): Promise<User | null> => {
    if (!isSupabaseConfigured) return null;
    
    // 1. Cek apakah username sudah dipakai oleh orang lain
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existing && existing.id !== uid) {
      throw new Error(`Username @${username} sudah digunakan oleh orang lain.`);
    }

    // 2. Hitung jumlah user untuk menentukan role (user pertama jadi admin)
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const role = (count || 0) === 0 ? 'admin' : 'user';

    const profileData = {
      id: uid,
      username: username.toLowerCase().replace(/\s/g, ''),
      display_name: displayName,
      role: role,
      photo_url: `https://picsum.photos/seed/${uid}/200`,
      created_at: new Date().toISOString()
    };

    // 3. Gunakan UPSERT untuk menangani kasus jika trigger database sudah membuat profile duluan
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error("Supabase Profile Upsert Error:", error);
      // Jika masih error FK, berarti email confirmation kemungkinan masih ON di Supabase
      if (error.code === '23503') {
        throw new Error("Gagal menyambungkan profil. Pastikan fitur 'Confirm Email' di Dashboard Supabase sudah dimatikan.");
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return {
      uid: data.id,
      username: data.username,
      userId: `@${data.username}`,
      displayName: data.display_name,
      email: '',
      password: '',
      photoUrl: data.photo_url,
      role: data.role as any,
      createdAt: new Date(data.created_at).getTime()
    };
  },

  // --- MESSAGES ---
  getMessages: async (): Promise<Message[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) return [];
    return data.map(m => ({
      messageId: m.id,
      chatId: m.chat_id,
      senderId: m.sender_id || 'aura-ai',
      text: m.text,
      timestamp: new Date(m.created_at).getTime(),
      isAi: m.is_ai,
      metadata: m.metadata
    }));
  },

  saveMessage: async (msg: Message): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('messages')
      .insert({
        id: msg.messageId,
        chat_id: msg.chatId,
        sender_id: msg.senderId === 'aura-ai' ? null : msg.senderId,
        text: msg.text,
        is_ai: msg.isAi || false,
        metadata: msg.metadata || {},
        created_at: new Date(msg.timestamp).toISOString()
      });
    if (error) console.error("Error saving message:", error);
  },

  // --- SAVINGS ---
  getSavings: async (): Promise<Saving[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('savings')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data.map(s => ({
      savingId: s.id,
      userId: s.user_id,
      userName: s.profiles?.display_name || 'Unknown',
      amount: parseFloat(s.amount),
      paymentMethod: s.payment_method,
      proofImage: s.proof_image_url,
      status: s.status,
      createdAt: new Date(s.created_at).getTime()
    }));
  },

  saveSaving: async (saving: Saving): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('savings')
      .insert({
        user_id: saving.userId,
        amount: saving.amount,
        payment_method: saving.paymentMethod,
        proof_image_url: saving.proofImage,
        status: saving.status,
        created_at: new Date(saving.createdAt).toISOString()
      });
    if (error) console.error("Error saving saving entry:", error);
  },

  // --- GALLERY ---
  getPhotos: async (): Promise<GalleryPhoto[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data.map(p => ({
      photoId: p.id,
      imageUrl: p.image_url,
      title: p.title,
      caption: p.caption,
      uploadedBy: p.uploaded_by,
      uploaderName: p.profiles?.display_name || 'Unknown',
      isPublic: p.is_public,
      createdAt: new Date(p.created_at).getTime()
    }));
  },

  savePhoto: async (photo: GalleryPhoto): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('gallery_photos')
      .insert({
        image_url: photo.imageUrl,
        title: photo.title,
        caption: photo.caption,
        uploaded_by: photo.uploadedBy,
        is_public: photo.isPublic,
        created_at: new Date(photo.createdAt).toISOString()
      });
    if (error) console.error("Error saving photo:", error);
  },

  deletePhoto: async (photoId: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', photoId);
    if (error) console.error("Error deleting photo:", error);
  }
};
