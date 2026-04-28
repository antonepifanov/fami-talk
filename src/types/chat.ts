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

export interface Sender {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string | Date;
  readBy?: string[];
  sender: Sender;
}

export interface Participant {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  status: string;
  lastSeen?: string | null;
}
