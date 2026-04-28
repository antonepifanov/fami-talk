'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readBy?: string[];
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

interface ChatWindowProps {
  chatId: string;
  userId: string;
  onBack?: () => void;
  onChatOpened?: () => void;
  onMessagesRead?: () => void;
}

export default function ChatWindow({
  chatId,
  userId,
  onBack,
  onChatOpened,
  onMessagesRead,
}: ChatWindowProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);

  // При открытии чата сразу обновляем список чатов (убираем индикатор)
  useEffect(() => {
    if (onChatOpened) {
      onChatOpened();
    }
  }, [chatId, onChatOpened]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      if (!res.ok) throw new Error('Ошибка загрузки');
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, content: newMessage }),
      });
      if (!res.ok) throw new Error('Ошибка отправки');
      setNewMessage('');
      await loadMessages();
      if (onMessagesRead) onMessagesRead();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Удалить это сообщение?')) return;
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ошибка удаления');
      await loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Не удалось удалить сообщение');
    }
  };

  // Отмечаем сообщения как прочитанные (один раз при загрузке окна чата)
  useEffect(() => {
    if (!session?.user?.id || hasMarkedRead) return;

    const unreadMessages = messages.filter(
      (msg) => msg.senderId !== session.user.id && !msg.readBy?.includes(session.user.id)
    );

    if (unreadMessages.length === 0) return;

    setHasMarkedRead(true);

    Promise.all(
      unreadMessages.map(async (msg) => {
        try {
          await fetch(`/api/messages/${msg.id}/read`, { method: 'POST' });
        } catch (error) {
          console.error('Error marking read:', error);
        }
      })
    ).then(() => {
      if (onMessagesRead) onMessagesRead();
    });
  }, [messages, session?.user?.id, onMessagesRead, hasMarkedRead]);

  useEffect(() => {
    loadMessages();
    intervalRef.current = setInterval(loadMessages, 5000);
    // Сбрасываем флаг при смене чата
    setHasMarkedRead(false);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [chatId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">Загрузка сообщений...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Заголовок */}
      <div className="p-4 border-b bg-white flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="font-semibold">Чат</h2>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500">Нет сообщений. Напишите что-нибудь!</div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === userId;
            return (
              <div key={msg.id} className={`group flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={msg.sender.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {msg.sender.name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="relative">
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwn ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'
                      }`}
                    >
                      {!isOwn && (
                        <div className="text-xs text-gray-500 mb-1">{msg.sender.name}</div>
                      )}
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {isOwn && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-gray-400 hover:text-red-500"
                        onClick={() => deleteMessage(msg.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
            disabled={sending}
          />
          <Button onClick={sendMessage} size="icon" disabled={sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
