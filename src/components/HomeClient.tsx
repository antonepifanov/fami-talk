'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { Chat } from '@/types/chat';
import { useNotifications } from '@/hooks/useNotifications';

interface HomeClientProps {
  initialChats: Chat[];
  userId: string;
}

export function HomeClient({ initialChats, userId }: HomeClientProps) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCounts = useRef<Record<string, number>>({});
  const { showNotification } = useNotifications();

  // Инициализируем счётчики сообщений при монтировании и при изменении chats
  useEffect(() => {
    const counts: Record<string, number> = {};
    chats.forEach((chat) => {
      counts[chat.id] = chat.messages.length;
    });
    lastMessageCounts.current = counts;
  }, [chats]); // ← теперь chats не вызывает бесконечный цикл

  const refreshChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chats');
      if (!response.ok) throw new Error('Ошибка загрузки');
      const freshChats: Chat[] = await response.json();

      // Проверяем новые сообщения
      freshChats.forEach((chat) => {
        const oldCount = lastMessageCounts.current[chat.id] || 0;
        const newCount = chat.messages.length;

        if (newCount > oldCount && selectedChatId !== chat.id) {
          const lastMessage = chat.messages[chat.messages.length - 1];
          const isOwn = lastMessage?.senderId === userId;

          if (lastMessage && !isOwn) {
            const chatName =
              chat.name || chat.participants.find((p) => p.id !== userId)?.name || 'Чат';

            showNotification(
              `Новое сообщение от ${chatName}`,
              lastMessage.content.length > 50
                ? lastMessage.content.slice(0, 50) + '...'
                : lastMessage.content,
              () => {
                setSelectedChatId(chat.id);
                if (isMobile) setIsSidebarOpen(false);
              }
            );
          }
        }
      });

      setChats(freshChats);
    } catch (error) {
      console.error('Refresh chats error:', error);
    }
  }, [selectedChatId, userId, isMobile, showNotification]);

  // Настройка адаптивности
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Polling
  useEffect(() => {
    refreshChats();
    intervalIdRef.current = setInterval(refreshChats, 5000);
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [refreshChats]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setIsSidebarOpen(true);
  };

  // Десктоп
  if (!isMobile) {
    return (
      <div className="flex h-screen">
        <div className="w-80 flex-shrink-0">
          <ChatSidebar
            chats={chats}
            userId={userId}
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
          />
        </div>
        <div className="flex-1">
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} userId={userId} onMessagesRead={refreshChats} />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <p className="text-lg">Выберите чат</p>
                <p className="text-sm">или создайте новый</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Мобильные
  if (!isSidebarOpen && selectedChatId) {
    return (
      <ChatWindow
        chatId={selectedChatId}
        userId={userId}
        onBack={handleBackToList}
        onMessagesRead={refreshChats}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatSidebar
        chats={chats}
        userId={userId}
        onSelectChat={handleSelectChat}
        selectedChatId={selectedChatId}
        isMobile={true}
      />
    </div>
  );
}
