'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { Chat } from '@/types/chat';

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

  // Функция для загрузки чатов
  const fetchChats = useCallback(async () => {
    try {
      const response = await fetch('/api/chats');
      if (!response.ok) throw new Error('Ошибка загрузки');
      const freshChats = await response.json();
      setChats(freshChats);
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, []);

  // Настройка адаптивности
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Основной polling-интервал (например, каждые 5 секунд)
  useEffect(() => {
    // Запускаем polling
    intervalIdRef.current = setInterval(fetchChats, 5000);

    // Очистка при размонтировании компонента
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [fetchChats]);

  // Хендлеры для выбора чата и мобильного меню
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setIsSidebarOpen(true);
  };

  // Рендер для десктопа
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
            <ChatWindow chatId={selectedChatId} userId={userId} />
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

  // Рендер для мобильных устройств
  if (!isSidebarOpen && selectedChatId) {
    return <ChatWindow chatId={selectedChatId} userId={userId} onBack={handleBackToList} />;
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
