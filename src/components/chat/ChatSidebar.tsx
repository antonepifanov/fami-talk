'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, LogOut, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { CreateChatModal } from './CreateChatModal';
import { SearchModal } from './SearchModal';
import { Chat } from '@/types/chat';

interface ChatSidebarProps {
  chats: Chat[];
  userId: string;
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string | null;
  isMobile?: boolean;
  onChatsUpdate?: (chats: Chat[]) => void;
}

// Чистая функция для проверки онлайн-статуса
const isUserOnline = (user: Chat['participants'][0], now: Date) => {
  if (user.status !== 'ONLINE') return false;
  if (!user.lastSeen) return true;
  const lastSeen = new Date(user.lastSeen);
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  return lastSeen > twoMinutesAgo;
};

export function ChatSidebar({
  chats,
  userId,
  onSelectChat,
  selectedChatId,
  onChatsUpdate,
}: ChatSidebarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [localChats, setLocalChats] = useState<Chat[]>(chats);

  // Обновляем локальные чаты при изменении пропсов
  useEffect(() => {
    setLocalChats(chats);
  }, [chats]);

  // Обновляем текущее время каждые 30 секунд для пересчёта статусов
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const getOtherUserStatus = (chat: Chat) => {
    if (chat.isGroup) return null;
    const otherUser = chat.participants.find((p) => p.id !== userId);
    if (!otherUser) return null;
    return isUserOnline(otherUser, now);
  };

  const getUnreadCount = (chat: Chat) => {
    if (!session?.user?.id) return 0;
    return chat.messages.filter(
      (msg) => msg.senderId !== session.user.id && !msg.readBy?.includes(session.user.id)
    ).length;
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/user/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OFFLINE' }),
      });
    } catch (error) {
      console.error('Logout status error:', error);
    }
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleChatCreated = (chatId: string) => {
    onSelectChat(chatId);
    // Обновляем страницу, чтобы подгрузить новый чат
    window.location.reload();
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        'Вы уверены, что хотите удалить этот чат? Все сообщения будут удалены без возможности восстановления.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');

      // Обновляем список чатов
      const updatedChats = localChats.filter((chat) => chat.id !== chatId);
      setLocalChats(updatedChats);
      if (onChatsUpdate) onChatsUpdate(updatedChats);

      if (selectedChatId === chatId) {
        onSelectChat('');
      }
    } catch (error) {
      console.error('Delete chat error:', error);
      alert('Не удалось удалить чат');
    }
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
              <AvatarImage src={session?.user?.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
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
        {localChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Нет чатов</p>
            <p className="text-sm">Создайте новый чат</p>
          </div>
        ) : (
          localChats.map((chat) => {
            const isOnline = getOtherUserStatus(chat);
            const unreadCount = getUnreadCount(chat);
            return (
              <div
                key={chat.id}
                className={`group flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                  selectedChatId === chat.id
                    ? 'bg-blue-50 border-r-4 border-blue-600'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <Avatar>
                  <AvatarImage src={getChatAvatar(chat) ?? undefined} />
                  <AvatarFallback>{getChatName(chat)[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{getChatName(chat)}</div>
                    {!chat.isGroup && isOnline !== null && (
                      <div
                        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                      />
                    )}
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {chat.messages[0] && (
                    <div className="text-sm text-gray-500 truncate">{chat.messages[0].content}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно создания чата */}
      <CreateChatModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onChatCreated={handleChatCreated}
      />

      {/* Модальное окно поиска */}
      <SearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectChat={onSelectChat}
        userId={userId}
      />
    </div>
  );
}
