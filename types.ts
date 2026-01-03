
export type Role = 'admin' | 'user';
export type SavingStatus = 'pending' | 'accepted' | 'rejected';

export interface User {
  uid: string;
  username: string; // The handle string
  userId: string; // The full @handle
  displayName: string;
  email: string; // New field
  password: string; // New field
  photoUrl: string;
  role: Role;
  createdAt: number;
}

export interface Message {
  messageId: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
  metadata?: {
    type: 'nobar_invite' | 'image' | 'system';
    videoUrl?: string;
    videoType?: 'youtube' | 'local';
    status?: 'active' | 'ended';
    startTime?: number; // Timestamp when video started for sync
  };
}

export interface Chat {
  chatId: string;
  members: string[]; // max 2
  createdAt: number;
}

export interface Saving {
  savingId: string;
  userId: string;
  userName: string;
  amount: number;
  paymentMethod: 'QRIS' | 'DANA';
  proofImage: string;
  status: SavingStatus;
  createdAt: number;
}

export interface GalleryPhoto {
  photoId: string;
  imageUrl: string;
  title: string;
  caption: string;
  uploadedBy: string; // uid
  uploaderName: string;
  isPublic: boolean;
  createdAt: number;
}
