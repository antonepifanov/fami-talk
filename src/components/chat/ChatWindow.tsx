'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

interface ChatWindowProps {
  chatId: string;
  userId: string;
  onBack?: () => void;
}

export function ChatWindow({ chatId, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    console.log('Отправка в чат', chatId, ':', message);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Заголовок с кнопкой "Назад" на мобильных */}
      <div className="p-4 border-b bg-white flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="font-semibold">Чат {chatId}</h2>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4">
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
