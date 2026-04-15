export interface Chat {
  id: string;
  name?: string | null;
  isGroup: boolean;
  participants: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    status: string;
  }[];
  messages: {
    id: string;
    content: string;
    createdAt: Date | string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}
