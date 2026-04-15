'use client';

import { useState, useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Chat } from '@/types/chat';

interface HomeClientProps {
  initialChats: Chat[];
  userId: string;
}

export function HomeClient({ initialChats, userId }: HomeClientProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setIsSidebarOpen(true);
  };

  // Десктоп: два блока рядом
  if (!isMobile) {
    return (
      <div className="flex h-screen">
        <div className="w-80 flex-shrink-0">
          <ChatSidebar
            chats={initialChats}
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

  // Мобильные: показываем один экран за раз
  if (!isSidebarOpen && selectedChatId) {
    return <ChatWindow chatId={selectedChatId} userId={userId} onBack={handleBackToList} />;
  }

  // Мобильные: список чатов (заголовок только здесь, без дублирования)
  return (
    <div className="h-screen flex flex-col">
      <ChatSidebar
        chats={initialChats}
        userId={userId}
        onSelectChat={handleSelectChat}
        selectedChatId={selectedChatId}
        isMobile={true}
      />
    </div>
  );
}
