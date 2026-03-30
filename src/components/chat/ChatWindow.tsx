'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatWindowProps {
  userId: string;
  chatId?: string;
}

export function ChatWindow({ userId, chatId }: ChatWindowProps) {
  const [message, setMessage] = useState('');

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Выберите чат</p>
          <p className="text-sm">или создайте новый</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!message.trim()) return;
    // TODO: Отправка сообщения через API
    console.log('Отправка:', message);
    setMessage('');
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Заголовок чата */}
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold">Чат</h2>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="text-center text-gray-500">Сообщений пока нет</div>
      </div>

      {/* Поле ввода */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Введите сообщение..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
