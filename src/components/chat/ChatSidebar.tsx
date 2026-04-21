'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { CreateChatModal } from './CreateChatModal';

interface Chat {
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
}

interface ChatSidebarProps {
  chats: Chat[];
  userId: string;
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string | null;
  isMobile?: boolean;
}

export function ChatSidebar({ chats, userId, onSelectChat, selectedChatId }: ChatSidebarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  const getChatName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.isGroup) return 'Групповой чат';
    const otherUser = chat.participants.find((p) => p.id !== userId);
    return otherUser?.name || 'Неизвестный пользователь';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) return null;
    const otherUser = chat.participants.find((p) => p.id !== userId);
    return otherUser?.avatarUrl;
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleChatCreated = (chatId: string) => {
    onSelectChat(chatId);
    // Можно также обновить список чатов, но пока просто перезагрузим страницу
    window.location.reload();
  };

  return (
    <div className="h-full bg-gray-50 border-r flex flex-col">
      {/* Заголовок с аватаром пользователя */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-lg">Чаты</h2>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/profile')}
            className="relative h-9 w-9 rounded-full"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.avatarUrl || ''} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setModalOpen(true)}>
            <PlusCircle className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Нет чатов</p>
            <p className="text-sm">Создайте новый чат</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                selectedChatId === chat.id
                  ? 'bg-blue-50 border-r-4 border-blue-600'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <Avatar>
                <AvatarImage src={getChatAvatar(chat) || ''} />
                <AvatarFallback>{getChatName(chat)[0]?.toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{getChatName(chat)}</div>
                {chat.messages[0] && (
                  <div className="text-sm text-gray-500 truncate">{chat.messages[0].content}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно создания чата */}
      <CreateChatModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}
