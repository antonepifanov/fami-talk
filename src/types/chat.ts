export interface Chat {
  id: string;
  name?: string | null;
  isGroup: boolean;
  participants: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    status: string;
    lastSeen?: string | null;
  }[];
  messages: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date | string;
    readBy?: string[];
  }[];
}
